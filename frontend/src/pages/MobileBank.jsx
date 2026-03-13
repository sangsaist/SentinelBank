import React, { useState, useEffect } from 'react';
import useDashboardStore from '../store/useDashboardStore';
import * as api from '../api/api';
import useWebSocket from '../hooks/useWebSocket';

import AccountPicker from '../components/mobile/AccountPicker';
import TransferForm from '../components/mobile/TransferForm';
import TransferResult from '../components/mobile/TransferResult';
import IncomingNotification from '../components/mobile/IncomingNotification';

const MobileBank = () => {
  const { connected } = useWebSocket();
  const accounts = useDashboardStore((state) => state.accounts);
  const transactions = useDashboardStore((state) => state.transactions);
  const setAccounts = useDashboardStore((state) => state.setAccounts);
  const fetchInitialData = useDashboardStore((state) => state.fetchInitialData);

  const [screen, setScreen] = useState('pick'); // 'pick', 'home', 'result'
  const [currentAccount, setCurrentAccount] = useState(null);
  const [transferResult, setTransferResult] = useState(null);

  useEffect(() => {
    // Fetch accounts on mount
    const loadAccounts = async () => {
      try {
        const data = await api.getAccounts();
        setAccounts(data);
      } catch (e) { console.error(e); }
    };
    loadAccounts();
    
    // Also fetch initial global data for transactions feed etc
    fetchInitialData(api);
  }, [setAccounts, fetchInitialData]);

  const handleAccountSelect = (acc) => {
    setCurrentAccount(acc);
    setScreen('home');
  };

  const handleTransferResult = (res) => {
    setTransferResult(res);
    setScreen('result');
    // Also refresh accounts list to update balances after a few seconds
    setTimeout(async () => {
      try {
        const data = await api.getAccounts();
        setAccounts(data);
        // Also update our currentAccount balance from the new list
        const updated = data.find(a => a.account_id === currentAccount.account_id);
        if (updated) setCurrentAccount(updated);
      } catch (e) { console.error(e); }
    }, 2000);
  };

  return (
    <div className="bg-[#0f172a] min-h-screen font-sans selection:bg-blue-600/30 overflow-x-hidden">
      <div className="max-w-[420px] mx-auto min-h-screen relative shadow-2xl shadow-black/50 overflow-hidden">
        
        {/* Real-time System Alert Overlay */}
        {!connected && (
          <div className="fixed top-0 inset-x-0 z-[10000] bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] text-center py-1.5 flex items-center justify-center gap-2 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            Connection Interrupted — Reconnecting...
          </div>
        )}

        {/* Global Components */}
        {currentAccount && <IncomingNotification currentAccountId={currentAccount.account_id} />}

        {/* Screens */}
        {screen === 'pick' && (
          <AccountPicker 
            accounts={accounts} 
            onSelect={handleAccountSelect} 
          />
        )}
        
        {screen === 'home' && currentAccount && (
          <TransferForm 
            currentAccount={currentAccount}
            accounts={accounts}
            transactions={transactions}
            onResult={handleTransferResult}
            onSwitchAccount={() => setScreen('pick')}
          />
        )}

        {screen === 'result' && transferResult && (
          <TransferResult 
            result={transferResult} 
            currentAccount={currentAccount}
            onDone={() => setScreen('home')} 
          />
        )}
      </div>

      {/* Background Decor */}
      <div className="fixed -z-10 top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed -z-10 bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

export default MobileBank;
