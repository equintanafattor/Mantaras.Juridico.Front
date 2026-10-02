"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as api from "../api/diasInhabilesAgendaApi";
import type { BuscarDiasInhabilesRequest, GuardarDiaInhabilRequest } from "../types/diasInhabiles";
import { useInvalidarAgenda } from "./useInvalidarAgenda";
export const diasInhabilesAgendaKeys = {
  listado: (params: BuscarDiasInhabilesRequest) => ["agenda", "dias-inhabiles", "listado", params] as const,
  detalle: (id: number) => ["agenda", "dias-inhabiles", "detalle", id] as const,
};
export function useDiasInhabiles(params: BuscarDiasInhabilesRequest) {
  return useQuery({ queryKey: diasInhabilesAgendaKeys.listado(params), queryFn: ({ signal }) => api.buscarDiasInhabiles(params, signal) });
}
export function useGuardarDiaInhabil() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, request }: { id?: number; request: GuardarDiaInhabilRequest }) => id === undefined ? api.crearDiaInhabil(request) : api.actualizarDiaInhabil(id, request), onSuccess });
}
export function useCambiarActivoDiaInhabil() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, activo }: { id: number; activo: boolean }) => api.cambiarActivoDiaInhabil(id, activo), onSuccess });
}
