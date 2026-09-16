import {
  obtenerFeriados,
  obtenerAsignaciones,
  obtenerMarcacionesRango,
  obtenerEmpleados,
  asignacionParaFecha,
  esDiaLaboralPara,
  nombreCompleto
} from './asistenciaHelpers.js';
import { normalizarPaginacion } from '../utils/paginationUtils.js';
import { generarDiasEnRango, formatearTimestamp } from '../utils/dateUtils.js';

export const TITULO = 'REPORTE DE CONTROL DE MARCAcION (INCIDENCIAS)';
export const COLUMNAS = [
  { header: 'Tipo Incidencia', key: 'tipo_incidencia', width: 22, align: 'left' },
  { header: 'Documento', key: 'documento_identidad', width: 16, align: 'left' },
  { header: 'Empleado', key: 'empleado', width: 26, align: 'left' },
  { header: 'Fecha', key: 'fecha', width: 14, align: 'left' },
  { header: 'Detalle', key: 'detalle', width: 55, align: 'left' }
];

export async function getControlIncidencias(filtros) {
  const { limit, offset } = normalizarPaginacion(filtros.limit, filtros.offset);
  const fechaInicio = filtros.fecha_inicio;
  const fechaFin = filtros.fecha_fin;
  const debouncingSegundos = Number(process.env.DEBOUNCING_SEGUNDOS) || 30;

  const [empleados, feriados, asignaciones, marcaciones] = await Promise.all([
    obtenerEmpleados(filtros.area_id, filtros.sede_id),
    obtenerFeriados(fechaInicio, fechaFin),
    obtenerAsignaciones(fechaInicio, fechaFin, filtros.empleado_id || null),
    obtenerMarcacionesRango(fechaInicio, fechaFin, filtros.empleado_id || null, filtros.area_id, filtros.sede_id)
  ]);

  const empleadosFiltrados = filtros.empleado_id
    ? empleados.filter((e) => e.id === Number(filtros.empleado_id))
    : empleados;

  const marcacionesFiltradas = marcaciones.filter((m) =>
    empleadosFiltrados.some((e) => e.id === m.empleado_id)
  );

  const filas = [];
  const marcasPorEmpDia = new Map();

  for (const m of marcacionesFiltradas) {
    const fecha = String(m.timestamp).slice(0, 10);
    const key = `${m.empleado_id}|${fecha}`;
    if (!marcasPorEmpDia.has(key)) marcasPorEmpDia.set(key, []);
    marcasPorEmpDia.get(key).push(m);
  }

  const marcasOrdenadas = [...marcacionesFiltradas].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  for (let i = 0; i < marcasOrdenadas.length; i++) {
    const actual = marcasOrdenadas[i];
    const anterior = i > 0 ? marcasOrdenadas[i - 1] : null;
    if (
      anterior &&
      anterior.empleado_id === actual.empleado_id &&
      anterior.tipo === actual.tipo &&
      (new Date(actual.timestamp) - new Date(anterior.timestamp)) / 1000 <= debouncingSegundos
    ) {
      filas.push({
        tipo_incidencia: 'MARCA_DUPLICADA',
        documento_identidad: actual.documento_identidad,
        empleado: nombreCompleto(actual),
        fecha: String(actual.timestamp).slice(0, 10),
        detalle: `Marca "${actual.tipo}" a las ${formatearTimestamp(actual.timestamp)} se repite a ${debouncingSegundos}s de la marca de ${formatearTimestamp(anterior.timestamp)}`
      });
    }
  }

  for (const [key, marcas] of marcasPorEmpDia) {
    const [empId, fecha] = key.split('|');
    const empleado = empleadosFiltrados.find((e) => e.id === Number(empId));
    if (!empleado) continue;

    const asignacion = asignacionParaFecha(asignaciones, Number(empId), fecha);
    const esLaboral = esDiaLaboralPara(asignacion, fecha, feriados);

    if (!esLaboral) {
      for (const m of marcas) {
        filas.push({
          tipo_incidencia: 'MARCA_FUERA_TURNO',
          documento_identidad: empleado.documento_identidad,
          empleado: nombreCompleto(empleado),
          fecha,
          detalle: `Marca "${m.tipo}" en día no laboral a las ${formatearTimestamp(m.timestamp)}${asignacion ? '' : ' sin turno asignado'}`
        });
      }
      continue;
    }

    const tieneEntrada = marcas.some((m) => m.tipo === 'ENTRADA');
    const tieneSalida = marcas.some((m) => m.tipo === 'SALIDA');

    if (tieneEntrada && !tieneSalida) {
      filas.push({
        tipo_incidencia: 'ENTRADA_SIN_SALIDA',
        documento_identidad: empleado.documento_identidad,
        empleado: nombreCompleto(empleado),
        fecha,
        detalle: 'Marcó entrada pero no registró salida'
      });
    }
    if (tieneSalida && !tieneEntrada) {
      filas.push({
        tipo_incidencia: 'SALIDA_SIN_ENTRADA',
        documento_identidad: empleado.documento_identidad,
        empleado: nombreCompleto(empleado),
        fecha,
        detalle: 'Marcó salida pero no registró entrada'
      });
    }
  }

  const total = filas.length;
  return { data: filas.slice(offset, offset + limit), total };
}