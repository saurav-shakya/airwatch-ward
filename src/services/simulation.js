const SOURCES = ['Vehicular Emissions', 'Biomass Burning', 'Construction Dust', 'Industrial Exhaust'];

const getRandomSource = () => SOURCES[Math.floor(Math.random() * SOURCES.length)];

// Initialize simulation data based on the features from GeoJSON
export function initializeSimulation(geoJsonFeatures) {
  const initialData = {};
  geoJsonFeatures.forEach((feature) => {
    const wardNo = feature.properties.ward_no;
    // Generate a diverse spread of initial AQI values across Delhi (50 to 450)
    const baseAqi = Math.floor(Math.random() * 400) + 50; 
    
    initialData[wardNo] = {
      aqi: baseAqi,
      source: getRandomSource(),
      pm25: Math.floor(baseAqi * 0.6),
      no2: Math.floor(baseAqi * 0.2),
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };
  });
  return initialData;
}

// Generate the next tick of data (random walk)
export function generateSimulationTick(currentData) {
  const nextData = { ...currentData };
  
  Object.keys(nextData).forEach((wardNo) => {
    const ward = nextData[wardNo];
    
    // Random walk: change by -15 to +15 AQI points
    let change = Math.floor(Math.random() * 31) - 15;
    
    // If it's trending up, slightly bias the change positive
    if (ward.trend === 'up') change += 5;
    if (ward.trend === 'down') change -= 5;
    
    let newAqi = ward.aqi + change;
    
    // Bound the AQI between 20 and 500
    if (newAqi < 20) {
      newAqi = 20;
      ward.trend = 'up'; // Bounce off bottom
    } else if (newAqi > 500) {
      newAqi = 500;
      ward.trend = 'down'; // Bounce off top
    } else {
      // 10% chance to flip trend
      if (Math.random() < 0.1) {
        ward.trend = ward.trend === 'up' ? 'down' : 'up';
      }
    }
    
    // Occasionally change the primarily detected source if AQI shifts significantly
    if (Math.abs(change) > 10 && Math.random() < 0.2) {
       ward.source = getRandomSource();
    }
    
    nextData[wardNo] = {
      ...ward,
      aqi: newAqi,
      pm25: Math.floor(newAqi * (0.5 + Math.random() * 0.2)), // PM2.5 is usually 50-70% of AQI driver
    };
  });
  
  return nextData;
}
