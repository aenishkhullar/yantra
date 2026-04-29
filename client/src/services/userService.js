import api from './api.js';

export const getProfile = () =>
  api.get('/user/profile').then(r => r.data);

export const updateDisplayName = (displayName) =>
  api.patch('/user/display-name', { displayName }).then(r => r.data);

export const changePassword = (currentPassword, newPassword) =>
  api.patch('/user/change-password', { currentPassword, newPassword })
    .then(r => r.data);
