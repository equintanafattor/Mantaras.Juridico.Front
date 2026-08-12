"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { crearExpediente } from "../api/expedientesApi";
import type { CrearExpedienteRequest } from "../types/types";

export function useCrearExpediente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CrearExpedienteRequest) => crearExpediente(request),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["expedientes"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["casos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["clientes"],
        }),
      ]);
    },
  });
}
