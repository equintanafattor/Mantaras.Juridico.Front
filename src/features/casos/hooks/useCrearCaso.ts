"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { crearCaso } from "../api/casosApi";
import type { CrearCasoRequest } from "../types/types";

export function useCrearCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CrearCasoRequest) => crearCaso(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["casos"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["clientes"],
      });
    },
  });
}
