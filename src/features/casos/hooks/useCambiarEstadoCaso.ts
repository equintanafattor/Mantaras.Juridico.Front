"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { darDeBajaCaso, restaurarCaso } from "../api/casosApi";

type CambiarEstadoCasoVariables = {
  casoId: number;
  activar: boolean;
};

export function useCambiarEstadoCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ casoId, activar }: CambiarEstadoCasoVariables) =>
      activar ? restaurarCaso(casoId) : darDeBajaCaso(casoId),

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
