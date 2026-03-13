import React, { useEffect } from 'react';
import useDashboardStore from '../store/useDashboardStore';
import * as api from '../api/api';
import useWebSocket from '../hooks/useWebSocket';

import StatsBar from '../components/dashboard/StatsBar';
import EngineControl from '../components/dashboard/EngineControl';
import TransactionFeed from '../components/dashboard/TransactionFeed';
import FraudAlertFeed from '../components/dashboard/FraudAlertFeed';
import CustomInjector from '../components/dashboard/CustomInjector';
import { Shield, Radio } from 'lucide-react';

const Dashboard = () => {
  const { connected } = useWebSocket();
  const fetchInitialData = useDashboardStore((state) => state.fetchInitialData);

  useEffect(() => {
    fetchInitialData(api);
  }, [fetchInitialData]);

  return (
    <div className="bg-[#0a0f1e] text-white w-full">
      {/* TopBar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#111827]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tighter leading-none">SentinelBank</h1>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Fraud Detection System</span>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
          connected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <Radio size={12} className={connected ? 'animate-pulse' : ''} />
          {connected ? 'WS Connected' : 'Disconnected'}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-24">
        <div className="flex gap-6">
          <div className="w-[320px] shrink-0">
            <EngineControl />
          </div>
          <div className="flex-1">
            <StatsBar />
          </div>
        </div>

        <CustomInjector />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[700px]">
          <div className="lg:col-span-3 h-full overflow-hidden">
            <TransactionFeed />
          </div>
          <div className="lg:col-span-2 h-full overflow-hidden">
            <FraudAlertFeed />
          </div>
        </div>
      </main>

      <footer className="p-8 border-t border-white/5 text-center bg-[#0a0f1e]">
        <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.5em]">Real-time Transaction Shield • Advanced Graph Neural Network Deployment v4.2</p>
      </footer>
    </div>
  );
};

export default Dashboard;
