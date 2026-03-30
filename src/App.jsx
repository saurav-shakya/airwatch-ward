import React, { useState, useEffect, useRef } from 'react';
import MapPanel from './components/MapLayer/MapPanel';
import { initializeSimulation, generateSimulationTick } from './services/simulation';
import { fetchAIAdvisory } from './services/ai';
import { fetchLiveWardData } from './services/liveData';

function App() {
  const [selectedWard, setSelectedWard] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [wardData, setWardData] = useState({});
  const [isSimulating, setIsSimulating] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const latestWardRef = useRef(null);

  // 1. Load GeoJSON and Initialize App Data
  useEffect(() => {
    fetch('/data/delhi_wards.geojson')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setWardData(initializeSimulation(data.features));
      })
      .catch(err => console.error("Error loading geojson", err));
  }, []);

  // 2. Simulation Engine Tick
  useEffect(() => {
    if (!isSimulating || !geoData) return;
    
    // Tick every 4 seconds to show map dynamics
    const interval = setInterval(() => {
      setWardData(prevData => {
        const newData = generateSimulationTick(prevData);
        
        // If a ward is selected, update its display stats in real-time
        if (latestWardRef.current) {
           const activeTarget = latestWardRef.current;
           setSelectedWard(prev => ({
              ...prev,
              ...newData[activeTarget]
           }));
        }
        return newData;
      });
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isSimulating, geoData]);

  // 2b. Live Data Fetch (when Live Sensors is active)
  useEffect(() => {
    if (isSimulating || !geoData) return;

    const fetchLive = async () => {
      setLiveLoading(true);
      setLiveError(null);
      try {
        const liveWardData = await fetchLiveWardData(geoData.features);
        setWardData(liveWardData);
        // Update selected ward if one is active
        if (latestWardRef.current && liveWardData[latestWardRef.current]) {
          setSelectedWard(prev => ({
            ...prev,
            ...liveWardData[latestWardRef.current]
          }));
        }
      } catch (e) {
        console.error('Live data fetch failed:', e);
        setLiveError('Failed to fetch live data. Falling back to simulation.');
      } finally {
        setLiveLoading(false);
      }
    };

    fetchLive(); // Fetch immediately
    const interval = setInterval(fetchLive, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [isSimulating, geoData]);

  // 3. Handle Map Click -> Trigger AI Profile
  const handleSelectWard = async (featureProps) => {
    const wardNo = featureProps.ward_no;
    latestWardRef.current = wardNo;
    
    const combinedData = {
       ...featureProps,
       ...wardData[wardNo]
    };
    
    setSelectedWard(combinedData);
    setAiResponse(null);
    setAiLoading(true);

    try {
      const response = await fetchAIAdvisory(combinedData);
      // Only set if user hasn't clicked away
      if (latestWardRef.current === wardNo) {
         setAiResponse(response);
      }
    } catch (e) {
      console.error(e);
      if (latestWardRef.current === wardNo) setAiResponse({ error: "Failed to fetch AI context."});
    } finally {
      if (latestWardRef.current === wardNo) setAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar / Main Content Area */}
      <div className="w-full md:w-[400px] flex-shrink-0 bg-slate-900 border-r border-slate-700/50 p-6 flex flex-col z-10 shadow-lg">
        <header className="mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wide mb-2 uppercase">
            v1.0 Hackathon Build
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-2">AirWatch<span className="text-indigo-400">Ward</span></h1>
          <p className="text-sm text-slate-400">Hyper-local AQI & GRAP intelligence for Delhi</p>
        </header>

        {/* Selected Ward Data Panel */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {selectedWard ? (
            <div className="bg-slate-800/70 rounded-xl p-5 border border-slate-700 shadow-sm mb-6 transition-all backdrop-blur">
              <h2 className="text-xl font-bold text-white mb-1">{selectedWard.ward_name}</h2>
              <p className="text-xs text-slate-400 mb-4 uppercase tracking-wider font-semibold">Ward No. {selectedWard.ward_no} • {selectedWard.zone} Zone</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 shadow-sm flex flex-col justify-center items-center">
                   <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Current AQI</span>
                   <span className={`text-3xl font-black ${selectedWard.aqi > 300 ? 'text-red-400' : selectedWard.aqi > 200 ? 'text-orange-400' : 'text-emerald-400'}`}>
                     {selectedWard.aqi || '--'}
                   </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 shadow-sm flex flex-col justify-center items-center">
                   <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Source AI</span>
                   <span className="text-sm font-bold text-slate-200 text-center leading-tight">
                     {selectedWard.source || 'Detecting...'}
                   </span>
                </div>
              </div>

              {/* Gemini Advisory Container */}
              <div className="mt-4 pt-4 border-t border-slate-700 min-h-[150px]">
                {aiLoading ? (
                   <div className="flex flex-col items-center justify-center h-full py-6 space-y-3">
                     <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     <span className="text-xs text-slate-500 font-medium animate-pulse">Analyzing GRAP & Policy Actions via Gemini...</span>
                   </div>
                ) : aiResponse?.error ? (
                   <div className="bg-red-50 text-red-700 p-3 rounded text-sm font-medium border border-red-200">
                     {aiResponse.error}
                   </div>
                ) : aiResponse ? (
                   <div className="space-y-4">
                      {/* GRAP Warning */}
                      <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded shadow-sm">
                         <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">GRAP Status</h4>
                         <p className="text-sm font-medium text-rose-900">{aiResponse.grap_warning}</p>
                      </div>
                      
                      {/* Policy Action */}
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded shadow-sm">
                         <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Govt Policy Action</h4>
                         <p className="text-sm font-medium text-blue-900">{aiResponse.policy_action}</p>
                      </div>

                      {/* Citizen Advisory */}
                      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded shadow-sm">
                         <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Citizen Advisory</h4>
                         <p className="text-sm font-medium text-emerald-900">{aiResponse.citizen_advisory}</p>
                      </div>
                   </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-600">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">Select a ward on the map to view real-time AQI analytics, source attribution, and Gemini GRAP advisories.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative bg-slate-950 p-2 md:p-4 overflow-hidden flex flex-col">
        {/* Toggle Controls */}
        <div className="absolute top-6 right-6 z-[1000] bg-slate-800/90 backdrop-blur-sm p-1 rounded-xl shadow-xl border border-slate-700/50 flex flex-col items-end gap-2">
          <div className="flex items-center">
            <button 
               onClick={() => setIsSimulating(false)}
               className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${!isSimulating ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-700'}`}>
               Live Sensors
               {!isSimulating && liveLoading && <span className="ml-2 inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
               {!isSimulating && !liveLoading && <span className="ml-2 inline-block w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>}
            </button>
            <button 
               onClick={() => setIsSimulating(true)}
               className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${isSimulating ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-700'}`}>
               Simulation
               {isSimulating && <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
            </button>
          </div>
          {liveError && <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">{liveError}</div>}
        </div>

        <div className="w-full h-full pb-4">
           {geoData && wardData ? (
             <MapPanel geoData={geoData} wardData={wardData} onSelectWard={handleSelectWard} />
           ) : (
             <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg shadow-inner">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
           )}
        </div>
        
        {/* Legend */}
        <div className="h-14 shrink-0 bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 flex items-center px-5 overflow-x-auto gap-3 mt-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">CPCB AQI</span>
          <div className="h-4 w-px bg-slate-600 mx-1 shrink-0"></div>
          <div className="flex flex-1 w-full shrink-0 min-w-[480px] h-7 rounded-lg overflow-hidden">
             <div className="flex-1 bg-[#00e676] flex items-center justify-center text-[9px] font-bold text-gray-900">&le;50 Good</div>
             <div className="flex-1 bg-[#76ff03] flex items-center justify-center text-[9px] font-bold text-gray-900">51-100</div>
             <div className="flex-1 bg-[#ffea00] flex items-center justify-center text-[9px] font-bold text-gray-900">101-200</div>
             <div className="flex-1 bg-[#ff9100] flex items-center justify-center text-[9px] font-bold text-white">201-300</div>
             <div className="flex-1 bg-[#ff1744] flex items-center justify-center text-[9px] font-bold text-white">301-400</div>
             <div className="flex-1 bg-[#d50000] flex items-center justify-center text-[9px] font-bold text-white">&gt;400</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
