import React, { useState, useEffect } from 'react';
import { IndianRupee, ArrowDownCircle, AlertTriangle } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const IncomingNotification = ({ currentAccountId }) => {
  const transactions = useDashboardStore((state) => state.transactions);
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (transactions.length > 0 && currentAccountId) {
      const latestTx = transactions[0];
      
      // If I am the receiver and it's not blocked (red)
      if (latestTx.receiver_id === currentAccountId && latestTx.color !== 'red') {
        setNotification(latestTx);
        setVisible(true);

        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(() => setNotification(null), 300); // Wait for slide up animation
        }, 4000);

        return () => clearTimeout(timer);
      }
    }
  }, [transactions, currentAccountId]);

  if (!notification) return null;

  const isSuspicious = notification.color === 'orange';

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[9999] p-4 transform transition-transform duration-300 ease-in-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className={`mx-auto max-w-[420px] bg-[#1a2035] border-l-4 rounded-xl shadow-2xl p-4 flex items-center gap-4 ${
        isSuspicious ? 'border-orange-500' : 'border-green-500'
      }`}>
        <div className={`p-2 rounded-full ${isSuspicious ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
          {isSuspicious ? (
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          ) : (
            <ArrowDownCircle className="w-6 h-6 text-green-400" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-white text-sm">
              {isSuspicious ? 'Payment Received (Review)' : 'Money Received!'}
            </h3>
            <span className="text-[10px] text-white/40 font-bold uppercase">Just now</span>
          </div>
          <p className="text-xs text-white/60 mb-1">From: Account {notification.sender_id}</p>
          <div className="flex items-center text-lg font-black text-white italic">
            <IndianRupee size={16} />
            {notification.amount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingNotification;
