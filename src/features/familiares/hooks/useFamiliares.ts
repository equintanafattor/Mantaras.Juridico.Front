"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  desvincularFamiliar,
  obtenerFamiliares,
  vincularFamiliar,
} from "../api/familiaresApi";

import type { VincularFamiliarRequest } from "../types/types";

export function familiaresQueryKey(clienteId: number) {
  return ["clientes", "familiares", clienteId] as const;
}

export function useFamiliares(clienteId: number) {
  return useQuery({
    queryKey: familiaresQueryKey(clienteId),
    queryFn: ({ signal }) => obtenerFamiliares(clienteId, signal),
    enabled: Number.isSafeInteger(clienteId) && clienteId > 0,
    staleTime: 0,
    retry: false,
  });
}

export function useVincularFamiliar(clienteId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: VincularFamiliarRequest) =>
      vincularFamiliar(clienteId, request),

    retry: false,

    // También refresca ante conflictos o una respuesta perdida.
    onSettled: async (_data, _error, request) => {
      await Promise.all(
        [clienteId, request.familiarId].map((id) =>
          queryClient.invalidateQueries({
            queryKey: familiaresQueryKey(id),
            exact: true,
          }),
        ),
      );
    },
  });
}

export function useDesvincularFamiliar(clienteId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (familiarId: number) =>
      desvincularFamiliar(clienteId, familiarId),

    retry: false,

    onSettled: async (_data, _error, familiarId) => {
      await Promise.all(
        [clienteId, familiarId].map((id) =>
          queryClient.invalidateQueries({
            queryKey: familiaresQueryKey(id),
            exact: true,
          }),
        ),
      );
    },
  });
}
