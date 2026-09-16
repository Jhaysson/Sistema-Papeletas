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
import { generarDiasEnRango } from '../utils/dateUtils.js';

export const TITULO = 'REPORTE DE TOLERANCIAS Y TARDANZAS';
export const COLUMNAS = [
  { header: 'Documento', key: 'documento_identidad', width: 16, align: 'left' },
  { header: 'Empleado', key: 'empleado', width: 26, align: 'left' },
  { header: 'Fecha', key: 'fecha', width: 14, align: 'left' },
  { header: 'Entrada Programada', key: 'hora_entrada', width: 16, align: 'left' },
  { header: 'Tolerancia (min)', key: 'tolerancia', width: 14, align: 'right', tipo: 'entero' },
  { header: 'Primera Marca', key: 'hora_marca', width: 14, align: 'left' },
  { header: 'Categoría', key: 'categoria', width: 18, align: 'left' },
  { header: 'Min Tardanza', key: 'minutos_tardanza', width: 13, align: 'right', tipo: 'entero' },
  { header: 'Min Descuento', key: 'minutos_descuento', width: 13, align: 'right', tipo: 'entero' }
];

function horasAMinutos(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
}

export async function getTolerancias(filtros) {
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

  const primeraEntradaPorEmpDia = new Map();
  for (const m of marcaciones) {
    if (m.tipo !== 'ENTRADA') continue;
    const key = `${m.empleado_id}|${String(m.timestamp).slice(0, 10)}`;
    if (!primeraEntradaPorEmpDia.has(key) || m.timestamp < primeraEntradaPorEmpDia.get(key).timestamp) {
      primeraEntradaPorEmpDia.set(key, m);
    }
  }

  const dias = generarDiasEnRango(fechaInicio, fechaFin);
  const filas = [];

  for (const empleado of empleadosFiltrados) {
    for (const fechaStr of dias) {
      const asignacion = asignacionParaFecha(asignaciones, empleado.id, fechaStr);
      if (!esDiaLaboralPara(asignacion, fechaStr, feriados)) continue;

      const marca = primeraEntradaPorEmpDia.get(`${empleado.id}|${fechaStr}`);
      if (!marca) continue;

      const horaEntrada = String(asignacion.hora_entrada).slice(0, 5);
      const horaMarcada = String(marca.timestamp).slice(11, 16);
      const tolerancia = asignacion.tolerancia_minutos || 0;

      const minutosMarca = horasAMinutos(horaMarcada);
      const minutosProgramado = horasAMinutos(horaEntrada);

      let categoria;
      let minutosTardanza;
      let minutosDescuento;

      if (minutosMarca <= minutosProgramado) {
        categoria = 'PUNTUAL';
        minutosTardanza = 0;
        minutosDescuento = 0;
      } else if (minutosMarca <= minutosProgramado + tolerancia) {
        categoria = 'DENTRO_TOLERANCIA';
        minutosTardanza = minutosMarca - minutosProgramado;
        minutosDescuento = 0;
      } else {
        categoria = 'TARDANZA';
        minutosTardanza = minutosMarca - minutosProgramado;
        minutosDescuento = minutosTardanza - tolerancia;
      }

      if (filtros.categoria && filtros.categoria.toUpperCase() !== categoria) continue;

      filas.push({
        documento_identidad: empleado.documento_identidad,
        empleado: nombreCompleto(empleado),
        area: empleado.area_nombre || '-',
        fecha: fechaStr,
        hora_entrada: horaEntrada,
        tolerancia,
        hora_marca: horaMarcada,
        categoria,
        minutos_tardanza: minutosTardanza,
        minutos_descuento: minutosDescuento
      });
    }
  }

  const total = filas.length;
  return { data: filas.slice(offset, offset + limit), total };
}