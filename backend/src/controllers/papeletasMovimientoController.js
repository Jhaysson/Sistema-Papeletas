import { crearController } from './baseController.js';
import { getPapeletasMovimiento, TITULO, COLUMNAS } from '../services/papeletasMovimientoService.js';

export default crearController({
  service: getPapeletasMovimiento,
  titulo: TITULO,
  columnas: COLUMNAS,
  campos: ['fecha_inicio', 'fecha_fin', 'empleado_id', 'area_id', 'tipo', 'estado', 'limit', 'offset', 'formato'],
  requiereFechas: true
});