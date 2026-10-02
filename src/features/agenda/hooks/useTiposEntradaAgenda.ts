"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as api from "../api/tiposEntradaAgendaApi";
import type { BuscarTiposEntradaAgendaRequest, GuardarTipoEntradaAgendaRequest } from "../types/tiposEntrada";
import { useInvalidarAgenda } from "./useInvalidarAgenda";
export const tiposEntradaAgendaKeys = {
  listado: (params: BuscarTiposEntradaAgendaRequest) => ["agenda", "tipos-entrada", "listado", params] as const,
  detalle: (id: number) => ["agenda", "tipos-entrada", "detalle", id] as const,
};
export function useTiposEntradaAgenda(params: BuscarTiposEntradaAgendaRequest) {
  return useQuery({ queryKey: tiposEntradaAgendaKeys.listado(params), queryFn: ({ signal }) => api.buscarTiposEntradaAgenda(params, signal) });
}
export function useGuardarTipoEntradaAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, request }: { id?: number; request: GuardarTipoEntradaAgendaRequest }) => id === undefined ? api.crearTipoEntradaAgenda(request) : api.actualizarTipoEntradaAgenda(id, request), onSuccess });
}
export function useCambiarActivoTipoEntradaAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, activo }: { id: number; activo: boolean }) => api.cambiarActivoTipoEntradaAgenda(id, activo), onSuccess });
}
