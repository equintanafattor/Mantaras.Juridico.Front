import { useMutation, useQueryClient } from "@tanstack/react-query";

import { actualizarCliente } from "../api/clientesApi";
import type {
  ActualizarClienteRequest,
  ClienteDetalleResponse,
} from "../types/types";

type ActualizarClienteVariables = {
  clienteId: number;
  request: ActualizarClienteRequest;
};

export function useActualizarCliente() {
  const queryClient = useQueryClient();

  return useMutation<ClienteDetalleResponse, Error, ActualizarClienteVariables>(
    {
      mutationFn: ({ clienteId, request }) =>
        actualizarCliente(clienteId, request),

      onSuccess: (cliente, variables) => {
        queryClient.setQueryData(["cliente", variables.clienteId], cliente);

        void queryClient.invalidateQueries({
          queryKey: ["clientes"],
        });
      },
    },
  );
}
