import pool from '../config/db.js';
import { normalizarPaginacion } from '../utils/paginationUtils.js';

export const TITULO = 'REPORTE DE MOVIMIENTO DE PAPELETAS DE SALIDA';
export const COLUMNAS = [
  { header: 'Documento', key: 'documento_identidad', width: 16, align: 'left' },
  { header: 'Empleado', key: 'empleado', width: 26, align: 'left' },
  { header: 'Área', key: 'area', width: 16, align: 'left' },
  { header: 'Fecha', key: 'fecha', width: 14, align: 'left' },
  { header: 'Hora Salida', key: 'hora_salida', width: 12, align: 'left' },
  { header: 'Hora Retorno', key: 'hora_retorno', width: 13, align: 'left' },
  { header: 'Tipo', key: 'tipo', width: 14, align: 'left' },
  { header: 'Motivo', key: 'motivo_texto', width: 28, align: 'left' },
  { header: 'Estado', key: 'estado', width: 12, align: 'left' }
];

export async function getPapeletasMovimiento(filtros) {
  const { limit, offset } = normalizarPaginacion(filtros.limit, filtros.offset);
  const params = [];
  let where = 'WHERE 1=1';

  if (filtros.fecha_inicio && filtros.fecha_fin) {
    where += ' AND p.fecha BETWEEN ? AND ?';
    params.push(filtros.fecha_inicio, filtros.fecha_fin);
  }
  if (filtros.empleado_id) {
    where += ' AND p.empleado_id = ?';
    params.push(filtros.empleado_id);
  }
  if (filtros.area_id) {
    where += ' AND e.area_id = ?';
    params.push(filtros.area_id);
  }
  if (filtros.tipo) {
    where += ' AND p.tipo = ?';
    params.push(filtros.tipo.toUpperCase());
  }
  if (filtros.estado) {
    where += ' AND p.estado = ?';
    params.push(filtros.estado.toUpperCase());
  }

  const whereEmpleado = `${where} AND e.id = p.empleado_id`;
  const countWhere = `FROM papeletas_salida p JOIN empleados e ON e.id = p.empleado_id ${whereEmpleado}`;
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${countWhere}`, params);
  const total = countRows[0].total;

  const sql = `
    SELECT p.id, p.fecha, p.hora_salida, p.hora_retorno, p.tipo, p.motivo_texto, p.estado,
           e.documento_identidad, e.nombres, e.apellidos, e.area_id,
           a.nombre AS area_nombre
    FROM papeletas_salida p
    JOIN empleados e ON e.id = p.empleado_id
    LEFT JOIN areas a ON a.id = e.area_id
    ${whereEmpleado}
    ORDER BY p.fecha DESC, p.empleado_id
    LIMIT ${limit} OFFSET ${offset}`;
  const [rows] = await pool.query(sql, params);

  const data = rows.map((r) => ({
    id: r.id,
    documento_identidad: r.documento_identidad,
    empleado: `${r.nombres} ${r.apellidos}`.trim(),
    area: r.area_nombre || '-',
    fecha: String(r.fecha).slice(0, 10),
    hora_salida: r.hora_salida ? String(r.hora_salida).slice(0, 5) : '-',
    hora_retorno: r.hora_retorno ? String(r.hora_retorno).slice(0, 5) : '-',
    tipo: r.tipo,
    motivo_texto: r.motivo_texto || '',
    estado: r.estado
  }));

  return { data, total };
}