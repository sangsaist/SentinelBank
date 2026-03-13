import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getAccounts = async () => {
  const response = await api.get('/accounts');
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get('/transactions');
  return response.data;
};

export const getFraudAlerts = async () => {
  const response = await api.get('/fraud-alerts');
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const getEngineStatus = async () => {
  const response = await api.get('/engine/status');
  return response.data;
};

export const startEngine = async () => {
  const response = await api.post('/engine/start');
  return response.data;
};

export const stopEngine = async () => {
  const response = await api.post('/engine/stop');
  return response.data;
};

export const pauseEngine = async () => {
  const response = await api.post('/engine/pause');
  return response.data;
};

export const resumeEngine = async () => {
  const response = await api.post('/engine/resume');
  return response.data;
};

export const sendTransaction = async (sender_id, receiver_id, amount) => {
  const response = await api.post('/transaction', {
    sender_id,
    receiver_id,
    amount: parseFloat(amount)
  });
  return response.data;
};

export default api;
