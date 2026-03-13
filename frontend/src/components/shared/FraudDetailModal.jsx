import React from 'react';
import { X, ArrowRight, Info, AlertCircle } from 'lucide-react';
import RiskBadge from './RiskBadge';

const FraudDetailModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const getRuleDescription = (reason) => {
    switch (reason) {
      case 'HIGH_VALUE_TRANSFER': return 'Amount exceeds ₹80,000 threshold';
      case 'HIGH_FREQUENCY_BURST': return 'Sender made >4 transactions in 30 seconds';
      case 'ROUND_AMOUNT': return 'Suspiciously round transaction amount';
      case 'CIRCULAR_TRANSACTION': return 'Money returned to original sender — cycle detected';
      default: return 'Anomalous behavior detected by neural engine';
    }
  };

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(transaction.amount);

  const getScoreColor = (score) => {
    if (score < 0.4) return 'bg-green-500';
    if (score < 0.7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-[#111827] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-new-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-gray-400 font-mono text-sm uppercase">#{transaction.transaction_id}</h3>
            <RiskBadge color={transaction.color} score={transaction.risk_score} reason={transaction.fraud_reason} />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Sender</p>
              <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-xl font-bold text-blue-400 border border-blue-500/20">
                {transaction.sender_id}
              </div>
            </div>
            <ArrowRight className="w-8 h-8 text-gray-600 animate-pulse" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Receiver</p>
              <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-xl font-bold text-blue-400 border border-blue-500/20">
                {transaction.receiver_id}
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-1">{formattedAmount}</p>
            <p className="text-xs text-gray-500">{new Date(transaction.timestamp).toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-medium">Neural Risk Score</span>
              <span className={`font-bold ${transaction.color === 'red' ? 'text-red-400' : 'text-gray-300'}`}>
                {Math.round(transaction.risk_score * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getScoreColor(transaction.risk_score)}`}
                style={{ width: `${transaction.risk_score * 100}%` }}
              />
            </div>
          </div>

          {transaction.fraud_reason && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-400 mb-1">{transaction.fraud_reason}</p>
                <p className="text-xs text-red-300/80 leading-relaxed italic">
                   "{getRuleDescription(transaction.fraud_reason)}"
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#1a2035]/50 border-t border-white/5 flex gap-2 overflow-hidden items-center justify-center">
          <Info className="w-3.5 h-3.5 text-gray-500" />
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
            Security logs secured by Sentinel Guardian Protocol
          </p>
        </div>
      </div>
    </div>
  );
};

export default FraudDetailModal;
