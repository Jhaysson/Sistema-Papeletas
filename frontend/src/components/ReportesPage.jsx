import React from 'react';
import { descargarReportePDF } from '../services/api.js';

function ReportesPage() {
  const [fechaInicio, setFechaInicio] = React.useState('');
  const [fechaFin, setFechaFin] = React.useState('');
  const [numeroTarjeta, setNumeroTarjeta] = React.useState('');
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState(null);

  const descargarPDF = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const filtros = {};
      if (fechaInicio && fechaFin) {
        filtros.fecha_inicio = fechaInicio;
        filtros.fecha_fin = fechaFin;
      }
      if (numeroTarjeta) {
        filtros.numero_tarjeta = numeroTarjeta;
      }

      const response = await descargarReportePDF(filtros);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reporte_papeletas.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'No se pudieron generar las papeletas. Verifique los filtros.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
            REPORTE DE PAPELETAS
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Genera un PDF con todas las papeletas ingresadas al sistema
          </p>
        </div>

        <form onSubmit={descargarPDF} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Fecha de inicio</label>
              <input
                type="date"
                className="input-field"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field">Fecha de fin</label>
              <input
                type="date"
                className="input-field"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">
                Nº de tarjeta del trabajador (opcional)
              </label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="Ej: 1, 5, 12..."
                value={numeroTarjeta}
                onChange={(e) => setNumeroTarjeta(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 border border-red-300 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setFechaInicio('');
                setFechaFin('');
                setNumeroTarjeta('');
                setError(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 disabled:opacity-50"
            >
              {cargando ? 'Generando...' : 'Generar Reporte PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportesPage;