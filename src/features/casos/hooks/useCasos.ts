import { useQuery } from "@tanstack/react-query";

import { buscarCasos } from "../api/casosApi";
import type { BuscarCasosParams } from "../types/types";

export function useCasos(params: BuscarCasosParams) {
  return useQuery({
    queryKey: [
      "casos",
      params.page,
      params.pageSize,
      params.busqueda,
      params.faseInterna,
      params.soloActivos,
    ],
    queryFn: ({ signal }) => buscarCasos(params, signal),
    placeholderData: (previousData) => previousData,
  });
}
