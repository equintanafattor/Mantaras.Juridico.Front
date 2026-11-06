"use client";

import { useQuery } from "@tanstack/react-query";
import { buscarAgenda } from "../api/agendaApi";
import { fechaHoyAgenda } from "../lib/agendaForm";
import { cargarPaginasAgenda } from "../lib/cargarPaginasAgenda";
import { parametrosFiltrosAgenda, type FiltrosAgenda } from "../lib/filtrosAgenda";
import { ESTADOS_ABIERTOS, sumarDias } from "../lib/situacionAgenda";

export const DIAS_PENDIENTES = 30;

// La API filtra un solo estado por consulta: se pide cada estado abierto y se unen.
// Sin "desde" para incluir lo vencido y atrasado. Ver brief de backend (filtro "abiertas").
// diasAdelante null: sin límite hacia adelante.
export function useAgendaPendientes(filtros: FiltrosAgenda, { enabled = true, diasAdelante = DIAS_PENDIENTES }: { enabled?: boolean; diasAdelante?: number | null } = {}) {
  const hoy = fechaHoyAgenda();
  const hasta = diasAdelante === null ? undefined : sumarDias(hoy, diasAdelante);
  const params = { ...parametrosFiltrosAgenda(filtros), estado: undefined };
  return useQuery({
    enabled,
    queryKey: ["agenda", "pendientes", hoy, hasta, params],
    queryFn: async ({ signal }) => {
      const resultados = await Promise.all(ESTADOS_ABIERTOS.map(estado => cargarPaginasAgenda(page => buscarAgenda({
        ...params, estado, hasta, page, pageSize: 100, soloActivos: true, incluirVencimientos: true,
      }, signal))));
      return { hoy, entradas: resultados.flat() };
    },
    refetchInterval: 60_000,
  });
}
