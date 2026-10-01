"use client";

import { useQuery } from "@tanstack/react-query";
import { buscarAgenda } from "../api/agendaApi";
import { fechaHoyAgenda } from "../lib/agendaForm";
import { parametrosAgendaContexto, proximasAgendaContexto, type ContextoAgenda } from "../lib/agendaContexto";
import { cargarPaginasAgenda } from "../lib/cargarPaginasAgenda";

export function useAgendaContexto(contexto: ContextoAgenda) {
  const hoy = fechaHoyAgenda();
  const params = parametrosAgendaContexto(contexto, hoy);
  return useQuery({
    queryKey: ["agenda", "contexto", contexto.tipo, contexto.id, hoy],
    queryFn: async ({ signal }) => proximasAgendaContexto(await cargarPaginasAgenda(page => buscarAgenda({ ...params, page }, signal)), hoy),
    refetchInterval: 60_000,
  });
}
