"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  darDeBajaExpediente,
  restaurarExpediente,
} from "../api/expedientesApi";

type CambiarEstadoExpedienteVariables = {
  expedienteId: number;
  activar: boolean;
};

export function useCambiarEstadoExpediente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      expedienteId,
      activar,
    }: CambiarEstadoExpedienteVariables) =>
      activar
        ? restaurarExpediente(expedienteId)
        : darDeBajaExpediente(expedienteId),

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
