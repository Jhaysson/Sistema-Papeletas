import React from 'react';

const PAPELETA_HEADER = 'SISTEMA DE PAPELETAS';

function Encabezado({ numeroTarjeta }) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
        {PAPELETA_HEADER}
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Control de salidas del personal
      </p>
      {numeroTarjeta && (
        <p className="text-sm text-gray-500 mt-1">
          Nº de Tarjeta: {numeroTarjeta}
        </p>
      )}
    </div>
  );
}

export default Encabezado;