import api from './api';

export const getDashboard = () => api.get('/api/dashboard');
export const getDeviceStatus = () => api.get('/api/device/status');
