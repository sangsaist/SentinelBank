import React, { useState, useEffect, useRef } from 'react';
import { Beaker, Zap, Plus, Minus, Target, ShieldAlert, CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import * as api from '../../api/api';
import axios from 'axios';

const FRAUD_TYPES = {
  1: { id: 1, name: 'HIGH VALUE TRANSFER', icon: '💰', color: 'text-red-400', desc: 'Single txn > ₹80,000', txnsPerInject: 1, accounts: 'A→B' },
  2: { id: 2, name: 'SMURFING', icon: '🔀', color: 'text-orange-400', desc: 'Multiple small txns same sender', txnsPerInject: 7, accounts: 'C→D,E,F,G,H,I,J' },
  3: { id: 3, name: 'LAYERING', icon: '🔗', color: 'text-red-400', desc: 'Chain transfer K→L→M→N→O', txnsPerInject: 4, accounts: 'K→L→M→N→O' },
  4: { id: 4, name: 'CIRCULAR', icon: '🔄', color: 'text-red-400', desc: 'Money returns to origin A→B→C→A', txnsPerInject: 3, accounts: 'A→B→C→A' },
  5: { id: 5, name: 'RAPID BURST', icon: '⚡', color: 'text-red-400', desc: '10 txns from D in 1 sec', txnsPerInject: 10, accounts: 'D→E,F,G,H,I,J,K,L,M,N' },
};

const CustomInjector = () => {
  const transactions = useDashboardStore((state) => state.transactions);
  const [counts, setCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [injecting, setInjecting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [session, setSession] = useState(null);
  
  const sessionRef = useRef(null);

  // Sync state to ref for detection logic in useEffect
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Detection Logic: Monitor incoming transactions
  useEffect(() => {
    if (transactions.length > 0 && sessionRef.current) {
      const txn = transactions[0];
      const sess = { ...sessionRef.current };
      
      // Pattern Matching
      let matchedType = null;
      if (txn.sender_id === 'A' && txn.receiver_id === 'B' && txn.amount > 80000) matchedType = 1;
      else if (txn.sender_id === 'C') matchedType = 2;
      else if (['K', 'L', 'M', 'N'].includes(txn.sender_id)) matchedType = 3;
      else if (['A', 'B', 'C'].includes(txn.sender_id) && ['A', 'B', 'C'].includes(txn.receiver_id)) matchedType = 4;
      else if (txn.sender_id === 'D') matchedType = 5;

      if (matchedType && sess.perType[matchedType]) {
        const isDetected = txn.color === 'red' || txn.color === 'orange';
        
        // Update Session Stats
        if (isDetected) sess.detectedCount++;
        else sess.missedCount++;
        
        sess.perType[matchedType].injected++;
        if (isDetected) sess.perType[matchedType].detected++;
        
        setSession(sess);
      }
    }
  }, [transactions]);

  const updateCount = (id, delta) => {
    setCounts(prev => ({ ...prev, [id]: Math.max(0, Math.min(10, prev[id] + delta)) }));
  };

  const totalToInject = Object.entries(counts).reduce((sum, [id, count]) => sum + (count * FRAUD_TYPES[id].txnsPerInject), 0);

  const startInjection = async () => {
    setInjecting(true);
    const newSession = {
      id: Date.now(),
      detectedCount: 0,
      missedCount: 0,
      totalQueued: totalToInject,
      perType: {}
    };

    // Initialize per-type tracking
    Object.entries(counts).forEach(([id, count]) => {
      if (count > 0) {
        newSession.perType[id] = { 
          name: FRAUD_TYPES[id].name, 
          icon: FRAUD_TYPES[id].icon,
          target: count * FRAUD_TYPES[id].txnsPerInject, 
          injected: 0, 
          detected: 0 
        };
      }
    });

    setSession(newSession);
    const apiBase = import.meta.env.VITE_API_URL;
    
    // Build call list
    const calls = [];
    Object.entries(counts).forEach(([id, count]) => {
      for (let i = 0; i < count; i++) {
        calls.push({ id, url: `${apiBase}/inject/${id}` });
      }
    });

    setProgress({ current: 0, total: calls.length });

    // Sequential injection
    for (let i = 0; i < calls.length; i++) {
      setProgress(p => ({ ...p, current: i + 1 }));
      try {
        await axios.post(calls[i].url);
      } catch (e) {
        console.error("Injection failed", e);
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    setInjecting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Queue Builder */}
      <div className="bg-[#111827] rounded-xl border border-white/5 p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beaker className="w-5 h-5 text-purple-400" />
            <h2 className="font-black text-sm uppercase tracking-[0.2em] text-white/80">Fraud Queue Builder</h2>
          </div>
          <button 
            onClick={() => setCounts({ 1:0, 2:0, 3:0, 4:0, 5:0 })}
            className="text-[10px] font-bold text-white/20 hover:text-white transition-colors"
          >
            RESET ALL
          </button>
        </div>

        <div className="space-y-2">
          {Object.values(FRAUD_TYPES).map(type => (
            <div key={type.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xl">{type.icon}</span>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black ${type.color} tracking-tighter`}>{type.name}</span>
                  <span className="text-[11px] text-white/40 font-medium">{type.desc}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateCount(type.id, -1)} className="p-1.5 hover:bg-white/5 rounded text-white/20 hover:text-white transition-all"><Minus size={14}/></button>
                <div className="w-8 text-center font-mono font-bold text-lg text-white">{counts[type.id]}</div>
                <button onClick={() => updateCount(type.id, 1)} className="p-1.5 hover:bg-white/5 rounded text-white/20 hover:text-white transition-all"><Plus size={14}/></button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Total frauds queued</span>
            <span className={`text-xl font-black ${totalToInject > 0 ? 'text-blue-400' : 'text-white/10'}`}>{totalToInject} txns</span>
          </div>
          <button 
            onClick={startInjection}
            disabled={injecting || totalToInject === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-20 py-4 rounded-xl font-black text-white tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {injecting ? <Loader2 className="animate-spin" size={18}/> : <Zap size={18}/>}
            {injecting ? `INJECTING ${progress.current}/${progress.total}...` : 'INJECT FRAUD QUEUE'}
          </button>
        </div>
      </div>

      {/* Right: Scoreboard */}
      <div className="bg-[#111827] rounded-xl border border-white/5 p-6 flex flex-col gap-6 relative overflow-hidden">
        {!session && (
          <div className="absolute inset-0 z-10 bg-[#111827]/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center gap-3">
            <Target className="w-8 h-8 text-white/10" />
            <p className="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Run a queue to see detection results</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-green-400" />
          <h2 className="font-black text-sm uppercase tracking-[0.2em] text-white/80">Detection Scoreboard</h2>
        </div>

        {session && (
          <>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Detected</span>
                <span className="text-3xl font-black text-white">{session.detectedCount}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Injected</span>
                <span className="text-3xl font-black text-white">{session.detectedCount + session.missedCount}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Missed</span>
                <span className="text-3xl font-black text-white">{session.missedCount}</span>
              </div>
              
              <div className="col-span-3 mt-2 space-y-2">
                 <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500 ease-out" 
                      style={{ width: `${(session.detectedCount / (session.detectedCount + session.missedCount || 1)) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-red-500 transition-all duration-500 ease-out" 
                      style={{ width: `${(session.missedCount / (session.detectedCount + session.missedCount || 1)) * 100}%` }}
                    />
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-white/40 uppercase tracking-widest">Accuracy</span>
                    <span className="text-white">{Math.round((session.detectedCount / (session.detectedCount + session.missedCount || 1)) * 100)}%</span>
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {Object.entries(session.perType).map(([id, stats]) => {
                const total = stats.injected;
                const accuracy = total > 0 ? Math.round((stats.detected / total) * 100) : 0;
                
                return (
                  <div key={id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{stats.icon}</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">{stats.name}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] font-bold">
                        <span className="text-white/40 uppercase">Inj: <span className="text-white">{stats.injected}</span></span>
                        <span className="text-white/40 uppercase">Det: <span className="text-green-400">{stats.detected}</span></span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${accuracy === 100 ? 'bg-green-500' : accuracy > 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black w-8 text-right">{accuracy}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {injecting && (
              <div className="pt-2 flex items-center gap-2 justify-center text-[10px] font-bold text-blue-400 animate-pulse uppercase tracking-[0.2em]">
                <Loader2 size={12} className="animate-spin" />
                Live Feed Sync Active...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomInjector;
