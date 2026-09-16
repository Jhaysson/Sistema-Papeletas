import {
  obtenerMarcacionesRango,
  obtenerFeriados,
  obtenerAsignaciones,
  esDiaLaboralPara,
  asignacionParaFecha,
  nombreCompleto
} from './asistenciaHelpers.js';
import { normalizarPaginacion } from '../utils/paginationUtils.js';
import { formatearTimestamp } from '../utils/dateUtils.js';

export const TITULO = 'REPORTE DE MARCAcIONES CONSOLIDADO';
export const COLUMNAS = [
  { header: 'Fecha Hora', key: 'timestamp', width: 22, align: 'left', tipo: 'fecha' },
  { header: 'Documento', key: 'documento_identidad', width: 16, align: 'left' },
  { header: 'Empleado', key: 'empleado', width: 26, align: 'left' },
  { header: 'Área', key: 'area', width: 16, align: 'left' },
  { header: 'Sede', key: 'sede', width: 16, align: 'left' },
  { header: 'Tipo Marca', key: 'tipo', width: 18, align: 'left' },
  { header: 'Origen', key: 'origen', width: 20, align: 'left' },
  { header: 'Estado', key: 'estado_marca', width: 10, align: 'left' }
];

export async function getMarcacionesConsolidado(filtros) {
  const { limit, offset } = normalizarPaginacion(filtros.limit, filtros.offset);
  const [marcaciones, feriados, asignaciones] = await Promise.all([
    obtenerMarcacionesRango(
      filtros.fecha_inicio,
      filtros.fecha_fin,
      filtros.empleado_id || null,
      filtros.area_id,
      filtros.sede_id,
      filtros.tipo_marca || null
    ),
    obtenerFeriados(filtros.fecha_inicio, filtros.fecha_fin),
    obtenerAsignaciones(filtros.fecha_inicio, filtros.fecha_fin, filtros.empleado_id || null)
  ]);

  const filas = marcaciones.map((m) => {
    const fecha = String(m.timestamp).slice(0, 10);
    const asignacion = asignacionParaFecha(asignaciones, m.empleado_id, fecha);
    const valida = esDiaLaboralPara(asignacion, fecha, feriados);
    const estadoMarca = valida ? 'VÁLIDA' : 'INVÁLIDA';
    return {
      timestamp: formatearTimestamp(m.timestamp),
      fecha: fecha,
      hora: String(m.timestamp).slice(11, 19),
      documento_identidad: m.documento_identidad,
      empleado: nombreCompleto(m),
      area: m.area_nombre || '-',
      sede: m.sede_nombre || '-',
      tipo: m.tipo,
      origen: m.origen_nombre || '-',
      estado_marca: estadoMarca
    };
  });

  if (filtros.estado_marca) {
    const estado = filtros.estado_marca.toUpperCase() === 'INVALIDA' ? 'INVÁLIDA' : 'VÁLIDA';
    return {
      data: filas.filter((f) => f.estado_marca === estado).slice(offset, offset + limit),
      total: filas.filter((f) => f.estado_marca === estado).length
    };
  }

  const total = filas.length;
  return { data: filas.slice(offset, offset + limit), total };
}