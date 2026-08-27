"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { crearCaso } from "../api/casosApi";
import type { CrearCasoRequest } from "../types/types";

export function useCrearCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CrearCasoRequest) => crearCaso(request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["casos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["clientes"],
        }),
        queryClient.invalidateQueries({ queryKey: ["cliente"] }),
        queryClient.invalidateQueries({
          queryKey: ["panel"],
        }),
      ]);
    },
  });
}
