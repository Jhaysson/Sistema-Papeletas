export const LIMITE_MAXIMO = 2000;
export const LIMITE_DEFECTO = 100;

export function normalizarPaginacion(limit, offset) {
  const lim = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : LIMITE_DEFECTO;
  const off = Number.isInteger(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;
  return {
    limit: Math.min(lim, LIMITE_MAXIMO),
    offset: off
  };
}

export function construirRespuestaPaginada(data, total, limit, offset) {
  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      page: limit > 0 ? Math.floor(offset / limit) + 1 : 1,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    }
  };
}