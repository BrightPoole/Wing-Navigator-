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
  Download,
  History,
  Target,
  Layout,
  Zap,
  ArrowUp,
  Link as LinkIcon,
  RefreshCw,
  Cloud
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

// Helper to extract wind from METAR
const parseWind = (metar: string | null) => {
  if (!metar) return null;
  const match = metar.match(/\s(\d{3})(\d{2,3})(G\d{2,3})?KT/);
  if (match) {
    return {
      dir: parseInt(match[1]),
      speed: parseInt(match[2]),
      gust: match[3] ? parseInt(match[3].substring(1)) : null
    };
  }
  return null;
};

// Helper to get heading from runway ident
const getRwyHeading = (ident: string) => {
  const match = ident.match(/^(\d{2})/);
  return match ? parseInt(match[1]) * 10 : null;
};

interface MapContainerProps {
  theme?: 'light' | 'dark';
  flightPlan: Airport[];
  setFlightPlan: React.Dispatch<React.SetStateAction<Airport[]>>;
  terminalAirports: Airport[];
  setTerminalAirports: React.Dispatch<React.SetStateAction<Airport[]>>;
}

interface SavedPlan {
  name: string;
  waypoints: Airport[];
  timestamp: number;
}

const MapContainer: React.FC<MapContainerProps> = ({ theme = 'dark', flightPlan, setFlightPlan, terminalAirports, setTerminalAirports }) => {
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
  const [showTerminals, setShowTerminals] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<WeatherHazard | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherSummary, setWeatherSummary] = useState<string | null>(null);
  const [rawMetar, setRawMetar] = useState<string | null>(null);
  
  const [liveIntel, setLiveIntel] = useState<{ text: string, links: { title: string, uri: string }[] } | null>(null);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  
  const [groundSpeed, setGroundSpeed] = useState(120);
  
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    const saved = localStorage.getItem(SAVED_PLANS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

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
      const windDeg = Math.floor(Math.random() * 36) * 10;
      const windSpeed = 8 + Math.floor(Math.random() * 10);
      const mockMetar = `${apt.icao} ${now.getUTCDate()}${now.getUTCHours()}${now.getUTCMinutes()}Z ${windDeg.toString().padStart(3, '0')}${windSpeed}KT 10SM SCT030 OVC080 15/10 A2992 RMK AO2`;
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
    
    if (mapInstance.current) {
      mapInstance.current.flyTo([apt.lat, apt.lng], 10, { animate: true, duration: 1.5 });
    }
  }, [fetchAirportWeather]);

  // Weather Auto-update timer logic
  useEffect(() => {
    let interval: any;
    if (selectedAirport && weatherConfig.autoUpdate) {
      interval = setInterval(() => {
        fetchAirportWeather(selectedAirport, true);
      }, REFRESH_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [selectedAirport, weatherConfig.autoUpdate, fetchAirportWeather]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true
    }).setView([40.7128, -74.0060], 4);
    
    mapInstance.current = map;

    const initialTileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    layersRef.current.base = L.tileLayer(initialTileUrl).addTo(map);

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
  }, []);

  useEffect(() => {
    if (mapInstance.current && layersRef.current.base) {
      const newUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      layersRef.current.base.setUrl(newUrl);
    }
  }, [theme]);

  useEffect(() => {
    if (isMapReady) {
      MAJOR_AIRPORTS.forEach(apt => addAirportMarker(apt));
      terminalAirports.forEach(apt => addAirportMarker(apt));
      flightPlan.forEach(apt => addAirportMarker(apt));
    }
  }, [isMapReady, addAirportMarker, flightPlan, terminalAirports]);

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

  const windData = useMemo(() => parseWind(rawMetar), [rawMetar]);

  const activeRwy = useMemo(() => {
    if (!selectedAirport?.runways || !windData) return null;

    let bestRwy = null;
    let minDiff = 181;

    selectedAirport.runways.forEach(rwy => {
      const idents = rwy.ident.split('/');
      idents.forEach(ident => {
        const heading = getRwyHeading(ident);
        if (heading !== null) {
          let diff = Math.abs(windData.dir - heading);
          if (diff > 180) diff = 360 - diff;
          if (diff < minDiff) {
            minDiff = diff;
            bestRwy = ident;
          }
        }
      });
    });
    return bestRwy;
  }, [selectedAirport, windData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const airport = await searchAirport(searchQuery);
      if (airport) {
        setTerminalAirports(prev => {
          if (prev.some(a => a.icao === airport.icao)) return prev;
          return [airport, ...prev];
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

  const deleteTerminal = (icao: string) => {
    setTerminalAirports(prev => prev.filter(p => p.icao !== icao));
    if (markersRef.current[icao]) {
      mapInstance.current.removeLayer(markersRef.current[icao]);
      delete markersRef.current[icao];
    }
  };

  const toggleWeatherConfig = (key: keyof typeof weatherConfig) => {
    setWeatherConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col md:flex-row gap-4 pointer-events-none">
        <form onSubmit={handleSearch} className="relative w-full md:w-80 pointer-events-auto">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              placeholder="Live ICAO or airport Search..."
              className={`w-full backdrop-blur-xl border rounded-2xl py-3.5 pl-9 pr-4 outline-none transition-all shadow-2xl text-sm font-medium ${
                isLight ? 'bg-white/90 border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-700/50 text-white'
              }`}
            />
            <button type="submit" disabled={isSearching} className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 px-3 min-w-[60px] flex items-center justify-center rounded-xl font-bold text-xs text-white transition-all active:scale-95">
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'GO'}
            </button>
          </div>
        </form>

        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => { setShowWeatherControls(!showWeatherControls); setShowFlightPlan(false); setShowTerminals(false); }} className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all shadow-2xl flex items-center gap-2 font-bold text-xs ${showWeatherControls ? 'bg-blue-600 text-white' : isLight ? 'bg-white/90 text-slate-600' : 'bg-slate-900/90 text-slate-400'}`}>
            <Layers size={18} />
            <span className="hidden md:block uppercase tracking-widest">Map Layers</span>
          </button>
          <button onClick={() => { setShowTerminals(!showTerminals); setShowFlightPlan(false); setShowWeatherControls(false); }} className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all shadow-2xl flex items-center gap-2 font-bold text-xs ${showTerminals ? 'bg-orange-600 text-white' : isLight ? 'bg-white/90 text-slate-600' : 'bg-slate-900/90 text-slate-400'}`}>
            <MapPin size={18} />
            <span className="hidden md:block uppercase tracking-widest">Terminals ({terminalAirports.length})</span>
          </button>
          <button onClick={() => { setShowFlightPlan(!showFlightPlan); setShowTerminals(false); setShowWeatherControls(false); }} className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all shadow-2xl flex items-center gap-2 font-bold text-xs ${showFlightPlan ? 'bg-emerald-600 text-white' : isLight ? 'bg-white/90 text-slate-600' : 'bg-slate-900/90 text-slate-400'}`}>
            <Route size={18} />
            <span className="hidden md:block uppercase tracking-widest">Flight Plan ({flightPlan.length})</span>
          </button>
        </div>
      </div>

      <div ref={mapRef} className="flex-1 z-0" />

      {/* Map Layers & Weather Controls Panel */}
      {showWeatherControls && (
        <div className={`absolute top-24 left-6 w-80 backdrop-blur-xl border rounded-[32px] p-6 z-[1000] shadow-2xl flex flex-col animate-in slide-in-from-left-4 duration-200 ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-700/50'}`}>
           <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Map Visualization</h3>
            <button onClick={() => setShowWeatherControls(false)} className="text-slate-500 hover:text-white p-1.5"><X size={16} /></button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Base Charts</span>
              <div className="grid grid-cols-1 gap-1">
                <button onClick={() => toggleWeatherConfig('vfrSectional')} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${weatherConfig.vfrSectional ? 'bg-blue-600/10 border-blue-600/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                  <span className="text-xs font-bold uppercase tracking-widest">VFR Sectional</span>
                  {weatherConfig.vfrSectional ? <Check size={14} /> : null}
                </button>
                <button onClick={() => toggleWeatherConfig('ifrLow')} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${weatherConfig.ifrLow ? 'bg-blue-600/10 border-blue-600/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                  <span className="text-xs font-bold uppercase tracking-widest">IFR Low Enroute</span>
                  {weatherConfig.ifrLow ? <Check size={14} /> : null}
                </button>
                <button onClick={() => toggleWeatherConfig('satellite')} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${weatherConfig.satellite ? 'bg-blue-600/10 border-blue-600/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                  <div className="flex items-center gap-2"><Satellite size={14} /> <span className="text-xs font-bold uppercase tracking-widest">Satellite Imagery</span></div>
                  {weatherConfig.satellite ? <Check size={14} /> : null}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Weather Layers</span>
              <div className="grid grid-cols-1 gap-1">
                <button onClick={() => toggleWeatherConfig('radar')} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${weatherConfig.radar ? 'bg-blue-600/10 border-blue-600/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                  <div className="flex items-center gap-2"><CloudRain size={14} /> <span className="text-xs font-bold uppercase tracking-widest">Precip Radar</span></div>
                  {weatherConfig.radar ? <Check size={14} /> : null}
                </button>
                <button onClick={() => toggleWeatherConfig('sigmets')} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${weatherConfig.sigmets ? 'bg-red-600/10 border-red-600/50 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                  <div className="flex items-center gap-2"><ShieldAlert size={14} /> <span className="text-xs font-bold uppercase tracking-widest">SIGMETs</span></div>
                  {weatherConfig.sigmets ? <Check size={14} /> : null}
                </button>
                <button onClick={() => toggleWeatherConfig('airmets')} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${weatherConfig.airmets ? 'bg-amber-600/10 border-amber-600/50 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                  <div className="flex items-center gap-2"><Cloud size={14} /> <span className="text-xs font-bold uppercase tracking-widest">AIRMETs</span></div>
                  {weatherConfig.airmets ? <Check size={14} /> : null}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
               <button onClick={() => toggleWeatherConfig('autoUpdate')} className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all ${weatherConfig.autoUpdate ? 'bg-emerald-600/10 border-emerald-600/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                  <div className="flex items-center gap-3">
                    <RefreshCw size={14} className={weatherConfig.autoUpdate ? 'animate-spin-slow' : ''} />
                    <div className="text-left">
                      <span className="block text-xs font-bold uppercase tracking-widest">WX Auto-Update</span>
                      <span className="block text-[8px] font-medium uppercase text-slate-600">Sync every 5m</span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${weatherConfig.autoUpdate ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${weatherConfig.autoUpdate ? 'left-4.5' : 'left-0.5'}`} style={{ left: weatherConfig.autoUpdate ? '1.1rem' : '0.125rem' }}></div>
                  </div>
                </button>
            </div>
          </div>
        </div>
      )}

      {showTerminals && (
        <div className={`absolute top-24 left-6 w-96 backdrop-blur-xl border rounded-[32px] p-6 z-[1000] shadow-2xl flex flex-col overflow-hidden max-h-[calc(100vh-140px)] animate-in slide-in-from-left-4 duration-200 ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">Terminal Briefing</h3>
            <button onClick={() => setShowTerminals(false)} className="text-slate-500 hover:text-white p-1.5"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {terminalAirports.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-slate-500 font-medium">Search for airports to monitor them on your terminal list.</p>
              </div>
            ) : (
              terminalAirports.map((apt) => (
                <div key={apt.icao} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleAirportClick(apt)}>
                    <div className="bg-orange-600/10 w-9 h-9 rounded-xl flex items-center justify-center text-orange-500 font-black text-xs border border-orange-500/20">{apt.icao}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white leading-tight">{apt.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ON CHART</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleAirportClick(apt)} className="p-2 text-slate-500 hover:text-orange-400 transition-colors" title="Bring Back Focus">
                      <Target size={16} />
                    </button>
                    <button onClick={() => deleteTerminal(apt.icao)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showFlightPlan && (
        <div className={`absolute top-24 left-6 w-96 backdrop-blur-xl border rounded-[32px] p-6 z-[1000] shadow-2xl flex flex-col overflow-hidden max-h-[calc(100vh-140px)] animate-in slide-in-from-left-4 duration-200 ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">Mission Route Plan</h3>
            <button onClick={() => setShowFlightPlan(false)} className="text-slate-500 hover:text-white p-1.5"><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {flightPlan.length === 0 ? <p className="text-center text-xs text-slate-500 py-12">Search airports to build your route.</p> : flightPlan.map((apt, i) => (
              <div 
                key={apt.icao + i} 
                className={`p-4 bg-slate-950 border rounded-2xl flex items-center justify-between group transition-all border-slate-800 hover:border-slate-700`}
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

          {flightPlan.length > 1 && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800"><div className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Distance</div><div className="text-xl font-mono font-bold text-white">{routeStats.totalDist} <span className="text-[10px] text-slate-500">NM</span></div></div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800"><div className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Time (ETE)</div><div className="text-xl font-mono font-bold text-emerald-400">{routeStats.ete}</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {(selectedAirport || selectedHazard) && (
        <div className={`absolute inset-y-6 right-6 w-full md:w-[460px] backdrop-blur-3xl border rounded-[40px] shadow-2xl z-[1001] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300 ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/98 border-slate-700/40'}`}>
          <div className={`p-8 border-b flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-[20px] shadow-xl shadow-blue-900/40">
                {selectedAirport ? <PlaneTakeoff size={24} className="text-white" /> : <ShieldAlert size={24} className="text-white" />}
              </div>
              <div>
                <h2 className={`font-black text-2xl tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedAirport ? selectedAirport.icao : 'WEATHER HAZARD'}
                </h2>
                <div className="text-[10px] uppercase font-black text-slate-500 mt-1 flex items-center gap-2">
                  <span className="truncate max-w-[200px]">{selectedAirport ? selectedAirport.name : selectedHazard?.hazard}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                  <span className="text-emerald-500 animate-pulse">LIVE DATA</span>
                </div>
              </div>
            </div>
            <button onClick={() => { setSelectedAirport(null); setSelectedHazard(null); }} className="text-slate-500 hover:text-white p-2 bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {selectedAirport && (
              <>
                {/* Flight Information (NOTAMs) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <ShieldCheck size={16} /> Flight Information
                    </h3>
                  </div>
                  {isIntelLoading ? (
                    <div className="py-12 bg-slate-950/50 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-amber-500" size={24} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Scanning Grounding Sources...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[28px] text-sm leading-relaxed text-slate-200 font-medium shadow-inner">
                        {liveIntel?.text || "No critical NOTAMs or operational delays currently reported for this terminal."}
                      </div>
                      {liveIntel?.links && liveIntel.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-1">
                          {liveIntel.links.map((link, idx) => (
                            <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-400 transition-colors">
                              <LinkIcon size={12} />
                              {link.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Runway Section */}
                {selectedAirport.runways && selectedAirport.runways.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Layout size={16} /> Runway
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedAirport.runways.map((rwy) => {
                        const idents = rwy.ident.split('/');
                        const isActive = idents.some(id => id === activeRwy);
                        return (
                          <div key={rwy.ident} className={`p-5 rounded-3xl flex items-center justify-between shadow-lg transition-all border ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20 scale-[1.02]' : 'bg-slate-950 border-slate-800'}`}>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <div className="text-xl font-mono font-bold text-white leading-none mb-1">
                                  {rwy.ident}
                                </div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{rwy.surface}</div>
                              </div>
                              {isActive && (
                                <div className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-900/40">
                                  <Zap size={10} className="fill-white" /> SUGGESTED
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-base font-mono font-bold text-slate-200">{rwy.length} x {rwy.width}</div>
                              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Feet</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Weather Observation Section */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Wind size={16} /> Weather Observation
                    </h3>
                    <button 
                      onClick={() => toggleWeatherConfig('autoUpdate')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[9px] font-black uppercase tracking-tighter ${weatherConfig.autoUpdate ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                    >
                      <RefreshCw size={10} className={weatherConfig.autoUpdate ? 'animate-spin-slow' : ''} />
                      {weatherConfig.autoUpdate ? 'Auto-Update ON' : 'Auto-Update OFF'}
                    </button>
                  </div>
                  {isWeatherLoading ? (
                    <div className="py-12 bg-slate-950/50 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-emerald-500" size={24} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Decoding Meteorological Data...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center">
                            <ArrowUp size={24} className="text-emerald-500 transition-transform duration-1000" style={{ transform: `rotate(${windData?.dir || 0}deg)` }} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-500 uppercase">Winds</div>
                            <div className="text-xl font-mono font-bold text-white">{windData ? `${windData.dir.toString().padStart(3, '0')}@${windData.speed}KT` : 'CALM'}</div>
                          </div>
                        </div>
                        <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl text-center flex flex-col justify-center">
                           <div className="text-sm font-black text-slate-500 uppercase">Category</div>
                           <div className="text-2xl font-black text-emerald-500 tracking-tighter">VFR</div>
                        </div>
                      </div>

                      {weatherSummary && (
                        <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl text-sm text-slate-200 leading-relaxed font-medium shadow-inner">
                          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Weather Briefing</div>
                          {weatherSummary}
                        </div>
                      )}

                      <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl font-mono text-xs text-blue-400/80 font-bold break-all shadow-inner leading-relaxed">
                        <span className="text-slate-600 mr-2 uppercase text-[9px]">RAW METAR:</span>
                        {rawMetar}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedHazard && (
              <div className="space-y-4">
                <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[40px] shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldAlert size={32} className="text-red-500" />
                    <h4 className="text-xl font-black text-red-500 uppercase tracking-tight">{selectedHazard.hazard}</h4>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium mb-8">
                    {selectedHazard.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <div className="text-[10px] font-black text-slate-600 uppercase mb-1">Validity</div>
                      <div className="text-xs font-bold text-white font-mono">{selectedHazard.validity}</div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <div className="text-[10px] font-black text-slate-600 uppercase mb-1">Flight Level</div>
                      <div className="text-xs font-bold text-white font-mono">{selectedHazard.level}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedAirport && (
            <div className="p-8 border-t border-slate-800 bg-slate-900/95 flex flex-col gap-3">
              <button onClick={() => setFlightPlan(p => {
                if (p.some(apt => apt.icao === selectedAirport.icao)) return p;
                return [...p, selectedAirport];
              })} disabled={flightPlan.some(p => p.icao === selectedAirport.icao)} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-900/40 transition-all active:scale-[0.98] tracking-widest text-sm">
                <Plus size={20} /> ADD TO MISSION PLAN
              </button>
              
              <button 
                onClick={() => {
                  setTerminalAirports(prev => {
                    if (prev.some(a => a.icao === selectedAirport.icao)) return prev;
                    return [selectedAirport, ...prev];
                  });
                }} 
                disabled={terminalAirports.some(p => p.icao === selectedAirport.icao)}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 font-bold py-4 rounded-[24px] flex items-center justify-center gap-3 transition-all"
              >
                <MapPin size={18} /> SAVE TO TERMINAL DECK
              </button>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MapContainer;
