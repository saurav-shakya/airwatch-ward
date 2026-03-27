import React, { useState } from 'react';
import MapPanel from './components/MapLayer/MapPanel';

function App() {
  const [selectedWard, setSelectedWard] = useState(null);

  return (
    <div className="flex h-screen w-full bg-slate-50 flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar / Main Content Area */}
      <div className="w-full md:w-[400px] flex-shrink-0 bg-white border-r border-slate-200 p-6 flex flex-col z-10 shadow-lg">
        <header className="mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide mb-2 uppercase">
            v1.0 Hackathon Build
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">AirWatch<span className="text-blue-600">Ward</span></h1>
          <p className="text-sm text-slate-500">Hyper-local AQI intelligence for Delhi</p>
        </header>

        {/* Selected Ward Data Panel */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {selectedWard ? (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm mb-6 transition-all">
              <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedWard.ward_name}</h2>
              <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider font-semibold">Ward No. {selectedWard.ward_no} • {selectedWard.zone} Zone</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                   <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Current AQI</span>
                   <span className="text-3xl font-black text-rose-500">245</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                   <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Source AI</span>
                   <span className="text-sm font-bold text-slate-700 text-center">Biomass Burning</span>
                </div>
              </div>

              {/* Placeholder for Gemini Advisory */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                  <h3 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Advisory (Stub)
                  </h3>
                  <p className="text-sm text-amber-800/80 leading-relaxed font-medium">Click on different wards on the map to view data. Currently showing randomized placeholder data pending API hookups.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">Select a ward on the map to view detailed AQI analytics, source attribution, and targeted advisories.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative bg-slate-200 p-2 md:p-6 overflow-hidden flex flex-col">
        {/* Toggle Controls Placeholder */}
        <div className="absolute top-8 right-8 z-[1000] bg-white p-1 rounded-xl shadow-lg border border-slate-200 flex items-center">
            <button className="px-4 py-2 text-sm font-bold rounded-lg bg-slate-900 text-white shadow transition-all">Live Sensors</button>
            <button className="px-4 py-2 text-sm font-bold rounded-lg text-slate-500 hover:bg-slate-100 transition-all">Simulation Run</button>
        </div>

        <div className="w-full h-full pb-4">
           <MapPanel onSelectWard={setSelectedWard} />
        </div>
        
        {/* Legend */}
        <div className="h-16 shrink-0 bg-white rounded-xl shadow-md border border-slate-200 flex items-center px-6 overflow-x-auto gap-4 mt-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">CPCB AQI Scale</span>
          <div className="h-4 w-px bg-slate-300 mx-2 shrink-0"></div>
          <div className="flex flex-1 w-full shrink-0 min-w-[500px] h-8 rounded overflow-hidden shadow-inner">
             <div className="flex-1 bg-[#00b050] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">&le;50 Good</div>
             <div className="flex-1 bg-[#92d050] flex items-center justify-center text-[10px] font-bold text-white shadow-sm text-green-900">51-100</div>
             <div className="flex-1 bg-[#ffff00] flex items-center justify-center text-[10px] font-bold text-yellow-900 shadow-sm">101-200 Mod</div>
             <div className="flex-1 bg-[#ff9900] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">201-300 Poor</div>
             <div className="flex-1 bg-[#ff0000] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">301-400 V.Poor</div>
             <div className="flex-1 bg-[#c00000] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">&gt;400 Severe</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
