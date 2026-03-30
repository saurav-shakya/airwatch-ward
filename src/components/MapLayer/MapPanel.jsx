import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AQI_COLORS = {
  good: '#00e676',
  satisfactory: '#76ff03',
  moderate: '#ffea00',
  poor: '#ff9100',
  veryPoor: '#ff1744',
  severe: '#d50000',
};

const AQI_LABELS = {
  good: 'Good',
  satisfactory: 'Satisfactory',
  moderate: 'Moderate',
  poor: 'Poor',
  veryPoor: 'Very Poor',
  severe: 'Severe',
};

const getAqiColor = (aqi) => {
  if (aqi === null || aqi === undefined) return '#555';
  if (aqi <= 50) return AQI_COLORS.good;
  if (aqi <= 100) return AQI_COLORS.satisfactory;
  if (aqi <= 200) return AQI_COLORS.moderate;
  if (aqi <= 300) return AQI_COLORS.poor;
  if (aqi <= 400) return AQI_COLORS.veryPoor;
  return AQI_COLORS.severe;
};

const getAqiLabel = (aqi) => {
  if (aqi === null || aqi === undefined) return 'No Data';
  if (aqi <= 50) return AQI_LABELS.good;
  if (aqi <= 100) return AQI_LABELS.satisfactory;
  if (aqi <= 200) return AQI_LABELS.moderate;
  if (aqi <= 300) return AQI_LABELS.poor;
  if (aqi <= 400) return AQI_LABELS.veryPoor;
  return AQI_LABELS.severe;
};

export default function MapPanel({ geoData, wardData = {}, onSelectWard }) {

  const onEachFeature = (feature, layer) => {
    const wardNo = feature.properties.ward_no;
    const data = wardData[wardNo];
    const aqi = data?.aqi;
    const source = data?.source || 'Unknown';
    const wardName = feature.properties.ward_name || `Ward ${wardNo}`;
    const zone = feature.properties.zone || '';
    const label = getAqiLabel(aqi);
    const color = getAqiColor(aqi);

    // Bind a rich tooltip
    layer.bindTooltip(
      `<div style="
          font-family: 'Inter', system-ui, sans-serif;
          min-width: 180px;
          padding: 0;
        ">
        <div style="
          background: ${color};
          color: ${aqi > 200 ? '#fff' : '#1a1a2e'};
          padding: 6px 10px;
          font-weight: 800;
          font-size: 13px;
          border-radius: 6px 6px 0 0;
          letter-spacing: 0.3px;
        ">
          ${wardName}
        </div>
        <div style="
          padding: 8px 10px;
          background: #1a1a2e;
          border-radius: 0 0 6px 6px;
        ">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="color:#94a3b8; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">AQI</span>
            <span style="color:${color}; font-size:18px; font-weight:900;">${aqi ?? '--'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="color:#94a3b8; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Status</span>
            <span style="color:#e2e8f0; font-size:11px; font-weight:600;">${label}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <span style="color:#94a3b8; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Source</span>
            <span style="color:#e2e8f0; font-size:11px; font-weight:600;">${source}</span>
          </div>
          <div style="margin-top:4px; border-top:1px solid #334155; padding-top:4px;">
            <span style="color:#64748b; font-size:9px; text-transform:uppercase; letter-spacing:0.5px;">${zone} Zone • Ward #${wardNo}</span>
          </div>
        </div>
      </div>`,
      {
        sticky: true,
        direction: 'top',
        offset: [0, -10],
        className: 'airwatch-tooltip',
        opacity: 1,
      }
    );

    // Hover & click interactions
    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 3,
          color: '#fff',
          fillOpacity: 0.95,
          dashArray: '',
        });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 1,
          color: 'rgba(255,255,255,0.4)',
          fillOpacity: 0.75,
        });
      },
      click: () => {
        if (onSelectWard) onSelectWard(feature.properties);
      },
    });
  };

  const styleFeature = (feature) => {
    const wardId = feature.properties.ward_no;
    const currentAqi = wardData[wardId]?.aqi;
    return {
      fillColor: getAqiColor(currentAqi),
      weight: 1,
      opacity: 1,
      color: 'rgba(255,255,255,0.4)',
      fillOpacity: 0.75,
    };
  };

  if (!geoData) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-gray-400 font-medium rounded-lg">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading Map Data...
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border border-slate-700/50">
      <MapContainer
        center={[28.6139, 77.209]}
        zoom={11}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
        />
        <GeoJSON
          key={JSON.stringify(wardData).length}
          data={geoData}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
