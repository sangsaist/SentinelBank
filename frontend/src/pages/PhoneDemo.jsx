import React, { useEffect, useState } from 'react';
import useDashboardStore from '../store/useDashboardStore';
import * as api from '../api/api';
import useWebSocket from '../hooks/useWebSocket';

import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import PhoneDemoPanel from '../components/panels/PhoneDemoPanel';
import { Send, ScrollText, Target, ShieldCheck, Fingerprint, Zap } from 'lucide-react';

const ScenarioCard = ({ scenario, onRun }) => {
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    await onRun(scenario.id);
    setTimeout(() => setRunning(false), 2000);
  };

  return (
    <div className={`
      bg-[#111827] rounded-2xl border transition-all duration-300 p-6 flex flex-col justify-between gap-4 group
      ${running ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 bg-white/[0.01] hover:border-white/30'}
    `}>
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
            Scenario 0{scenario.id}
          </div>
          <div className={`w-2 h-2 rounded-full ${scenario.expected === 'RED' ? 'bg-red-500' : 'bg-orange-500'} group-hover:animate-ping`} />
        </div>
        
        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors capitalize">{scenario.name.replace(/_/g, ' ').toLowerCase()}</h3>
        
        <div className="space-y-2">
          <div className="flex gap-3 text-xs leading-relaxed">
            <ScrollText className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-gray-400"><span className="text-gray-300 font-bold">Story:</span> {scenario.story}</p>
          </div>
          <div className="flex gap-3 text-xs leading-relaxed">
            <Target className="w-4 h-4 text-gray-500 shrink-0" />
            <p className="text-gray-400"><span className="text-gray-300 font-bold">Expected:</span> {scenario.expected_desc}</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={running}
        className={`
          w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs transition-all
          ${running 
            ? 'bg-blue-600 text-white cursor-not-allowed' 
            : 'bg-white/5 text-gray-300 hover:bg-blue-600 hover:text-white border border-white/5 hover:border-blue-500'}
        `}
      >
        {running ? <Zap className="w-4 h-4 animate-bounce" /> : <Send className="w-4 h-4" />}
        {running ? 'Running Simulation...' : '▶ Run Scenario'}
      </button>
    </div>
  );
};

const PhoneDemo = () => {
  const { connected } = useWebSocket();
  const fetchInitialData = useDashboardStore((state) => state.fetchInitialData);

  useEffect(() => {
    fetchInitialData(api);
  }, [fetchInitialData]);

  const SCENARIOS_FULL = [
    { 
      id: 1, 
      name: 'HIGH_VALUE', 
      story: 'Account A sends ₹95,000 to Account B in a single large wire transfer.',
      expected: 'RED',
      expected_desc: 'Flagged RED immediately via HIGH_VALUE_TRANSFER rule (> ₹80k).'
    },
    { 
      id: 2, 
      name: 'SMURFING', 
      story: 'Account C sends 7 transactions to multiple accounts just under ₹10,000 each.',
      expected: 'ORANGE',
      expected_desc: 'Trigger multiple ORANGE alerts via ROUND_AMOUNT proximity rule.'
    },
    { 
      id: 3, 
      name: 'LAYERING', 
      story: '₹50,000 moves rapidly through Account K → L → M → N → O in a linear chain.',
      expected: 'RED',
      expected_desc: 'Detected as money laundering chain via graph-based LAYERING rules.'
    },
    { 
      id: 4, 
      name: 'CIRCULAR', 
      story: 'Fund movement from A → B, B → C, and finally C → A in a tight loop.',
      expected: 'RED',
      expected_desc: 'Flagged RED by path-finding engine — CIRCULAR_TRANSACTION detected.'
    },
    { 
      id: 5, 
      name: 'RAPID BURST', 
      story: 'Account D sends to 10 different accounts at a rate of 5 transactions per second.',
      expected: 'RED',
      expected_desc: 'Flagged RED via HIGH_FREQUENCY_BURST rate-limiting rule.'
    }
  ];

  const handleRunScenario = async (id) => {
    await api.injectFraud(id);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <TopBar connected={connected} />
      <Sidebar />

      <main className="ml-[240px] pt-16 p-8 min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-500">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Interactive Simulation</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight">Interactive Fraud Demo</h1>
              <p className="text-gray-500 max-w-2xl leading-relaxed italic border-l-2 border-blue-600/30 pl-4">
                "Select a pattern below to execute a mock financial attack. The underlying AI engine will analyze graph cycles, frequency, and value thresholds in real-time."
              </p>
            </div>
            <div className="flex gap-4">
               <div className="flex flex-col items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <Fingerprint className="w-5 h-5 text-gray-600 mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Demo User</span>
                  <span className="text-[10px] font-mono text-gray-400">#ADMIN-08</span>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <h2 className="text-sm font-black uppercase tracking-widest text-blue-400/80">Network Nodes</h2>
               <div className="h-px flex-1 bg-gradient-to-r from-blue-600/20 to-transparent" />
            </div>
            <PhoneDemoPanel />
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-orange-400/80">Attack Storyboard</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-orange-600/20 to-transparent" />
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SCENARIOS_FULL.map(s => (
                <ScenarioCard key={s.id} scenario={s} onRun={handleRunScenario} />
              ))}
            </div>
          </div>
          
          <div className="pt-10 text-center opacity-30">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-500">
              SentinelBank Advanced Monitoring Protocol • End-to-End Encryption Enabled
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PhoneDemo;
