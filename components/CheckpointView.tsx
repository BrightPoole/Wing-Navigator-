
import React from 'react';
import { Checkpoint } from '../types';
import { Clock, MapPin, Trash2, RotateCcw, Flag } from 'lucide-react';

interface CheckpointViewProps {
  checkpoints: Checkpoint[];
  onRestore: (checkpoint: Checkpoint) => void;
  onDelete: (id: string) => void;
}

const CheckpointView: React.FC<CheckpointViewProps> = ({ checkpoints, onRestore, onDelete }) => {
  const sortedCheckpoints = [...checkpoints].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="p-8 h-full overflow-y-auto max-w-5xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-2">Flight Logbook</h2>
        <p className="text-slate-400">Review and restore previous cockpit states (checkpoints).</p>
      </div>

      <div className="space-y-4">
        {sortedCheckpoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">
            <Flag size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium">No checkpoints saved yet.</p>
            <p className="text-sm">Use the 'Set Checkpoint' button in the status bar to save your current progress.</p>
          </div>
        ) : (
          sortedCheckpoints.map((cp) => (
            <div 
              key={cp.id} 
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-blue-500/50 transition-all group flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-6">
                <div className="bg-blue-600/10 p-4 rounded-2xl text-blue-400">
                  <Flag size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{cp.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <Clock size={12} />
                      {new Date(cp.timestamp).toLocaleTimeString()}
                    </span>
                    {cp.mapCenter && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <MapPin size={12} />
                        {cp.mapCenter[0].toFixed(2)}, {cp.mapCenter[1].toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onRestore(cp)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                >
                  <RotateCcw size={16} />
                  RESTORE
                </button>
                <button
                  onClick={() => onDelete(cp.id)}
                  className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CheckpointView;
