import { useEffect, useRef, useState } from 'react';
import useDashboardStore from '../store/useDashboardStore';

const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const store = useDashboardStore();

  const connect = () => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;

        switch (type) {
          case 'transaction':
            store.addTransaction(data);
            break;
          case 'fraud_alert':
            store.addFraudAlert(data);
            break;
          case 'engine_status':
            store.setEngineStatus(data);
            break;
          default:
            console.warn('Unknown message type:', type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error', error);
      socket.close();
    };

    socketRef.current = socket;
  };

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return { connected };
};

export default useWebSocket;
