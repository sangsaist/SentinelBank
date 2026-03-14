import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const RiskBadge = ({ color, score, reason }) => {
  const config = {
    green: {
      bg: 'bg-green-900/40',
      text: 'text-green-400',
      border: 'border-green-500/30',
      label: 'SAFE',
      icon: CheckCircle2
    },
    orange: {
      bg: 'bg-orange-900/40',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      label: 'SUSPICIOUS',
      icon: AlertTriangle
    },
    red: {
      bg: 'bg-red-900/40',
      text: 'text-red-400',
      border: 'border-red-500/30',
      label: 'FRAUD',
      icon: XCircle
    }
  }[color] || config.green;

  const Icon = config.icon;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.bg} ${config.text} ${config.border} transition-all duration-200 group relative cursor-help`}
      title={reason}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-bold tracking-wider">{config.label}</span>
      <span className="text-[10px] font-mono opacity-80 border-l border-current pl-1.5 ml-0.5">
        {Math.round(score * 100)}%
      </span>
    </div>
  );
};

export default RiskBadge;
