
import React, { useState } from 'react';
import { Search, Wind, Cloud, MapPin, Loader2, FileText } from 'lucide-react';
import { interpretWeather } from '../services/gemini';

const WeatherView: React.FC = () => {
  const [icao, setIcao] = useState('');
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [metar, setMetar] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icao || icao.length < 3) return;
    
    setLoading(true);
    setTimeout(async () => {
      const mockMetar = `${icao.toUpperCase()} 241853Z 21014G22KT 10SM SCT025 BKN050 18/12 A2992 RMK AO2 SLP124 T01830122`;
      setMetar(mockMetar);
      const summary = await interpretWeather(mockMetar);
      setInterpretation(summary);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Weather Services</h2>
        <p className="text-slate-400">Search METAR/TAF data for any airport worldwide.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={icao}
            onChange={(e) => setIcao(e.target.value.toUpperCase())}
            placeholder="Enter ICAO (e.g., KJFK, EGLL)"
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-lg"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 px-6 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'FETCH'}
          </button>
        </div>
      </form>

      {metar && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
              <div className="flex items-center gap-3 text-blue-400 mb-2">
                <Wind size={20} />
                <span className="text-xs font-bold uppercase">Winds</span>
              </div>
              <div className="text-2xl font-mono font-bold">210° @ 14 G 22</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
              <div className="flex items-center gap-3 text-orange-400 mb-2">
                <Cloud size={20} />
                <span className="text-xs font-bold uppercase">Visibility</span>
              </div>
              <div className="text-2xl font-mono font-bold">10 SM</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
              <div className="flex items-center gap-3 text-emerald-400 mb-2">
                <MapPin size={20} />
                <span className="text-xs font-bold uppercase">Condition</span>
              </div>
              <div className="text-2xl font-mono font-bold">VFR</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Raw METAR</h3>
            <p className="font-mono text-lg leading-relaxed text-blue-100 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {metar}
            </p>
          </div>

          {interpretation && (
            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                Flight Information
              </h3>
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                {interpretation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherView;
