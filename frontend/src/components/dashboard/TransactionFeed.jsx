import React, { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, History } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const TransactionFeed = () => {
  const transactions = useDashboardStore((state) => state.transactions);
  const [filter, setFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);

  const filtered = transactions.filter(t => {
    if (filter === 'fraud') return t.color === 'red';
    if (filter === 'safe') return t.color === 'green';
    return true;
  });

  const getStatusColor = (color) => {
    if (color === 'red') return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (color === 'orange') return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    return 'text-green-400 bg-green-400/10 border-green-400/20';
  };

  const getTimeAgo = (ts) => {
    const s = Math.floor((new Date() - new Date(ts)) / 1000);
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-white/5 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <History className="w-4 h-4 text-blue-400" />
           <h2 className="text-xs font-bold uppercase tracking-widest text-white/60">Live Transactions</h2>
        </div>
        <div className="flex gap-2">
          {['all', 'fraud', 'safe'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${
                filter === f ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-transparent text-white/40 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-white/20 tracking-widest border-b border-white/5">
              <th className="p-4">Flow</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Risk</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <React.Fragment key={t.transaction_id}>
                <tr 
                  onClick={() => setExpandedRow(expandedRow === t.transaction_id ? null : t.transaction_id)}
                  className={`
                    cursor-pointer border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group
                    ${t.color === 'red' ? 'bg-red-500/[0.02]' : ''}
                    ${t.color === 'orange' ? 'bg-orange-500/[0.02]' : ''}
                  `}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-blue-400">{t.sender_id}</span>
                      <ArrowRight size={10} className="text-white/20" />
                      <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-blue-400">{t.receiver_id}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-sm text-white">₹{t.amount.toLocaleString()}</td>
                  <td className={`p-4 font-mono text-xs ${t.color === 'red' ? 'text-red-400' : t.color === 'orange' ? 'text-orange-400' : 'text-green-400'}`}>
                    {t.risk_score.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${getStatusColor(t.color)}`}>
                      {t.color === 'red' ? 'FRAUD' : t.color === 'orange' ? 'SUSPICIOUS' : 'SAFE'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-[10px] text-white/30 font-mono">
                    <div className="flex items-center justify-end gap-2">
                      {getTimeAgo(t.timestamp)}
                      {expandedRow === t.transaction_id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </td>
                </tr>
                {expandedRow === t.transaction_id && (
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <td colSpan="5" className="p-4">
                      <div className="grid grid-cols-2 gap-8 animate-new-row">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-white/20">Transaction ID</span>
                          <span className="text-xs font-mono text-white/60">{t.transaction_id}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-white/20">Fraud Intelligence</span>
                          <span className="text-xs text-white/80">{t.fraud_reason || 'No risk patterns matching core rule engine.'}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionFeed;
