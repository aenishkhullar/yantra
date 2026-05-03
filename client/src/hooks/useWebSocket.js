import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export const useWebSocket = () => {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);

  const [prices, setPrices] = useState({});
  const [connected, setConnected] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[WS] Connected to Yantra price feed');
        setConnected(true);
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current);
          reconnectRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PRICE_UPDATE') {
            const data = Array.isArray(msg.data) ? msg.data : [msg.data];
            setPrices((prev) => {
              const next = { ...prev };
              data.forEach((q) => {
                if (q?.symbol) next[q.symbol] = q;
              });
              return next;
            });
            setMarketOpen(msg.marketOpen ?? false);
            setFromCache(msg.fromCache ?? false);
            setLastUpdated(new Date(msg.timestamp));
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      wsRef.current.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        console.log('[WS] Disconnected — retry in 5s');
        reconnectRef.current = setTimeout(connect, 5000);
      };

      wsRef.current.onerror = () => {
        wsRef.current?.close();
      };

    } catch (err) {
      console.error('[WS] Failed to connect:', err);
      reconnectRef.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    prices,
    connected,
    marketOpen,
    fromCache,
    lastUpdated,
  };
};
