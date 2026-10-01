"use client";

import { useQuery, skipToken } from "@tanstack/react-query";
import { buscarAgenda } from "../api/agendaApi";
import { parametrosFiltrosAgenda, rangoCalendarioFiltrado, type FiltrosAgenda } from "../lib/filtrosAgenda";
import { cargarPaginasAgenda } from "../lib/cargarPaginasAgenda";

export function useAgendaCalendario(mes: string, filtros: FiltrosAgenda) {
  const rango = rangoCalendarioFiltrado(mes, filtros);
  const params = parametrosFiltrosAgenda(filtros);
  return useQuery({
    queryKey: ["agenda", "calendario", rango, params],
    queryFn: rango === null ? skipToken : ({ signal }) => cargarPaginasAgenda((page) => buscarAgenda({
      ...params, ...rango, page, pageSize: 100, soloActivos: true, incluirVencimientos: true,
    }, signal)),
  });
}
