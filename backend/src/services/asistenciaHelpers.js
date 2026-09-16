import pool from '../config/db.js';

export async function obtenerFeriados(fechaInicio, fechaFin) {
  const [rows] = await pool.query(
    `SELECT id, fecha, descripcion, es_recurrente
     FROM feriados
     WHERE (fecha BETWEEN ? AND ?) OR es_recurrente = 1`,
    [fechaInicio, fechaFin]
  );
  return rows;
}

export async function obtenerAsignaciones(fechaInicio, fechaFin, empleadoId = null) {
  const params = [];
  let sql = `
    SELECT a.id, a.empleado_id, a.horario_id, a.fecha_inicio, a.fecha_fin, h.*
    FROM asignacion_horarios a
    JOIN horarios h ON h.id = a.horario_id
    WHERE a.fecha_inicio <= ? AND (a.fecha_fin IS NULL OR a.fecha_fin >= ?)`;
  params.push(fechaFin, fechaInicio);
  if (empleadoId) {
    sql += ' AND a.empleado_id = ?';
    params.push(empleadoId);
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function obtenerMarcacionesRango(fechaInicio, fechaFin, empleadoId = null, areaId = null, sedeId = null, tipo = null) {
  const params = [];
  let sql = `
    SELECT m.id, m.empleado_id, m.timestamp, m.tipo, m.origen_biometrico_id,
           e.nombres, e.apellidos, e.documento_identidad, e.area_id, e.sede_id,
           a.nombre AS area_nombre, s.nombre AS sede_nombre,
           ob.nombre AS origen_nombre
    FROM marcaciones m
    JOIN empleados e ON e.id = m.empleado_id
    LEFT JOIN areas a ON a.id = e.area_id
    LEFT JOIN sedes s ON s.id = e.sede_id
    LEFT JOIN origenes_biometricos ob ON ob.id = m.origen_biometrico_id
    WHERE m.timestamp >= ? AND m.timestamp < DATE_ADD(?, INTERVAL 1 DAY)`;
  params.push(fechaInicio + ' 00:00:00', fechaFin);
  if (empleadoId) {
    sql += ' AND m.empleado_id = ?';
    params.push(empleadoId);
  }
  if (areaId) {
    sql += ' AND e.area_id = ?';
    params.push(areaId);
  }
  if (sedeId) {
    sql += ' AND e.sede_id = ?';
    params.push(sedeId);
  }
  if (tipo) {
    sql += ' AND m.tipo = ?';
    params.push(tipo);
  }
  sql += ' ORDER BY m.empleado_id, m.timestamp';
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function obtenerEmpleados(areaId = null, sedeId = null) {
  const params = [];
  let sql = `
    SELECT e.id, e.documento_identidad, e.nombres, e.apellidos, e.regimen_laboral,
           e.area_id, e.sede_id, e.estado,
           a.nombre AS area_nombre, s.nombre AS sede_nombre
    FROM empleados e
    LEFT JOIN areas a ON a.id = e.area_id
    LEFT JOIN sedes s ON s.id = e.sede_id
    WHERE 1=1`;
  if (areaId) {
    sql += ' AND e.area_id = ?';
    params.push(areaId);
  }
  if (sedeId) {
    sql += ' AND e.sede_id = ?';
    params.push(sedeId);
  }
  sql += ' ORDER BY e.apellidos, e.nombres';
  const [rows] = await pool.query(sql, params);
  return rows;
}

export function asignacionParaFecha(asignaciones, empleadoId, fechaStr) {
  return asignaciones.find((a) =>
    a.empleado_id === empleadoId &&
    a.fecha_inicio <= fechaStr &&
    (!a.fecha_fin || a.fecha_fin >= fechaStr)
  );
}

export function esDiaLaboralPara(asignacion, fechaStr, feriados) {
  if (!asignacion) return false;
  const dia = new Date(fechaStr + 'T00:00:00').getDay();
  const mapa = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  if (!asignacion[mapa[dia]]) return false;
  const esFeriado = feriados.some((f) => {
    const fk = String(f.fecha).slice(0, 10);
    if (f.es_recurrente) {
      const mmdd = fk.split('-').slice(1).join('-');
      return mmdd === fechaStr.slice(5);
    }
    return fk === fechaStr;
  });
  return !esFeriado;
}

export function nombreCompleto(e) {
  return `${e.nombres} ${e.apellidos}`.trim();
}

export function aplicarPaginacionSQL(sql, filtros) {
  return `${sql} LIMIT ${Number(filtros.limit)} OFFSET ${Number(filtros.offset)}`;
}

export function wrapForCount(sql) {
  return `SELECT COUNT(*) AS total FROM (${sql}) AS sub`;
}