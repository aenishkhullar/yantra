import api from './api.js';

export const getAllPrices = async () => {
  const response = await api.get('/market/prices');
  return response.data;
};

export const getPrice = async (symbol) => {
  const response = await api.get(`/market/price/${symbol}`);
  return response.data;
};

export const getHistory = async (symbol, period = '1mo') => {
  const response = await api.get(`/market/history/${symbol}`, {
    params: { period },
  });
  return response.data;
};
