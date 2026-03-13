import React from 'react';
import { Shield, Wallet, ChevronRight, UserCircle } from 'lucide-react';

const AccountPicker = ({ accounts, onSelect }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] p-6 animate-new-row">
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="bg-blue-600 p-5 rounded-[2rem] shadow-2xl shadow-blue-500/20">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white tracking-tight">SentinelBank</h1>
          <p className="text-sm text-white/40 font-bold uppercase tracking-widest mt-1">Mobile Gateway 4.0</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-center">Select Your Account</p>
        <div className="grid grid-cols-1 gap-3">
          {accounts.map((acc) => (
            <button
              key={acc.account_id}
              onClick={() => onSelect(acc)}
              className="bg-[#1e293b] border border-white/5 active:scale-[0.98] active:bg-[#2d3a4f] p-4 rounded-2xl flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-blue-600/10 flex items-center justify-center font-black text-xl text-blue-400 border border-blue-500/10 group-active:bg-blue-600 group-active:text-white transition-colors uppercase">
                  {acc.account_id}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-lg">{acc.name}</span>
                  <div className="flex items-center gap-1.5 text-white/40">
                    <Wallet size={12} />
                    <span className="text-xs font-bold font-mono">₹{acc.balance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-white/10" />
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-auto py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
          End-to-End Encrypted Session
        </div>
      </div>
    </div>
  );
};

export default AccountPicker;
