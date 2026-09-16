import { crearController } from './baseController.js';
import { getInasistencias, TITULO, COLUMNAS } from '../services/inasistenciasService.js';

export default crearController({
  service: getInasistencias,
  titulo: TITULO,
  columnas: COLUMNAS,
  campos: ['fecha_inicio', 'fecha_fin', 'empleado_id', 'area_id', 'limit', 'offset', 'formato'],
  requiereFechas: true
});