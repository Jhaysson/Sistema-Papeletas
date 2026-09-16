import { crearController } from './baseController.js';
import { getHorasLaboradasRecuperar, TITULO, COLUMNAS } from '../services/horasLaboradasService.js';

export default crearController({
  service: getHorasLaboradasRecuperar,
  titulo: TITULO,
  columnas: COLUMNAS,
  campos: ['fecha_inicio', 'fecha_fin', 'empleado_id', 'area_id', 'sede_id', 'limit', 'offset', 'formato'],
  requiereFechas: true
});