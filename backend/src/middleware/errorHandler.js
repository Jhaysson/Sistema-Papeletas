import { ValidationError } from '../utils/validationUtils.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(err.status || 400).json({
      error: err.message,
      codigo: err.codigo
    });
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      error: 'La base de datos no está migrada. Ejecute database/migration_asistencia.sql',
      codigo: 'BD_NO_MIGRADA'
    });
  }

  console.error('Error no controlado:', err);
  return res.status(500).json({
    error: err.message || 'Error interno del servidor',
    codigo: 'ERROR_INTERNO'
  });
}