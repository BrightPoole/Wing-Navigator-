
import React, { useState, useMemo } from 'react';
import { Fuel, Wind, Ruler, Settings2, Thermometer, PlaneLanding, Navigation2, PlaneTakeoff, AlertTriangle, Timer, ArrowDownRight, ArrowUpRight, Scale, Info, MoveRight } from 'lucide-react';

type TabType = 'fuel' | 'wind' | 'takeoff' | 'landing' | 'performance' | 'nav' | 'climb' | 'weight';

const CalculatorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('nav');

  // Shared Performance State
  const [pressAlt, setPressAlt] = useState('0');
  const [oat, setOat] = useState('15');
  const [weight, setWeight] = useState('2400');
  const [headwindInput, setHeadwindInput] = useState('0');
  const [rwyLen, setRwyLen] = useState('3000');

  // Nav Planning (Time/Distance/Speed/Fuel)
  const [dist, setDist] = useState('100');
  const [gs, setGs] = useState('110');
  const [burnRate, setBurnRate] = useState('8.5');

  // Wind Triangle State
  const [tas, setTas] = useState('110');
  const [windSpeed, setWindSpeed] = useState('15');
  const [windDir, setWindDir] = useState('270');
  const [course, setCourse] = useState('360');

  // Climb/Descent State
  const [startAlt, setStartAlt] = useState('1000');
  const [targetAlt, setTargetAlt] = useState('8500');
  const [verticalSpeed, setVerticalSpeed] = useState('500');
  const [groundSpeedCD, setGroundSpeedCD] = useState('100');

  // Weight & Balance State (Simple C172 Model)
  const [emptyWeight, setEmptyWeight] = useState('1650');
  const [emptyArm, setEmptyArm] = useState('38.5');
  const [pilotWeight, setPilotWeight] = useState('380'); // 2 people
  const [pilotArm] = useState('37.0');
  const [rearWeight, setRearWeight] = useState('0');
  const [rearArm] = useState('73.0');
  const [fuelGals, setFuelGals] = useState('40');
  const [fuelArm] = useState('48.0');

  // Shared Calculations
  const densityAlt = useMemo(() => {
    const pa = parseFloat(pressAlt);
    const temp = parseFloat(oat);
    if (isNaN(pa) || isNaN(temp)) return 0;
    const isaTemp = 15 - (2 * (pa / 1000));
    const da = pa + (120 * (temp - isaTemp));
    return Math.round(da);
  }, [pressAlt, oat]);

  // Nav Calculations
  const navResults = useMemo(() => {
    const d = parseFloat(dist);
    const s = parseFloat(gs);
    const b = parseFloat(burnRate);
    if (isNaN(d) || isNaN(s) || isNaN(b) || s <= 0) return { timeMin: 0, fuelReq: 0 };
    const timeHr = d / s;
    const timeMin = timeHr * 60;
    const fuelReq = timeHr * b;
    return { timeMin: Math.round(timeMin), fuelReq: parseFloat(fuelReq.toFixed(1)) };
  }, [dist, gs, burnRate]);

  // Wind Triangle with Components
  const windResults = useMemo(() => {
    const V_tas = parseFloat(tas);
    const V_ws = parseFloat(windSpeed);
    const D_wd = parseFloat(windDir);
    const D_tc = parseFloat(course);
    if (isNaN(V_tas) || isNaN(V_ws) || isNaN(D_wd) || isNaN(D_tc) || V_tas === 0) 
      return { gs: 0, wca: 0, th: 0, headwind: 0, crosswind: 0 };

    const wd_rad = (D_wd * Math.PI) / 180;
    const tc_rad = (D_tc * Math.PI) / 180;
    
    // Wind Components relative to course
    const angleDiff = wd_rad - tc_rad;
    const headwind = V_ws * Math.cos(angleDiff);
    const crosswind = V_ws * Math.sin(angleDiff);

    const wca_rad = Math.asin((V_ws / V_tas) * Math.sin(angleDiff));
    const wca_deg = (wca_rad * 180) / Math.PI;
    const groundSpeed = V_tas * Math.cos(wca_rad) - headwind;
    
    let th = D_tc + wca_deg;
    if (th < 0) th += 360;
    if (th >= 360) th -= 360;

    return { 
      gs: Math.round(groundSpeed), 
      wca: Math.round(wca_deg), 
      th: Math.round(th),
      headwind: Math.round(headwind),
      crosswind: Math.round(crosswind)
    };
  }, [tas, windSpeed, windDir, course]);

  // Climb/Descent Calculations
  const cdResults = useMemo(() => {
    const s = parseFloat(startAlt);
    const t = parseFloat(targetAlt);
    const vs = parseFloat(verticalSpeed);
    const speed = parseFloat(groundSpeedCD);
    if (isNaN(s) || isNaN(t) || isNaN(vs) || isNaN(speed) || vs <= 0) return { time: 0, dist: 0 };
    
    const altDiff = Math.abs(t - s);
    const timeMin = altDiff / vs;
    const distance = (timeMin / 60) * speed;
    return { time: Math.round(timeMin), dist: parseFloat(distance.toFixed(1)) };
  }, [startAlt, targetAlt, verticalSpeed, groundSpeedCD]);

  // Weight & Balance
  const wbResults = useMemo(() => {
    const ew = parseFloat(emptyWeight);
    const ea = parseFloat(emptyArm);
    const pw = parseFloat(pilotWeight);
    const rw = parseFloat(rearWeight);
    const fg = parseFloat(fuelGals);
    const fw = fg * 6; // 6lb per gal

    if (isNaN(ew) || isNaN(pw) || isNaN(rw) || isNaN(fg)) return { weight: 0, cg: 0, moment: 0 };

    const totalWeight = ew + pw + rw + fw;
    const totalMoment = (ew * ea) + (pw * parseFloat(pilotArm)) + (rw * parseFloat(rearArm)) + (fw * parseFloat(fuelArm));
    const cg = totalMoment / totalWeight;

    return {
      weight: Math.round(totalWeight),
      cg: parseFloat(cg.toFixed(2)),
      moment: Math.round(totalMoment)
    };
  }, [emptyWeight, emptyArm, pilotWeight, rearWeight, fuelGals]);

  const takeoffPerf = useMemo(() => {
    const baseRoll = 950;
    const baseTotal = 1650;
    const da = densityAlt;
    const w = parseFloat(weight);
    const hw = parseFloat(headwindInput);
    if (isNaN(w) || isNaN(hw)) return { roll: 0, total: 0, vr: 0 };
    const daFactor = 1 + (da / 1000) * 0.10;
    const weightFactor = 1 + ((w - 2300) / 100) * 0.10;
    const windFactor = hw >= 0 ? 1 - (hw / 9) * 0.10 : 1 + (Math.abs(hw) / 2) * 0.10;
    const roll = baseRoll * daFactor * weightFactor * windFactor;
    const total = baseTotal * daFactor * weightFactor * windFactor;
    const vr = 55 * Math.sqrt(w / 2300);
    return { roll: Math.round(roll), total: Math.round(total), vr: Math.round(vr) };
  }, [densityAlt, weight, headwindInput]);

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
            { id: 'performance', icon: Thermometer, label: 'Perf/DA' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
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
              <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl text-center">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Estimated Time</div>
                    <div className="text-5xl font-mono font-bold text-white">{navResults.timeMin} <span className="text-sm">MIN</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Fuel Required</div>
                    <div className="text-5xl font-mono font-bold text-amber-500">{navResults.fuelReq} <span className="text-sm">GAL</span></div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl flex gap-4">
                <Info size={24} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Calculation based on constant ground speed. For more precision, use the <button onClick={() => setActiveTab('wind')} className="text-blue-400 font-bold hover:underline">Wind Triangle</button> to derive ground speed from TAS and winds aloft.
                </p>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'wind' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Navigation2 size={16} /> Wind Triangle Solver
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">True Course (°T)</label>
                    <input type="number" value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">True Airspeed (TAS)</label>
                    <input type="number" value={tas} onChange={e => setTas(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Wind Dir (°T)</label>
                    <input type="number" value={windDir} onChange={e => setWindDir(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Wind Speed (KTS)</label>
                    <input type="number" value={windSpeed} onChange={e => setWindSpeed(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                  </div>
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
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">{windResults.headwind >= 0 ? 'Headwind' : 'Tailwind'} Component</span>
                  <span className={`font-mono text-xl font-bold ${windResults.headwind >= 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {Math.abs(windResults.headwind)} KTS
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'climb' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <ArrowUpRight size={16} /> Vertical Profiles
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">From Alt (FT)</label>
                  <input type="number" value={startAlt} onChange={e => setStartAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">To Alt (FT)</label>
                  <input type="number" value={targetAlt} onChange={e => setTargetAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Rate (FPM)</label>
                  <input type="number" value={verticalSpeed} onChange={e => setVerticalSpeed(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Gnd Speed (KTS)</label>
                  <input type="number" value={groundSpeedCD} onChange={e => setGroundSpeedCD(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
                </div>
              </div>
            </section>
            
            <section className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl flex flex-col justify-center">
              <div className="text-center space-y-8">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Time Required</div>
                  <div className="text-5xl font-mono font-bold text-white">{cdResults.time} <span className="text-sm">MIN</span></div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Distance Over Ground</div>
                  <div className="text-5xl font-mono font-bold text-blue-400">{cdResults.dist} <span className="text-sm">NM</span></div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'weight' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <section className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] shadow-xl">
               <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Scale size={16} /> Loading Manifest (Cessna 172 Pattern)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Basic Empty Weight (LBS)</label>
                    <input type="number" value={emptyWeight} onChange={e => setEmptyWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Front Seat Weight (LBS)</label>
                    <input type="number" value={pilotWeight} onChange={e => setPilotWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Rear Seat/Baggage (LBS)</label>
                    <input type="number" value={rearWeight} onChange={e => setRearWeight(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Fuel Load (Gallons)</label>
                    <input type="number" value={fuelGals} onChange={e => setFuelGals(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-xl text-slate-100" />
                  </div>
               </div>
             </section>

             <section className="space-y-6">
                <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[32px] shadow-xl text-center">
                   <div className="space-y-8">
                     <div>
                       <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Gross Weight</div>
                       <div className="text-4xl font-mono font-bold text-white">{wbResults.weight} <span className="text-xs">LBS</span></div>
                     </div>
                     <div>
                       <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Center of Gravity</div>
                       <div className="text-4xl font-mono font-bold text-emerald-400">{wbResults.cg} <span className="text-xs">IN</span></div>
                     </div>
                   </div>
                </div>
                {wbResults.weight > 2400 && (
                   <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[32px] flex gap-4">
                      <AlertTriangle size={24} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-400 font-bold leading-relaxed uppercase tracking-widest">
                        Exceeds Max Gross Weight!
                      </p>
                   </div>
                )}
             </section>
          </div>
        )}

        {/* Existing Performance / Takeoff / Landing tabs can be kept or slightly refined similarly */}
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
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Takeoff Weight (LBS)</label>
                      <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-blue-100 outline-none" />
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

        {/* Catch-all for other tabs or refinement */}
        {activeTab === 'performance' && (
           <div className="max-w-2xl mx-auto">
             <section className="bg-slate-900/60 border border-slate-800 p-12 rounded-[48px] shadow-2xl text-center">
               <div className="bg-blue-600/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                 <Thermometer size={48} className="text-blue-500" />
               </div>
               <h3 className="text-lg font-black text-slate-300 uppercase tracking-[0.2em] mb-8">Atmospheric Physics</h3>
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
