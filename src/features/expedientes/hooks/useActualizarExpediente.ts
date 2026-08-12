"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { actualizarExpediente } from "../api/expedientesApi";
import type { ActualizarExpedienteRequest } from "../types/types";

type ActualizarExpedienteVariables = {
  expedienteId: number;
  request: ActualizarExpedienteRequest;
};

export function useActualizarExpediente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expedienteId, request }: ActualizarExpedienteVariables) =>
      actualizarExpediente(expedienteId, request),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["expedientes"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["expedientes", "detalle", variables.expedienteId],
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
