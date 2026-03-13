import React, { useState } from 'react';
import { List, Filter, ArrowRight, MousePointer2 } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import RiskBadge from '../shared/RiskBadge';

const TransactionFeed = () => {
  const transactions = useDashboardStore((state) => state.transactions);
  const setSelectedTransaction = useDashboardStore((state) => state.setSelectedTransaction);
  const [filter, setFilter] = useState('all');

  const filteredTxns = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'fraud') return t.color === 'red';
    if (filter === 'safe') return t.color === 'green';
    return true;
  });

  const formattedCurrency = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val);

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="bg-[#111827] rounded-2xl border border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <List className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="font-bold tracking-tight">Live Transaction Feed</h2>
        </div>
        
        <div className="flex p-1 bg-white/5 rounded-lg border border-white/5">
          {['all', 'fraud', 'safe'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all
                ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#111827] z-10 border-b border-white/5">
            <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <th className="px-5 py-4">ID</th>
              <th className="px-4 py-4">Flow</th>
              <th className="px-4 py-4">Amount</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right pr-5">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxns.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-20 text-center text-gray-600">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8 opacity-20" />
                    <p className="text-sm italic">No matching transactions found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTxns.map((t) => (
                <tr 
                  key={t.transaction_id}
                  onClick={() => setSelectedTransaction(t)}
                  className={`
                    group cursor-pointer border-b border-white/[0.02] transition-colors duration-200 animate-new-row
                    hover:bg-blue-600/[0.03]
                    ${t.color === 'red' ? 'bg-red-500/5' : ''}
                    ${t.color === 'orange' ? 'bg-orange-500/5' : ''}
                  `}
                >
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">
                    <span className="group-hover:text-blue-400 transition-colors uppercase">
                      {t.transaction_id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-blue-600/20 group-hover:text-blue-300">
                        {t.sender_id}
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-600" />
                      <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-blue-600/20 group-hover:text-blue-300">
                        {t.receiver_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-bold text-gray-200 group-hover:text-white">
                      {formattedCurrency(t.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <RiskBadge color={t.color} score={t.risk_score} reason={t.fraud_reason} />
                  </td>
                  <td className="px-4 py-4 text-right pr-5 text-[10px] font-medium text-gray-600 font-mono">
                    <div className="flex items-center justify-end gap-2">
                      <span>{getTimeAgo(t.timestamp)}</span>
                      <MousePointer2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
        <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest leading-none">
          Live stream secured • Auto-trim at 100 entries
        </p>
      </div>
    </div>
  );
};

export default TransactionFeed;
