import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Square, Cpu } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import * as api from '../../api/api';

const EngineControl = () => {
  const { status, count } = useDashboardStore((state) => state.engineStatus);
  const setEngineStatus = useDashboardStore((state) => state.setEngineStatus);
  const [loading, setLoading] = useState(false);

  const handleAction = async (fn) => {
    setLoading(true);
    try {
      const newStatus = await fn();
      setEngineStatus(newStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    running: 'text-green-400 bg-green-400/10 border-green-400/20',
    paused: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    stopped: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-white/5 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/60">Engine</h2>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${statusColors[status]}`}>
          {status}
        </div>
      </div>

      <div>
        <span className="text-2xl font-bold text-white tracking-tighter">{count.toLocaleString()}</span>
        <span className="text-[10px] text-white/40 font-bold uppercase ml-2 tracking-widest">Txns</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button 
          onClick={() => handleAction(api.startEngine)} 
          disabled={status !== 'stopped' || loading}
          className="p-2 bg-green-500/10 text-green-500 rounded border border-green-500/20 hover:bg-green-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <Play size={14} className="mx-auto" />
        </button>
        <button 
          onClick={() => handleAction(api.pauseEngine)} 
          disabled={status !== 'running' || loading}
          className="p-2 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20 hover:bg-yellow-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <Pause size={14} className="mx-auto" />
        </button>
        <button 
          onClick={() => handleAction(api.resumeEngine)} 
          disabled={status !== 'paused' || loading}
          className="p-2 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20 hover:bg-blue-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <RotateCcw size={14} className="mx-auto" />
        </button>
        <button 
          onClick={() => handleAction(api.stopEngine)} 
          disabled={status === 'stopped' || loading}
          className="p-2 bg-red-500/10 text-red-500 rounded border border-red-500/20 hover:bg-red-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <Square size={14} className="mx-auto" />
        </button>
      </div>

      <button
        onClick={() => {
          if (window.confirm("CRITICAL: Wipe all transactions and reset system?")) {
            handleAction(api.resetDatabase);
          }
        }}
        disabled={loading}
        className="w-full py-2 bg-red-600/10 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center gap-2"
      >
        <RotateCcw size={10} className={loading ? 'animate-spin' : ''} />
        Reset System Database
      </button>
    </div>
  );
};

export default EngineControl;
