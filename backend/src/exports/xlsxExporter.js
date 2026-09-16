import ExcelJS from 'exceljs';

const COLOR_CABECERA = '1F4E78';
const COLOR_TOTAL = 'DDEBF7';

export async function generarXLSX({
  titulo,
  columnas,
  data,
  hoja = 'Reporte',
  totales = null,
  nombreArchivo = 'reporte.xlsx'
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = process.env.EMPRESA_NOMBRE || 'Institución';
  workbook.created = new Date();

  const ws = workbook.addWorksheet(hoja, {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  const anchoTotal = columnas.reduce((acc, c) => acc + (c.width || 16), 0);

  ws.mergeCells(1, 1, 1, columnas.length);
  const celdaTitulo = ws.getCell(1, 1);
  celdaTitulo.value = titulo;
  celdaTitulo.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  celdaTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
  celdaTitulo.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLOR_CABECERA }
  };
  ws.getRow(1).height = 24;

  const filaCabecera = ws.addRow(columnas.map((c) => c.header));
  filaCabecera.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_CABECERA }
    };
    cell.alignment = { horizontal: columnas[colNumber - 1].align || 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  filaCabecera.height = 20;

  for (const fila of data) {
    const filaDatos = ws.addRow(columnas.map((c) => {
      const valor = fila[c.key];
      if (valor === null || valor === undefined) return '';
      return valor;
    }));
    filaDatos.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = columnas[colNumber - 1];
      if (col?.tipo === 'fecha' && cell.value) {
        cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
      } else if (col?.tipo === 'numero') {
        cell.numFmt = '0.00';
        cell.alignment = { horizontal: 'right' };
      } else if (col?.tipo === 'entero') {
        cell.numFmt = '0';
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.alignment = { horizontal: col?.align || 'left' };
      }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  if (totales && Object.keys(totales).length > 0) {
    const filaTotal = ws.addRow(columnas.map((c, i) => totales[c.key] !== undefined ? totales[c.key] : (i === 0 ? 'TOTAL' : '')));
    filaTotal.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLOR_TOTAL }
      };
      cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'left' };
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    for (const c of columnas) {
      const idx = columnas.indexOf(c) + 1;
      const txt = filaTotal.getCell(idx).text;
      const num = Number(txt);
      if (Number.isFinite(num)) {
        filaTotal.getCell(idx).numFmt = c.tipo === 'entero' ? '0' : '0.00';
      }
    }
  }

  columnas.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width || 16;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, nombreArchivo, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
}