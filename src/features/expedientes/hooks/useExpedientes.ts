import { useQuery } from "@tanstack/react-query";

import { buscarExpedientes } from "../api/expedientesApi";
import type { BuscarExpedientesParams } from "../types/types";

export function useExpedientes(
  params: BuscarExpedientesParams,
  enabled = true,
  keepPreviousData = true,
) {
  return useQuery({
    queryKey: [
      "expedientes",
      "listado",
      params.page,
      params.pageSize,
      params.casoId,
      params.busqueda,
      params.soloActivos,
    ],
    queryFn: ({ signal }) => buscarExpedientes(params, signal),
    placeholderData: keepPreviousData
      ? (previousData) => previousData
      : undefined,
    enabled,
  });
}
