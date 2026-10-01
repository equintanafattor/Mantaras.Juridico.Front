"use client";

import { useQuery, useMutation, skipToken } from "@tanstack/react-query";
import * as api from "../api/agendaApi";
import type { BuscarAgendaRequest, GuardarEntradaAgendaRequest, CambiarEstadoAgendaRequest } from "../types/types";
import { agendaKeys } from "./agendaKeys";
import { useInvalidarAgenda } from "./useInvalidarAgenda";

export function useAgenda(params: BuscarAgendaRequest = {}, enabled = true) {
  return useQuery({ enabled, queryKey: agendaKeys.listado(params), queryFn: ({ signal }) => api.buscarAgenda(params, signal) });
}
export function useEntradaAgenda(id?: number) {
  return useQuery({ queryKey: agendaKeys.entrada(id), queryFn: id === undefined ? skipToken : ({ signal }) => api.obtenerEntradaAgenda(id, signal) });
}
export function useCrearEntradaAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: api.crearEntradaAgenda, onSuccess });
}
export function useCrearVencimientoManual() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: api.crearVencimientoManual, onSuccess });
}
export function useActualizarEntradaAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, request }: { id: number; request: GuardarEntradaAgendaRequest }) => api.actualizarEntradaAgenda(id, request), onSuccess });
}
export function useCambiarEstadoAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, request }: { id: number; request: CambiarEstadoAgendaRequest }) => api.cambiarEstadoAgenda(id, request), onSuccess });
}
