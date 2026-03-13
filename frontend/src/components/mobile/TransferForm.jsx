import React, { useState } from 'react';
import { IndianRupee, Send, UserCircle, Search, Wallet, History, ArrowUpRight, ArrowDownLeft, Loader2, Shield } from 'lucide-react';
import * as api from '../../api/api';

const TransferForm = ({ currentAccount, accounts, onResult, onSwitchAccount, transactions }) => {
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const quickAmounts = [
    { label: '500', value: '500' },
    { label: '1K', value: '1000' },
    { label: '5K', value: '5000' },
    { label: '10K', value: '10000' },
    { label: '50K', value: '50000' },
    { label: '1L', value: '100000' },
  ];

  const filteredAccounts = accounts
    .filter(a => a.account_id !== currentAccount.account_id)
    .filter(a => 
      a.name.toLowerCase().includes(search.toLowerCase()) || 
      a.account_id.toLowerCase().includes(search.toLowerCase())
    );

  const myTransactions = transactions
    .filter(t => t.sender_id === currentAccount.account_id || t.receiver_id === currentAccount.account_id)
    .slice(0, 5);

  const handleSend = async () => {
    if (!receiver || !amount) return;
    setLoading(true);
    try {
      const res = await api.sendTransaction(currentAccount.account_id, receiver, amount);
      onResult(res);
    } catch (e) {
      console.error(e);
      alert("Transfer failed. Please check network.");
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (ts) => {
    const s = Math.floor((new Date() - new Date(ts)) / 1000);
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] animate-new-row pb-12">
      {/* Top Bar */}
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0f172a]/90 backdrop-blur-md z-40 border-b border-white/5">
        <h2 className="font-black text-white text-lg tracking-tighter">SentinelBank</h2>
        <button onClick={onSwitchAccount} className="flex items-center gap-2 bg-[#1e293b] border border-white/5 px-3 py-1.5 rounded-full active:scale-95 transition-all">
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black uppercase text-white">
            {currentAccount.account_id}
          </div>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Switch</span>
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Account Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] shadow-2xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Shield size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Your Balance</span>
                <div className="flex items-center text-4xl font-black text-white tracking-tighter">
                  <IndianRupee size={28} className="mr-0.5" />
                  {currentAccount.balance.toLocaleString()}
                </div>
              </div>
              <Wallet className="text-white/40" size={24} />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Account ID</span>
                <span className="text-sm font-bold text-white uppercase">{currentAccount.account_id}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Holder Name</span>
                <span className="text-sm font-bold text-white">{currentAccount.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Send Money</h3>
          
          <div className="bg-[#1e293b] p-6 rounded-[2rem] border border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">To Account</label>
              <div className="relative group">
                <select 
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-4 text-white font-bold text-lg focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="">Select Recipient</option>
                  {accounts.filter(a => a.account_id !== currentAccount.account_id).map(acc => (
                    <option key={acc.account_id} value={acc.account_id}>{acc.account_id} — {acc.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <UserCircle size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Amount</label>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-6 text-4xl font-black text-white focus:outline-none focus:border-blue-500 transition-colors pl-12 tracking-tighter"
                />
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={24} />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
              {quickAmounts.map(p => (
                <button 
                  key={p.label}
                  onClick={() => setAmount(p.value)}
                  className="px-5 py-2.5 bg-[#0f172a] border border-white/5 rounded-full text-xs font-bold text-white/60 active:bg-blue-600 active:text-white active:border-blue-600 transition-all shrink-0"
                >
                  ₹{p.label}
                </button>
              ))}
            </div>

            <button 
              onClick={handleSend}
              disabled={loading || !receiver || !amount}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] py-5 rounded-2xl font-black text-white tracking-widest text-lg transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {loading ? 'PROCESSING...' : 'SEND MONEY'}
            </button>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Recent Activity</h3>
            <History size={14} className="text-white/20" />
          </div>

          <div className="space-y-3">
            {myTransactions.length === 0 ? (
              <div className="py-8 text-center bg-[#1e293b]/30 rounded-2xl border border-dashed border-white/5">
                <p className="text-xs font-bold text-white/10 uppercase tracking-widest">No recent transactions</p>
              </div>
            ) : (
              myTransactions.map((t) => {
                const isSent = t.sender_id === currentAccount.account_id;
                const otherParty = isSent ? t.receiver_id : t.sender_id;
                return (
                  <div key={t.transaction_id} className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 flex items-center justify-between animate-new-row">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${isSent ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                        {isSent ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white/30 uppercase tracking-tighter">
                          {isSent ? 'Transfer To' : 'Received From'}
                        </span>
                        <span className="text-sm font-bold text-white uppercase">Acc {otherParty}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-black italic ${isSent ? 'text-red-400' : 'text-green-400'}`}>
                        {isSent ? '-' : '+'}₹{t.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        {getTimeAgo(t.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TransferForm;
