"use client";

import { useQuery, useMutation, skipToken } from "@tanstack/react-query";
import * as api from "../api/reglasVencimientoApi";
import type { GuardarReglaVencimientoRequest, AplicarReglaVencimientoRequest } from "../types/types";
import { agendaKeys } from "./agendaKeys";
import { useInvalidarAgenda } from "./useInvalidarAgenda";

export function useReglasVencimiento(soloActivas = true) {
  return useQuery({ queryKey: agendaKeys.reglas(soloActivas), queryFn: ({ signal }) => api.obtenerReglasVencimiento(soloActivas, signal) });
}
export function useReglaVencimiento(id?: number) {
  return useQuery({ queryKey: agendaKeys.regla(id), queryFn: id === undefined ? skipToken : ({ signal }) => api.obtenerReglaVencimiento(id, signal) });
}
export function useCrearReglaVencimiento() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: api.crearReglaVencimiento, onSuccess });
}
export function useActualizarReglaVencimiento() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, request }: { id: number; request: GuardarReglaVencimientoRequest }) => api.actualizarReglaVencimiento(id, request), onSuccess });
}
export function useAplicarReglaVencimiento() {
  const onSuccess = useInvalidarAgenda();
  return useMutation({ mutationFn: ({ id, request }: { id: number; request: AplicarReglaVencimientoRequest }) => api.aplicarReglaVencimiento(id, request), onSuccess });
}
