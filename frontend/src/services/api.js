import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

export const registrarPapeleta = (datos) => api.post('/papeletas', datos);

export const obtenerPapeletas = () => api.get('/papeletas');

export const obtenerPapeleta = (id) => api.get(`/papeletas/${id}`);

export const descargarReportePDF = (filtros) => {
  return api.get('/reportes/papeletas-pdf', {
    params: filtros,
    responseType: 'blob'
  });
};