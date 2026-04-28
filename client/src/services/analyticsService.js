import api from './api.js';

export const getAnalyticsSummary = () =>
  api.get('/analytics/summary').then(r => r.data);

export const getPortfolioHistory = () =>
  api.get('/analytics/portfolio-history').then(r => r.data);

export const getTradeBreakdown = () =>
  api.get('/analytics/breakdown').then(r => r.data);
