import api from './api.js';

export const placeBuyOrder = async (payload) => {
  const res = await api.post('/orders/buy', payload);
  return res.data;
};

export const placeSellOrder = async (payload) => {
  const res = await api.post('/orders/sell', payload);
  return res.data;
};

export const getOrderHistory = async () => {
  const res = await api.get('/orders/history');
  return res.data;
};

export const getPositions = async () => {
  const res = await api.get('/orders/positions');
  return res.data;
};

export const closePosition = async (positionId) => {
  const res = await api.post(`/orders/close/${positionId}`);
  return res.data;
};

export const getPendingOrders = async () => {
  const res = await api.get('/orders/pending');
  return res.data;
};

export const cancelOrder = async (orderId) => {
  const res = await api.patch(`/orders/cancel/${orderId}`);
  return res.data;
};
