"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { actualizarCaso } from "../api/casosApi";
import type { ActualizarCasoRequest } from "../types/types";

type ActualizarCasoVariables = {
  casoId: number;
  request: ActualizarCasoRequest;
};

export function useActualizarCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ casoId, request }: ActualizarCasoVariables) =>
      actualizarCaso(casoId, request),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["casos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["casos", "detalle", variables.casoId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["clientes"],
        }),
      ]);
    },
  });
}
