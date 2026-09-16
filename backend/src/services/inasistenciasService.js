import pool from '../config/db.js';
import {
  obtenerFeriados,
  obtenerAsignaciones,
  obtenerMarcacionesRango,
  obtenerEmpleados,
  asignacionParaFecha,
  esDiaLaboralPara,
  nombreCompleto
} from './asistenciaHelpers.js';
import { generarDiasEnRango } from '../utils/dateUtils.js';
import { normalizarPaginacion } from '../utils/paginationUtils.js';

export const TITULO = 'REPORTE DE INASISTENCIAS';
export const COLUMNAS = [
  { header: 'Documento', key: 'documento_identidad', width: 16, align: 'left' },
  { header: 'Empleado', key: 'empleado', width: 26, align: 'left' },
  { header: 'Área', key: 'area', width: 16, align: 'left' },
  { header: 'Días No Justificados', key: 'dias_no_justificados', width: 18, align: 'right', tipo: 'entero' },
  { header: 'Días Justificados', key: 'dias_justificados', width: 16, align: 'right', tipo: 'entero' },
  { header: 'Días Vacaciones', key: 'dias_vacaciones', width: 15, align: 'right', tipo: 'entero' },
  { header: 'Primeras Fechas', key: 'fechas', width: 36, align: 'left' }
];

export async function getInasistencias(filtros) {
  const { limit, offset } = normalizarPaginacion(filtros.limit, filtros.offset);
  const fechaInicio = filtros.fecha_inicio;
  const fechaFin = filtros.fecha_fin;

  const [empleados, feriados, asignaciones, marcaciones] = await Promise.all([
    obtenerEmpleados(filtros.area_id, filtros.sede_id),
    obtenerFeriados(fechaInicio, fechaFin),
    obtenerAsignaciones(fechaInicio, fechaFin, filtros.empleado_id || null),
    obtenerMarcacionesRango(fechaInicio, fechaFin, filtros.empleado_id || null, filtros.area_id, filtros.sede_id)
  ]);

  const empleadosFiltrados = filtros.empleado_id
    ? empleados.filter((e) => e.id === Number(filtros.empleado_id))
    : empleados;

  const diasConMarca = new Set();
  for (const m of marcaciones) {
    diasConMarca.add(`${m.empleado_id}|${String(m.timestamp).slice(0, 10)}`);
  }

  const paramsEmp = [];
  let empCond = '';
  if (filtros.empleado_id) {
    empCond = ' AND empleado_id = ?';
    paramsEmp.push(filtros.empleado_id);
  } else if (filtros.area_id) {
    empCond = ' AND empleado_id IN (SELECT id FROM empleados WHERE area_id = ?)';
    paramsEmp.push(filtros.area_id);
  }

  const [justificacionesAprobadas] = await pool.query(
    `SELECT empleado_id, fecha_inicio, fecha_fin
     FROM justificaciones
     WHERE estado = 'APROBADO'
       AND fecha_inicio <= ? AND fecha_fin >= ?${empCond}`,
    [fechaFin, fechaInicio, ...paramsEmp]
  );

  const justUtiles = justificacionesAprobadas;

  const [vacaciones] = await pool.query(
    `SELECT empleado_id, fecha_inicio, fecha_fin
     FROM vacaciones
     WHERE estado IN ('GOZADO', 'PROGRAMADO')
       AND fecha_inicio <= ? AND fecha_fin >= ?`,
    [fechaFin, fechaInicio]
  );

  const vacacionesUsadas = vacaciones.filter((v) =>
    !filtros.area_id || empleadosFiltrados.some((e) => e.id === v.empleado_id)
  );

  const dias = generarDiasEnRango(fechaInicio, fechaFin);
  const filas = [];

  for (const empleado of empleadosFiltrados) {
    let noJust = 0;
    let just = 0;
    let vac = 0;
    const fechasList = [];

    const justEmp = justUtiles.filter((j) => j.empleado_id === empleado.id);
    const vacEmp = vacacionesUsadas.filter((v) => v.empleado_id === empleado.id);

    for (const fechaStr of dias) {
      const asignacion = asignacionParaFecha(asignaciones, empleado.id, fechaStr);
      if (!esDiaLaboralPara(asignacion, fechaStr, feriados)) continue;

      if (diasConMarca.has(`${empleado.id}|${fechaStr}`)) continue;

      const cubreJustificacion = justEmp.some((j) => String(j.fecha_inicio).slice(0, 10) <= fechaStr && String(j.fecha_fin).slice(0, 10) >= fechaStr);
      const cubreVacaciones = vacEmp.some((v) => String(v.fecha_inicio).slice(0, 10) <= fechaStr && String(v.fecha_fin).slice(0, 10) >= fechaStr);

      if (cubreJustificacion) {
        just++;
        continue;
      }
      if (cubreVacaciones) {
        vac++;
        continue;
      }

      noJust++;
      if (fechasList.length < 5) fechasList.push(fechaStr);
    }

    filas.push({
      documento_identidad: empleado.documento_identidad,
      empleado: nombreCompleto(empleado),
      area: empleado.area_nombre || '-',
      dias_no_justificados: noJust,
      dias_justificados: just,
      dias_vacaciones: vac,
      fechas: fechasList.join(', ')
    });
  }

  const total = filas.length;
  const paginadas = filas.slice(offset, offset + limit);
  return { data: paginadas, total };
}