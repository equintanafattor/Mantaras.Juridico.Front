"use client";

import { useQuery, useMutation, skipToken } from "@tanstack/react-query";
import * as api from "../api/recordatoriosApi";
import type { BuscarRecordatoriosAgendaRequest, CrearRecordatorioAgendaRequest, GuardarRecordatoriosPredeterminadosRequest } from "../types/types";
import { agendaKeys } from "./agendaKeys";
import { useInvalidarAgenda } from "./useInvalidarAgenda";

export function useRecordatoriosAgenda(params: BuscarRecordatoriosAgendaRequest = {}, refetchInterval: number | false = false) {
  return useQuery({ refetchInterval, queryKey: agendaKeys.recordatorios(params), queryFn: ({ signal }) => api.buscarRecordatoriosAgenda(params, signal) });
}
export function useCrearRecordatorioAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, request }: { id: number; request: CrearRecordatorioAgendaRequest }) => api.crearRecordatorioAgenda(id, request), onSuccess });
}
export function useAtenderRecordatorioAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: api.atenderRecordatorioAgenda, onSuccess });
}
export function useRecordatoriosPredeterminados(origen: api.OrigenRecordatoriosPredeterminados, id?: number) {
  return useQuery({ queryKey: agendaKeys.predeterminados(origen, id), queryFn: id === undefined ? skipToken : ({ signal }) => api.obtenerRecordatoriosPredeterminados(origen, id, signal) });
}
export function useGuardarRecordatoriosPredeterminados() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ origen, id, request }: { origen: api.OrigenRecordatoriosPredeterminados; id: number; request: GuardarRecordatoriosPredeterminadosRequest }) => api.guardarRecordatoriosPredeterminados(origen, id, request), onSuccess });
}

export function useReprogramarRecordatorioAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, request }: { id: number; request: CrearRecordatorioAgendaRequest }) => api.reprogramarRecordatorioAgenda(id, request), onSuccess });
}
export function useQuitarRecordatorioAgenda() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: api.quitarRecordatorioAgenda, onSuccess });
}
