import React from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const FraudAlertFeed = () => {
  const alerts = useDashboardStore((state) => state.fraudAlerts);

  const getTimeAgo = (ts) => {
    const s = Math.floor((new Date() - new Date(ts)) / 1000);
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-white/5 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-red-500/20 flex items-center justify-between bg-red-500/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertCircle size={16} className="text-red-500" />
            {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
          </div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-500">Alerts</h2>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[8px] font-black italic">LIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 gap-2 opacity-50">
            <Zap size={24} />
            <p className="text-[10px] font-bold uppercase tracking-widest">No alerts yet</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.alert_id} 
              className={`
                p-4 rounded-lg bg-[#1a2035] border-l-4 animate-new-row transition-all
                ${alert.risk_score >= 0.7 ? 'border-red-500' : 'border-orange-500'}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${alert.risk_score >= 0.7 ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                  {alert.pattern_type}
                </span>
                <span className="text-[10px] text-white/20 font-mono italic">{getTimeAgo(alert.timestamp)}</span>
              </div>
              <p className="text-xs text-white/60 mb-2 leading-relaxed">{alert.reason}</p>
              <div className="flex justify-between items-center text-[9px] font-bold uppercase text-white/20 tracking-widest">
                <span>TXN #{alert.transaction_id.slice(0, 8)}</span>
                <span className={alert.risk_score >= 0.7 ? 'text-red-400' : 'text-orange-400'}>
                  Score: {Math.round(alert.risk_score * 100)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FraudAlertFeed;
