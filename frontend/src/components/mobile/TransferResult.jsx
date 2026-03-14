import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, IndianRupee } from 'lucide-react';

const TransferResult = ({ result, currentAccount, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const isSafe = result.color === 'green';
  const isSuspicious = result.color === 'orange';
  const isFraud = result.color === 'red';

  const config = {
    green: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      title: 'Money Sent!',
      description: 'Your transfer was successful.',
    },
    orange: {
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      title: 'Under Review',
      description: 'Transaction flagged for AI review.',
    },
    red: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      title: 'Blocked',
      description: 'Fraud pattern detected instantly.',
    },
  }[result.color] || config.green;

  const Icon = config.icon;

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] p-8 animate-new-row pt-20 text-center">
      <div className={`w-32 h-32 rounded-full ${config.bg} flex items-center justify-center mx-auto mb-8 animate-bounce`}>
        <Icon size={64} className={config.color} />
      </div>

      <div className="space-y-4 mb-12">
        <h1 className={`text-4xl font-black tracking-tight ${config.color}`}>{config.title}</h1>
        <p className="text-white/40 text-base font-medium leading-relaxed max-w-[280px] mx-auto">
          {isFraud ? `Reason: ${result.fraud_reason}` : config.description}
        </p>
      </div>

      <div className="bg-[#1e293b] rounded-[2.5rem] p-10 border border-white/5 space-y-8 shadow-2xl">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Transaction Amount</span>
          <div className="flex items-center justify-center text-5xl font-black text-white italic tracking-tighter">
            <IndianRupee size={36} className="text-white/20 mr-1" />
            {result.amount.toLocaleString()}
          </div>
        </div>

        <div className="h-px bg-white/5 w-full shrink-0" />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Recipient</span>
            <span className="text-lg font-black text-white uppercase">Acc {result.receiver_id}</span>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Reference</span>
            <span className="text-xs font-mono text-white/40">{result.transaction_id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto py-8">
        <button
          onClick={onDone}
          className="w-full bg-[#1e293b] border border-white/10 active:scale-[0.98] py-5 rounded-2xl font-black text-white tracking-[0.3em] uppercase transition-all mb-4"
        >
          Done
        </button>
        <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest animate-pulse">Auto-returning in 4s...</p>
      </div>
    </div>
  );
};

export default TransferResult;
