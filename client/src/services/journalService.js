import api from './api.js';

export const getJournalEntries = () =>
  api.get('/journal').then(r => r.data);

export const getJournalStats = () =>
  api.get('/journal/stats').then(r => r.data);

export const createJournalEntry = (payload) =>
  api.post('/journal', payload).then(r => r.data);

export const createFromOrder = (orderId) =>
  api.post(`/journal/from-order/${orderId}`).then(r => r.data);

export const updateJournalEntry = (id, payload) =>
  api.patch(`/journal/${id}`, payload).then(r => r.data);

export const deleteJournalEntry = (id) =>
  api.delete(`/journal/${id}`).then(r => r.data);
