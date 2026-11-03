import api from './api';

export const getSettings = () => api.get('/api/settings');
export const updateSettings = (data) => api.put('/api/settings', data);
export const testTelegram = () => api.post('/api/telegram/test');
