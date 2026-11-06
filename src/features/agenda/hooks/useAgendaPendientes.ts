"use client";

import { useQuery } from "@tanstack/react-query";
import { buscarAgenda } from "../api/agendaApi";
import { fechaHoyAgenda } from "../lib/agendaForm";
import { cargarPaginasAgenda } from "../lib/cargarPaginasAgenda";
import { parametrosFiltrosAgenda, type FiltrosAgenda } from "../lib/filtrosAgenda";
import { sumarDias } from "../lib/situacionAgenda";

export const DIAS_PENDIENTES = 30;

// Lo abierto (Pendiente, En curso, Pospuesta) ordenado por fecha de referencia.
// Sin "desde" para incluir lo vencido y atrasado. diasAdelante null: sin límite.
export function useAgendaPendientes(filtros: FiltrosAgenda, { enabled = true, diasAdelante = DIAS_PENDIENTES }: { enabled?: boolean; diasAdelante?: number | null } = {}) {
  const hoy = fechaHoyAgenda();
  const hasta = diasAdelante === null ? undefined : sumarDias(hoy, diasAdelante);
  const params = { ...parametrosFiltrosAgenda(filtros), estado: undefined };
  return useQuery({
    enabled,
    queryKey: ["agenda", "pendientes", hoy, hasta, params],
    queryFn: async ({ signal }) => ({
      hoy,
      entradas: await cargarPaginasAgenda(page => buscarAgenda({
        ...params, hasta, page, pageSize: 100, soloActivos: true, soloAbiertas: true, orden: "Referencia", incluirVencimientos: true,
      }, signal)),
    }),
    refetchInterval: 60_000,
  });
}
