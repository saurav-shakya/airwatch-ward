// src/services/liveData.js
// Fetches real-time AQI data from WAQI and OpenAQ APIs for Delhi wards.

const DELHI_BBOX = { south: 28.4, west: 76.8, north: 28.9, east: 77.4 };

// ─── Haversine distance in km ───
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Compute centroids from GeoJSON features ───
function computeCentroids(features) {
  return features.map((f) => {
    const coords = f.geometry.coordinates[0]; // outer ring
    let sumLat = 0, sumLon = 0;
    coords.forEach(([lon, lat]) => { sumLon += lon; sumLat += lat; });
    return {
      ward_no: f.properties.ward_no,
      lat: sumLat / coords.length,
      lon: sumLon / coords.length,
    };
  });
}

// ─── Snap a station reading to the nearest ward centroid (within 5 km) ───
function snapToWard(stationLat, stationLon, centroids) {
  let best = null, bestDist = Infinity;
  for (const c of centroids) {
    const d = haversine(stationLat, stationLon, c.lat, c.lon);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return bestDist <= 5 ? best.ward_no : null;
}

// ─── Source guessing from pollutant profile ───
function guessSource(aqi, pm25, pm10) {
  if (pm10 && pm25 && pm10 > 0) {
    const ratio = pm25 / pm10;
    if (ratio < 0.4) return 'Construction Dust';
    if (ratio > 0.75) return 'Vehicular Emissions';
  }
  const hour = new Date().getHours();
  if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) return 'Biomass Burning';
  if (aqi > 300) return 'Industrial Exhaust';
  return 'Vehicular Emissions';
}

// ═══════════════════════════════════════════════════
// 1. WAQI Bounding-Box Fetch
// ═══════════════════════════════════════════════════
async function fetchWAQI() {
  const token = import.meta.env.VITE_WAQI_KEY;
  if (!token || token === 'your_waqi_api_key_here') return [];

  const url = `https://api.waqi.info/v2/map/bounds/?latlng=${DELHI_BBOX.south},${DELHI_BBOX.west},${DELHI_BBOX.north},${DELHI_BBOX.east}&networks=all&token=${token}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.status !== 'ok' || !Array.isArray(json.data)) {
      console.warn('WAQI response not ok:', json);
      return [];
    }
    return json.data.map((s) => ({
      lat: s.lat,
      lon: s.lon,
      aqi: parseInt(s.aqi, 10) || null,
      stationName: s.station?.name || 'Unknown',
      source: 'waqi',
    })).filter((s) => s.aqi !== null && !isNaN(s.aqi));
  } catch (e) {
    console.error('WAQI fetch error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// 2. OpenAQ v3 Fetch
// ═══════════════════════════════════════════════════
async function fetchOpenAQ() {
  const apiKey = import.meta.env.VITE_OPENAQ_KEY;
  if (!apiKey || apiKey === 'your_openaq_api_key_here') return [];

  const url = `https://api.openaq.org/v3/locations?bbox=${DELHI_BBOX.west},${DELHI_BBOX.south},${DELHI_BBOX.east},${DELHI_BBOX.north}&limit=100`;

  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': apiKey },
    });
    if (!res.ok) {
      console.warn('OpenAQ response not ok:', res.status);
      return [];
    }
    const json = await res.json();
    const results = json.results || [];

    return results
      .filter(loc => loc.coordinates?.latitude && loc.coordinates?.longitude)
      .map((loc) => {
        // Find latest PM2.5 or PM10 sensor to approximate AQI
        const pm25Sensor = loc.sensors?.find(s => s.parameter?.name === 'pm25' || s.parameter?.name === 'pm2.5');
        const pm10Sensor = loc.sensors?.find(s => s.parameter?.name === 'pm10');

        const pm25Val = pm25Sensor?.summary?.avg || pm25Sensor?.summary?.last || null;
        const pm10Val = pm10Sensor?.summary?.avg || pm10Sensor?.summary?.last || null;

        // Simple AQI approximation from PM2.5
        let aqi = null;
        if (pm25Val !== null) {
          aqi = Math.round(pm25Val * 1.5); // rough CPCB approximation
        } else if (pm10Val !== null) {
          aqi = Math.round(pm10Val * 0.8);
        }

        return {
          lat: loc.coordinates.latitude,
          lon: loc.coordinates.longitude,
          aqi,
          pm25: pm25Val,
          pm10: pm10Val,
          stationName: loc.name || 'OpenAQ Station',
          source: 'openaq',
        };
      })
      .filter((s) => s.aqi !== null && !isNaN(s.aqi));
  } catch (e) {
    console.error('OpenAQ fetch error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// 3. Main: fetch all sources, snap to wards, return wardData
// ═══════════════════════════════════════════════════
export async function fetchLiveWardData(geoFeatures) {
  const centroids = computeCentroids(geoFeatures);

  // Fetch from both APIs in parallel
  const [waqiStations, openaqStations] = await Promise.all([
    fetchWAQI(),
    fetchOpenAQ(),
  ]);

  const allStations = [...waqiStations, ...openaqStations];
  console.log(`[LiveData] Fetched ${waqiStations.length} WAQI + ${openaqStations.length} OpenAQ stations = ${allStations.length} total`);

  // Accumulate readings per ward
  const wardReadings = {}; // wardNo -> [{ aqi, pm25, pm10 }]
  for (const station of allStations) {
    const wardNo = snapToWard(station.lat, station.lon, centroids);
    if (wardNo === null) continue;
    if (!wardReadings[wardNo]) wardReadings[wardNo] = [];
    wardReadings[wardNo].push(station);
  }

  // Build final wardData, averaging readings per ward
  const wardData = {};
  for (const c of centroids) {
    const readings = wardReadings[c.ward_no];
    if (readings && readings.length > 0) {
      const avgAqi = Math.round(readings.reduce((s, r) => s + r.aqi, 0) / readings.length);
      const avgPm25 = Math.round(readings.reduce((s, r) => s + (r.pm25 || 0), 0) / readings.length);
      const avgPm10 = Math.round(readings.reduce((s, r) => s + (r.pm10 || 0), 0) / readings.length);
      wardData[c.ward_no] = {
        aqi: avgAqi,
        pm25: avgPm25,
        pm10: avgPm10,
        source: guessSource(avgAqi, avgPm25, avgPm10),
        stationCount: readings.length,
        dataSource: 'live',
      };
    } else {
      // IDW interpolation from 3 nearest wards that have data
      const wardsWithData = centroids.filter(
        (wc) => wardReadings[wc.ward_no] && wardReadings[wc.ward_no].length > 0
      );
      const nearest = wardsWithData
        .map((wc) => ({
          wardNo: wc.ward_no,
          dist: haversine(c.lat, c.lon, wc.lat, wc.lon),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);

      if (nearest.length > 0) {
        let totalWeight = 0;
        let weightedAqi = 0;
        for (const n of nearest) {
          const w = 1 / (n.dist + 0.001);
          totalWeight += w;
          const readings = wardReadings[n.wardNo];
          const avg = readings.reduce((s, r) => s + r.aqi, 0) / readings.length;
          weightedAqi += avg * w;
        }
        const interpolatedAqi = Math.round(weightedAqi / totalWeight);
        wardData[c.ward_no] = {
          aqi: interpolatedAqi,
          pm25: Math.round(interpolatedAqi * 0.6),
          source: guessSource(interpolatedAqi, null, null),
          stationCount: 0,
          dataSource: 'interpolated',
        };
      } else {
        // Absolute fallback
        wardData[c.ward_no] = {
          aqi: null,
          pm25: null,
          source: 'No Data',
          stationCount: 0,
          dataSource: 'none',
        };
      }
    }
  }

  return wardData;
}
