import React from 'react';
import { Shield, Clock } from 'lucide-react';
import StatsBar from '../panels/StatsBar';
import ConnectionStatus from '../shared/ConnectionStatus';
import { useState, useEffect } from 'react';

const TopBar = ({ connected }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-16 w-full bg-[#111827] border-b border-white/10 flex items-center px-6 fixed top-0 z-50 justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">SentinelBank</h1>
          <p className="text-[10px] text-blue-400 font-medium uppercase tracking-widest">Real-time Fraud Detection</p>
        </div>
      </div>

      <div className="flex-1 px-8">
        <StatsBar />
      </div>

      <div className="flex items-center gap-6">
        <ConnectionStatus connected={connected} />
        <div className="flex items-center gap-2 text-gray-400 font-mono text-sm border-l border-white/10 pl-6">
          <Clock className="w-4 h-4" />
          <span>{time.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
