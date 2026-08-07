import { useMutation, useQueryClient } from "@tanstack/react-query";

import { darDeBajaCliente, reactivarCliente } from "../api/clientesApi";
import type { ClienteDetalleResponse } from "../types/types";

type CambiarEstadoClienteVariables = {
  clienteId: number;
  activar: boolean;
};

export function useCambiarEstadoCliente() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CambiarEstadoClienteVariables>({
    mutationFn: ({ clienteId, activar }) =>
      activar ? reactivarCliente(clienteId) : darDeBajaCliente(clienteId),

    onSuccess: (_, variables) => {
      queryClient.setQueryData<ClienteDetalleResponse>(
        ["cliente", variables.clienteId],
        (clienteActual) =>
          clienteActual
            ? {
                ...clienteActual,
                activo: variables.activar,
              }
            : clienteActual,
      );

      void queryClient.invalidateQueries({
        queryKey: ["cliente", variables.clienteId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["clientes"],
      });
    },
  });
}
