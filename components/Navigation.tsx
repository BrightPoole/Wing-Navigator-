
import React from 'react';
import { 
  Map as MapIcon, 
  CloudSun, 
  Calculator, 
  ListChecks, 
  Moon, 
  Sun,
  Plane,
  History
} from 'lucide-react';
import { ViewMode } from '../types';

interface NavigationProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  nightMode: boolean;
  toggleNightMode: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  setView, 
  nightMode, 
  toggleNightMode 
}) => {
  const navItems = [
    { id: ViewMode.MAP, icon: MapIcon, label: 'Charts' },
    { id: ViewMode.WEATHER, icon: CloudSun, label: 'WX/METAR' },
    { id: ViewMode.CALC, icon: Calculator, label: 'E6B Calc' },
    { id: ViewMode.CHECKLIST, icon: ListChecks, label: 'Checklists' },
    { id: ViewMode.CHECKPOINTS, icon: History, label: 'Logbook' },
  ];

  return (
    <nav className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Plane className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold hidden md:block tracking-tight">
          Sky<span className="text-blue-500">Nav</span>
        </h1>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              currentView === item.id 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <item.icon size={24} />
            <span className="font-medium hidden md:block">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={toggleNightMode}
          className="w-full flex items-center justify-center md:justify-start gap-4 p-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-all"
        >
          {nightMode ? <Sun size={24} /> : <Moon size={24} />}
          <span className="font-medium hidden md:block">
            {nightMode ? 'Day Mode' : 'Night Vision'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
