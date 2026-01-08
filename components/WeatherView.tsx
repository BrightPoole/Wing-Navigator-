
import React, { useState } from 'react';
import { Search, Wind, Cloud, MapPin, Loader2, FileText, ToggleLeft, ToggleRight, Layout } from 'lucide-react';
import { interpretWeather } from '../services/gemini.ts';

type WeatherType = 'METAR' | 'TAF';

const WeatherView: React.FC = () => {
  const [icao, setIcao] = useState('');
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [metar, setMetar] = useState<string | null>(null);
  const [taf, setTaf] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<WeatherType>('METAR');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icao || icao.length < 3) return;
    
    setLoading(true);
    // Simulating API latency
    setTimeout(async () => {
      const upperIcao = icao.toUpperCase();
      const mockMetar = `${upperIcao} 241853Z 21014G22KT 10SM SCT025 BKN050 18/12 A2992 RMK AO2 SLP124 T01830122`;
      const mockTaf = `${upperIcao} 241720Z 2418/2518 21015G25KT P6SM BKN040\n  FM250000 19010KT P6SM OVC030\n  FM250600 18008KT P6SM SCT040\n  FM251500 22012G20KT P6SM BKN050`;
      
      setMetar(mockMetar);
      setTaf(mockTaf);
      
      const currentData = activeType === 'METAR' ? mockMetar : mockTaf;
      const summary = await interpretWeather(currentData);
      setInterpretation(summary);
      setLoading(false);
    }, 1000);
  };

  const handleToggle = async (type: WeatherType) => {
    if (type === activeType) return;
    setActiveType(type);
    
    const data = type === 'METAR' ? metar : taf;
    if (data) {
      setLoading(true);
      const summary = await interpretWeather(data);
      setInterpretation(summary);
      setLoading(false);
    }
  };

  const currentRaw = activeType === 'METAR' ? metar : taf;

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Weather Services</h2>
        <p className="text-slate-400">Search real-time aviation weather reports for any airport worldwide.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={icao}
            onChange={(e) => setIcao(e.target.value.toUpperCase())}
            placeholder="Enter ICAO (e.g., KJFK, EGLL)"
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-lg text-white"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 px-6 min-w-[100px] flex items-center justify-center rounded-xl font-bold gap-2 disabled:opacity-50 text-white transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'FETCH'}
          </button>
        </div>
      </form>

      {metar && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Weather Type Toggle */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 w-fit">
            {(['METAR', 'TAF'] as WeatherType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleToggle(type)}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  activeType === type 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 text-blue-400 mb-2">
                <Wind size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Winds</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white">210° @ 14 G 22</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 text-orange-400 mb-2">
                <Cloud size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Visibility</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white">10 SM</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 text-emerald-400 mb-2">
                <MapPin size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Flight Cat</span>
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-500">VFR</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Raw {activeType} Report</h3>
              <div className="text-[10px] text-slate-600 font-mono">UPDATED: JUST NOW</div>
            </div>
            <p className="font-mono text-base leading-relaxed text-blue-100 bg-slate-950 p-6 rounded-2xl border border-slate-800 whitespace-pre-wrap">
              {currentRaw}
            </p>
          </div>

          {interpretation && (
            <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-[24px] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Layout size={64} />
              </div>
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                AI Decoded Information
              </h3>
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-medium">
                {interpretation}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && !metar && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Retrieving Satellite Data...</p>
        </div>
      )}
    </div>
  );
};

export default WeatherView;
