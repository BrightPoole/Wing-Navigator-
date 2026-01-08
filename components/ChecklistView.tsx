
import React, { useState } from 'react';
import { PREFLIGHT_CHECKLIST } from '../constants';
import { ChecklistGroup, ChecklistItem } from '../types';
import { CheckCircle2, Circle, RotateCcw, Plus, PlusCircle, Trash2, X } from 'lucide-react';

const ChecklistView: React.FC = () => {
  const [checklists, setChecklists] = useState<ChecklistGroup[]>(PREFLIGHT_CHECKLIST);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<{ [key: number]: string }>({});

  const toggleItem = (groupIndex: number, itemIndex: number) => {
    const next = [...checklists];
    next[groupIndex].items[itemIndex].completed = !next[groupIndex].items[itemIndex].completed;
    setChecklists(next);
  };

  const resetAll = () => {
    const next = checklists.map(group => ({
      ...group,
      items: group.items.map(item => ({ ...item, completed: false }))
    }));
    setChecklists(next);
  };

  const addGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    const newGroup: ChecklistGroup = {
      title: newGroupName,
      items: []
    };
    
    setChecklists([...checklists, newGroup]);
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const addItem = (groupIndex: number) => {
    const text = newItemTexts[groupIndex];
    if (!text || !text.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      completed: false
    };

    const next = [...checklists];
    next[groupIndex].items.push(newItem);
    setChecklists(next);
    
    setNewItemTexts({
      ...newItemTexts,
      [groupIndex]: ''
    });
  };

  const deleteGroup = (index: number) => {
    const next = checklists.filter((_, i) => i !== index);
    setChecklists(next);
  };

  const deleteItem = (groupIndex: number, itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = [...checklists];
    next[groupIndex].items.splice(itemIndex, 1);
    setChecklists(next);
  };

  return (
    <div className="p-8 h-full overflow-y-auto max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">SOP Checklists</h2>
          <p className="text-slate-400">Manage standard operating procedures and custom mission steps.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddGroup(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg"
          >
            <Plus size={18} /> NEW GROUP
          </button>
          <button 
            onClick={resetAll}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 transition-all"
          >
            <RotateCcw size={16} /> RESET
          </button>
        </div>
      </div>

      {showAddGroup && (
        <div className="mb-10 animate-in zoom-in-95 duration-200">
          <form onSubmit={addGroup} className="bg-slate-800 border-2 border-dashed border-blue-500/30 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Create Custom Checklist Group</h3>
              <button type="button" onClick={() => setShowAddGroup(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Group Title (e.g., Mountain Landing, Night Prep)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm"
              >
                CREATE
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-12 pb-20">
        {checklists.map((group, gIdx) => (
          <div key={gIdx} className="group relative bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-slate-800/80 backdrop-blur-sm p-5 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider">{group.title}</h3>
                <span className="bg-slate-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-700 text-slate-500">
                  {group.items.length} STEPS
                </span>
              </div>
              <button 
                onClick={() => deleteGroup(gIdx)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-3">
              {group.items.map((item, iIdx) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(gIdx, iIdx)}
                  className={`group/item w-full flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                    item.completed 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-100/50' 
                      : 'bg-slate-900/60 border-slate-700/50 text-slate-300 hover:border-blue-500/30 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {item.completed ? (
                      <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={24} />
                    ) : (
                      <Circle className="text-slate-700 group-hover/item:text-blue-500 flex-shrink-0" size={24} />
                    )}
                    <span className={`text-base font-medium ${item.completed ? 'line-through' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => deleteItem(gIdx, iIdx, e)}
                    className="opacity-0 group-hover/item:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="pt-4 mt-2 border-t border-slate-700/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add step..."
                    className="flex-1 bg-slate-900/40 border border-slate-700/50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all font-mono"
                    value={newItemTexts[gIdx] || ''}
                    onChange={(e) => setNewItemTexts({ ...newItemTexts, [gIdx]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addItem(gIdx);
                    }}
                  />
                  <button 
                    onClick={() => addItem(gIdx)}
                    className="p-2 bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
                  >
                    <PlusCircle size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {checklists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <div className="p-6 bg-slate-900 rounded-full mb-4 border border-slate-800">
              <Plus size={48} className="opacity-20" />
            </div>
            <p className="text-lg font-medium">No checklists configured.</p>
            <button 
              onClick={() => setShowAddGroup(true)}
              className="mt-4 text-blue-500 hover:underline font-bold text-sm uppercase"
            >
              Add your first group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistView;
