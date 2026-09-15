import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import Encabezado from './components/Encabezado.jsx';
import ReportesPage from './components/ReportesPage.jsx';
import { registrarPapeleta } from './services/api.js';

const PAGINAS = {
  FORMULARIO: 'formulario',
  REPORTES: 'reportes'
};

function Navegacion({ paginaActual, cambiarPagina }) {
  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="font-bold tracking-wide text-lg">SIGA - Sistema de Papeletas</div>
        <div className="flex gap-2">
          <button
            onClick={() => cambiarPagina(PAGINAS.FORMULARIO)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              paginaActual === PAGINAS.FORMULARIO
                ? 'bg-white text-blue-900'
                : 'hover:bg-blue-800'
            }`}
          >
            Nueva Papeleta
          </button>
          <button
            onClick={() => cambiarPagina(PAGINAS.REPORTES)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              paginaActual === PAGINAS.REPORTES
                ? 'bg-white text-blue-900'
                : 'hover:bg-blue-800'
            }`}
          >
            Reportes PDF
          </button>
        </div>
      </div>
    </nav>
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

function PapeletaForm() {
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

  return (
    <div>
      <Navegacion paginaActual={paginaActual} cambiarPagina={setPaginaActual} />
      {paginaActual === PAGINAS.FORMULARIO ? <PapeletaForm /> : <ReportesPage />}
    </div>
  );
}

export default App;