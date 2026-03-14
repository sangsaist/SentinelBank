import React, { useMemo } from 'react';
import { Smartphone, ArrowRight, Wallet, History as HistoryIcon } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const PhoneMockup = ({ id, name, balance, history }) => (
  <div className="w-56 h-[400px] bg-[#1a2035] rounded-[2.5rem] border-4 border-[#333] relative shadow-2xl overflow-hidden flex flex-col group hover:border-blue-500/50 transition-all duration-500">
    <div className="h-6 w-24 bg-[#333] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-10" />
    
    <div className="p-6 pt-10 flex-1 flex flex-col gap-6">
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase">
        <div className="flex items-center gap-1">
          <Smartphone className="w-3 h-3" />
          <span>Account: {id}</span>
        </div>
        <span>5G</span>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Available Balance</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">₹{balance.toLocaleString()}</span>
          <span className="text-xs text-green-500">.00</span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2">
          <HistoryIcon className="w-3 h-3" /> Activity
        </p>
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="py-10 text-center opacity-20">
              <Wallet className="w-8 h-8 mx-auto mb-2" />
              <p className="text-[10px] uppercase font-bold">No recent txns</p>
            </div>
          ) : (
            history.map((t, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col gap-1 animate-new-row transition-colors group-hover:bg-white/[0.08]">
                <div className="flex justify-between items-center capitalize">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {t.sender_id === id ? `Sent to ${t.receiver_id}` : `From ${t.sender_id}`}
                  </span>
                  <span className={`text-[10px] font-bold ${t.sender_id === id ? 'text-red-400' : 'text-green-400'}`}>
                    {t.sender_id === id ? '-' : '+'}₹{t.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[8px]">
                  <span className="text-gray-600 font-mono uppercase tracking-tighter">#{t.transaction_id.slice(0, 6)}</span>
                  <div className={`w-1 h-1 rounded-full ${t.color === 'red' ? 'bg-red-500' : 'bg-green-500'}`} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

    <div className="h-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-around px-6">
      <div className="w-8 h-1 bg-white/10 rounded-full" />
    </div>
  </div>
);

const PhoneDemoPanel = () => {
  const transactions = useDashboardStore((state) => state.transactions);
  const accounts = useDashboardStore((state) => state.accounts);

  const phoneAccounts = ['A', 'B', 'C', 'D'];
  
  const getAccountData = (id) => {
    const acc = accounts.find(a => a.account_id === id) || { name: 'Unknown', balance: 0 };
    const history = transactions.filter(t => t.sender_id === id || t.receiver_id === id).slice(0, 2);
    return { ...acc, history };
  };

  const lastTxn = useMemo(() => transactions[0], [transactions]);

  return (
    <div className="bg-[#111827] rounded-3xl border border-white/10 p-10 overflow-hidden relative shadow-inner">
      <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center gap-12">
        <div className="flex gap-8 items-center justify-center flex-wrap">
          {phoneAccounts.map(id => (
            <div key={id} className="relative">
              <PhoneMockup id={id} {...getAccountData(id)} />
              
              {/* Dynamic Connection Lines */}
              {lastTxn && (lastTxn.sender_id === id || lastTxn.receiver_id === id) && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
                  <div className={`w-2 h-2 rounded-full ${lastTxn.color === 'red' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className="text-[10px] font-black font-mono tracking-tighter">ACTIVE</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {lastTxn && (
          <div className="bg-[#1a2035] px-6 py-4 rounded-full border border-white/10 flex items-center gap-6 shadow-2xl animate-new-row">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center font-bold text-blue-400 border border-blue-500/20">{lastTxn.sender_id}</div>
              <ArrowRight className={`w-4 h-4 ${lastTxn.color === 'red' ? 'text-red-500' : 'text-green-500'} animate-pulse`} />
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center font-bold text-blue-400 border border-blue-500/20">{lastTxn.receiver_id}</div>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Flow</span>
              <span className="text-sm font-bold text-white">₹{lastTxn.amount.toLocaleString()}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
              lastTxn.color === 'red' ? 'bg-red-950/50 border-red-500 text-red-400' : 'bg-green-950/50 border-green-500 text-green-400'
            }`}>
              {lastTxn.color === 'red' ? 'FRAUD BLOCKED' : 'TRANSACTION SAFE'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneDemoPanel;
