import React, { useState, useMemo, useEffect } from 'react';
import { 
  Fuel, 
  Wind, 
  Ruler, 
  Settings2, 
  Thermometer, 
  PlaneLanding, 
  Navigation2, 
  PlaneTakeoff, 
  AlertTriangle, 
  Timer, 
  ArrowDownRight, 
  ArrowUpRight, 
  Scale, 
  Info, 
  MoveRight, 
  Clock, 
  ChevronRight, 
  Zap, 
  Target, 
  RefreshCw,
  Compass,
  ArrowRightLeft,
  Check,
  Mountain,
  Gauge
} from 'lucide-react';

type TabType = 'fuel' | 'wind' | 'takeoff' | 'landing' | 'performance' | 'nav' | 'climb' | 'weight';
type SurfaceType = 'paved' | 'grass_dry' | 'grass_wet' | 'soft_field';

const CalculatorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('fuel');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Shared Performance & Environmental State
  const [fieldElev, setFieldElev] = useState('0');
  const [altimeter, setAltimeter] = useState('29.92');
  const [pressAlt, setPressAlt] = useState('0');
  const [oat, setOat] = useState('15');
  const [weight, setWeight] = useState('2400');
  const [headwindInput, setHeadwindInput] = useState('0');
  const [rwyLen, setRwyLen] = useState('3000');
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('paved');
  const [magVar, setMagVar] = useState('0');

  // Nav Planning & Fuel
  const [dist, setDist] = useState('100');
  const [gsInput, setGsInput] = useState('110');
  const [burnRate, setBurnRate] = useState('8.5');
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

  // Wind Triangle
  const [tas, setTas] = useState('110');
  const [windSpeed, setWindSpeed] = useState('15');
  const [windDir, setWindDir] = useState('270');
  const [course, setCourse] = useState('360');

  // Climb & Descent
  const [startAlt, setStartAlt] = useState('1000');
  const [targetAlt, setTargetAlt] = useState('8500');
  const [fpm, setFpm] = useState('500');

  // Weight & Balance State
  const [emptyWeight, setEmptyWeight] = useState('1642');
  const [emptyArm, setEmptyArm] = useState('38.5');
  const [pilotWeight, setPilotWeight] = useState('190');
  const [copilotWeight, setCopilotWeight] = useState('0');
  const [rearPaxWeight, setRearPaxWeight] = useState('0');
  const [baggage1Weight, setBaggage1Weight] = useState('0');
  const [fuelGals, setFuelGals] = useState('53');
  const [maxTakeoffWeight, setMaxTakeoffWeight] = useState('2550');
  
  // Station Arms
  const [frontArm, setFrontArm] = useState('37.0');
  const [rearArm, setRearArm] = useState('73.0');
  const [fuelArm, setFuelArm] = useState('48.0');
  const [baggageArm, setBaggageArm] = useState('95.0');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Derived Pressure Altitude Helper
  const calculatedPressAltValue = useMemo(() => {
    const elev = parseFloat(fieldElev);
    const altim = parseFloat(altimeter);
    if (isNaN(elev) || isNaN(altim)) return 0;
    return Math.round(elev + (29.92 - altim) * 1000);
  }, [fieldElev, altimeter]);

  const syncPressAltFromDerived = () => {
    setPressAlt(calculatedPressAltValue.toString());
  };

  const densityAlt = useMemo(() => {
    const pa = parseFloat(pressAlt);
    const temp = parseFloat(oat);
    if (isNaN(pa) || isNaN(temp)) return 0;
    const isaTemp = 15 - (2 * (pa / 1000));
    return Math.round(pa + (120 * (temp - isaTemp)));
  }, [pressAlt, oat]);

  const perfImpact = useMemo(() => {
    const da = densityAlt;
    const baseTakeoffAdd = Math.max(0, (da / 1000) * 10); // 10% more distance per 1000ft DA
    const baseClimbRed = Math.max(0, (da / 1000) * 7); // 7% less climb per 1000ft DA
    return {
      takeoffDistanceIncrease: baseTakeoffAdd.toFixed(1),
      climbRateReduction: baseClimbRed.toFixed(1),
      isHighDA: da > 3000
    };
  }, [densityAlt]);

  const windResults = useMemo(() => {
    const V_tas = parseFloat(tas);
    const V_ws = parseFloat(windSpeed);
    const D_wd = parseFloat(windDir);
    const D_tc = parseFloat(course);
    const v = parseFloat(magVar) || 0;
    
    if (isNaN(V_tas) || isNaN(V_ws) || isNaN(D_wd) || isNaN(D_tc) || V_tas === 0) {
      return { gs: 0, wca: 0, th: 0, mh: 0, headwind: 0, crosswind: 0 };
    }

    const wd_rad = (D_wd * Math.PI) / 180;
    const tc_rad = (D_tc * Math.PI) / 180;
    const angleDiff = wd_rad - tc_rad;
    
    const headwind = V_ws * Math.cos(angleDiff);
    const crosswind = V_ws * Math.sin(angleDiff);
    
    const wca_rad = Math.asin((V_ws / V_tas) * Math.sin(angleDiff));
    const wca_deg = (wca_rad * 180) / Math.PI;
    
    let th = D_tc + wca_deg;
    if (th < 0) th += 360; 
    if (th >= 360) th -= 360;

    let mh = th - v;
    if (mh < 0) mh += 360;
    if (mh >= 360) mh -= 360;

    const gs = V_tas * Math.cos(wca_rad) - headwind;

    return { 
      gs: Math.round(gs), 
      th: Math.round(th),
      mh: Math.round(mh),
      wca: parseFloat(wca_deg.toFixed(1)),
      headwind: Math.round(headwind),
      crosswind: Math.round(crosswind)
    };
  }, [tas, windSpeed, windDir, course, magVar]);

  const navResults = useMemo(() => {
    const d = parseFloat(dist);
    const s = parseFloat(gsInput) || windResults.gs;
    const b = parseFloat(burnRate);
    if (isNaN(d) || isNaN(s) || isNaN(b) || s <= 0) return { timeMin: 0, fuelReq: 0, ete: '00:00', eta: '--:--' };
    
    const timeHr = d / s;
    const timeMin = timeHr * 60;
    const eteFormatted = `${Math.floor(timeHr).toString().padStart(2, '0')}:${Math.round((timeHr % 1) * 60).toString().padStart(2, '0')}`;
    
    const [hrs, mins] = departureTime.split(':').map(Number);
    const depDate = new Date();
    depDate.setHours(hrs || 0, mins || 0, 0, 0);
    
    const etaDate = new Date(depDate.getTime() + timeMin * 60000);
    return { 
      timeMin: Math.round(timeMin), 
      fuelReq: parseFloat((timeHr * b).toFixed(1)),
      ete: eteFormatted,
      eta: etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  }, [dist, gsInput, windResults.gs, burnRate, departureTime]);

  const climbResults = useMemo(() => {
    const s = parseFloat(startAlt);
    const t = parseFloat(targetAlt);
    const r = parseFloat(fpm);
    const s_gs = parseFloat(gsInput) || windResults.gs || 100;
    const b = parseFloat(burnRate);

    // Fixed typo: changed iNaN to isNaN
    if (isNaN(s) || isNaN(t) || isNaN(r) || r <= 0) return { time: 0, dist: 0, fuel: 0 };

    const diff = Math.abs(t - s);
    const timeMin = diff / r;
    const timeHr = timeMin / 60;
    const distance = (timeHr * s_gs);
    const fuelBurn = (timeHr * b);

    return {
      time: Math.round(timeMin),
      dist: parseFloat(distance.toFixed(1)),
      fuel: parseFloat(fuelBurn.toFixed(1))
    };
  }, [startAlt, targetAlt, fpm, gsInput, windResults.gs, burnRate]);

  const wbResults = useMemo(() => {
    const ew = parseFloat(emptyWeight) || 0;
    const ea = parseFloat(emptyArm) || 0;
    const pw = parseFloat(pilotWeight) || 0;
    const cpw = parseFloat(copilotWeight) || 0;
    const rpw = parseFloat(rearPaxWeight) || 0;
    const bw = parseFloat(baggage1Weight) || 0;
    const fg = parseFloat(fuelGals) || 0;
    const mtow = parseFloat(maxTakeoffWeight) || 2550;
    const fw = fg * 6;
    
    const fa = parseFloat(frontArm) || 0;
    const ra = parseFloat(rearArm) || 0;
    const fula = parseFloat(fuelArm) || 0;
    const ba = parseFloat(baggageArm) || 0;

    const takeoffWeight = ew + pw + cpw + rpw + bw + fw;
    const takeoffMoment = (ew * ea) + ((pw + cpw) * fa) + (rpw * ra) + (bw * ba) + (fw * fula);
    const takeoffCG = takeoffMoment / (takeoffWeight || 1);

    return {
      takeoff: { weight: Math.round(takeoffWeight), cg: parseFloat(takeoffCG.toFixed(2)), moment: Math.round(takeoffMoment) },
      isOverWeight: takeoffWeight > mtow,
      isCGValid: takeoffCG >= 35 && takeoffCG <= 47.3
    };
  }, [emptyWeight, emptyArm, pilotWeight, copilotWeight, rearPaxWeight, baggage1Weight, fuelGals, frontArm, rearArm, fuelArm, baggageArm, maxTakeoffWeight]);

  const surfaceFactor = useMemo(() => {
    switch(surfaceType) {
      case 'grass_dry': return 1.20;
      case 'grass_wet': return 1.30;
      case 'soft_field': return 1.45;
      default: return 1.0;
    }
  }, [surfaceType]);

  const takeoffPerf = useMemo(() => {
    const baseRoll = 945; 
    const baseTotal = 1685; 
    const da = densityAlt;
    const w = parseFloat(weight) || 2300;
    const hw = parseFloat(headwindInput);
    
    const daFactor = 1 + (da / 1000) * 0.10;
    const weightFactor = 1 + ((w - 2300) / 100) * 0.08;
    const windFactor = hw >= 0 ? 1 - (hw / 9) * 0.10 : 1 + (Math.abs(hw) / 2) * 0.10;
    
    const roll = Math.round(baseRoll * daFactor * weightFactor * windFactor * surfaceFactor);
    const total = Math.round(baseTotal * daFactor * weightFactor * windFactor * surfaceFactor);
    
    return { roll, total, vr: Math.round(55 * Math.sqrt(w / 2300)) };
  }, [densityAlt, weight, headwindInput, surfaceFactor]);

  const landingPerf = useMemo(() => {
    const baseRoll = 575; 
    const baseTotal = 1335; 
    const da = densityAlt;
    const w = parseFloat(weight) || 2300;
    const hw = parseFloat(headwindInput);

    const daFactor = 1 + (da / 1000) * 0.05;
    const weightFactor = 1 + ((w - 2300) / 100) * 0.05;
    const windFactor = hw >= 0 ? 1 - (hw / 9) * 0.10 : 1 + (Math.abs(hw) / 2) * 0.10;
    const ldgSurfaceFactor = surfaceType === 'paved' ? 1.0 : 1.15;

    const roll = Math.round(baseRoll * daFactor * weightFactor * windFactor * ldgSurfaceFactor);
    const total = Math.round(baseTotal * daFactor * weightFactor * windFactor * ldgSurfaceFactor);
    
    return { roll, total, vref: Math.round(65 * Math.sqrt(w / 2300)) };
  }, [densityAlt, weight, headwindInput, surfaceType]);

  const syncWeightFromWB = () => {
    setWeight(wbResults.takeoff.weight.toString());
  };

  return (
    <div className="p-8 h-full overflow-y-auto max-w-7xl mx-auto custom-scrollbar">
      <div className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">E6B Flight Computer</h2>
          <p className="text-slate-400">Precision aeronautical calculations for mission planning.</p>
        </div>
        <div className="flex flex-wrap bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1 shadow-2xl">
          {[
            { id: 'nav', icon: Timer, label: 'Nav Plan' },
            { id: 'wind', icon: Navigation2, label: 'Wind/GS' },
            { id: 'climb', icon: ArrowUpRight, label: 'Climb/Des' },
            { id: 'weight', icon: Scale, label: 'W&B' },
            { id: 'takeoff', icon: PlaneTakeoff, label: 'Takeoff' },
            { id: 'landing', icon: PlaneLanding, label: 'Landing' },
            { id: 'fuel', icon: Fuel, label: 'Fuel' },
            { id: 'performance', icon: Thermometer, label: 'Perf/DA' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {activeTab === 'nav' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-5 bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Timer size={16} /> Mission Timing & Flow
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Distance (NM)</label>
                    <input type="number" value={dist} onChange={e => setDist(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Ground Speed (KTS)</label>
                    <div className="relative">
                      <input type="number" value={gsInput} onChange={e => setGsInput(e.target.value)} placeholder={windResults.gs.toString()} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                      {!gsInput && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-bold uppercase">Using Wind Result</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Departure Time (Local/Zulu)</label>
                  <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </section>
            
            <section className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl text-center flex flex-col justify-center">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-4">ETE (Time Enroute)</div>
                <div className="text-6xl font-mono font-bold text-white">{navResults.ete}</div>
              </div>
              <div className="bg-emerald-600/10 border border-emerald-500/20 p-8 rounded-[32px] shadow-xl text-center flex flex-col justify-center">
                <div className="text-[10px] font-black text-emerald-500 uppercase mb-4">Estimated Arrival (ETA)</div>
                <div className="text-6xl font-mono font-bold text-emerald-500">{navResults.eta}</div>
              </div>
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600/20 p-4 rounded-2xl"><Clock className="text-blue-500" size={24} /></div>
                  <div>
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Flight Status</h4>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Based on {gsInput || windResults.gs} kts ground speed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-bold text-white">{navResults.timeMin}</span>
                  <span className="text-[10px] font-black text-slate-600 uppercase ml-2">Total Minutes</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={16} /> Environmental Core
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Field Elevation (FT)</label>
                  <div className="flex items-center gap-3">
                    <Mountain size={18} className="text-slate-600" />
                    <input type="number" value={fieldElev} onChange={e => setFieldElev(e.target.value)} className="w-full bg-transparent outline-none font-mono text-xl text-white" />
                  </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Altimeter (InHg)</label>
                  <div className="flex items-center gap-3">
                    <Gauge size={18} className="text-slate-600" />
                    <input type="number" step="0.01" value={altimeter} onChange={e => setAltimeter(e.target.value)} className="w-full bg-transparent outline-none font-mono text-xl text-white" />
                  </div>
                </div>
                <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[9px] font-black text-blue-400 uppercase">Pressure Altitude (FT)</label>
                    <button 
                      onClick={syncPressAltFromDerived}
                      className="text-[9px] font-black text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase transition-colors"
                      title="Calculate from Elevation/Altimeter"
                    >
                      <RefreshCw size={10} /> Sync
                    </button>
                  </div>
                  <input 
                    type="number" 
                    value={pressAlt} 
                    onChange={e => setPressAlt(e.target.value)} 
                    className="w-full bg-transparent border-none outline-none font-mono text-2xl font-bold text-slate-300" 
                  />
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Outside Temp (°C)</label>
                  <div className="flex items-center gap-3">
                    <Thermometer size={18} className="text-slate-600" />
                    <input type="number" value={oat} onChange={e => setOat(e.target.value)} className="w-full bg-transparent outline-none font-mono text-xl text-white" />
                  </div>
                </div>
              </div>
            </section>

            <section className="lg:col-span-8 flex flex-col gap-8">
              <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-amber-500"></div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Density Altitude</h3>
                <div className={`text-8xl font-mono font-bold tracking-tighter ${perfImpact.isHighDA ? 'text-amber-500' : 'text-white'}`}>
                  {densityAlt.toLocaleString()}
                </div>
                <div className="text-sm font-black text-slate-600 uppercase mt-2">Feet Mean Sea Level</div>
                
                {perfImpact.isHighDA && (
                  <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Caution: High Density Altitude</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 p-8 rounded-[32px] border border-slate-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg"><PlaneTakeoff size={20} className="text-blue-500" /></div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Takeoff Impact</h4>
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">+{perfImpact.takeoffDistanceIncrease}%</div>
                  <p className="text-[10px] text-slate-500 uppercase leading-relaxed font-medium">Estimated increase in ground roll distance from standard conditions.</p>
                </div>
                <div className="bg-slate-800/40 p-8 rounded-[32px] border border-slate-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600/20 p-2 rounded-lg"><ArrowUpRight size={20} className="text-emerald-500" /></div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Climb Impact</h4>
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">-{perfImpact.climbRateReduction}%</div>
                  <p className="text-[10px] text-slate-500 uppercase leading-relaxed font-medium">Estimated reduction in rate of climb performance.</p>
                </div>
              </div>

              <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-start gap-4">
                <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-400 leading-relaxed font-medium">
                  Density Altitude is the pressure altitude corrected for non-standard temperature. High DA reduces air density, decreasing lift, engine power, and propeller efficiency. 
                  <span className="block mt-1 text-slate-500">ISA Standard Temperature at {pressAlt}ft: {Math.round(15 - (2 * (parseFloat(pressAlt) / 1000)))}°C</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'weight' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-7 bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Scale size={16} /> Load Manifest
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {/* Aircraft Base & Limits */}
                <div className="bg-slate-800/20 p-4 rounded-3xl border border-slate-800/50 space-y-4">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Aircraft Base & Limits</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-slate-600 uppercase mb-1">Empty Weight (LBS)</label>
                      <input type="number" value={emptyWeight} onChange={e => setEmptyWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-slate-100" />
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-slate-600 uppercase mb-1">Empty Arm (IN)</label>
                      <input type="number" value={emptyArm} onChange={e => setEmptyArm(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-slate-100" />
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-red-500 uppercase mb-1">Max Takeoff Wt (LBS)</label>
                      <input type="number" value={maxTakeoffWeight} onChange={e => setMaxTakeoffWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-red-100" />
                    </div>
                  </div>
                </div>

                {/* Pilot & Copilot */}
                <div className="bg-slate-800/20 p-4 rounded-3xl border border-slate-800/50 space-y-4">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Front Seats</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-slate-600 uppercase mb-1">Pilot (LBS)</label>
                      <input type="number" value={pilotWeight} onChange={e => setPilotWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-slate-100" />
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-slate-600 uppercase mb-1">Copilot (LBS)</label>
                      <input type="number" value={copilotWeight} onChange={e => setCopilotWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-slate-100" />
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-blue-500 uppercase mb-1">Arm (IN)</label>
                      <input type="number" value={frontArm} onChange={e => setFrontArm(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-blue-100" />
                    </div>
                  </div>
                </div>

                {/* Fuel */}
                <div className="bg-slate-800/20 p-4 rounded-3xl border border-slate-800/50 space-y-4">
                  <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Fuel System</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-slate-600 uppercase mb-1">Fuel Load (GAL)</label>
                      <input type="number" value={fuelGals} onChange={e => setFuelGals(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-slate-100" />
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-emerald-500 uppercase mb-1">Fuel Arm (IN)</label>
                      <input type="number" value={fuelArm} onChange={e => setFuelArm(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-emerald-100" />
                    </div>
                  </div>
                </div>

                {/* Rear Passengers */}
                <div className="bg-slate-800/20 p-4 rounded-3xl border border-slate-800/50 space-y-4">
                  <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Rear Seats</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-slate-600 uppercase mb-1">Pass. Total (LBS)</label>
                      <input type="number" value={rearPaxWeight} onChange={e => setRearPaxWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-slate-100" />
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-orange-500 uppercase mb-1">Rear Arm (IN)</label>
                      <input type="number" value={rearArm} onChange={e => setRearArm(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-orange-100" />
                    </div>
                  </div>
                </div>

                {/* Baggage */}
                <div className="bg-slate-800/20 p-4 rounded-3xl border border-slate-800/50 space-y-4">
                  <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Baggage / Cargo</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-slate-600 uppercase mb-1">Baggage (LBS)</label>
                      <input type="number" value={baggage1Weight} onChange={e => setBaggage1Weight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-slate-100" />
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-[8px] font-black text-purple-500 uppercase mb-1">Baggage Arm (IN)</label>
                      <input type="number" value={baggageArm} onChange={e => setBaggageArm(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-lg text-purple-100" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            <section className="lg:col-span-5 bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-10 flex flex-col justify-center">
              <div>
                <div className="text-[12px] font-black text-slate-500 uppercase mb-2">Gross Weight Summary</div>
                <div className={`text-6xl font-mono font-bold ${wbResults.isOverWeight ? 'text-red-500' : 'text-white'}`}>
                  {wbResults.takeoff.weight} <span className="text-xl">LBS</span>
                </div>
                {wbResults.isOverWeight && <div className="text-sm text-red-500 font-bold uppercase mt-2 flex items-center gap-2"><AlertTriangle size={16} /> EXCEEDS MTOW ({maxTakeoffWeight})</div>}
              </div>
              
              <div className="pt-10 border-t border-slate-800">
                <div className="text-[12px] font-black text-slate-500 uppercase mb-2">Center of Gravity (CG)</div>
                <div className={`text-6xl font-mono font-bold ${!wbResults.isCGValid ? 'text-red-500' : 'text-emerald-400'}`}>
                  {wbResults.takeoff.cg}"
                </div>
                {!wbResults.isCGValid && <div className="text-sm text-red-500 font-bold uppercase mt-2 flex items-center gap-2"><AlertTriangle size={16} /> CG OUTSIDE LIMITS</div>}
                {wbResults.isCGValid && <div className="text-sm text-emerald-500 font-bold uppercase mt-2 flex items-center gap-2"><Check size={16} /> CG WITHIN LIMITS</div>}
              </div>
              
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                 <div className="text-[10px] font-bold text-slate-600 uppercase mb-1">Total Calculated Moment</div>
                 <div className="text-2xl font-mono font-bold text-slate-300">{wbResults.takeoff.moment.toLocaleString()}</div>
                 <div className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">LB-IN</div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Fuel size={16} /> Fuel analysis
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Fuel Burn Rate (GPH)</label>
                  <input type="number" value={burnRate} onChange={e => setBurnRate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Distance (NM)</label>
                  <input type="number" value={dist} onChange={e => setDist(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Ground Speed (KTS)</label>
                  <input type="number" value={gsInput} onChange={e => setGsInput(e.target.value)} placeholder={windResults.gs.toString()} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </section>
            
            <section className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl flex flex-col justify-center text-center">
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Required Fuel</div>
                <div className="text-7xl font-mono font-bold text-amber-500">{navResults.fuelReq} <span className="text-2xl">GAL</span></div>
                <div className="mt-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest">Excludes Reserve</div>
              </div>
              <div className="mt-12 p-6 bg-slate-950 border border-slate-800 rounded-[24px]">
                 <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Endurance at current rate</div>
                 <div className="text-3xl font-mono font-bold text-white">
                   {fuelGals ? (parseFloat(fuelGals) / parseFloat(burnRate)).toFixed(1) : '--'} <span className="text-xs">HRS</span>
                 </div>
              </div>
            </section>
          </div>
        )}

        {(activeTab === 'takeoff' || activeTab === 'landing') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-5 bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={16} /> Environmental Inputs
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Pressure Alt (FT)</label>
                  <input type="number" value={pressAlt} onChange={e => setPressAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Temp (°C)</label>
                  <input type="number" value={oat} onChange={e => setOat(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Headwind (KTS)</label>
                  <input type="number" value={headwindInput} onChange={e => setHeadwindInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Weight (LBS)</label>
                    <button 
                      onClick={syncWeightFromWB}
                      className="text-[9px] font-black text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase transition-colors"
                      title="Sync from Weight & Balance"
                    >
                      <RefreshCw size={10} /> Sync W&B
                    </button>
                  </div>
                  <input 
                    type="number" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">Runway Surface</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'paved', label: 'Paved / Level' },
                    { id: 'grass_dry', label: 'Grass (Dry)' },
                    { id: 'grass_wet', label: 'Grass (Wet)' },
                    { id: 'soft_field', label: 'Soft / Muddy' }
                  ].map(surface => (
                    <button
                      key={surface.id}
                      onClick={() => setSurfaceType(surface.id as SurfaceType)}
                      className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        surfaceType === surface.id 
                          ? 'bg-blue-600/10 border-blue-600 text-blue-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {surface.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
            
            <section className="lg:col-span-7 space-y-6">
              {activeTab === 'takeoff' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl text-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-4">Ground Roll</div>
                    <div className="text-6xl font-mono font-bold text-white">{takeoffPerf.roll} <span className="text-xl">FT</span></div>
                    <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 inline-block">
                      <div className="text-[9px] font-bold text-slate-600 uppercase">Rotation Speed (Vr)</div>
                      <div className="text-lg font-mono font-bold text-emerald-400">{takeoffPerf.vr} KIAS</div>
                    </div>
                  </div>
                  <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[32px] shadow-xl text-center">
                    <div className="text-[10px] font-black text-blue-400 uppercase mb-4">Total Over 50' Obstacle</div>
                    <div className="text-6xl font-mono font-bold text-blue-500">{takeoffPerf.total} <span className="text-xl text-blue-400">FT</span></div>
                    <div className="mt-6 flex items-center justify-center gap-2 text-blue-400/60">
                      <Zap size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Optimized Profile</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl text-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-4">Landing Ground Roll</div>
                    <div className="text-6xl font-mono font-bold text-white">{landingPerf.roll} <span className="text-xl">FT</span></div>
                    <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 inline-block">
                      <div className="text-[9px] font-bold text-slate-600 uppercase">Approach Speed (Vref)</div>
                      <div className="text-lg font-mono font-bold text-amber-400">{landingPerf.vref} KIAS</div>
                    </div>
                  </div>
                  <div className="bg-amber-600/10 border border-amber-500/20 p-8 rounded-[32px] shadow-xl text-center">
                    <div className="text-[10px] font-black text-amber-500 uppercase mb-4">Total From 50' Obstacle</div>
                    <div className="text-6xl font-mono font-bold text-amber-500">{landingPerf.total} <span className="text-xl">FT</span></div>
                    <div className="mt-6 flex items-center justify-center gap-2 text-amber-400/60">
                      <Target size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Aimed Touchdown Point</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center gap-6">
                <div className="bg-blue-600/20 p-4 rounded-2xl">
                  <Thermometer className="text-blue-500" size={32} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Performance Context</h4>
                  <div className="flex gap-4 mt-1">
                    <div className="text-sm font-mono text-slate-400">DENSITY ALT: <span className="text-white font-bold">{densityAlt} FT</span></div>
                    <div className="text-sm font-mono text-slate-400">ISA DEV: <span className="text-white font-bold">{Math.round(parseFloat(oat) - (15 - (2 * (parseFloat(pressAlt) / 1000))))}°C</span></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'wind' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-5 bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Navigation2 size={16} /> Wind Vector & Heading
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">True Airspeed (TAS)</label>
                  <input type="number" value={tas} onChange={e => setTas(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">True Course (TC)</label>
                  <input type="number" value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Wind Direction (°T)</label>
                  <input type="number" value={windDir} onChange={e => setWindDir(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Wind Speed (KTS)</label>
                  <input type="number" value={windSpeed} onChange={e => setWindSpeed(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Mag Variation (+E / -W)</label>
                  <input type="number" value={magVar} onChange={e => setMagVar(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </section>
            
            <section className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-4">Ground Speed (GS)</div>
                <div className="text-6xl font-mono font-bold text-white">{windResults.gs} <span className="text-xl">KTS</span></div>
              </div>
              <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[32px] shadow-xl text-center">
                <div className="text-[10px] font-black text-blue-400 uppercase mb-4">Magnetic Heading (MH)</div>
                <div className="text-6xl font-mono font-bold text-blue-500">{windResults.mh.toString().padStart(3, '0')}°</div>
                <div className="mt-2 text-[10px] font-bold text-slate-500">WCA: {windResults.wca > 0 ? `+${windResults.wca}` : windResults.wca}°</div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] md:col-span-2 grid grid-cols-2 gap-8">
                <div className="flex items-center gap-4 border-r border-slate-800">
                  <div className="bg-red-500/10 p-3 rounded-xl"><ArrowRightLeft className="text-red-500" size={20} /></div>
                  <div>
                    <div className="text-[10px] font-black text-slate-600 uppercase">Head/Tailwind</div>
                    <div className="text-xl font-mono font-bold text-white">{Math.abs(windResults.headwind)} <span className="text-[10px] font-normal uppercase text-slate-500">{windResults.headwind >= 0 ? 'Head' : 'Tail'}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500/10 p-3 rounded-xl"><Wind className="text-amber-500" size={20} /></div>
                  <div>
                    <div className="text-[10px] font-black text-slate-600 uppercase">Crosswind</div>
                    <div className="text-xl font-mono font-bold text-white">{Math.abs(windResults.crosswind)} <span className="text-[10px] font-normal uppercase text-slate-500">KTS</span></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'climb' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-5 bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <ArrowUpRight size={16} /> Transition Planning
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Start Alt (FT)</label>
                    <input type="number" value={startAlt} onChange={e => setStartAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Target Alt (FT)</label>
                    <input type="number" value={targetAlt} onChange={e => setTargetAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Rate (FPM)</label>
                  <input type="number" value={fpm} onChange={e => setFpm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                 <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Ground Speed (KTS)</label>
                  <input type="number" value={gsInput} onChange={e => setGsInput(e.target.value)} placeholder={windResults.gs.toString()} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </section>
            
            <section className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-4">Time to Altitude</div>
                <div className="text-6xl font-mono font-bold text-white">{climbResults.time} <span className="text-xl uppercase">Min</span></div>
              </div>
              <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[32px] shadow-xl text-center">
                <div className="text-[10px] font-black text-blue-400 uppercase mb-4">Distance Covered</div>
                <div className="text-6xl font-mono font-bold text-blue-500">{climbResults.dist} <span className="text-xl">NM</span></div>
              </div>
               <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-[32px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-600/20 p-4 rounded-2xl"><Fuel className="text-emerald-500" size={24} /></div>
                  <div>
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Transition Fuel</h4>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Burn based on cruise GPH</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-mono font-bold text-white">{climbResults.fuel}</span>
                  <span className="text-xs font-black text-slate-600 uppercase ml-2">GAL</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorView;