import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  transactions: [],
  fraudAlerts: [],
  engineStatus: { status: "stopped", rate: 60, count: 0 },
  stats: {
    total_transactions: 0,
    total_fraud: 0,
    fraud_rate: 0,
    green_count: 0,
    orange_count: 0,
    red_count: 0
  },
  accounts: [],
  lastTransferResult: null,

  addTransaction: (txn) => set((state) => {
    if (state.transactions.some(t => t.transaction_id === txn.transaction_id)) return state;
    return { transactions: [txn, ...state.transactions].slice(0, 100) };
  }),

  addFraudAlert: (alert) => set((state) => {
    if (state.fraudAlerts.some(a => a.alert_id === alert.alert_id)) return state;
    return { fraudAlerts: [alert, ...state.fraudAlerts].slice(0, 50) };
  }),

  setEngineStatus: (status) => set({ engineStatus: status }),

  setStats: (stats) => set({ stats }),

  setAccounts: (accounts) => set({ accounts }),

  setLastTransferResult: (result) => set({ lastTransferResult: result }),

  fetchInitialData: async (api) => {
    try {
      const [accounts, txns, alerts, stats, status] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getFraudAlerts(),
        api.getStats(),
        api.getEngineStatus()
      ]);
      set({
        accounts,
        transactions: txns,
        fraudAlerts: alerts,
        stats,
        engineStatus: status
      });
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  }
}));

export default useDashboardStore;
