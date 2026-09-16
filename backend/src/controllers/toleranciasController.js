import { crearController } from './baseController.js';
import { getTolerancias, TITULO, COLUMNAS } from '../services/toleranciasService.js';

export default crearController({
  service: getTolerancias,
  titulo: TITULO,
  columnas: COLUMNAS,
  campos: ['fecha_inicio', 'fecha_fin', 'empleado_id', 'area_id', 'categoria', 'limit', 'offset', 'formato'],
  requiereFechas: true
});