"use client";

import { useQueries } from "@tanstack/react-query";
import { buscarDiasInhabiles } from "../api/diasInhabilesAgendaApi";
import { aniosEnRango, diasInhabilesPorFecha } from "../lib/diasInhabilesCalendario";
import type { DiaInhabilResponse } from "../types/diasInhabiles";

// La API filtra por año y pagina de a 100 como máximo: se piden todas las páginas
// de cada año visible para no ocultar fechas.
async function cargarAnio(anio: number, signal: AbortSignal) {
  const dias = new Map<number, DiaInhabilResponse>();
  for (let page = 1, total = 1; page <= total; page++) {
    const respuesta = await buscarDiasInhabiles({ anio, soloActivos: true, page, pageSize: 100 }, signal);
    if (respuesta.page !== page) throw new Error("La API devolvió una página de días inhábiles inesperada.");
    total = respuesta.totalPages;
    for (const dia of respuesta.items) dias.set(dia.diaInhabilId, dia);
  }
  return Array.from(dias.values());
}

// Bajo ["agenda"]: se refresca al importar, crear, editar, desactivar o reactivar un día inhábil.
export function useDiasInhabilesCalendario(rango: { desde: string; hasta: string }) {
  const consultas = useQueries({
    queries: aniosEnRango(rango.desde, rango.hasta).map(anio => ({
      queryKey: ["agenda", "dias-inhabiles", "calendario", anio] as const,
      queryFn: ({ signal }: { signal: AbortSignal }) => cargarAnio(anio, signal),
    })),
  });
  const error = consultas.find(c => c.isError)?.error;
  return {
    porFecha: diasInhabilesPorFecha(consultas.flatMap(c => c.data ?? []), rango.desde, rango.hasta),
    isPending: consultas.some(c => c.isPending),
    isFetching: consultas.some(c => c.isFetching),
    error,
    refetch: () => Promise.all(consultas.map(c => c.refetch())),
  };
}
