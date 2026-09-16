import { crearController } from './baseController.js';
import { getMarcacionesConsolidado, TITULO, COLUMNAS } from '../services/marcacionesConsolidadoService.js';

export default crearController({
  service: getMarcacionesConsolidado,
  titulo: TITULO,
  columnas: COLUMNAS,
  campos: ['fecha_inicio', 'fecha_fin', 'empleado_id', 'area_id', 'sede_id', 'estado_marca', 'tipo_marca', 'limit', 'offset', 'formato'],
  requiereFechas: true
});