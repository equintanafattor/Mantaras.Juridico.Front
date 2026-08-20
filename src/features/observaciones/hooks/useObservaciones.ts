"use client";

import { useQuery } from "@tanstack/react-query";

import { obtenerObservaciones } from "../api/observacionesApi";
import type { EntidadObservacion } from "../types/types";

export function observacionesQueryKey(
  entidad: EntidadObservacion,
  propietarioId: number,
) {
  return ["observaciones", entidad, propietarioId] as const;
}

export function useObservaciones(
  entidad: EntidadObservacion,
  propietarioId: number,
) {
  return useQuery({
    queryKey: observacionesQueryKey(entidad, propietarioId),
    queryFn: ({ signal }) =>
      obtenerObservaciones(entidad, propietarioId, signal),
  });
}
