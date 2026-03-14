import React, { useState } from 'react';
import { Beaker, Send, CheckCircle2, Loader2, Info } from 'lucide-react';
import * as api from '../../api/api';

const SCENARIOS = [
  { id: 1, name: 'High Value', desc: 'A→B Single Transfer ₹95,000', color: 'red' },
  { id: 2, name: 'Smurfing', desc: 'Multiple accounts under ₹10k', color: 'orange' },
  { id: 3, name: 'Layering', desc: 'K→L→M→N Chain transfer', color: 'red' },
  { id: 4, name: 'Circular', desc: 'A→B→C→A Loop detected', color: 'red' },
  { id: 5, name: 'Rapid Burst', desc: '10 txns from D in 2 seconds', color: 'red' },
];

const FraudInjectorPanel = () => {
  const [selected, setSelected] = useState(null);
  const [injecting, setInjecting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInject = async () => {
    if (!selected) return;
    setInjecting(true);
    try {
      await api.injectFraud(selected);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Injection failed", error);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="bg-[#111827] rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full grow">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600/10 rounded-lg">
            <Beaker className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="font-bold tracking-tight text-white">Fraud Injector</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <Info className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[10px] font-bold text-gray-400 tracking-wider">SANDBOX MODE</span>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`
                text-left p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 h-[100px]
                ${selected === s.id 
                  ? 'bg-orange-600/10 border-orange-500 scale-[1.02] shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                  : 'bg-[#1a2035] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 ${selected === s.id ? 'text-orange-400' : 'text-gray-500'}`}>0{s.id}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${s.color === 'red' ? 'bg-red-500' : 'bg-orange-500'}`} />
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight mb-1 ${selected === s.id ? 'text-white' : 'text-gray-300'}`}>{s.name}</p>
                <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={handleInject}
          disabled={!selected || injecting}
          className={`
            w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all duration-300
            ${success 
              ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
              : !selected 
                ? 'bg-[#1a2035] text-gray-600 cursor-not-allowed border border-white/5' 
                : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-orange-950/20'}
          `}
        >
          {injecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Injecting Attack...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Successfully Injected</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Inject Selected Pattern</span>
            </>
          )}
        </button>
      </div>

      <div className="px-6 py-3 bg-[#111827] border-t border-white/5 flex justify-between items-center italic">
        <p className="text-[9px] text-gray-600 font-medium">WARNING: Pattern injection will trigger real-time AI alerts across all monitoring nodes.</p>
        <span className="text-[9px] text-gray-700 font-mono">CODE: SE-403</span>
      </div>
    </div>
  );
};

export default FraudInjectorPanel;
