import React from 'react';
import { Activity, AlertOctagon, Percent, ShieldCheck, HelpCircle, ShieldAlert } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const StatCard = ({ label, value, icon: Icon, color, subValue }) => {
  const colorMap = {
    blue: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
    red: 'border-red-500/30 text-red-400 bg-red-500/5',
    orange: 'border-orange-500/30 text-orange-400 bg-orange-500/5',
    green: 'border-green-500/30 text-green-400 bg-green-500/5',
  };

  return (
    <div className={`flex flex-col gap-1 p-3 rounded-xl border ${colorMap[color]} transition-all duration-300 hover:bg-white/5 group relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">{label}</span>
        <Icon className="w-3 h-3 text-gray-500" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-mono font-bold tracking-tight text-white">{value}</span>
        {subValue && <span className="text-[10px] font-medium opacity-60">({subValue})</span>}
      </div>
    </div>
  );
};

const StatsBar = () => {
  const stats = useDashboardStore((state) => state.stats);

  const fraudRate = (stats.fraud_rate * 100).toFixed(2) + '%';

  return (
    <div className="grid grid-cols-6 gap-3 w-full">
      <StatCard 
        label="Total Txns" 
        value={stats.total_transactions.toLocaleString()} 
        icon={Activity} 
        color="blue" 
      />
      <StatCard 
        label="Fraud Detected" 
        value={stats.total_fraud.toLocaleString()} 
        icon={AlertOctagon} 
        color="red" 
      />
      <StatCard 
        label="Fraud Rate" 
        value={fraudRate} 
        icon={Percent} 
        color="orange" 
      />
      <StatCard 
        label="Safe" 
        value={stats.green_count.toLocaleString()} 
        icon={ShieldCheck} 
        color="green" 
      />
      <StatCard 
        label="Suspicious" 
        value={stats.orange_count.toLocaleString()} 
        icon={HelpCircle} 
        color="orange" 
      />
      <StatCard 
        label="Fraud" 
        value={stats.red_count.toLocaleString()} 
        icon={ShieldAlert} 
        color="red" 
      />
    </div>
  );
};

export default StatsBar;
