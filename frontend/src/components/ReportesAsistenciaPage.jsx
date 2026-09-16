import React from 'react';
import { TIPOS_REPORTE, obtenerReporte, descargarReporteFormato } from '../services/api.js';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function ReportesAsistenciaPage() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

  const [tipoReporte, setTipoReporte] = React.useState(TIPOS_REPORTE[0].id);
  const [fechaInicio, setFechaInicio] = React.useState(primerDia);
  const [fechaFin, setFechaFin] = React.useState(ultimoDia);
  const [periodoAnio, setPeriodoAnio] = React.useState(hoy.getFullYear());
  const [empleadoId, setEmpleadoId] = React.useState('');
  const [areaId, setAreaId] = React.useState('');
  const [sedeId, setSedeId] = React.useState('');
  const [estado, setEstado] = React.useState('');
  const [tipoPapeleta, setTipoPapeleta] = React.useState('');
  const [categoria, setCategoria] = React.useState('');
  const [tipoMarca, setTipoMarca] = React.useState('');
  const [estadoMarca, setEstadoMarca] = React.useState('');

  const [datos, setDatos] = React.useState([]);
  const [paginacion, setPaginacion] = React.useState(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState(null);

  const reporteActual = TIPOS_REPORTE.find((r) => r.id === tipoReporte);

  const construirFiltros = () => {
    const f = {};
    if (reporteActual?.requiereFecha) {
      f.fecha_inicio = fechaInicio;
      f.fecha_fin = fechaFin;
    }
    if (tipoReporte === 'vacaciones-saldo') f.periodo_anio = periodoAnio;
    if (empleadoId) f.empleado_id = empleadoId;
    if (areaId) f.area_id = areaId;
    if (sedeId) f.sede_id = sedeId;
    if (estado) f.estado = estado;
    if (tipoPapeleta) f.tipo = tipoPapeleta;
    if (categoria) f.categoria = categoria;
    if (tipoMarca) f.tipo_marca = tipoMarca;
    if (estadoMarca) f.estado_marca = estadoMarca;
    f.limit = 100;
    return f;
  };

  const buscarReporte = async () => {
    setCargando(true);
    setError(null);
    setDatos([]);
    setPaginacion(null);
    try {
      const res = await obtenerReporte(tipoReporte, construirFiltros());
      setDatos(res.data.data || []);
      setPaginacion(res.data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al obtener el reporte');
    } finally {
      setCargando(false);
    }
  };

  const descargarFormato = async (formato) => {
    setError(null);
    try {
      const res = await descargarReporteFormato(tipoReporte, construirFiltros(), formato);
      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      const mimeType = formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${tipoReporte}.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al descargar el reporte');
    }
  };

  const limpiar = () => {
    setFechaInicio(primerDia);
    setFechaFin(ultimoDia);
    setPeriodoAnio(hoy.getFullYear());
    setEmpleadoId('');
    setAreaId('');
    setSedeId('');
    setEstado('');
    setTipoPapeleta('');
    setCategoria('');
    setTipoMarca('');
    setEstadoMarca('');
    setDatos([]);
    setPaginacion(null);
    setError(null);
  };

  const columnas = datos.length > 0 ? Object.keys(datos[0]).filter((k) => k !== 'fechas') : [];
  const columnasVisibles = columnas.filter((c) =>
    !['area', 'sede', 'empleado'].includes(c) || datos.some((d) => d[c] && d[c] !== '-')
  );

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto bg-white shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
            MÓDULO DE REPORTES DE ASISTENCIA
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Consulte y descargue los reportes del sistema de control de asistencia
          </p>
        </div>

        <div className="border border-gray-300 rounded p-4 bg-gray-50 mb-6">
          <div className="mb-4">
            <label className="label-field font-semibold">Tipo de Reporte</label>
            <select
              className="input-field w-full"
              value={tipoReporte}
              onChange={(e) => { setTipoReporte(e.target.value); setDatos([]); setPaginacion(null); setError(null); }}
            >
              {TIPOS_REPORTE.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          {reporteActual?.requiereFecha && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label-field">Fecha de inicio</label>
                <input type="date" className="input-field" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <label className="label-field">Fecha de fin</label>
                <input type="date" className="input-field" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>
          )}

          {tipoReporte === 'vacaciones-saldo' && (
            <div className="mb-4">
              <label className="label-field">Período (Año)</label>
              <select className="input-field w-32" value={periodoAnio} onChange={(e) => setPeriodoAnio(Number(e.target.value))}>
                {Array.from({ length: 8 }, (_, i) => hoy.getFullYear() - 3 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label-field">ID Empleado</label>
              <input type="number" min="1" className="input-field" value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)} placeholder="Todos" />
            </div>
            <div>
              <label className="label-field">ID Área</label>
              <input type="number" min="1" className="input-field" value={areaId} onChange={(e) => setAreaId(e.target.value)} placeholder="Todas" />
            </div>
            <div>
              <label className="label-field">ID Sede</label>
              <input type="number" min="1" className="input-field" value={sedeId} onChange={(e) => setSedeId(e.target.value)} placeholder="Todas" />
            </div>
          </div>

          {(tipoReporte === 'justificaciones' || tipoReporte === 'papeletas-movimiento') && (
            <div className="mb-4">
              <label className="label-field">Estado</label>
              <select className="input-field w-48" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option>
                <option value="APROBADO">Aprobado</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
            </div>
          )}

          {tipoReporte === 'papeletas-movimiento' && (
            <div className="mb-4">
              <label className="label-field">Tipo de Papeleta</label>
              <select className="input-field w-48" value={tipoPapeleta} onChange={(e) => setTipoPapeleta(e.target.value)}>
                <option value="">Todos</option>
                <option value="PARTICULAR">Particular</option>
                <option value="COMISION">Comisión</option>
                <option value="SALUD">Salud</option>
              </select>
            </div>
          )}

          {tipoReporte === 'tolerancias' && (
            <div className="mb-4">
              <label className="label-field">Categoría</label>
              <select className="input-field w-48" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Todas</option>
                <option value="PUNTUAL">Puntual</option>
                <option value="DENTRO_TOLERANCIA">Dentro de tolerancia</option>
                <option value="TARDANZA">Tardanza</option>
              </select>
            </div>
          )}

          {tipoReporte === 'marcaciones-consolidado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label-field">Tipo de Marca</label>
                <select className="input-field w-48" value={tipoMarca} onChange={(e) => setTipoMarca(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                  <option value="REFRIGERIO_SALIDA">Refrigerio Salida</option>
                  <option value="REFRIGERIO_ENTRADA">Refrigerio Entrada</option>
                </select>
              </div>
              <div>
                <label className="label-field">Estado de Marca</label>
                <select className="input-field w-48" value={estadoMarca} onChange={(e) => setEstadoMarca(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="VALIDA">Válida</option>
                  <option value="INVALIDA">Inválida</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 border border-red-300 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div className="flex gap-2">
            <button onClick={buscarReporte} disabled={cargando} className="px-4 py-2 bg-blue-700 text-white rounded text-sm hover:bg-blue-800 disabled:opacity-50">
              {cargando ? 'Cargando...' : 'Buscar en Pantalla'}
            </button>
            <button onClick={() => descargarFormato('pdf')} className="px-4 py-2 bg-red-700 text-white rounded text-sm hover:bg-red-800">
              Descargar PDF
            </button>
            <button onClick={() => descargarFormato('xlsx')} className="px-4 py-2 bg-green-700 text-white rounded text-sm hover:bg-green-800">
              Descargar Excel
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {paginacion && `Mostrando ${datos.length} de ${paginacion.total} registros`}
            <button onClick={limpiar} className="ml-3 px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600">Limpiar filtros</button>
          </div>
        </div>

        {datos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-blue-900 text-white">
                  {columnasVisibles.map((col) => (
                    <th key={col} className="border border-gray-400 px-2 py-2 whitespace-nowrap text-left">
                      {col.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.map((fila, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {columnasVisibles.map((col) => (
                      <td key={col} className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">
                        {fila[col] !== null && fila[col] !== undefined ? String(fila[col]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && datos.length === 0 && !error && (
          <div className="text-center text-gray-400 py-8 border border-dashed border-gray-300 rounded">
            Seleccione los filtros y presione "Buscar en Pantalla" para ver los datos del reporte.
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportesAsistenciaPage;