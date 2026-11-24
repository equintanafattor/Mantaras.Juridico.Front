"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as api from "../api/diasInhabilesAgendaApi";
import type { ConfirmarImportacionFeriadosRequest } from "../types/diasInhabiles";
import { useInvalidarAgenda } from "./useInvalidarAgenda";
export const importacionFeriadosKeys = {
  estado: (anio: number) => ["agenda", "dias-inhabiles", "importacion", "estado", anio] as const,
  // Fuera de ["agenda"]: invalidar la agenda no debe volver a consultar la fuente oficial.
  vistaPrevia: (anio: number) => ["importacion-feriados", "vista-previa", anio] as const,
};
export function useEstadoImportacionFeriados(anio: number | undefined) {
  return useQuery({ queryKey: importacionFeriadosKeys.estado(anio ?? 0), queryFn: ({ signal }) => api.obtenerEstadoImportacionFeriados(anio!, signal), enabled: anio !== undefined });
}
// La vista previa consulta la fuente oficial desde el backend: sin reintentos automáticos
// ni refrescos en segundo plano, para que lo que se confirma sea lo que el usuario vio.
export function useVistaPreviaImportacionFeriados(anio: number | undefined) {
  return useQuery({
    queryKey: importacionFeriadosKeys.vistaPrevia(anio ?? 0), queryFn: ({ signal }) => api.obtenerVistaPreviaImportacionFeriados(anio!, signal),
    enabled: anio !== undefined, retry: false, staleTime: Infinity, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
}
export function useConfirmarImportacionFeriados() {
  const invalidar = useInvalidarAgenda();
  return useMutation({
    mutationFn: ({ anio, request }: { anio: number; request: ConfirmarImportacionFeriadosRequest }) => api.confirmarImportacionFeriados(anio, request),
    // Se refresca también tras un 409 o un error de red: la base pudo cambiar.
    onSettled: async () => { try { await invalidar(); } catch { /* El resultado se muestra aunque falle el refresco. */ } },
  });
}
