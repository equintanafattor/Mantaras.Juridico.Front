"use client";

import { useQuery } from "@tanstack/react-query";
import { buscarAgenda } from "../api/agendaApi";
import { rangoCalendario } from "../lib/calendarioAgenda";
import { cargarPaginasAgenda } from "../lib/cargarPaginasAgenda";

export function useAgendaCalendario(mes: string) {
  const rango = rangoCalendario(mes);
  return useQuery({
    queryKey: ["agenda", "calendario", rango],
    queryFn: ({ signal }) => cargarPaginasAgenda((page) => buscarAgenda({
      ...rango, page, pageSize: 100, soloActivos: true, incluirVencimientos: true,
    }, signal)),
  });
}
