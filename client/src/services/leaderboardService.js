import api from './api.js';

export const getLeaderboard = (period = 'all') =>
  api.get(`/leaderboard?period=${period}`).then(r => r.data);

export const getMyRank = (period = 'all') =>
  api.get(`/leaderboard/my-rank?period=${period}`).then(r => r.data);
