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

type AppTheme = 'light' | 'dark';

interface NavigationProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  setView, 
  currentTheme,
  setTheme 
}) => {
  const navItems = [
    { id: ViewMode.MAP, icon: MapIcon, label: 'Charts' },
    { id: ViewMode.WEATHER, icon: CloudSun, label: 'WX/METAR' },
    { id: ViewMode.CALC, icon: Calculator, label: 'E6B Calc' },
    { id: ViewMode.CHECKLIST, icon: ListChecks, label: 'Checklists' },
    { id: ViewMode.CHECKPOINTS, icon: History, label: 'Logbook' },
  ];

  const cycleTheme = () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  const isLight = currentTheme === 'light';

  return (
    <nav className={`w-20 md:w-64 border-r flex flex-col h-full transition-all duration-300 ${isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800'}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
          <Plane className="text-white w-6 h-6" />
        </div>
        <h1 className={`text-xl font-bold hidden md:block tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Wing<span className="text-blue-500"> Navigator</span>
        </h1>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : isLight 
                  ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <item.icon size={24} />
            <span className="font-bold text-xs uppercase tracking-widest hidden md:block">{item.label}</span>
          </button>
        ))}
      </div>

      <div className={`p-4 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
        <button
          onClick={cycleTheme}
          className={`w-full flex items-center justify-center md:justify-start gap-4 p-3 rounded-xl transition-all ${
            isLight 
              ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          {currentTheme === 'light' ? (
            <Sun size={24} className="text-amber-500" />
          ) : (
            <Moon size={24} className="text-blue-400" />
          )}
          <span className="font-bold text-xs uppercase tracking-widest hidden md:block">
            {currentTheme === 'light' ? 'Day Mode' : 'Night Mode'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;