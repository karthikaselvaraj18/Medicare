import api from './api';

export const getNotifications = () => api.get('/api/notifications');
export const markRead = (id) => api.put(`/api/notifications/${id}/read`);
export const markAllRead = () => api.put('/api/notifications/read-all');
