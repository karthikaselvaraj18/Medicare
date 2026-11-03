import api from './api';

export const getMedicines = () => api.get('/api/medicines');
export const createMedicine = (data) => api.post('/api/medicines', data);
export const updateMedicine = (id, data) => api.put(`/api/medicines/${id}`, data);
export const deleteMedicine = (id) => api.delete(`/api/medicines/${id}`);
