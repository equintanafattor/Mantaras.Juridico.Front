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

  return useMutation({
    mutationFn: (texto: string) =>
      crearObservacion(entidad, propietarioId, {
        texto,
      }),

    onSuccess: async (nuevaObservacion) => {
      queryClient.setQueryData<ObservacionResponse[]>(
        observacionesQueryKey(entidad, propietarioId),
        (observacionesActuales = []) => [
          nuevaObservacion,
          ...observacionesActuales.filter(
            (observacion) =>
              observacion.observacionId !== nuevaObservacion.observacionId,
          ),
        ],
      );

      await queryClient.invalidateQueries({
        queryKey: [entidad],
      });
    },
  });
}
