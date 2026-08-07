import { useQuery } from "@tanstack/react-query";

import { obtenerClientePorId } from "../api/clientesApi";

export function useCliente(clienteId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["cliente", clienteId],
    queryFn: ({ signal }) => obtenerClientePorId(clienteId!, signal),
    enabled: enabled && clienteId !== null,
  });
}
