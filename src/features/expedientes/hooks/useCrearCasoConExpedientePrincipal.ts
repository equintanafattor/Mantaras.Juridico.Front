"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { crearCasoConExpedientePrincipal } from "../api/expedientesApi";
import type { CrearCasoConExpedientePrincipalRequest } from "../types/types";

export function useCrearCasoConExpedientePrincipal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CrearCasoConExpedientePrincipalRequest) =>
      crearCasoConExpedientePrincipal(request),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["casos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["expedientes"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["clientes"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["panel"],
        }),
      ]);
    },
  });
}
