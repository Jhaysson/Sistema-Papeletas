import { crearController } from './baseController.js';
import { getControlIncidencias, TITULO, COLUMNAS } from '../services/controlIncidenciasService.js';

export default crearController({
  service: getControlIncidencias,
  titulo: TITULO,
  columnas: COLUMNAS,
  campos: ['fecha_inicio', 'fecha_fin', 'empleado_id', 'area_id', 'limit', 'offset', 'formato'],
  requiereFechas: true
});