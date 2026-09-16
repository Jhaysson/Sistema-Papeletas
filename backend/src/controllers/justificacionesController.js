import { crearController } from './baseController.js';
import { getJustificaciones, TITULO, COLUMNAS } from '../services/justificacionesService.js';

export default crearController({
  service: getJustificaciones,
  titulo: TITULO,
  columnas: COLUMNAS,
  campos: ['fecha_inicio', 'fecha_fin', 'empleado_id', 'area_id', 'estado', 'limit', 'offset', 'formato'],
  requiereFechas: true
});