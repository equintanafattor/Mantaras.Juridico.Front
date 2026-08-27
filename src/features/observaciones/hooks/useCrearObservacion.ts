"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { crearObservacion } from "../api/observacionesApi";
import type { EntidadObservacion, ObservacionResponse } from "../types/types";
import { observacionesQueryKey } from "./useObservaciones";

export function useCrearObservacion(
  entidad: EntidadObservacion,
  propietarioId: number,
) {
  const queryClient = useQueryClient();
  const queryKey = observacionesQueryKey(entidad, propietarioId);

  return useMutation({
    mutationFn: (texto: string) =>
      crearObservacion(entidad, propietarioId, { texto }),

    onSuccess: async (nuevaObservacion) => {
      await queryClient.cancelQueries({ queryKey, exact: true });

      queryClient.setQueryData<ObservacionResponse[]>(queryKey, (actuales) => {
        // Si todavía no cargamos el historial, no crear una lista parcial
        // que contenga únicamente el registro nuevo.
        if (actuales === undefined) return undefined;

        return [
          nuevaObservacion,
          ...actuales.filter(
            (item) => item.observacionId !== nuevaObservacion.observacionId,
          ),
        ];
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey, exact: true }),
        queryClient.invalidateQueries({ queryKey: [entidad] }),
        ...(entidad === "clientes"
          ? [
              queryClient.invalidateQueries({
                queryKey: ["cliente", propietarioId],
              }),
            ]
          : []),
      ]);
    },
  });
}
