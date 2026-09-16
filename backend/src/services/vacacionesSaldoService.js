import pool from '../config/db.js';
import { obtenerEmpleados, nombreCompleto } from './asistenciaHelpers.js';
import { normalizarPaginacion } from '../utils/paginationUtils.js';

export const TITULO = 'REPORTE DE VACACIONES Y SALDOS';
export const COLUMNAS = [
  { header: 'Documento', key: 'documento_identidad', width: 16, align: 'left' },
  { header: 'Empleado', key: 'empleado', width: 26, align: 'left' },
  { header: 'Área', key: 'area', width: 16, align: 'left' },
  { header: 'Período', key: 'periodo_anio', width: 10, align: 'right', tipo: 'entero' },
  { header: 'Días Correspondientes', key: 'dias_correspondientes', width: 20, align: 'right', tipo: 'entero' },
  { header: 'Días Gozados', key: 'dias_gozados', width: 13, align: 'right', tipo: 'entero' },
  { header: 'Días Programados', key: 'dias_programados', width: 15, align: 'right', tipo: 'entero' },
  { header: 'Saldo Pendiente', key: 'saldo_pendiente', width: 15, align: 'right', tipo: 'entero' }
];

export async function getVacacionesSaldo(filtros) {
  const { limit, offset } = normalizarPaginacion(filtros.limit, filtros.offset);
  const periodo = Number(filtros.periodo_anio) || new Date().getFullYear();
  const diasPorAnio = Number(process.env.VACACIONES_DIAS_POR_ANIO) || 30;

  const empleados = await obtenerEmpleados(filtros.area_id, filtros.sede_id);
  const empleadosFiltrados = filtros.empleado_id
    ? empleados.filter((e) => e.id === Number(filtros.empleado_id))
    : empleados;

  if (empleadosFiltrados.length === 0) {
    return { data: [], total: 0 };
  }

  const ids = empleadosFiltrados.map((e) => e.id);
  const placeholders = ids.map(() => '?').join(',');
  const params = [];
  params.push(...ids, periodo);

  const [vacacionesRows] = await pool.query(
    `SELECT empleado_id, estado, SUM(dias_efectivos) AS total_dias
     FROM vacaciones
     WHERE empleado_id IN (${placeholders}) AND periodo_anio = ?
     GROUP BY empleado_id, estado`,
    params
  );

  const diasPorEstado = new Map();
  for (const v of vacacionesRows) {
    const key = `${v.empleado_id}|${v.estado}`;
    diasPorEstado.set(key, Number(v.total_dias) || 0);
  }

  const filas = empleadosFiltrados.map((empleado) => {
    const gozados = diasPorEstado.get(`${empleado.id}|GOZADO`) || 0;
    const programados = diasPorEstado.get(`${empleado.id}|PROGRAMADO`) || 0;
    const pendientes = diasPorEstado.get(`${empleado.id}|PENDIENTE`) || 0;
    const gozadosTotales = gozados + programados;

    return {
      documento_identidad: empleado.documento_identidad,
      empleado: nombreCompleto(empleado),
      area: empleado.area_nombre || '-',
      periodo_anio: periodo,
      dias_correspondientes: diasPorAnio,
      dias_gozados: gozadosTotales,
      dias_programados: programados,
      saldo_pendiente: Math.max(0, diasPorAnio - gozadosTotales)
    };
  });

  const total = filas.length;
  return { data: filas.slice(offset, offset + limit), total };
}