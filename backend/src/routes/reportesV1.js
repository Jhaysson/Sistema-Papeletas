import { Router } from 'express';
import horasLaboradasController from '../controllers/horasLaboradasController.js';
import justificacionesController from '../controllers/justificacionesController.js';
import papeletasMovimientoController from '../controllers/papeletasMovimientoController.js';
import inasistenciasController from '../controllers/inasistenciasController.js';
import marcacionesConsolidadoController from '../controllers/marcacionesConsolidadoController.js';
import toleranciasController from '../controllers/toleranciasController.js';
import controlIncidenciasController from '../controllers/controlIncidenciasController.js';
import vacacionesController from '../controllers/vacacionesController.js';

const router = Router();

router.get('/horas-laboradas-recuperar', horasLaboradasController);
router.get('/justificaciones', justificacionesController);
router.get('/papeletas-movimiento', papeletasMovimientoController);
router.get('/inasistencias', inasistenciasController);
router.get('/marcaciones-consolidado', marcacionesConsolidadoController);
router.get('/tolerancias', toleranciasController);
router.get('/control-incidencias', controlIncidenciasController);
router.get('/vacaciones-saldo', vacacionesController);

export default router;