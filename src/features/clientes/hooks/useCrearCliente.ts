"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { crearCliente } from "../api/clientesApi";
import type { CrearClienteRequest } from "../types/types";

export function useCrearCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CrearClienteRequest) => crearCliente(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["clientes"],
      });
    },
  });
}
