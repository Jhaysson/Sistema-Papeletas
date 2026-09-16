import { crearController } from './baseController.js';
import { getVacacionesSaldo, TITULO, COLUMNAS } from '../services/vacacionesSaldoService.js';

export default crearController({
  service: getVacacionesSaldo,
  titulo: TITULO,
  columnas: COLUMNAS,
  campos: ['periodo_anio', 'empleado_id', 'area_id', 'limit', 'offset', 'formato'],
  requiereFechas: false
});