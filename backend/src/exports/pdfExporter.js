import PDFDocument from 'pdfkit';

const MARGEN = 40;
const ANCHO_PAGINA = 595.28;
const ANCHO_TABLA = ANCHO_PAGINA - MARGEN * 2;

export const FIRMAS_RRHH = [
  { nombre: 'Elaborado por Recursos Humanos', etiqueta: 'Elaborado por' },
  { nombre: 'Visto Bueno de Gerencia', etiqueta: 'Visto bueno' },
  { nombre: 'Aprobado por Dirección', etiqueta: 'Aprobado por' }
];

function obtenerConfigEmpresa() {
  return {
    nombre: process.env.EMPRESA_NOMBRE || 'Institución Municipal de Ejemplo',
    ruc: process.env.EMPRESA_RUC || '20123456789',
    direccion: process.env.EMPRESA_DIRECCION || 'Av. Principal 1234'
  };
}

export function generarPDF({
  titulo,
  subtitulo,
  columnas,
  data,
  filtrosTexto,
  totales,
  nombreArchivo = 'reporte.pdf'
}) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGEN, bufferPages: true });
  const empresa = obtenerConfigEmpresa();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const finalizar = () =>
    new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      doc.end();
    });

  const firmas = FIRMAS_RRHH;

  const encabezado = () => {
    doc.font('Helvetica-Bold').fontSize(14).text(empresa.nombre.toUpperCase(), { align: 'center' });
    doc.font('Helvetica').fontSize(9);
    doc.text(`RUC: ${empresa.ruc}`, { align: 'center' });
    doc.text(empresa.direccion, { align: 'center' });
    doc.moveDown(0.8);
    doc.moveTo(MARGEN, doc.y).lineTo(ANCHO_PAGINA - MARGEN, doc.y).stroke();
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(13).text(titulo, { align: 'center' });
    if (subtitulo) {
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(10).text(subtitulo, { align: 'center' });
    }
    if (filtrosTexto) {
      doc.font('Helvetica').fontSize(9);
      doc.text(filtrosTexto, { align: 'left', indent: 0 });
    }
    doc.moveDown(0.5);
  };

  encabezado();
  const totalAncho = columnas.reduce((acc, c) => acc + (c.width || 60), 0);
  const factor = ANCHO_TABLA / totalAncho;

  const titulos = columnas.map((c) => ({
    header: c.header,
    key: c.key,
    width: (c.width || 60) * factor,
    align: c.align || 'left'
  }));

  const dibujarTabla = (filas, inicioY = null) => {
    let y = inicioY !== null ? inicioY : doc.y + 10;
    const alturaFila = 18;
    const x = MARGEN;

    doc.font('Helvetica-Bold').fontSize(8.5);
    titulos.forEach((t, i) => {
      const xx = x + titulos.slice(0, i).reduce((acc, tt) => acc + tt.width, 0);
      doc.text(t.header, xx + 3, y + 4, { width: t.width - 6, align: t.align });
    });
    y += 16;
    doc.moveTo(x, y).lineTo(x + ANCHO_TABLA, y).stroke();

    doc.font('Helvetica').fontSize(8);
    filas.forEach((fila) => {
      if (y + alturaFila > 720) {
        doc.addPage();
        y = MARGEN;
      }
      titulos.forEach((t, i) => {
        const xx = x + titulos.slice(0, i).reduce((acc, tt) => acc + tt.width, 0);
        let valor = fila[t.key];
        if (valor === null || valor === undefined) valor = '';
        valor = String(valor);
        doc.text(valor, xx + 3, y + 3, { width: t.width - 6, align: t.align });
      });
      y += alturaFila;
    });

    return y;
  };

  if (data && data.length > 0) {
    doc.y = dibujarTabla(data) + 12;
  } else {
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(10).text('No se encontraron registros para los criterios seleccionados.', { align: 'center' });
    doc.moveDown(1);
  }

  if (totales && Object.keys(totales).length > 0) {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(9);
    Object.entries(totales).forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, { align: 'left' });
    });
  }

  doc.moveDown(3);
  const yFirmas = doc.y + 20;
  if (yFirmas > 720) {
    doc.addPage();
  }
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text(firmas.join('    '), { align: 'center', lineGap: 34 });

  return finalizar().then((buffer) => ({ buffer, nombreArchivo, contentType: 'application/pdf' }));
}