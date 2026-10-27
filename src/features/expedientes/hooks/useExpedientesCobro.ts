import { useQuery } from "@tanstack/react-query";

import { buscarExpedientesCobro } from "../api/expedientesApi";
import type { BuscarExpedientesCobroParams } from "../types/types";

export function useExpedientesCobro(params: BuscarExpedientesCobroParams) {
  return useQuery({
    // Bajo "expedientes" para que se refresque al guardar un judicial.
    queryKey: [
      "expedientes",
      "cobro",
      params.page,
      params.pageSize,
      params.busqueda,
      params.soloActivos,
      params.seguimientoVencido,
    ],
    queryFn: ({ signal }) => buscarExpedientesCobro(params, signal),
    placeholderData: (previousData) => previousData,
  });
}
