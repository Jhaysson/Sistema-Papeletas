export class ValidationError extends Error {
  constructor(message, codigo = 'VALIDACION_ERROR', status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.codigo = codigo;
    this.status = status;
  }
}

export function validarRangoFechas(inicio, fin, requerido = true) {
  if (requerido && (!inicio || !fin)) {
    throw new ValidationError('Los parámetros fecha_inicio y fecha_fin son obligatorios');
  }
  if (!inicio || !fin) return;
  const patron = /^\d{4}-\d{2}-\d{2}$/;
  if (!patron.test(inicio) || !patron.test(fin)) {
    throw new ValidationError('El formato de fecha debe ser YYYY-MM-DD');
  }
  if (inicio > fin) {
    throw new ValidationError('fecha_inicio no puede ser mayor que fecha_fin');
  }
}

export function validarFormato(formato) {
  if (!formato) return 'json';
  if (!['json', 'pdf', 'xlsx'].includes(formato)) {
    throw new ValidationError('El parámetro formato debe ser json, pdf o xlsx');
  }
  return formato;
}

export function validarLimite(limit) {
  if (limit !== undefined && limit !== null && limit !== '') {
    const n = Number(limit);
    if (!Number.isInteger(n) || n <= 0 || n > 2000) {
      throw new ValidationError('El parámetro limit debe ser un entero entre 1 y 2000');
    }
  }
}

export function validarOffset(offset) {
  if (offset !== undefined && offset !== null && offset !== '') {
    const n = Number(offset);
    if (!Number.isInteger(n) || n < 0) {
      throw new ValidationError('El parámetro offset debe ser un entero mayor o igual a 0');
    }
  }
}

export function validarEnteroPositivo(valor, nombre, opcional = true) {
  if ((!valor && opcional) || valor === '' || valor === undefined || valor === null) return;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`El parámetro ${nombre} debe ser un entero positivo`);
  }
}

export function validarEntero(valor, nombre, opcional = true) {
  if ((!valor && opcional) || valor === '' || valor === undefined || valor === null) return;
  const n = Number(valor);
  if (!Number.isInteger(n)) {
    throw new ValidationError(`El parámetro ${nombre} debe ser un entero`);
  }
}