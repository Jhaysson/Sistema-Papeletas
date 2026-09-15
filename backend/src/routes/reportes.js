import { Router } from 'express';
import PDFDocument from 'pdfkit';
import pool from '../config/db.js';

const router = Router();

router.get('/papeletas-pdf', async (req, res) => {
  const { fecha_inicio, fecha_fin, numero_tarjeta } = req.query;

  try {
    let query = `
      SELECT p.*, e.numero AS est_numero, e.institucion, e.lugar,
             e.hora_llegada, e.hora_retorno AS est_hora_retorno
      FROM papeletas p
      LEFT JOIN establecimientos e ON e.papeleta_id = p.id
      WHERE 1=1
    `;
    let params = [];

    if (fecha_inicio && fecha_fin) {
      query += ' AND p.fecha_salida BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }

    if (numero_tarjeta) {
      query += ' AND p.numero_tarjeta = ?';
      params.push(numero_tarjeta);
    }

    query += ' ORDER BY p.fecha_salida DESC, p.numero_tarjeta, e.numero';

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron papeletas para los criterios seleccionados' });
    }

    const papeletasAgrupadas = agruparPapeletas(rows);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_papeletas.pdf');

    doc.pipe(res);

    generarReporte(doc, papeletasAgrupadas, { fecha_inicio, fecha_fin });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: 'Error al generar el reporte PDF' });
  }
});

function agruparPapeletas(rows) {
  const mapa = new Map();
  for (const row of rows) {
    if (!mapa.has(row.id)) {
      mapa.set(row.id, {
        id: row.id,
        nombre_apellidos: row.nombre_apellidos,
        numero_tarjeta: row.numero_tarjeta,
        oficina: row.oficina,
        motivo_comision: row.motivo_comision,
        motivo_personales: row.motivo_personales,
        motivo_otros: row.motivo_otros,
        motivo_otros_descripcion: row.motivo_otros_descripcion,
        fecha_salida: row.fecha_salida,
        hora_salida: row.hora_salida,
        hora_retorno: row.hora_retorno,
        fecha_retorno: row.fecha_retorno,
        detalle_acciones: row.detalle_acciones,
        firma_trabajador: row.firma_trabajador,
        firma_funcionario: row.firma_funcionario,
        firma_jefe: row.firma_jefe,
        establecimientos: []
      });
    }
    const papeleta = mapa.get(row.id);
    if (row.est_numero) {
      papeleta.establecimientos.push({
        numero: row.est_numero,
        institucion: row.institucion,
        lugar: row.lugar,
        hora_llegada: row.hora_llegada,
        hora_retorno: row.est_hora_retorno
      });
    }
  }
  return Array.from(mapa.values());
}

function generarReporte(doc, papeletas, filtros) {
  const titulo = doc.font('Helvetica-Bold').fontSize(16).text('REPORTE DE PAPELETAS', { align: 'center' });
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(10);
  if (filtros.fecha_inicio && filtros.fecha_fin) {
    doc.text(`Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`, { align: 'center' });
  }
  if (filtros.numero_tarjeta) {
    doc.text(`Nº de Tarjeta: ${filtros.numero_tarjeta}`, { align: 'center' });
  }
  doc.moveDown();
  doc.text(`Total de papeletas: ${papeletas.length}`, { align: 'right' });
  doc.moveDown();

  const datosTrabajadores = new Map();
  papeletas.forEach(p => {
    if (!datosTrabajadores.has(p.numero_tarjeta)) {
      datosTrabajadores.set(p.numero_tarjeta, {
        nombre: p.nombre_apellidos,
        oficina: p.oficina,
        veces: 0
      });
    }
    datosTrabajadores.get(p.numero_tarjeta).veces++;
  });

  doc.font('Helvetica-Bold').fontSize(12).text('RESUMEN POR TRABAJADOR');
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Nº de Tarjeta | Nombre y Apellidos | Oficina | Veces que realizó papeletas');
  doc.font('Helvetica').fontSize(9);
  let yLinea = doc.y;

  doc.moveTo(40, yLinea).lineTo(550, yLinea).stroke();
  yLinea = yLinea + 5;

  for (const [tarjeta, datos] of datosTrabajadores) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .text(
        `${tarjeta}  |  ${datos.nombre}  |  ${datos.oficina}  |  ${datos.veces}`,
        { columns: 1, columnGap: 0 }
      );
    doc.moveDown(0.2);
  }

  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(12).text('DETALLE DE PAPELETAS');
  doc.moveDown(0.5);

  for (const p of papeletas) {
    if (doc.y > 700) {
      doc.addPage();
    }

    doc.font('Helvetica-Bold').fontSize(11).text(`Papeleta Nº ${p.id}`);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Trabajador: ${p.nombre_apellidos}`);
    doc.text(`Nº de Tarjeta: ${p.numero_tarjeta}   Oficina: ${p.oficina}`);
    doc.text(`Fecha de salida: ${p.fecha_salida}   Hora de salida: ${p.hora_salida}`);
    if (p.hora_retorno) {
      doc.text(`Hora de retorno: ${p.hora_retorno}${p.fecha_retorno ? `   Fecha de retorno: ${p.fecha_retorno}` : ''}`);
    }

    let motivos = [];
    if (p.motivo_comision) motivos.push('Comisión de servicios');
    if (p.motivo_personales) motivos.push('Asuntos personales');
    if (p.motivo_otros) motivos.push(`Otros${p.motivo_otros_descripcion ? `: ${p.motivo_otros_descripcion}` : ''}`);
    doc.text(`Motivo(s): ${motivos.join(', ') || 'No especificado'}`);

    if (p.establecimientos && p.establecimientos.length > 0) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(10).text('Establecimientos visitados:');
      doc.font('Helvetica').fontSize(9);

      const tableTop = doc.y;
      const columnX = [40, 70, 260, 420, 490];
      const columnWidths = [30, 190, 160, 70, 60];

      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('N°', columnX[0], tableTop);
      doc.text('Institución', columnX[1], tableTop);
      doc.text('Lugar', columnX[2], tableTop);
      doc.text('H. Llegada', columnX[3], tableTop);
      doc.text('H. Retorno', columnX[4], tableTop);
      doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      doc.font('Helvetica').fontSize(9);
      let y = tableTop + 20;
      for (const est of p.establecimientos) {
        doc.text(String(est.numero), columnX[0] + 5, y);
        doc.text(est.institucion, columnX[1], y);
        doc.text(est.lugar, columnX[2], y);
        doc.text(est.hora_llegada || '-', columnX[3], y);
        doc.text(est.hora_retorno || '-', columnX[4], y);
        y += 18;
        if (y > 700) {
          doc.addPage();
          y = 40;
        }
      }
      doc.y = y + 5;
    }

    if (p.detalle_acciones) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(10).text('Detalle de acciones cumplidas:');
      doc.font('Helvetica').fontSize(9).text(p.detalle_acciones);
    }

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(9);
    doc.moveTo(40, doc.y + 5).lineTo(300, doc.y + 5).stroke();
    doc.moveTo(310, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown(0.3);

    if (p.firma_trabajador || p.firma_funcionario || p.firma_jefe) {
      doc.font('Helvetica').fontSize(8);
      let line = '';
      if (p.firma_trabajador) line += `Trabajador: ${p.firma_trabajador}   `;
      if (p.firma_jefe) line += `Jefe inmediato: ${p.firma_jefe}   `;
      if (p.firma_funcionario) line += `Autoriza: ${p.firma_funcionario}`;
      doc.text(line, { align: 'center' });
    }

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).dash(2).stroke();
    doc.undash();
    doc.moveDown(1);
  }

  doc.end();
}

export default router;