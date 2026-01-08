
import React, { useState, useMemo, useEffect } from 'react';
import { Fuel, Wind, Ruler, Settings2, Thermometer, PlaneLanding, Navigation2, PlaneTakeoff, AlertTriangle, Timer, ArrowDownRight, ArrowUpRight, Scale, Info, MoveRight, Clock, ChevronRight } from 'lucide-react';

type TabType = 'fuel' | 'wind' | 'takeoff' | 'landing' | 'performance' | 'nav' | 'climb' | 'weight';

const CalculatorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('weight');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Shared Performance State
  const [pressAlt, setPressAlt] = useState('0');
  const [oat, setOat] = useState('15');
  const [weight, setWeight] = useState('2400');
  const [headwindInput, setHeadwindInput] = useState('0');
  const [rwyLen, setRwyLen] = useState('3000');

  // Nav Planning
  const [dist, setDist] = useState('100');
  const [gs, setGs] = useState('110');
  const [burnRate, setBurnRate] = useState('8.5');

  // Wind Triangle
  const [tas, setTas] = useState('110');
  const [windSpeed, setWindSpeed] = useState('15');
  const [windDir, setWindDir] = useState('270');
  const [course, setCourse] = useState('360');

  // Climb/Descent
  const [startAlt, setStartAlt] = useState('1000');
  const [targetAlt, setTargetAlt] = useState('8500');
  const [verticalSpeed, setVerticalSpeed] = useState('500');
  const [groundSpeedCD, setGroundSpeedCD] = useState('100');

  // Enhanced Weight & Balance State (Cessna 172S Profile)
  const [emptyWeight, setEmptyWeight] = useState('1642');
  const [emptyArm, setEmptyArm] = useState('38.5');
  const [pilotWeight, setPilotWeight] = useState('190');
  const [copilotWeight, setCopilotWeight] = useState('0');
  const [rearPaxWeight, setRearPaxWeight] = useState('0');
  const [baggage1Weight, setBaggage1Weight] = useState('0');
  const [fuelGals, setFuelGals] = useState('53');

  const STATIONS = {
    FRONT: 37.0,
    REAR: 73.0,
    FUEL: 48.0,
    BAGGAGE: 95.0
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const densityAlt = useMemo(() => {
    const pa = parseFloat(pressAlt);
    const temp = parseFloat(oat);
    if (isNaN(pa) || isNaN(temp)) return 0;
    const isaTemp = 15 - (2 * (pa / 1000));
    return Math.round(pa + (120 * (temp - isaTemp)));
  }, [pressAlt, oat]);

  const navResults = useMemo(() => {
    const d = parseFloat(dist);
    const s = parseFloat(gs);
    const b = parseFloat(burnRate);
    if (isNaN(d) || isNaN(s) || isNaN(b) || s <= 0) return { timeMin: 0, fuelReq: 0, ete: '00:00', eta: '--:--' };
    const timeHr = d / s;
    const timeMin = timeHr * 60;
    const eteFormatted = `${Math.floor(timeHr).toString().padStart(2, '0')}:${Math.round((timeHr % 1) * 60).toString().padStart(2, '0')}`;
    const etaDate = new Date(currentTime.getTime() + timeMin * 60000);
    return { 
      timeMin: Math.round(timeMin), 
      fuelReq: parseFloat((timeHr * b).toFixed(1)),
      ete: eteFormatted,
      eta: etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  }, [dist, gs, burnRate, currentTime]);

  const windResults = useMemo(() => {
    const V_tas = parseFloat(tas);
    const V_ws = parseFloat(windSpeed);
    const D_wd = parseFloat(windDir);
    const D_tc = parseFloat(course);
    if (isNaN(V_tas) || isNaN(V_ws) || isNaN(D_wd) || isNaN(D_tc) || V_tas === 0) return { gs: 0, wca: 0, th: 0, headwind: 0, crosswind: 0 };
    const wd_rad = (D_wd * Math.PI) / 180;
    const tc_rad = (D_tc * Math.PI) / 180;
    const angleDiff = wd_rad - tc_rad;
    const headwind = V_ws * Math.cos(angleDiff);
    const wca_rad = Math.asin((V_ws / V_tas) * Math.sin(angleDiff));
    let th = D_tc + (wca_rad * 180) / Math.PI;
    if (th < 0) th += 360; if (th >= 360) th -= 360;
    return { 
      gs: Math.round(V_tas * Math.cos(wca_rad) - headwind), 
      th: Math.round(th),
      headwind: Math.round(headwind),
      crosswind: Math.round(V_ws * Math.sin(angleDiff))
    };
  }, [tas, windSpeed, windDir, course]);

  // Enhanced W&B Calculation - Removed fuel burn dependency
  const wbResults = useMemo(() => {
    const ew = parseFloat(emptyWeight) || 0;
    const ea = parseFloat(emptyArm) || 0;
    const pw = parseFloat(pilotWeight) || 0;
    const cpw = parseFloat(copilotWeight) || 0;
    const rpw = parseFloat(rearPaxWeight) || 0;
    const bw = parseFloat(baggage1Weight) || 0;
    const fg = parseFloat(fuelGals) || 0;
    const fw = fg * 6;

    const takeoffWeight = ew + pw + cpw + rpw + bw + fw;
    const takeoffMoment = (ew * ea) + ((pw + cpw) * STATIONS.FRONT) + (rpw * STATIONS.REAR) + (bw * STATIONS.BAGGAGE) + (fw * STATIONS.FUEL);
    const takeoffCG = takeoffMoment / takeoffWeight;

    const zeroFuelWeight = ew + pw + cpw + rpw + bw;
    const zeroFuelMoment = (ew * ea) + ((pw + cpw) * STATIONS.FRONT) + (rpw * STATIONS.REAR) + (bw * STATIONS.BAGGAGE);
    const zeroFuelCG = zeroFuelMoment / zeroFuelWeight;

    return {
      takeoff: { weight: Math.round(takeoffWeight), cg: parseFloat(takeoffCG.toFixed(2)), moment: Math.round(takeoffMoment) },
      zero: { weight: Math.round(zeroFuelWeight), cg: parseFloat(zeroFuelCG.toFixed(2)) },
      isOverWeight: takeoffWeight > 2550,
      isCGValid: takeoffCG >= 35 && takeoffCG <= 47.3
    };
  }, [emptyWeight, emptyArm, pilotWeight, copilotWeight, rearPaxWeight, baggage1Weight, fuelGals]);

  const takeoffPerf = useMemo(() => {
    const baseRoll = 950;
    const baseTotal = 1650;
    const da = densityAlt;
    const w = wbResults.takeoff.weight;
    const hw = parseFloat(headwindInput);
    const daFactor = 1 + (da / 1000) * 0.10;
    const weightFactor = 1 + ((w - 2300) / 100) * 0.10;
    const windFactor = hw >= 0 ? 1 - (hw / 9) * 0.10 : 1 + (Math.abs(hw) / 2) * 0.10;
    return { roll: Math.round(baseRoll * daFactor * weightFactor * windFactor), total: Math.round(baseTotal * daFactor * weightFactor * windFactor), vr: Math.round(55 * Math.sqrt(w / 2300)) };
  }, [densityAlt, wbResults.takeoff.weight, headwindInput]);

  const renderEnvelopeGraph = () => {
    // Envelope coordinates for C172S (CG in inches, Weight in lbs)
    const points = [
      { x: 35.0, y: 1500 },
      { x: 35.0, y: 1900 },
      { x: 41.0, y: 2550 },
      { x: 47.3, y: 2550 },
      { x: 47.3, y: 1500 },
      { x: 35.0, y: 1500 }
    ];

    const minX = 33, maxX = 50, minY = 1400, maxY = 2700;
    const scaleX = (val: number) => ((val - minX) / (maxX - minX)) * 100;
    const scaleY = (val: number) => 100 - (((val - minY) / (maxY - minY)) * 100);

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');

    return (
      <div className="relative w-full aspect-square bg-slate-950 rounded-3xl border border-slate-800 p-4">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Grid lines */}
          {[1600, 1800, 2000, 2200, 2400, 2600].map(y => (
            <line key={y} x1="0" y1={scaleY(y)} x2="100" y2={scaleY(y)} stroke="#1e293b" strokeWidth="0.5" />
          ))}
          {[35, 40, 45].map(x => (
            <line key={x} x1={scaleX(x)} y1="0" x2={scaleX(x)} y2="100" stroke="#1e293b" strokeWidth="0.5" />
          ))}
          
          {/* Envelope */}
          <path d={pathData} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="1" />
          
          {/* Takeoff Point */}
          <circle cx={scaleX(wbResults.takeoff.cg)} cy={scaleY(wbResults.takeoff.weight)} r="2" fill="#10b981" />
          <text x={scaleX(wbResults.takeoff.cg) + 3} y={scaleY(wbResults.takeoff.weight)} fontSize="3" fill="#10b981" fontWeight="bold">LOADING POINT</text>
          
          {/* Axes labels */}
          <text x="50" y="98" fontSize="3" fill="#64748b" textAnchor="middle">CG (INCHES AFT DATUM)</text>
          <text x="2" y="50" fontSize="3" fill="#64748b" textAnchor="middle" transform="rotate(-90 2 50)">WEIGHT (LBS)</text>
        </svg>
      </div>
    );
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
        {activeTab === 'weight' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Panel */}
            <section className="lg:col-span-4 bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Scale size={16} /> Load Manifest
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Aircraft Empty Weight</label>
                  <input type="number" value={emptyWeight} onChange={e => setEmptyWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Pilot (LBS)</label>
                    <input type="number" value={pilotWeight} onChange={e => setPilotWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Copilot (LBS)</label>
                    <input type="number" value={copilotWeight} onChange={e => setCopilotWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Rear Passengers (Total LBS)</label>
                  <input type="number" value={rearPaxWeight} onChange={e => setRearPaxWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Baggage Area (LBS)</label>
                  <input type="number" value={baggage1Weight} onChange={e => setBaggage1Weight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Fuel Load (GAL)</label>
                  <input type="number" value={fuelGals} onChange={e => setFuelGals(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                </div>
              </div>
            </section>

            {/* Visual Panel */}
            <section className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl">
                 <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6 text-center">CG Envelope Visualization</h3>
                 {renderEnvelopeGraph()}
                 <div className="mt-6 flex justify-center gap-6">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Current State</span>
                   </div>
                 </div>
              </div>

              {(wbResults.isOverWeight || !wbResults.isCGValid) && (
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[32px] flex items-center gap-4 animate-bounce">
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={32} />
                  <div>
                    <h4 className="text-sm font-black text-red-500 uppercase tracking-widest">Safety Alert</h4>
                    <p className="text-xs text-red-400 font-medium">Aircraft state is outside certified operational limits. Adjust loading before takeoff.</p>
                  </div>
                </div>
              )}
            </section>

            {/* Results Panel */}
            <section className="lg:col-span-3 space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-xl">
                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Weight & Balance Configuration</div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Gross Weight</div>
                    <div className={`text-3xl font-mono font-bold ${wbResults.isOverWeight ? 'text-red-500' : 'text-white'}`}>
                      {wbResults.takeoff.weight} <span className="text-xs">LBS</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">CG Location</div>
                    <div className={`text-3xl font-mono font-bold ${!wbResults.isCGValid ? 'text-red-500' : 'text-emerald-400'}`}>
                      {wbResults.takeoff.cg}"
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-[32px] space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Zero Fuel Weight</span>
                  <span className="font-mono text-white">{wbResults.zero.weight} LBS</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Zero Fuel CG</span>
                  <span className="font-mono text-white">{wbResults.zero.cg}"</span>
                </div>
              </div>

              <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl">
                <div className="flex gap-3 mb-2">
                  <Info size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pilot Reference</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Based on C172S profile. Max Ramp: 2558 lbs. Max Takeoff: 2550 lbs. Always consult the POH for your specific tail number.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Navigation Planning */}
        {activeTab === 'nav' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Timer size={16} /> Navigation Planning
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Leg Distance (NM)</label>
                  <input type="number" value={dist} onChange={e => setDist(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Ground Speed (KTS)</label>
                  <input type="number" value={gs} onChange={e => setGs(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Fuel Burn Rate (GPH)</label>
                  <input type="number" value={burnRate} onChange={e => setBurnRate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </section>
            
            <section className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2">ETE (HH:MM)</div>
                    <div className="text-5xl font-mono font-bold text-white">{navResults.ete}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Fuel Required</div>
                    <div className="text-5xl font-mono font-bold text-amber-500">{navResults.fuelReq} <span className="text-sm">GAL</span></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                      <Clock size={12} /> ETA (Local)
                    </div>
                    <div className="text-3xl font-mono font-bold text-white">{navResults.eta}</div>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Mins</div>
                    <div className="text-3xl font-mono font-bold text-slate-300">{navResults.timeMin}</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Wind Triangle */}
        {activeTab === 'wind' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Navigation2 size={16} /> Wind Triangle Solver
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">True Course (°T)</label>
                  <input type="number" value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">True Airspeed (TAS)</label>
                  <input type="number" value={tas} onChange={e => setTas(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Wind Dir (°T)</label>
                  <input type="number" value={windDir} onChange={e => setWindDir(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Wind Speed (KTS)</label>
                  <input type="number" value={windSpeed} onChange={e => setWindSpeed(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                </div>
              </div>
            </section>

            <section className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                   <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Ground Speed</div>
                   <div className="text-3xl font-mono font-bold text-white">{windResults.gs} <span className="text-xs">KTS</span></div>
                </div>
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                   <div className="text-[10px] font-black text-slate-500 uppercase mb-1">True Heading</div>
                   <div className="text-3xl font-mono font-bold text-blue-400">{windResults.th}°</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">Crosswind Component</span>
                  <span className="font-mono text-xl font-bold text-amber-500">{Math.abs(windResults.crosswind)} KTS</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Takeoff Performance */}
        {activeTab === 'takeoff' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
                 <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                   <PlaneTakeoff size={16} /> Ground Performance
                 </h3>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Pressure Alt (FT)</label>
                        <input type="number" value={pressAlt} onChange={e => setPressAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Temp (°C)</label>
                        <input type="number" value={oat} onChange={e => setOat(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Weight</span>
                      <span className="font-mono text-blue-100">{wbResults.takeoff.weight} LBS</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Headwind (KTS)</label>
                      <input type="number" value={headwindInput} onChange={e => setHeadwindInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                    </div>
                 </div>
              </section>
              <section className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl flex flex-col justify-center">
                 <div className="grid grid-cols-1 gap-8 text-center">
                    <div>
                       <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Rotation Speed</div>
                       <div className="text-5xl font-mono font-bold text-emerald-400">{takeoffPerf.vr} <span className="text-sm">KIAS</span></div>
                    </div>
                    <div>
                       <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Ground Roll</div>
                       <div className="text-5xl font-mono font-bold text-white">{takeoffPerf.roll} <span className="text-sm">FT</span></div>
                    </div>
                 </div>
              </section>
           </div>
        )}

        {/* Performance (Pressure Alt) */}
        {activeTab === 'performance' && (
           <div className="max-w-2xl mx-auto">
             <section className="bg-slate-900/60 border border-slate-800 p-12 rounded-[48px] shadow-2xl text-center">
               <div className="bg-blue-600/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                 <Thermometer size={48} className="text-blue-500" />
               </div>
               <h3 className="text-lg font-black text-slate-300 uppercase tracking-[0.2em] mb-8">Atmospheric Pressure</h3>
               <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Press Alt</label>
                    <input type="number" value={pressAlt} onChange={e => setPressAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center font-mono text-2xl text-white outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outside Temp</label>
                    <input type="number" value={oat} onChange={e => setOat(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center font-mono text-2xl text-white outline-none focus:border-blue-500" />
                  </div>
               </div>
               <div className="pt-12 border-t border-slate-800">
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Density Altitude Result</div>
                  <div className="text-7xl font-mono font-bold text-white">{densityAlt.toLocaleString()}</div>
                  <div className="text-sm font-black text-slate-600 uppercase mt-4">Feet (MSL)</div>
               </div>
             </section>
           </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorView;
