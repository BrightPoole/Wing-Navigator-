
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Search, 
  Loader2, 
  PlaneTakeoff, 
  Layers, 
  CloudRain, 
  ShieldAlert, 
  Satellite, 
  X, 
  RotateCw, 
  MapPin, 
  Navigation,
  Wind,
  Globe,
  ShieldCheck,
  Radio,
  MoveUpRight,
  Route,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  GripVertical,
  Save,
  FolderOpen,
  Check,
  Download
} from 'lucide-react';
import { MAJOR_AIRPORTS, MOCK_SIGMETS, MOCK_AIRMETS } from '../constants.ts';
import { searchAirport, interpretWeather, getLiveAirportInfo } from '../services/gemini.ts';
import { Airport, WeatherHazard } from '../types.ts';

declare const L: any;

const REFRESH_INTERVAL = 300000; // 5 minutes
const SAVED_PLANS_KEY = 'skynav_saved_flight_plans';

const getDistanceNM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3440.065;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

interface MapContainerProps {
  theme?: 'light' | 'dark';
  flightPlan: Airport[];
  setFlightPlan: React.Dispatch<React.SetStateAction<Airport[]>>;
  pinnedAirports: Airport[];
  setPinnedAirports: React.Dispatch<React.SetStateAction<Airport[]>>;
}

interface SavedPlan {
  name: string;
  waypoints: Airport[];
  timestamp: number;
}

const MapContainer: React.FC<MapContainerProps> = ({ theme = 'dark', flightPlan, setFlightPlan, pinnedAirports, setPinnedAirports }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const layersRef = useRef<{ [key: string]: any }>({});
  const routeLayerRef = useRef<any>(null);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showWeatherControls, setShowWeatherControls] = useState(false);
  const [showFlightPlan, setShowFlightPlan] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<WeatherHazard | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherSummary, setWeatherSummary] = useState<string | null>(null);
  const [rawMetar, setRawMetar] = useState<string | null>(null);
  
  const [liveIntel, setLiveIntel] = useState<{ text: string, links: { title: string, uri: string }[] } | null>(null);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  
  const [groundSpeed, setGroundSpeed] = useState(120);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    const saved = localStorage.getItem(SAVED_PLANS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [planName, setPlanName] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const [weatherConfig, setWeatherConfig] = useState({
    satellite: false,
    radar: false,
    sigmets: true,
    airmets: true,
    vfrSectional: false,
    ifrLow: false,
    ifrHigh: false,
    autoUpdate: true
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'VFR': return '#22c55e';
      case 'MVFR': return '#3b82f6';
      case 'IFR': return '#ef4444';
      case 'LIFR': return '#d946ef';
      default: return '#64748b';
    }
  };

  const addAirportMarker = useCallback((apt: Airport, focus: boolean = false, category: string = 'VFR') => {
    if (!mapInstance.current || !isMapReady) return;
    
    if (markersRef.current[apt.icao]) {
      mapInstance.current.removeLayer(markersRef.current[apt.icao]);
    }

    const color = getCategoryColor(category);
    const markerIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex flex-col items-center group">
          <div class="absolute -inset-2 rounded-full blur-sm" style="background-color: ${color}33;"></div>
          <div class="relative w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg cursor-pointer transform group-hover:scale-125 transition-all" style="background-color: ${color};"></div>
          <div class="flex flex-col items-center mt-1 pointer-events-none">
            <span class="text-[10px] font-bold text-white drop-shadow-md font-mono bg-slate-900/90 px-1 py-0.5 rounded border border-slate-700">${apt.icao}</span>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([apt.lat, apt.lng], { icon: markerIcon }).addTo(mapInstance.current);
    
    // Quick Add Popup
    const popupContent = document.createElement('div');
    popupContent.className = 'p-2 text-center';
    popupContent.innerHTML = `
      <div class="font-bold text-slate-900 mb-1 font-sans">${apt.icao}</div>
      <button class="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-tighter py-1 px-3 rounded shadow-md transition-all active:scale-95">
        ADD TO MISSION
      </button>
    `;
    
    popupContent.querySelector('button')?.addEventListener('click', (e) => {
      e.stopPropagation();
      setFlightPlan(prev => {
        if (prev.some(p => p.icao === apt.icao)) return prev;
        return [...prev, apt];
      });
      marker.closePopup();
    });

    marker.bindPopup(popupContent, { closeButton: false, offset: [0, -10] });

    marker.on('click', (e: any) => {
      L.DomEvent.stopPropagation(e);
      handleAirportClick(apt);
    });
    
    markersRef.current[apt.icao] = marker;

    if (focus) {
      mapInstance.current.flyTo([apt.lat, apt.lng], 10, { animate: true, duration: 1.5 });
    }
  }, [isMapReady, setFlightPlan]);

  const fetchAirportWeather = useCallback(async (apt: Airport, silent: boolean = false) => {
    if (!silent) {
      setIsWeatherLoading(true);
      setIsIntelLoading(true);
    }
    try {
      const now = new Date();
      const mockMetar = `${apt.icao} ${now.getUTCDate()}${now.getUTCHours()}${now.getUTCMinutes()}Z 24012KT 10SM SCT030 OVC080 15/10 A2992 RMK AO2`;
      setRawMetar(mockMetar);
      
      const interpretation = await interpretWeather(mockMetar);
      setWeatherSummary(interpretation);

      const intel = await getLiveAirportInfo(apt.icao);
      setLiveIntel(intel);

      const cats = ['VFR', 'VFR', 'MVFR', 'IFR'];
      addAirportMarker(apt, false, cats[Math.floor(Math.random() * cats.length)]);
    } catch (err) {
      console.error("Failed to load weather/intel", err);
    } finally {
      if (!silent) {
        setIsWeatherLoading(false);
        setIsIntelLoading(false);
      }
    }
  }, [addAirportMarker]);

  const handleAirportClick = useCallback((apt: Airport) => {
    setSelectedHazard(null);
    setSelectedAirport(apt);
    setWeatherSummary(null);
    setRawMetar(null);
    setLiveIntel(null);
    fetchAirportWeather(apt);
  }, [fetchAirportWeather]);

  // Initial Map Setup
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true
    }).setView([40.7128, -74.0060], 4);
    
    mapInstance.current = map;

    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    layersRef.current.base = L.tileLayer(tileUrl).addTo(map);

    layersRef.current.vfr = L.tileLayer('https://tiles.arcgis.com/tiles/ssU2qS7qELu60V4p/arcgis/rest/services/VFR_Sectional/MapServer/tile/{z}/{y}/{x}');
    layersRef.current.ifrLow = L.tileLayer('https://tiles.arcgis.com/tiles/ssU2qS7qELu60V4p/arcgis/rest/services/IFR_Low_Enroute/MapServer/tile/{z}/{y}/{x}');
    layersRef.current.ifrHigh = L.tileLayer('https://tiles.arcgis.com/tiles/ssU2qS7qELu60V4p/arcgis/rest/services/IFR_High_Enroute/MapServer/tile/{z}/{y}/{x}');
    layersRef.current.radar = L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0r-900913/{z}/{x}/{y}.png', { opacity: 0.6 });
    layersRef.current.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');

    setIsMapReady(true);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setIsMapReady(false);
        markersRef.current = {};
      }
    };
  }, [theme]);

  // Bring back all pinpointed airports (Major + Flight Plan + Pinned Searched)
  useEffect(() => {
    if (isMapReady) {
      // Add major hubs
      MAJOR_AIRPORTS.forEach(apt => addAirportMarker(apt));
      // Add previously pinned/searched airports
      pinnedAirports.forEach(apt => addAirportMarker(apt));
      // Add mission-critical airports from flight plan
      flightPlan.forEach(apt => addAirportMarker(apt));
    }
  }, [isMapReady, addAirportMarker, flightPlan, pinnedAirports]);

  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return;
    
    if (routeLayerRef.current) {
      mapInstance.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (flightPlan.length >= 2) {
      const latlngs = flightPlan.map(apt => L.latLng(apt.lat, apt.lng));
      routeLayerRef.current = L.polyline(latlngs, {
        color: '#10b981',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 10',
        lineJoin: 'round'
      }).addTo(mapInstance.current);
      
      const bounds = L.latLngBounds(latlngs);
      mapInstance.current.fitBounds(bounds, { padding: [100, 100], maxZoom: 8 });
    }
  }, [flightPlan, isMapReady]);

  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return;
    const map = mapInstance.current;
    const config = weatherConfig;

    if (config.vfrSectional) layersRef.current.vfr.addTo(map); else layersRef.current.vfr.remove();
    if (config.ifrLow) layersRef.current.ifrLow.addTo(map); else layersRef.current.ifrLow.remove();
    if (config.ifrHigh) layersRef.current.ifrHigh.addTo(map); else layersRef.current.ifrHigh.remove();
    if (config.radar) layersRef.current.radar.addTo(map); else layersRef.current.radar.remove();
    if (config.satellite) layersRef.current.satellite.addTo(map); else layersRef.current.satellite.remove();

    if (layersRef.current.sigGroup) layersRef.current.sigGroup.remove();
    if (config.sigmets) {
      layersRef.current.sigGroup = L.layerGroup().addTo(map);
      MOCK_SIGMETS.forEach(sig => L.polygon(sig.points, { color: '#ef4444', fillOpacity: 0.2, weight: 2 }).on('click', (e: any) => { L.DomEvent.stopPropagation(e); setSelectedHazard(sig); }).addTo(layersRef.current.sigGroup));
    }
    if (layersRef.current.airGroup) layersRef.current.airGroup.remove();
    if (config.airmets) {
      layersRef.current.airGroup = L.layerGroup().addTo(map);
      MOCK_AIRMETS.forEach(air => L.polygon(air.points, { color: '#f59e0b', fillOpacity: 0.1, weight: 1.5, dashArray: '5, 5' }).on('click', (e: any) => { L.DomEvent.stopPropagation(e); setSelectedHazard(air); }).addTo(layersRef.current.airGroup));
    }
  }, [weatherConfig, isMapReady]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const airport = await searchAirport(searchQuery);
      if (airport) {
        // Automatically pin the searched airport
        setPinnedAirports(prev => {
          if (prev.some(a => a.icao === airport.icao)) return prev;
          return [...prev, airport];
        });
        addAirportMarker(airport, true);
        handleAirportClick(airport);
        setSearchQuery('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const routeStats = useMemo(() => {
    let totalDist = 0;
    for (let i = 0; i < flightPlan.length - 1; i++) {
      totalDist += getDistanceNM(flightPlan[i].lat, flightPlan[i].lng, flightPlan[i+1].lat, flightPlan[i+1].lng);
    }
    const mins = (totalDist / groundSpeed) * 60;
    return { totalDist: Math.round(totalDist), ete: `${Math.floor(mins/60)}h ${Math.round(mins%60)}m` };
  }, [flightPlan, groundSpeed]);

  const isLight = theme === 'light';

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newPlan = [...flightPlan];
    const item = newPlan.splice(draggedIndex, 1)[0];
    newPlan.splice(index, 0, item);
    
    setDraggedIndex(index);
    setFlightPlan(newPlan);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Save/Load Plan Handlers
  const handleSavePlan = () => {
    if (!planName.trim() || flightPlan.length === 0) return;
    const newPlan: SavedPlan = {
      name: planName.trim(),
      waypoints: flightPlan,
      timestamp: Date.now()
    };
    const updated = [newPlan, ...savedPlans];
    setSavedPlans(updated);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updated));
    setPlanName('');
    setIsSavingPlan(false);
  };

  const loadPlan = (plan: SavedPlan) => {
    setFlightPlan(plan.waypoints);
    setShowSavedPlans(false);
  };

  const deleteSavedPlan = (timestamp: number) => {
    const updated = savedPlans.filter(p => p.timestamp !== timestamp);
    setSavedPlans(updated);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updated));
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col md:flex-row gap-4 pointer-events-none">
        <form onSubmit={handleSearch} className="relative w-full md:w-96 pointer-events-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              placeholder="Live ICAO Search..."
              className={`w-full backdrop-blur-xl border rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all shadow-2xl text-sm font-medium ${
                isLight ? 'bg-white/90 border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-700/50 text-white'
              }`}
            />
            <button type="submit" disabled={isSearching} className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 px-4 min-w-[80px] flex items-center justify-center rounded-xl font-bold text-xs text-white">
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'FETCH'}
            </button>
          </div>
        </form>

        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => setShowWeatherControls(!showWeatherControls)} className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all shadow-2xl flex items-center gap-2 font-bold text-xs ${showWeatherControls ? 'bg-blue-600 text-white' : isLight ? 'bg-white/90 text-slate-600' : 'bg-slate-900/90 text-slate-400'}`}>
            <Layers size={18} />
            <span className="hidden md:block uppercase tracking-widest">Map Layers</span>
          </button>
          <button onClick={() => setShowFlightPlan(!showFlightPlan)} className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all shadow-2xl flex items-center gap-2 font-bold text-xs ${showFlightPlan ? 'bg-emerald-600 text-white' : isLight ? 'bg-white/90 text-slate-600' : 'bg-slate-900/90 text-slate-400'}`}>
            <Route size={18} />
            <span className="hidden md:block uppercase tracking-widest">Flight Plan ({flightPlan.length})</span>
          </button>
        </div>
      </div>

      <div ref={mapRef} className="flex-1 z-0" />

      {showFlightPlan && (
        <div className={`absolute top-24 left-6 w-96 backdrop-blur-xl border rounded-[32px] p-6 z-[1000] shadow-2xl flex flex-col overflow-hidden max-h-[calc(100vh-140px)] ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Mission Route Plan</h3>
            <div className="flex gap-2">
              <button onClick={() => { setShowSavedPlans(!showSavedPlans); setIsSavingPlan(false); }} className={`p-1.5 rounded-lg transition-colors ${showSavedPlans ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white'}`}>
                <FolderOpen size={16} />
              </button>
              <button onClick={() => { setIsSavingPlan(!isSavingPlan); setShowSavedPlans(false); }} className={`p-1.5 rounded-lg transition-colors ${isSavingPlan ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-white'}`}>
                <Save size={16} />
              </button>
              <button onClick={() => setShowFlightPlan(false)} className="text-slate-500 hover:text-white p-1.5"><X size={16} /></button>
            </div>
          </div>

          {isSavingPlan && (
            <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={planName}
                  autoFocus
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Plan name..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
                <button onClick={handleSavePlan} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-xl text-white">
                  <Check size={16} />
                </button>
              </div>
            </div>
          )}

          {showSavedPlans && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4 animate-in fade-in duration-200">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Stored Missions</h4>
              {savedPlans.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic">No saved plans found.</p>
              ) : (
                savedPlans.map(plan => (
                  <div key={plan.timestamp} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between group">
                    <div className="cursor-pointer flex-1" onClick={() => loadPlan(plan)}>
                      <div className="text-xs font-bold text-slate-200">{plan.name}</div>
                      <div className="text-[9px] text-slate-500">{plan.waypoints.length} waypoints • {new Date(plan.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => loadPlan(plan)} className="text-blue-500 hover:text-blue-400 p-1"><Download size={14} /></button>
                      <button onClick={() => deleteSavedPlan(plan.timestamp)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
              <div className="border-t border-slate-800 my-4" />
            </div>
          )}

          {!showSavedPlans && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
              {flightPlan.length === 0 ? <p className="text-center text-xs text-slate-500 py-12">Search airports to build your route.</p> : flightPlan.map((apt, i) => (
                <div 
                  key={apt.icao + i} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 bg-slate-950 border rounded-2xl flex items-center justify-between group cursor-move transition-all ${
                    draggedIndex === i ? 'opacity-40 border-blue-500 scale-95 shadow-2xl' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-700 group-hover:text-slate-400 transition-colors">
                      <GripVertical size={16} />
                    </div>
                    <div className="bg-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-900/20">{apt.icao}</div>
                    <div className="text-sm font-bold truncate max-w-[140px] text-white">{apt.name}</div>
                  </div>
                  <button onClick={() => setFlightPlan(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {flightPlan.length > 1 && !showSavedPlans && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800"><div className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Distance</div><div className="text-xl font-mono font-bold text-white">{routeStats.totalDist} <span className="text-[10px] text-slate-500">NM</span></div></div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800"><div className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Time (ETE)</div><div className="text-xl font-mono font-bold text-emerald-400">{routeStats.ete}</div></div>
              </div>
              <div className="px-1 space-y-2">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Ground Speed</span>
                  <span className="text-blue-500">{groundSpeed} KTS</span>
                </div>
                <input 
                  type="range" min="50" max="400" step="5"
                  value={groundSpeed}
                  onChange={(e) => setGroundSpeed(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {showWeatherControls && (
        <div className={`absolute top-24 left-6 w-80 backdrop-blur-xl border rounded-[32px] p-6 z-[1000] shadow-2xl max-h-[calc(100vh-140px)] overflow-y-auto ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-6"><h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Map Layers</h3><button onClick={() => setShowWeatherControls(false)} className="text-slate-500 hover:text-white"><X size={16} /></button></div>
          <div className="space-y-3">
            {[
              { id: 'vfrSectional', label: 'VFR Sectional', icon: Navigation },
              { id: 'ifrLow', label: 'IFR Low Airways', icon: MoveUpRight },
              { id: 'ifrHigh', label: 'IFR High Airways', icon: MoveUpRight },
              { id: 'radar', label: 'Precip Radar', icon: CloudRain },
              { id: 'sigmets', label: 'SIGMET Warning', icon: ShieldAlert },
              { id: 'satellite', label: 'Satellite View', icon: Satellite }
            ].map((layer) => (
              <label key={layer.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/40 cursor-pointer transition-colors border border-transparent hover:border-slate-700/50">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <layer.icon size={14} />
                  {layer.label}
                </div>
                <input type="checkbox" checked={(weatherConfig as any)[layer.id]} onChange={() => setWeatherConfig(p => ({...p, [layer.id]: !(p as any)[layer.id]}))} className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-blue-600" />
              </label>
            ))}
          </div>
        </div>
      )}

      {(selectedAirport || selectedHazard) && (
        <div className={`absolute inset-y-6 right-6 w-full md:w-[420px] backdrop-blur-2xl border rounded-[32px] shadow-2xl z-[1001] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300 ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-700/40'}`}>
          <div className={`p-6 border-b flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <div className="flex items-center gap-3"><div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg">{selectedAirport ? <PlaneTakeoff size={20} className="text-white" /> : <ShieldAlert size={20} className="text-white" />}</div><div><h2 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedAirport ? selectedAirport.icao : 'WEATHER HAZARD'}</h2><div className="text-[10px] uppercase font-bold text-slate-500">{selectedAirport ? selectedAirport.name : selectedHazard?.hazard}</div></div></div>
            <button onClick={() => { setSelectedAirport(null); setSelectedHazard(null); }} className="text-slate-500 hover:text-white p-2"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {selectedAirport && (
              <>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={16} /> Operational Intel</h3>
                  {isIntelLoading ? <div className="py-8 text-center"><Loader2 className="animate-spin inline text-amber-500" /></div> : <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-3xl text-sm leading-relaxed text-slate-300 font-medium">{liveIntel?.text || "No active NOTAMs reported for this terminal."}</div>}
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Wind size={16} /> Weather Observation</h3>
                  {isWeatherLoading ? <div className="py-8 text-center"><Loader2 className="animate-spin inline text-blue-500" /></div> : <div className="space-y-4">{weatherSummary && <div className="p-5 bg-blue-600/5 border border-blue-500/10 rounded-3xl text-sm text-slate-200 leading-relaxed font-medium">{weatherSummary}</div>}<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-[10px] text-blue-400/70 break-all">{rawMetar}</div></div>}
                </div>
              </>
            )}
            {selectedHazard && (
              <div className="space-y-4">
                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-3xl"><h4 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-widest">{selectedHazard.hazard}</h4><p className="text-xs text-slate-300 leading-relaxed">{selectedHazard.description}</p><div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold"><div className="text-slate-500 uppercase">Validity:</div><div className="text-white">{selectedHazard.validity}</div><div className="text-slate-500 uppercase">Altitude:</div><div className="text-white">{selectedHazard.level}</div></div></div>
              </div>
            )}
          </div>
          {selectedAirport && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex flex-col gap-3">
              <button onClick={() => setFlightPlan(p => {
                if (p.some(apt => apt.icao === selectedAirport.icao)) return p;
                return [...p, selectedAirport];
              })} disabled={flightPlan.some(p => p.icao === selectedAirport.icao)} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98]"><Plus size={18} /> ADD TO FLIGHT PLAN</button>
              
              <button 
                onClick={() => {
                  setPinnedAirports(prev => {
                    if (prev.some(a => a.icao === selectedAirport.icao)) return prev;
                    return [...prev, selectedAirport];
                  });
                  alert(`${selectedAirport.icao} pinpointed on map.`);
                }} 
                disabled={pinnedAirports.some(p => p.icao === selectedAirport.icao)}
                className="w-full bg-blue-600/10 hover:bg-blue-600/20 disabled:opacity-50 text-blue-500 border border-blue-500/30 font-bold py-3 rounded-2xl flex items-center justify-center gap-3 transition-all"
              >
                <MapPin size={16} /> PINPOINT ON MAP
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapContainer;
