import { createContext, useContext } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const MarketContext = createContext(null);

export const MarketProvider = ({ children }) => {
  const {
    prices,
    connected,
    marketOpen,
    fromCache,
    lastUpdated,
  } = useWebSocket();

  const getPrice = (symbol) =>
    symbol ? prices[symbol.toUpperCase()] || null : null;

  const getAllPrices = () => Object.values(prices);

  return (
    <MarketContext.Provider value={{
      prices,
      connected,
      marketOpen,
      fromCache,
      lastUpdated,
      getPrice,
      getAllPrices,
    }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => useContext(MarketContext);
