
import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation.tsx';
import MapContainer from './components/MapContainer.tsx';
import WeatherView from './components/WeatherView.tsx';
import CalculatorView from './components/CalculatorView.tsx';
import ChecklistView from './components/ChecklistView.tsx';
import CheckpointView from './components/CheckpointView.tsx';
import { ViewMode, Checkpoint, ChecklistGroup, Airport } from './types.ts';
import { PREFLIGHT_CHECKLIST } from './constants.ts';
import { Flag, RotateCcw, Key, ExternalLink, ShieldAlert } from 'lucide-react';

const STORAGE_KEY = 'skynav_checkpoints';
const CHECKLIST_KEY = 'skynav_checklist_state';
const FLIGHTPLAN_KEY = 'skynav_flightplan_state';
const PINNED_KEY = 'skynav_pinned_airports';
const THEME_KEY = 'skynav_theme';

type AppTheme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.MAP);
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return (saved === 'dark' ? 'dark' : 'light');
  });
  
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); // Assume true initially to check
  const [isKeyChecking, setIsKeyChecking] = useState(true);

  // State for Checkpoints
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Global Flight Plan state
  const [flightPlan, setFlightPlan] = useState<Airport[]>(() => {
    const saved = localStorage.getItem(FLIGHTPLAN_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Global Pinned (searched) Airports
  const [pinnedAirports, setPinnedAirports] = useState<Airport[]>(() => {
    const saved = localStorage.getItem(PINNED_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Checklist state needs to be shared or persistent to be snapshotted
  const [checklistState, setChecklistState] = useState<ChecklistGroup[]>(() => {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    return saved ? JSON.parse(saved) : PREFLIGHT_CHECKLIST;
  });

  // Check for API key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
      setIsKeyChecking(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (typeof (window as any).aistudio?.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      // Assume successful selection per guidelines to avoid race condition
      setHasApiKey(true);
    }
  };

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoints));
  }, [checkpoints]);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklistState));
  }, [checklistState]);

  useEffect(() => {
    localStorage.setItem(FLIGHTPLAN_KEY, JSON.stringify(flightPlan));
  }, [flightPlan]);

  useEffect(() => {
    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedAirports));
  }, [pinnedAirports]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.body.className = '';
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    }
  }, [theme]);

  const createCheckpoint = useCallback(() => {
    const name = `Checkpoint ${checkpoints.length + 1}`;
    const newCheckpoint: Checkpoint = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name,
      viewMode: currentView,
      checklistState: JSON.parse(JSON.stringify(checklistState)),
      flightPlan: JSON.parse(JSON.stringify(flightPlan)),
    };
    
    setCheckpoints(prev => [...prev, newCheckpoint]);
    alert(`Checkpoint "${name}" saved.`);
  }, [checkpoints.length, currentView, checklistState, flightPlan]);

  const restoreCheckpoint = useCallback((cp: Checkpoint) => {
    setCurrentView(cp.viewMode);
    setChecklistState(cp.checklistState);
    if (cp.flightPlan) {
      setFlightPlan(cp.flightPlan);
    }
    alert(`Restored to checkpoint from ${new Date(cp.timestamp).toLocaleTimeString()}`);
  }, []);

  const deleteCheckpoint = useCallback((id: string) => {
    setCheckpoints(prev => prev.filter(cp => cp.id !== id));
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewMode.MAP:
        return (
          <MapContainer 
            theme={theme} 
            flightPlan={flightPlan} 
            setFlightPlan={setFlightPlan}
            pinnedAirports={pinnedAirports}
            setPinnedAirports={setPinnedAirports}
          />
        );
      case ViewMode.WEATHER:
        return <WeatherView />;
      case ViewMode.CALC:
        return <CalculatorView />;
      case ViewMode.CHECKLIST:
        return <ChecklistView />; 
      case ViewMode.CHECKPOINTS:
        return (
          <CheckpointView 
            checkpoints={checkpoints} 
            onRestore={restoreCheckpoint} 
            onDelete={deleteCheckpoint} 
          />
        );
      default:
        return (
          <MapContainer 
            theme={theme} 
            flightPlan={flightPlan} 
            setFlightPlan={setFlightPlan} 
            pinnedAirports={pinnedAirports}
            setPinnedAirports={setPinnedAirports}
          />
        );
    }
  };

  const lastCheckpoint = checkpoints[checkpoints.length - 1];

  if (!hasApiKey && !isKeyChecking) {
    return (
      <div className={`flex items-center justify-center h-screen w-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
        <div className={`max-w-md w-full p-10 rounded-[40px] border shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="bg-blue-600/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20">
            <Key size={40} className="text-blue-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tight">Project Connectivity Required</h1>
            <p className="text-sm text-slate-500 leading-relaxed px-4">
              Advanced flight intelligence (Google Search Grounding) requires a paid API key from a Google Cloud project with billing enabled.
            </p>
          </div>
          
          <div className="space-y-4 pt-4">
            <button 
              onClick={handleSelectKey}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              CONNECT PROJECT KEY
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-blue-500 transition-colors"
            >
              <ExternalLink size={12} />
              Billing Documentation
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-50'}`}>
      <Navigation 
        currentView={currentView} 
        setView={setCurrentView} 
        currentTheme={theme}
        setTheme={setTheme}
      />
      
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className={`h-10 border-b px-4 flex items-center justify-between text-[10px] font-mono tracking-widest z-20 transition-colors ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-slate-900/80 border-slate-800 text-slate-400'}`}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              GPS: <span className={`${theme === 'light' ? 'text-slate-900' : 'text-slate-100'} font-bold`}>LOCKED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              AI LINK: <span className={`${theme === 'light' ? 'text-slate-900' : 'text-slate-100'} font-bold`}>ENCRYPTED</span>
            </div>
            <div className={`h-4 w-px mx-2 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
            <button 
              onClick={createCheckpoint}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-500 transition-colors group"
            >
              <Flag size={12} className="group-hover:scale-110 transition-transform" />
              SET CHECKPOINT
            </button>
            {lastCheckpoint && (
              <button 
                onClick={() => restoreCheckpoint(lastCheckpoint)}
                className="flex items-center gap-1.5 text-orange-600 hover:text-orange-500 transition-colors group"
              >
                <RotateCcw size={12} className="group-hover:rotate-[-45deg] transition-transform" />
                RESTORE PREV
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>ZULU: {new Date().toISOString().split('T')[1].slice(0, 5)}</span>
            <button onClick={() => setHasApiKey(false)} className="bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded border border-blue-600/20 text-[9px] font-bold uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-colors">
              REKEY
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
