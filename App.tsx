
import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation.tsx';
import MapContainer from './components/MapContainer.tsx';
import WeatherView from './components/WeatherView.tsx';
import CalculatorView from './components/CalculatorView.tsx';
import ChecklistView from './components/ChecklistView.tsx';
import CheckpointView from './components/CheckpointView.tsx';
import { ViewMode, Checkpoint, ChecklistGroup } from './types.ts';
import { PREFLIGHT_CHECKLIST } from './constants.ts';
import { Flag, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'skynav_checkpoints';
const CHECKLIST_KEY = 'skynav_checklist_state';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.MAP);
  const [nightMode, setNightMode] = useState(false);
  
  // State for Checkpoints
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Checklist state needs to be shared or persistent to be snapshotted
  const [checklistState, setChecklistState] = useState<ChecklistGroup[]>(() => {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    return saved ? JSON.parse(saved) : PREFLIGHT_CHECKLIST;
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoints));
  }, [checkpoints]);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklistState));
  }, [checklistState]);

  const createCheckpoint = useCallback(() => {
    const name = `Checkpoint ${checkpoints.length + 1}`;
    const newCheckpoint: Checkpoint = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name,
      viewMode: currentView,
      checklistState: JSON.parse(JSON.stringify(checklistState)),
    };
    
    setCheckpoints(prev => [...prev, newCheckpoint]);
    alert(`Checkpoint "${name}" saved.`);
  }, [checkpoints.length, currentView, checklistState]);

  const restoreCheckpoint = useCallback((cp: Checkpoint) => {
    setCurrentView(cp.viewMode);
    setChecklistState(cp.checklistState);
    alert(`Restored to checkpoint from ${new Date(cp.timestamp).toLocaleTimeString()}`);
  }, []);

  const deleteCheckpoint = useCallback((id: string) => {
    setCheckpoints(prev => prev.filter(cp => cp.id !== id));
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewMode.MAP:
        return <MapContainer />;
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
        return <MapContainer />;
    }
  };

  const lastCheckpoint = checkpoints[checkpoints.length - 1];

  return (
    <div className={`flex h-screen w-full bg-slate-950 text-slate-50 transition-colors duration-500 ${nightMode ? 'night-mode' : ''}`}>
      <Navigation 
        currentView={currentView} 
        setView={setCurrentView} 
        nightMode={nightMode} 
        toggleNightMode={() => setNightMode(!nightMode)} 
      />
      
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="h-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500 z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              GPS: <span className="text-slate-300 font-bold">LOCKED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              TELM: <span className="text-slate-300 font-bold">ACTIVE</span>
            </div>
            <div className="h-4 w-px bg-slate-800 mx-2"></div>
            <button 
              onClick={createCheckpoint}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors group"
            >
              <Flag size={12} className="group-hover:scale-110 transition-transform" />
              SET CHECKPOINT
            </button>
            {lastCheckpoint && (
              <button 
                onClick={() => restoreCheckpoint(lastCheckpoint)}
                className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 transition-colors group"
              >
                <RotateCcw size={12} className="group-hover:rotate-[-45deg] transition-transform" />
                BRING BACK LAST CHECKPOINT
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">ZULU: {new Date().toISOString().split('T')[1].slice(0, 5)}</span>
            <span className="bg-blue-600/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20 text-[9px] font-bold">SKYNAV v1.3</span>
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
