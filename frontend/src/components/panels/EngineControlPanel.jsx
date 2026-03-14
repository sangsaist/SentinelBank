import React, { useState } from 'react';
import { Play, Square, Pause, RotateCcw, Cpu, Zap } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import * as api from '../../api/api';

const ControlButton = ({ icon: Icon, label, color, onClick, disabled, activeColor }) => {
  const colors = {
    green: 'hover:bg-green-600 hover:text-white border-green-500/30 text-green-500 disabled:opacity-30',
    red: 'hover:bg-red-600 hover:text-white border-red-500/30 text-red-500 disabled:opacity-30',
    yellow: 'hover:bg-yellow-600 hover:text-white border-yellow-500/30 text-yellow-500 disabled:opacity-30',
    blue: 'hover:bg-blue-600 hover:text-white border-blue-500/30 text-blue-500 disabled:opacity-30',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-transparent 
        bg-white/5 transition-all duration-200 group
        ${colors[color]}
        ${disabled ? 'cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95'}
      `}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110`} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
};

const EngineControlPanel = () => {
  const engineStatus = useDashboardStore((state) => state.engineStatus);
  const setEngineStatus = useDashboardStore((state) => state.setEngineStatus);
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionFn) => {
    setLoading(true);
    try {
      const newStatus = await actionFn();
      setEngineStatus(newStatus);
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    running: { label: 'RUNNING', color: 'bg-green-500' },
    paused: { label: 'PAUSED', color: 'bg-yellow-500' },
    stopped: { label: 'STOPPED', color: 'bg-red-500' },
  };

  const current = statusMap[engineStatus.status];

  return (
    <div className="bg-[#111827] rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="font-bold tracking-tight">Transaction Engine</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <div className={`w-2 h-2 rounded-full ${current.color} animate-pulse`} />
          <span className="text-[10px] font-bold text-gray-300 tracking-wider font-mono">{current.label}</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a2035] rounded-xl p-4 border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Processed</p>
            <p className="text-2xl font-mono font-bold text-white tracking-tighter">
              {engineStatus.count.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#1a2035] rounded-xl p-4 border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Rate</p>
            <p className="text-2xl font-mono font-bold text-white tracking-tighter">
              {engineStatus.rate}<span className="text-xs text-gray-500 ml-1">tx/m</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ControlButton 
            icon={Play} 
            label="Start" 
            color="green" 
            onClick={() => handleAction(api.startEngine)}
            disabled={engineStatus.status === 'running' || loading}
          />
          <ControlButton 
            icon={Pause} 
            label="Pause" 
            color="yellow" 
            onClick={() => handleAction(api.pauseEngine)}
            disabled={engineStatus.status !== 'running' || loading}
          />
          <ControlButton 
            icon={RotateCcw} 
            label="Resume" 
            color="blue" 
            onClick={() => handleAction(api.resumeEngine)}
            disabled={engineStatus.status !== 'paused' || loading}
          />
          <ControlButton 
            icon={Square} 
            label="Stop" 
            color="red" 
            onClick={() => handleAction(api.stopEngine)}
            disabled={engineStatus.status === 'stopped' || loading}
          />
        </div>

        <button
          onClick={() => {
            if (window.confirm("CRITICAL: This will delete all transactions and alerts. Continue?")) {
              handleAction(api.resetDatabase);
            }
          }}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 font-black tracking-[0.2em] text-[10px] uppercase disabled:opacity-20 mt-4 shadow-lg shadow-red-500/5"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reset Database & History
        </button>
      </div>

      <div className="p-4 bg-blue-600/5 flex items-center gap-3">
        <Zap className="w-4 h-4 text-blue-400" />
        <p className="text-[10px] text-blue-300 font-medium uppercase tracking-tight">
          Engine connected to core ledger node v4.2.1-stable
        </p>
      </div>
    </div>
  );
};

export default EngineControlPanel;
