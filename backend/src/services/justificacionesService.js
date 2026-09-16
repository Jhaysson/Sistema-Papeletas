import pool from '../config/db.js';
import { normalizarPaginacion } from '../utils/paginationUtils.js';

export const TITULO = 'REPORTE DE JUSTIFICACIONES DE INASISTENCIAS';
export const COLUMNAS = [
  { header: 'Documento', key: 'documento_identidad', width: 16, align: 'left' },
  { header: 'Empleado', key: 'empleado', width: 26, align: 'left' },
  { header: 'Área', key: 'area', width: 16, align: 'left' },
  { header: 'Tipo', key: 'tipo', width: 18, align: 'left' },
  { header: 'Fecha Inicio', key: 'fecha_inicio', width: 16, align: 'left' },
  { header: 'Fecha Fin', key: 'fecha_fin', width: 16, align: 'left' },
  { header: 'Descripción', key: 'descripcion', width: 32, align: 'left' },
  { header: 'Estado', key: 'estado', width: 12, align: 'left' }
];

export async function getJustificaciones(filtros) {
  const { limit, offset } = normalizarPaginacion(filtros.limit, filtros.offset);
  const params = [];
  let where = 'WHERE 1=1';

  if (filtros.fecha_inicio && filtros.fecha_fin) {
    where += ' AND j.fecha_inicio <= ? AND j.fecha_fin >= ?';
    params.push(filtros.fecha_fin, filtros.fecha_inicio);
  }
  if (filtros.empleado_id) {
    where += ' AND j.empleado_id = ?';
    params.push(filtros.empleado_id);
  }
  if (filtros.area_id) {
    where += ' AND e.area_id = ?';
    params.push(filtros.area_id);
  }
  if (filtros.estado) {
    where += ' AND j.estado = ?';
    params.push(filtros.estado.toUpperCase());
  }

  const base = `
    SELECT j.id, j.fecha_inicio, j.fecha_fin, j.descripcion, j.adjunto_url, j.estado,
           e.documento_identidad, e.nombres, e.apellidos, e.area_id, e.sede_id,
           a.nombre AS area_nombre, tj.nombre AS tipo_nombre
    FROM justificaciones j
    JOIN empleados e ON e.id = j.empleado_id
    LEFT JOIN areas a ON a.id = e.area_id
    LEFT JOIN tipo_justificacion tj ON tj.id = j.tipo_justificacion_id
    ${where}
    ORDER BY j.fecha_inicio DESC`;

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM justificaciones j JOIN empleados e ON e.id = j.empleado_id ${where}`, params);
  const total = countRows[0].total;

  const sql = `${base} LIMIT ${limit} OFFSET ${offset}`;
  const [rows] = await pool.query(sql, params);

  const data = rows.map((r) => ({
    id: r.id,
    documento_identidad: r.documento_identidad,
    empleado: `${r.nombres} ${r.apellidos}`.trim(),
    area: r.area_nombre || '-',
    tipo: r.tipo_nombre || '-',
    fecha_inicio: String(r.fecha_inicio).slice(0, 10),
    fecha_fin: String(r.fecha_fin).slice(0, 10),
    descripcion: r.descripcion || '',
    adjunto_url: r.adjunto_url || '',
    estado: r.estado
  }));

  return { data, total };
}