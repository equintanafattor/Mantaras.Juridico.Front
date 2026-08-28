"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { guardarHojaResumen, obtenerHojaResumen } from "../api/hojaResumenApi";

import type { DatosHojaResumen } from "../types/hojaResumen";

export const hojaResumenKey = (casoId: number) =>
  ["hoja-resumen-caso", casoId] as const;

export function useHojaResumen(casoId: number) {
  return useQuery({
    queryKey: hojaResumenKey(casoId),
    queryFn: ({ signal }) => obtenerHojaResumen(casoId, signal),
    enabled: Number.isSafeInteger(casoId) && casoId > 0,
    staleTime: 0,
    retry: false,
  });
}

export function useGuardarHojaResumen(casoId: number) {
  const client = useQueryClient();
  const queryKey = hojaResumenKey(casoId);

  return useMutation({
    mutationFn: (datos: DatosHojaResumen) => guardarHojaResumen(casoId, datos),

    retry: false,

    onSuccess: async (hoja) => {
      await client.cancelQueries({
        queryKey,
        exact: true,
      });

      client.setQueryData(queryKey, hoja);
    },
  });
}
