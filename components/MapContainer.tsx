
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Clock, 
  MapPin, 
  AlertCircle, 
  Maximize2, 
  Zap,
  ChevronDown,
  ChevronRight,
  Navigation,
  Info,
  Wind,
  Globe,
  ExternalLink,
  ShieldCheck,
  Radio,
  MoveUpRight
} from 'lucide-react';
import { MAJOR_AIRPORTS, MOCK_SIGMETS, MOCK_AIRMETS } from '../constants';
import { searchAirport, interpretWeather, getLiveAirportInfo } from '../services/gemini';
import { Airport, WeatherHazard } from '../types';

declare const L: any;

const REFRESH_INTERVAL = 300000; // 5 minutes

const MapContainer: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const layersRef = useRef<{ [key: string]: any }>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWeatherControls, setShowWeatherControls] = useState(false);
  
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<WeatherHazard | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherSummary, setWeatherSummary] = useState<string | null>(null);
  const [rawMetar, setRawMetar] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Real-time Information State
  const [liveIntel, setLiveIntel] = useState<{ text: string, links: { title: string, uri: string }[] } | null>(null);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  
  const [showRunways, setShowRunways] = useState(false);
  const [showWeatherDetails, setShowWeatherDetails] = useState(true);
  const [showIntel, setShowIntel] = useState(true);

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

  const fetchAirportWeather = useCallback(async (apt: Airport, silent: boolean = false) => {
    if (!silent) setIsWeatherLoading(true);
    if (!silent) setIsIntelLoading(true);
    
    try {
      const now = new Date();
      const categories = ['VFR', 'VFR', 'VFR', 'MVFR', 'IFR'];
      const cat = categories[Math.floor(Math.random() * categories.length)];
      
      const mockMetar = `${apt.icao} ${now.getUTCDate()}${now.getUTCHours()}${now.getUTCMinutes()}Z 24012KT 10SM SCT030 OVC080 15/10 A2992 RMK AO2`;
      setRawMetar(mockMetar);
      
      const interpretation = await interpretWeather(mockMetar);
      setWeatherSummary(interpretation);
      setLastUpdated(new Date());

      // Fetch grounded live intelligence
      const intel = await getLiveAirportInfo(apt.icao);
      setLiveIntel(intel);

      if (markersRef.current[apt.icao]) {
        addAirportMarker(apt, false, cat); 
      }
    } catch (err) {
      console.error("Failed to load weather/intel", err);
    } finally {
      if (!silent) {
        setIsWeatherLoading(false);
        setIsIntelLoading(false);
      }
    }
  }, []);

  const handleAirportClick = useCallback(async (apt: Airport) => {
    setSelectedHazard(null);
    setSelectedAirport(apt);
    setWeatherSummary(null);
    setRawMetar(null);
    setLiveIntel(null);
    setLastUpdated(null);
    setShowWeatherDetails(true); 
    setShowIntel(true);
    fetchAirportWeather(apt);
  }, [fetchAirportWeather]);

  const addAirportMarker = useCallback((apt: Airport, focus: boolean = false, category: string = 'VFR') => {
    if (!mapInstance.current) return;
    if (markersRef.current[apt.icao]) {
      mapInstance.current.removeLayer(markersRef.current[apt.icao]);
    }
    const color = getCategoryColor(category);
    const markerIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex flex-col items-center group">
          <div class="absolute -inset-3 bg-[${color}]/10 rounded-full animate-ping opacity-30"></div>
          <div class="absolute -inset-2 bg-[${color}]/20 rounded-full blur-sm group-hover:bg-[${color}]/40 transition-all duration-300"></div>
          <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transform group-hover:scale-125 transition-transform duration-200" style="background-color: ${color}"></div>
          <div class="flex flex-col items-center mt-1">
            <span class="text-[10px] font-bold text-white drop-shadow-md font-mono bg-slate-900/95 px-1.5 py-0.5 rounded-md border border-slate-700 whitespace-nowrap group-hover:border-[${color}] transition-colors">${apt.icao}</span>
            <span class="text-[8px] font-black text-[${color}] uppercase drop-shadow-sm mt-0.5">${category}</span>
          </div>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    const marker = L.marker([apt.lat, apt.lng], { icon: markerIcon })
      .addTo(mapInstance.current);

    marker.on('click', () => handleAirportClick(apt));
    markersRef.current[apt.icao] = marker;

    if (focus) {
      mapInstance.current.flyTo([apt.lat, apt.lng], 10, { animate: true, duration: 1.5 });
    }
  }, [handleAirportClick]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([40.7128, -74.0060], 4);
    
    layersRef.current.base = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB'
    }).addTo(mapInstance.current);

    layersRef.current.vfr = L.tileLayer('https://tiles.arcgis.com/tiles/ssU2qS7qELu60V4p/arcgis/rest/services/VFR_Sectional/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'FAA VFR Sectional'
    });

    layersRef.current.ifrLow = L.tileLayer('https://tiles.arcgis.com/tiles/ssU2qS7qELu60V4p/arcgis/rest/services/IFR_Low_Enroute/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'FAA IFR Low Enroute'
    });

    layersRef.current.ifrHigh = L.tileLayer('https://tiles.arcgis.com/tiles/ssU2qS7qELu60V4p/arcgis/rest/services/IFR_High_Enroute/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'FAA IFR High Enroute'
    });

    layersRef.current.radar = L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0r-900913/{z}/{x}/{y}.png', {
      attribution: 'Iowa State University NEXRAD',
      opacity: 0.65,
      transparent: true
    });

    layersRef.current.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri'
    });

    MAJOR_AIRPORTS.forEach(apt => addAirportMarker(apt));
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [addAirportMarker]);

  const updateWeatherLayers = useCallback(() => {
    if (!mapInstance.current) return;

    if (weatherConfig.vfrSectional) layersRef.current.vfr?.addTo(mapInstance.current);
    else layersRef.current.vfr?.remove();

    if (weatherConfig.ifrLow) layersRef.current.ifrLow?.addTo(mapInstance.current);
    else layersRef.current.ifrLow?.remove();

    if (weatherConfig.ifrHigh) layersRef.current.ifrHigh?.addTo(mapInstance.current);
    else layersRef.current.ifrHigh?.remove();

    if (weatherConfig.radar) layersRef.current.radar?.addTo(mapInstance.current);
    else layersRef.current.radar?.remove();

    if (weatherConfig.satellite) layersRef.current.satellite?.addTo(mapInstance.current);
    else layersRef.current.satellite?.remove();

    if (layersRef.current.sigmetGroup) layersRef.current.sigmetGroup.remove();
    if (weatherConfig.sigmets) {
      layersRef.current.sigmetGroup = L.layerGroup().addTo(mapInstance.current);
      MOCK_SIGMETS.forEach(sig => {
        L.polygon(sig.points, { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3, weight: 2 })
          .on('click', (e: any) => { L.DomEvent.stopPropagation(e); setSelectedAirport(null); setSelectedHazard(sig); })
          .addTo(layersRef.current.sigmetGroup);
      });
    }

    if (layersRef.current.airmetGroup) layersRef.current.airmetGroup.remove();
    if (weatherConfig.airmets) {
      layersRef.current.airmetGroup = L.layerGroup().addTo(mapInstance.current);
      MOCK_AIRMETS.forEach(air => {
        L.polygon(air.points, { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 2, dashArray: '5, 5' })
          .on('click', (e: any) => { L.DomEvent.stopPropagation(e); setSelectedAirport(null); setSelectedHazard(air); })
          .addTo(layersRef.current.airmetGroup);
      });
    }
  }, [weatherConfig]);

  useEffect(() => { updateWeatherLayers(); }, [updateWeatherLayers]);

  useEffect(() => {
    let interval: number | undefined;
    if (selectedAirport && weatherConfig.autoUpdate) {
      interval = window.setInterval(() => fetchAirportWeather(selectedAirport, true), REFRESH_INTERVAL);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedAirport, weatherConfig.autoUpdate, fetchAirportWeather]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const airport = await searchAirport(searchQuery);
      if (airport) {
        addAirportMarker(airport, true);
        handleAirportClick(airport);
        setSearchQuery('');
      } else { setError('Airport not found.'); }
    } catch (err) { setError('Search failed.'); } finally { setIsSearching(false); }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* HUD Search & Layers Trigger */}
      <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col md:flex-row gap-4 pointer-events-none">
        <form onSubmit={handleSearch} className="relative w-full md:w-96 pointer-events-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              placeholder="Live ICAO Search..."
              className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all shadow-2xl text-sm font-medium"
            />
            <button type="submit" disabled={isSearching} className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 px-4 rounded-xl font-bold text-xs">
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'FETCH'}
            </button>
          </div>
        </form>

        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => setShowWeatherControls(!showWeatherControls)} 
            className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all shadow-2xl flex items-center gap-2 font-bold text-xs ${showWeatherControls ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/90 border-slate-700/50 text-slate-400'}`}
          >
            <Layers size={18} />
            <span className="hidden md:block uppercase tracking-widest">Map Layers</span>
          </button>
        </div>
      </div>

      <div ref={mapRef} className="flex-1 z-0" />

      {/* Expanded Map Layers Panel */}
      {showWeatherControls && (
        <div className="absolute top-24 left-6 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-[32px] p-6 z-[1000] shadow-2xl animate-in slide-in-from-top-4 duration-300 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Electronic Flight Bag</h3>
            <button onClick={() => setShowWeatherControls(false)} className="text-slate-500 hover:text-white p-1">
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-6">
            <section>
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Navigation size={12} />
                Navigation Charts
              </h4>
              <div className="space-y-1">
                {[
                  { id: 'vfrSectional', icon: Navigation, label: 'VFR Sectional', sub: 'Visual Navigation Charts' },
                  { id: 'ifrLow', icon: MoveUpRight, label: 'IFR Low Enroute', sub: 'Low-Altitude Airways' },
                  { id: 'ifrHigh', icon: Zap, label: 'IFR High Enroute', sub: 'Jet Routes (above FL180)' },
                  { id: 'satellite', icon: Satellite, label: 'Satellite View', sub: 'World Imagery' },
                ].map((layer) => (
                  <label key={layer.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 cursor-pointer group transition-all border border-transparent hover:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-700 transition-colors">
                        <layer.icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200">{layer.label}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{layer.sub}</div>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(weatherConfig as any)[layer.id]} 
                        onChange={() => setWeatherConfig(prev => ({ ...prev, [layer.id]: !(prev as any)[layer.id] }))} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 after:bg-white"></div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CloudRain size={12} />
                Weather Overlays
              </h4>
              <div className="space-y-1">
                {[
                  { id: 'radar', icon: Radio, label: 'NEXRAD Radar', sub: 'Real-time Precipitation', color: 'text-emerald-400' },
                  { id: 'sigmets', icon: ShieldAlert, label: 'SIGMET Overlay', sub: 'Significant Meteorological', color: 'text-red-400' },
                  { id: 'airmets', icon: CloudRain, label: 'AIRMET Overlay', sub: 'In-flight Advisories', color: 'text-orange-400' },
                  { id: 'autoUpdate', icon: RotateCw, label: 'Auto-Refresh', sub: '5 min telemetry cycle' }
                ].map((layer) => (
                  <label key={layer.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 cursor-pointer group transition-all border border-transparent hover:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-slate-800 ${layer.color || 'text-slate-400'} group-hover:bg-slate-700 transition-colors`}>
                        <layer.icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200">{layer.label}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{layer.sub}</div>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(weatherConfig as any)[layer.id]} 
                        onChange={() => setWeatherConfig(prev => ({ ...prev, [layer.id]: !(prev as any)[layer.id] }))} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 after:bg-white"></div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Global Information Ticker */}
      <div className="absolute bottom-6 left-6 right-[444px] hidden xl:flex z-[1000] pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl flex items-center gap-4 w-full overflow-hidden shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest text-white whitespace-nowrap">
            <Globe size={12} className="animate-spin-slow" />
            Global Feed
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-12 animate-marquee whitespace-nowrap text-[10px] font-mono font-bold text-slate-400">
              <span>GPS CONSTELLATION: NOMINAL</span>
              <span>•</span>
              <span>SOLAR ACTIVITY: LOW - NO RADIO INTERFERENCE</span>
              <span>•</span>
              <span>NORTH ATLANTIC TRACKS: UPDATED 1200Z</span>
              <span>•</span>
              <span>ICAO VOLCANIC ASH ADVISORY: NONE ACTIVE</span>
              <span>•</span>
              <span>SPACE WEATHER STATUS: G1 MINOR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Panel */}
      {(selectedAirport || selectedHazard) && (
        <div className="absolute inset-y-6 right-6 w-full md:w-[420px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/40 rounded-[32px] shadow-2xl z-[1001] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg">
                {selectedAirport ? <PlaneTakeoff size={20} className="text-white" /> : <ShieldAlert size={20} className="text-white" />}
              </div>
              <div>
                <h2 className="font-bold text-lg">{selectedAirport ? selectedAirport.icao : 'HAZARD'}</h2>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{selectedAirport ? selectedAirport.name : selectedHazard?.hazard}</div>
              </div>
            </div>
            <button onClick={() => { setSelectedAirport(null); setSelectedHazard(null); }} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {selectedAirport && (
              <>
                {/* Real-time Information Section (Grounded) */}
                <div className="space-y-4">
                  <button onClick={() => setShowIntel(!showIntel)} className="w-full flex items-center justify-between text-xs font-black text-amber-500 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} />
                      Flight Information
                    </div>
                    {showIntel ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  
                  {showIntel && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {isIntelLoading ? (
                        <div className="py-8 flex flex-col items-center justify-center bg-amber-500/5 rounded-3xl border border-amber-500/10 border-dashed">
                          <Loader2 className="animate-spin text-amber-500 mb-2" size={20} />
                          <span className="text-[9px] text-amber-600/70 font-bold uppercase">Scanning Live NOTAMs...</span>
                        </div>
                      ) : (
                        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl">
                           <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                             {liveIntel?.text || "No specific operational warnings detected."}
                           </div>
                           
                           {liveIntel?.links && liveIntel.links.length > 0 && (
                             <div className="mt-4 pt-4 border-t border-amber-500/10 space-y-2">
                               <div className="text-[9px] font-black text-amber-600 uppercase mb-2">Source Documentation</div>
                               {liveIntel.links.map((link, i) => (
                                 <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 text-xs text-blue-400 group transition-all">
                                   <span className="truncate pr-4">{link.title}</span>
                                   <ExternalLink size={12} className="flex-shrink-0 opacity-50 group-hover:opacity-100" />
                                 </a>
                               ))}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Weather Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Weather Observation
                  </h3>
                  
                  {isWeatherLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center bg-slate-800/20 rounded-3xl border border-slate-800 border-dashed">
                      <Loader2 className="animate-spin text-blue-500" size={20} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {weatherSummary && (
                        <div className="bg-blue-600/5 border border-blue-500/10 p-5 rounded-3xl">
                           <div className="text-sm text-slate-200 leading-relaxed font-medium">
                             {weatherSummary}
                           </div>
                        </div>
                      )}
                      <div className="bg-slate-950 border border-slate-800/50 p-4 rounded-2xl">
                        <p className="font-mono text-[10px] text-blue-400/80 leading-relaxed break-all">{rawMetar}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Runway Section */}
                <div className="space-y-4 pt-2">
                  <button onClick={() => setShowRunways(!showRunways)} className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300">
                    <div className="flex items-center gap-2"><MapPin size={14} /> Runway Geometry</div>
                    {showRunways ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {showRunways && (
                    <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-top-2 duration-200">
                      {selectedAirport.runways?.map((rwy, idx) => (
                        <div key={idx} className="bg-slate-800/40 border border-slate-700/30 p-4 rounded-2xl flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-slate-100">RWY {rwy.ident}</div>
                            <div className="text-[10px] text-slate-500">{rwy.surface}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-blue-400">{rwy.length} × {rwy.width}</div>
                            <div className="text-[9px] text-slate-600 uppercase font-bold">FEET</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="p-6 bg-slate-900/90 border-t border-slate-800">
             <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-600/10">
                <Maximize2 size={18} />
                MISSION SUMMARY
             </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MapContainer;
