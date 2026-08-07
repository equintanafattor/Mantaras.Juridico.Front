import { useQuery } from "@tanstack/react-query";

import { buscarClientes } from "../api/clientesApi";
import type { BuscarClientesParams } from "../types/types";

export function useClientes(params: BuscarClientesParams) {
  return useQuery({
    queryKey: [
      "clientes",
      params.page,
      params.pageSize,
      params.busqueda,
      params.soloActivos,
    ],
    queryFn: ({ signal }) => buscarClientes(params, signal),
    placeholderData: (previousData) => previousData,
  });
}