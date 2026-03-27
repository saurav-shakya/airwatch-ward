import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AQI_COLORS = {
  good: '#00b050',
  satisfactory: '#92d050',
  moderate: '#ffff00',
  poor: '#ff9900',
  veryPoor: '#ff0000',
  severe: '#c00000',
};

// Simple utility to determine color based on AQI
const getAqiColor = (aqi) => {
  if (aqi === null || aqi === undefined) return '#cccccc'; // Grey for no data
  if (aqi <= 50) return AQI_COLORS.good;
  if (aqi <= 100) return AQI_COLORS.satisfactory;
  if (aqi <= 200) return AQI_COLORS.moderate;
  if (aqi <= 300) return AQI_COLORS.poor;
  if (aqi <= 400) return AQI_COLORS.veryPoor;
  return AQI_COLORS.severe;
};

export default function MapPanel({ wardData = {}, onSelectWard }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/data/delhi_wards.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Error loading geojson", err));
  }, []);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (onSelectWard) onSelectWard(feature.properties);
      }
    });
  };

  const styleFeature = (feature) => {
    const wardId = feature.properties.ward_no;
    // Mock simulation: random AQI if data is absent
    const mockAqi = wardData[wardId]?.aqi || (Math.floor(Math.random() * 450) + 10);
    return {
      fillColor: getAqiColor(mockAqi),
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };

  if (!geoData) return <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500 font-medium">Loading Map Data...</div>;

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg border border-slate-200">
      <MapContainer 
        center={[28.6139, 77.2090]} // Center of Delhi
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
        />
        <GeoJSON 
          data={geoData} 
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
