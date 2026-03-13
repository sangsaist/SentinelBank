import React from 'react';
import { Activity, AlertCircle, Percent, ShieldCheck, HelpCircle, ShieldAlert } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    red: 'text-red-400 border-red-500/20 bg-red-500/5',
    orange: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
    green: 'text-green-400 border-green-500/20 bg-green-500/5',
  };

  return (
    <div className={`flex flex-col gap-1 p-3 rounded-lg border ${colors[color]} flex-1`}>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/40">
        <span>{label}</span>
        <Icon className="w-3 h-3" />
      </div>
      <span className="text-xl font-bold tracking-tight text-white">{value}</span>
    </div>
  );
};

const StatsBar = () => {
  const stats = useDashboardStore((state) => state.stats);
  const fraudRate = (stats.fraud_rate * 100).toFixed(1) + '%';

  return (
    <div className="flex gap-4 w-full">
      <StatCard label="Total Txns" value={stats.total_transactions} icon={Activity} color="blue" />
      <StatCard label="Fraud" value={stats.total_fraud} icon={AlertCircle} color="red" />
      <StatCard label="Rate" value={fraudRate} icon={Percent} color="orange" />
      <StatCard label="Safe" value={stats.green_count} icon={ShieldCheck} color="green" />
      <StatCard label="Suspicious" value={stats.orange_count} icon={HelpCircle} color="orange" />
      <StatCard label="Flagged" value={stats.red_count} icon={ShieldAlert} color="red" />
    </div>
  );
};

export default StatsBar;
