import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

export const registrarPapeleta = (datos) => api.post('/papeletas', datos);

export const obtenerPapeletas = (fecha) => {
  const params = {};
  if (fecha) params.fecha = fecha;
  return api.get('/papeletas', { params });
};

export const obtenerPapeleta = (id) => api.get(`/papeletas/${id}`);

export const descargarReportePDF = (filtros) => {
  return api.get('/reportes/papeletas-pdf', {
    params: filtros,
    responseType: 'blob'
  });
};

const TIPOS_REPORTE = [
  { id: 'horas-laboradas-recuperar', nombre: 'Horas Laboradas vs Horas por Recuperar', requiereFecha: true },
  { id: 'justificaciones', nombre: 'Justificaciones de Inasistencias', requiereFecha: true },
  { id: 'papeletas-movimiento', nombre: 'Movimiento de Papeletas de Salida', requiereFecha: true },
  { id: 'inasistencias', nombre: 'Reporte de Inasistencias', requiereFecha: true },
  { id: 'marcaciones-consolidado', nombre: 'Marcaciones Consolidado', requiereFecha: true },
  { id: 'tolerancias', nombre: 'Tolerancias y Tardanzas', requiereFecha: true },
  { id: 'control-incidencias', nombre: 'Control de Marcación (Incidencias)', requiereFecha: true },
  { id: 'vacaciones-saldo', nombre: 'Vacaciones y Saldos', requiereFecha: false }
];

export { TIPOS_REPORTE };

export const obtenerReporte = (tipo, filtros) => {
  return api.get(`/v1/reportes/${tipo}`, { params: filtros });
};

export const descargarReporteFormato = (tipo, filtros, formato) => {
  return api.get(`/v1/reportes/${tipo}`, {
    params: { ...filtros, formato },
    responseType: 'blob'
  });
};