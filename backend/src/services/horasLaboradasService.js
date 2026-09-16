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

export const TITULO = 'REPORTE DE HORAS LABORADAS VS HORAS POR RECUPERAR';
export const COLUMNAS = [
  { header: 'Documento', key: 'documento_identidad', width: 16, align: 'left' },
  { header: 'Empleado', key: 'empleado', width: 28, align: 'left' },
  { header: 'Área', key: 'area', width: 18, align: 'left' },
  { header: 'Horas Programadas', key: 'horas_programadas', width: 16, align: 'left' },
  { header: 'Horas Reales', key: 'horas_reales', width: 14, align: 'left' },
  { header: 'Min Tardanza', key: 'minutos_tardanza', width: 12, align: 'right', tipo: 'entero' },
  { header: 'Min Papeletas', key: 'minutos_papeletas', width: 12, align: 'right', tipo: 'entero' },
  { header: 'Saldo (HH:MM)', key: 'diferencia_saldo', width: 14, align: 'left' }
];

function calcularHoras(stringTime) {
  const [h, m] = stringTime.split(':').map(Number);
  return h * 60 + m;
}

export async function getHorasLaboradasRecuperar(filtros) {
  const { limit, offset } = normalizarPaginacion(filtros.limit, filtros.offset);
  const fechaInicio = filtros.fecha_inicio;
  const fechaFin = filtros.fecha_fin;

  const [empleados, feriados, asignaciones] = await Promise.all([
    obtenerEmpleados(filtros.area_id, filtros.sede_id),
    obtenerFeriados(fechaInicio, fechaFin),
    obtenerAsignaciones(fechaInicio, fechaFin, filtros.empleado_id || null)
  ]);

  const empleadosFiltrados = filtros.empleado_id
    ? empleados.filter((e) => e.id === Number(filtros.empleado_id))
    : empleados;

  const marcaciones = await obtenerMarcacionesRango(fechaInicio, fechaFin, filtros.empleado_id || null, filtros.area_id, filtros.sede_id);

  const diaPorEmp = new Map();
  for (const m of marcaciones) {
    const dia = String(m.timestamp).slice(0, 10);
    const key = `${m.empleado_id}|${dia}`;
    if (!diaPorEmp.has(key)) diaPorEmp.set(key, { entrada: null, salida: null });
    const reg = diaPorEmp.get(key);
    if (m.tipo === 'ENTRADA' && (!reg.entrada || m.timestamp < reg.entrada)) reg.entrada = m.timestamp;
    if (m.tipo === 'SALIDA' && (!reg.salida || m.timestamp > reg.salida)) reg.salida = m.timestamp;
  }

  const [filasPapeletas] = await pool.query(
    `SELECT pe.empleado_id, pe.fecha, pe.hora_salida, pe.hora_retorno, pe.estado, pe.tipo
     FROM papeletas_salida pe
     WHERE pe.fecha BETWEEN ? AND ?
       AND pe.estado IN ('PENDIENTE', 'RECHAZADO')`,
    [fechaInicio, fechaFin]
  );

  const dias = generarDiasEnRango(fechaInicio, fechaFin);
  const filas = [];

  for (const empleado of empleadosFiltrados) {
    let horasProgramadas = 0;
    let horasReales = 0;
    let minutosTardanza = 0;
    let minutosPapeletas = 0;

    for (const fechaStr of dias) {
      const asignacion = asignacionParaFecha(asignaciones, empleado.id, fechaStr);
      if (!esDiaLaboralPara(asignacion, fechaStr, feriados)) continue;

      horasProgramadas += calcularHoras(asignacion.hora_salida) - calcularHoras(asignacion.hora_entrada);

      const reg = diaPorEmp.get(`${empleado.id}|${fechaStr}`);
      if (reg && reg.entrada && reg.salida) {
        const reales = calcularHoras(reg.salida.slice(11, 16)) - calcularHoras(reg.entrada.slice(11, 16));
        horasReales += reales;

        const horaEntradaMarca = reg.entrada.slice(11, 16);
        const limite = `${asignacion.hora_entrada.slice(0, 2)}:${asignacion.hora_entrada.slice(3)}`;
        const tardanzaTotal = calcularHoras(horaEntradaMarca) - calcularHoras(String(limite).slice(0, 5));
        const tolerancia = asignacion.tolerancia_minutos || 0;
        const tardanzaComputable = Math.max(0, tardanzaTotal - tolerancia);
        if (tardanzaComputable > 0) minutosTardanza += tardanzaComputable;
      }

      const papeletasDia = filasPapeletas.filter((p) => p.empleado_id === empleado.id && String(p.fecha) === fechaStr);
      for (const p of papeletasDia) {
        if (p.hora_salida && p.hora_retorno) {
          minutosPapeletas += calcularHoras(p.hora_retorno) - calcularHoras(p.hora_salida);
        }
      }
    }

    const diferenciaMin = (horasReales - horasProgramadas) - (minutosTardanza + minutosPapeletas);

    filas.push({
      documento_identidad: empleado.documento_identidad,
      empleado: nombreCompleto(empleado),
      area: empleado.area_nombre || '-',
      horas_programadas: horasProgramadas === 0 ? '00:00' : horasPorMom(horasProgramadas),
      horas_reales: horasReales === 0 ? '00:00' : horasPorMom(horasReales),
      minutos_tardanza: minutosTardanza,
      minutos_papeletas: minutosPapeletas,
      diferencia_saldo: diferenciaMin === 0 ? '00:00' : horasPorMom(diferenciaMin, true)
    });
  }

  const total = filas.length;
  const paginadas = filas.slice(offset, offset + limit);
  return { data: paginadas, total };
}

function horasPorMom(minutos, conSigno = false) {
  const signo = conSigno && minutos < 0 ? '-' : (conSigno ? '+' : '');
  const abs = Math.abs(Math.round(minutos));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${signo}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}