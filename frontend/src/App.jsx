import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import Encabezado from './components/Encabezado.jsx';
import ReportesPage from './components/ReportesPage.jsx';
import ReportesAsistenciaPage from './components/ReportesAsistenciaPage.jsx';
import { registrarPapeleta, obtenerPapeletas } from './services/api.js';

const PAGINAS = {
  FORMULARIO: 'formulario',
  REPORTES: 'reportes',
  REPORTES_ASISTENCIA: 'reportes_asistencia'
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function Navegacion({ paginaActual, cambiarPagina, mostrarFormulario, setMostrarFormulario }) {
  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="font-bold tracking-wide text-lg">SIGA - Sistema de Papeletas</div>
        <div className="flex gap-2">
          <button
            onClick={() => { cambiarPagina(PAGINAS.FORMULARIO); setMostrarFormulario(false); }}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              paginaActual === PAGINAS.FORMULARIO && !mostrarFormulario
                ? 'bg-white text-blue-900'
                : 'hover:bg-blue-800'
            }`}
          >
            Papeletas
          </button>
          {!mostrarFormulario && (
            <button
              onClick={() => { cambiarPagina(PAGINAS.FORMULARIO); setMostrarFormulario(true); }}
              className="px-4 py-2 rounded text-sm font-medium transition bg-blue-600 hover:bg-blue-500"
            >
              Nueva Papeleta
            </button>
          )}
          <button
            onClick={() => { cambiarPagina(PAGINAS.REPORTES); setMostrarFormulario(false); }}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              paginaActual === PAGINAS.REPORTES
                ? 'bg-white text-blue-900'
                : 'hover:bg-blue-800'
            }`}
          >
            Reportes PDF
          </button>
          <button
            onClick={() => { cambiarPagina(PAGINAS.REPORTES_ASISTENCIA); setMostrarFormulario(false); }}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              paginaActual === PAGINAS.REPORTES_ASISTENCIA
                ? 'bg-white text-blue-900'
                : 'hover:bg-blue-800'
            }`}
          >
            Asistencia
          </button>
        </div>
      </div>
    </nav>
  );
}

function ListaPapeletas() {
  const hoy = new Date();
  const [dia, setDia] = React.useState(hoy.getDate());
  const [mes, setMes] = React.useState(hoy.getMonth() + 1);
  const [anio, setAnio] = React.useState(hoy.getFullYear());
  const [papeletas, setPapeletas] = React.useState([]);
  const [cargando, setCargando] = React.useState(false);
  const [buscado, setBuscado] = React.useState(false);

  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const anios = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  const buscar = async () => {
    const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    setCargando(true);
    try {
      const res = await obtenerPapeletas(fechaStr);
      setPapeletas(res.data);
    } catch {
      setPapeletas([]);
    } finally {
      setCargando(false);
      setBuscado(true);
    }
  };

  const limpiar = () => {
    setPapeletas([]);
    setBuscado(false);
  };

  const motivoPapeleta = (p) => {
    const motivos = [];
    if (p.motivo_comision) motivos.push('Comisión');
    if (p.motivo_personales) motivos.push('Personales');
    if (p.motivo_otros) motivos.push(`Otros${p.motivo_otros_descripcion ? `: ${p.motivo_otros_descripcion}` : ''}`);
    return motivos.join(', ') || '-';
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
            PAPELETAS REGISTRADAS
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Consulte las papeletas por día
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-6 p-4 border border-gray-300 rounded bg-gray-50">
          <div>
            <label className="label-field">Día</label>
            <select
              className="input-field w-24"
              value={dia}
              onChange={(e) => setDia(Number(e.target.value))}
            >
              {dias.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Mes</label>
            <select
              className="input-field w-40"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {MESES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Año</label>
            <select
              className="input-field w-28"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            >
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <button
            onClick={buscar}
            disabled={cargando}
            className="px-4 py-2 bg-blue-700 text-white rounded text-sm hover:bg-blue-800 disabled:opacity-50"
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            onClick={limpiar}
            className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Limpiar
          </button>
        </div>

        {buscado && papeletas.length === 0 && (
          <div className="text-center text-gray-500 py-8 border border-dashed border-gray-300 rounded">
            No hay papeletas registradas para esta fecha.
          </div>
        )}

        {papeletas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border border-gray-400 px-3 py-2">N° Tarjeta</th>
                  <th className="border border-gray-400 px-3 py-2">Nombre y Apellidos</th>
                  <th className="border border-gray-400 px-3 py-2">Oficina</th>
                  <th className="border border-gray-400 px-3 py-2">Motivo</th>
                  <th className="border border-gray-400 px-3 py-2">Hora Salida</th>
                  <th className="border border-gray-400 px-3 py-2">Hora Retorno</th>
                </tr>
              </thead>
              <tbody>
                {papeletas.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-3 py-2 text-center">{p.numero_tarjeta}</td>
                    <td className="border border-gray-400 px-3 py-2">{p.nombre_apellidos}</td>
                    <td className="border border-gray-400 px-3 py-2">{p.oficina}</td>
                    <td className="border border-gray-400 px-3 py-2">{motivoPapeleta(p)}</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{p.hora_salida}</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{p.hora_retorno || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-gray-500 mt-2 text-right">
              Total: {papeletas.length} papeleta{papeletas.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {!buscado && (
          <div className="text-center text-gray-400 py-8 border border-dashed border-gray-300 rounded">
            Seleccione una fecha y presione "Buscar" para ver las papeletas.
          </div>
        )}
      </div>
    </div>
  );
}

function DatosTrabajador({ register }) {
  return (
    <section className="border border-gray-400 rounded p-4 mb-4">
      <h2 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
        Datos del Trabajador
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label-field">Nombre y Apellidos</label>
          <input type="text" className="input-field" {...register('nombre_apellidos', { required: true })} />
        </div>
        <div>
          <label className="label-field">Nº de Tarjeta</label>
          <input type="number" min="1" className="input-field" {...register('numero_tarjeta', { required: true, min: 1 })} />
        </div>
        <div>
          <label className="label-field">Oficina</label>
          <input type="text" className="input-field" {...register('oficina', { required: true })} />
        </div>
      </div>
    </section>
  );
}

function MotivoSalida({ register, watch, setValue }) {
  const motivoOtros = watch('motivo_otros');

  const seleccionarMotivo = (campo) => {
    setValue('motivo_comision', campo === 'comision');
    setValue('motivo_personales', campo === 'personales');
    setValue('motivo_otros', campo === 'otros');
  };

  return (
    <section className="border border-gray-400 rounded p-4 mb-4">
      <h2 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
        Motivo de Salida
      </h2>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox-field"
            {...register('motivo_comision')}
            onChange={() => seleccionarMotivo('comision')}
          />
          Comisión de servicios
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox-field"
            {...register('motivo_personales')}
            onChange={() => seleccionarMotivo('personales')}
          />
          Asuntos personales
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox-field"
            {...register('motivo_otros')}
            onChange={() => seleccionarMotivo('otros')}
          />
          Otros
        </label>
        {motivoOtros && (
          <input
            type="text"
            placeholder="Especifique otros"
            className="input-field md:w-64"
            {...register('motivo_otros_descripcion')}
          />
        )}
      </div>
    </section>
  );
}

function ControlPorteria({ register }) {
  return (
    <section className="border border-gray-400 rounded p-4 mb-4">
      <h2 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
        Control de Portería
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="label-field">Fecha de salida</label>
          <input type="date" className="input-field" {...register('fecha_salida', { required: true })} />
        </div>
        <div>
          <label className="label-field">Hora de salida</label>
          <input type="time" className="input-field" {...register('hora_salida', { required: true })} />
        </div>
        <div>
          <label className="label-field">Horario de retorno</label>
          <input type="time" className="input-field" {...register('hora_retorno')} />
        </div>
        <div>
          <label className="label-field">Fecha de retorno</label>
          <input type="date" className="input-field" {...register('fecha_retorno')} />
        </div>
      </div>
    </section>
  );
}

function Establecimientos({ register, campos, append, remove }) {
  return (
    <section className="border border-gray-400 rounded p-4 mb-4">
      <div className="flex justify-between items-center mb-3 border-b border-gray-300 pb-1">
        <h2 className="font-semibold text-gray-800">Establecimientos Visitados</h2>
        <button
          type="button"
          onClick={() => append({})}
          className="px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-800"
        >
          + Agregar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="border border-gray-400 px-2 py-1 w-10">N°</th>
              <th className="border border-gray-400 px-2 py-1">Institución visitada</th>
              <th className="border border-gray-400 px-2 py-1">Lugar</th>
              <th className="border border-gray-400 px-2 py-1 w-32">Hora llegada</th>
              <th className="border border-gray-400 px-2 py-1 w-32">Hora retorno</th>
              <th className="border border-gray-400 px-2 py-1 w-12">Acción</th>
            </tr>
          </thead>
          <tbody>
            {campos.map((campo, index) => (
              <tr key={campo.id}>
                <td className="border border-gray-400 px-2 py-1 text-center">{index + 1}</td>
                <td className="border border-gray-400 px-2 py-1">
                  <input type="text" className="w-full px-1 py-0.5" {...register(`establecimientos.${index}.institucion`)} />
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  <input type="text" className="w-full px-1 py-0.5" {...register(`establecimientos.${index}.lugar`)} />
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  <input type="time" className="w-full px-1 py-0.5" {...register(`establecimientos.${index}.hora_llegada`)} />
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  <input type="time" className="w-full px-1 py-0.5" {...register(`establecimientos.${index}.hora_retorno`)} />
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DetalleYFirmas({ register }) {
  return (
    <section className="border border-gray-400 rounded p-4 mb-4">
      <h2 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
        Detalle de Acciones Cumplidas
      </h2>
      <textarea
        className="input-field w-full mb-4"
        rows="4"
        placeholder="Detalle de las acciones o gestiones realizadas durante la salida..."
        {...register('detalle_acciones')}
      />
      <h2 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
        Firmas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <label className="label-field">Firma del Trabajador</label>
          <input type="text" className="input-field text-center" {...register('firma_trabajador')} />
        </div>
        <div>
          <label className="label-field">Jefe Inmediato</label>
          <input type="text" className="input-field text-center" {...register('firma_jefe')} />
        </div>
        <div>
          <label className="label-field">Funcionario que Autoriza la Salida</label>
          <input type="text" className="input-field text-center" {...register('firma_funcionario')} />
        </div>
      </div>
    </section>
  );
}

function PapeletaForm({ onRegistrado }) {
  const { register, handleSubmit, reset, watch, control, setValue } = useForm({
    defaultValues: {
      establecimientos: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'establecimientos' });
  const [guardando, setGuardando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState(null);
  const numeroTarjeta = watch('numero_tarjeta');

  const onSubmit = async (data) => {
    setGuardando(true);
    setMensaje(null);
    try {
      const establecimientosFiltrados = (data.establecimientos || []).filter(
        (e) => e.institucion || e.lugar
      );
      await registrarPapeleta({ ...data, establecimientos: establecimientosFiltrados });
      setMensaje({ tipo: 'exito', texto: 'Papeleta registrada correctamente' });
      reset({ establecimientos: [] });
      setTimeout(() => {
        setMensaje(null);
        onRegistrado();
      }, 1500);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al registrar la papeleta' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-lg p-8">
        <Encabezado numeroTarjeta={numeroTarjeta} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DatosTrabajador register={register} />
          <MotivoSalida register={register} watch={watch} setValue={setValue} />
          <ControlPorteria register={register} />
          <Establecimientos
            register={register}
            campos={fields}
            append={append}
            remove={remove}
          />
          <DetalleYFirmas register={register} />

          {mensaje && (
            <div
              className={`mb-4 p-3 rounded text-sm ${
                mensaje.tipo === 'exito'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {mensaje.texto}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => reset({ establecimientos: [] })}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Registrar Papeleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [paginaActual, setPaginaActual] = React.useState(PAGINAS.FORMULARIO);
  const [mostrarFormulario, setMostrarFormulario] = React.useState(false);

  return (
    <div>
      <Navegacion
        paginaActual={paginaActual}
        cambiarPagina={setPaginaActual}
        mostrarFormulario={mostrarFormulario}
        setMostrarFormulario={setMostrarFormulario}
      />
      {paginaActual === PAGINAS.REPORTES && <ReportesPage />}
      {paginaActual === PAGINAS.REPORTES_ASISTENCIA && <ReportesAsistenciaPage />}
      {paginaActual === PAGINAS.FORMULARIO && !mostrarFormulario && (
        <ListaPapeletas />
      )}
      {paginaActual === PAGINAS.FORMULARIO && mostrarFormulario && (
        <PapeletaForm onRegistrado={() => setMostrarFormulario(false)} />
      )}
    </div>
  );
}

export default App;
