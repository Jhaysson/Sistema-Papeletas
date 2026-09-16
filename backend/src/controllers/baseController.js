import { generarPDF } from '../exports/pdfExporter.js';
import { generarXLSX } from '../exports/xlsxExporter.js';
import {
  validarRangoFechas,
  validarFormato,
  validarLimite,
  validarOffset,
  validarEnteroPositivo,
  validarEntero
} from '../utils/validationUtils.js';
import { normalizarPaginacion, construirRespuestaPaginada } from '../utils/paginationUtils.js';

function slugNombre(titulo) {
  return titulo.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function crearController({ service, titulo, columnas, campos = [], requiereFechas = false, permitirArea = true, permitirEmpleado = true }) {
  return async (req, res, next) => {
    try {
      const q = req.query;
      const filtros = {};

      for (const campo of campos) {
        if (q[campo] !== undefined && q[campo] !== '') {
          filtros[campo] = q[campo];
        }
      }

      validarRangoFechas(filtros.fecha_inicio, filtros.fecha_fin, requiereFechas);
      const formato = validarFormato(filtros.formato);
      validarLimite(filtros.limit);
      validarOffset(filtros.offset);
      if (permitirEmpleado) validarEnteroPositivo(filtros.empleado_id, 'empleado_id');
      if (permitirArea) validarEnteroPositivo(filtros.area_id, 'area_id');
      validarEnteroPositivo(filtros.sede_id, 'sede_id');
      if (filtros.periodo_anio !== undefined) validarEntero(filtros.periodo_anio, 'periodo_anio');

      const { limit, offset } = normalizarPaginacion(filtros.limit, filtros.offset);
      const { data, total } = await service(filtros);

      const filtrosTexto = [
        filtros.fecha_inicio && filtros.fecha_fin ? `Período consultado: ${filtros.fecha_inicio} al ${filtros.fecha_fin}` : '',
        filtros.periodo_anio ? `Período vacacional: ${filtros.periodo_anio}` : '',
        filtros.empleado_id ? `Empleado ID: ${filtros.empleado_id}` : '',
        filtros.area_id ? `Área ID: ${filtros.area_id}` : '',
        filtros.estado ? `Estado: ${filtros.estado}` : ''
      ].filter(Boolean).join('  |  ');

      if (formato === 'pdf') {
        const { buffer, nombreArchivo, contentType } = await generarPDF({
          titulo,
          subtitulo: `Total de registros: ${total}`,
          columnas,
          data,
          filtrosTexto,
          totales: { 'Total de registros': total },
          nombreArchivo: `${slugNombre(titulo)}.pdf`
        });
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        return res.send(buffer);
      }

      if (formato === 'xlsx') {
        const totales = {};
        for (const c of columnas) {
          if (c.tipo === 'entero' || c.tipo === 'numero') {
            totales[c.key] = data.reduce((acc, fila) => acc + (Number(fila[c.key]) || 0), 0);
          }
        }
        const { buffer, nombreArchivo, contentType } = await generarXLSX({
          titulo,
          columnas,
          data,
          hoja: titulo.slice(0, 30),
          totales,
          nombreArchivo: `${slugNombre(titulo)}.xlsx`
        });
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        return res.send(buffer);
      }

      return res.json(construirRespuestaPaginada(data, total, limit, offset));
    } catch (error) {
      next(error);
    }
  };
}