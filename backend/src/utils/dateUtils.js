const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado'
];

export function obtenerDiaSemana(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha + 'T00:00:00');
  return DIAS_SEMANA[d.getDay()];
}

export function esDiaFeriado(fecha, feriados) {
  const key = fecha instanceof Date ? fecha.toISOString().slice(0, 10) : String(fecha).slice(0, 10);
  return feriados.some((f) => {
    const fk = String(f.fecha).slice(0, 10);
    return fk === key || (f.es_recurrente && fk.split('-').slice(1).join('-') === key.split('-').slice(1).join('-'));
  });
}

export function esDiaLaboral(fecha, horario, feriados = []) {
  const dia = obtenerDiaSemana(fecha);
  const flag = horario && horario[dia];
  if (!flag) return false;
  if (esDiaFeriado(fecha, feriados)) return false;
  return true;
}

export function generarDiasEnRango(inicio, fin) {
  const fechas = [];
  const actual = new Date(inicio + 'T00:00:00');
  const final = new Date(fin + 'T00:00:00');
  while (actual <= final) {
    fechas.push(actual.toISOString().slice(0, 10));
    actual.setDate(actual.getDate() + 1);
  }
  return fechas;
}

export function calcularMinutos(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  return Math.abs((b - a) / 60000);
}

export function deltaMinutos(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  return Math.floor((b - a) / 60000);
}

export function minutosAHorasMinutos(minutos) {
  const m = Math.round(minutos);
  const signo = m < 0 ? '-' : '';
  const abs = Math.abs(m);
  const h = Math.floor(abs / 60);
  const min = abs % 60;
  return `${signo}${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function combinarFechaHora(fecha, hora) {
  return `${String(fecha).slice(0, 10)}T${hora}`;
}

export function formatearTimestamp(ts) {
  if (!ts) return '';
  return String(ts).slice(0, 19).replace('T', ' ');
}