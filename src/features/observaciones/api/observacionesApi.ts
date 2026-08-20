import { apiRequest } from "@/lib/api/apiClient";

import type {
  CrearObservacionRequest,
  EntidadObservacion,
  ObservacionResponse,
} from "../types/types";

export async function obtenerObservaciones(
  entidad: EntidadObservacion,
  propietarioId: number,
  signal?: AbortSignal,
): Promise<ObservacionResponse[]> {
  return apiRequest<ObservacionResponse[]>(
    `/api/${entidad}/${propietarioId}/observaciones`,
    {
      method: "GET",
      signal,
    },
  );
}

export async function crearObservacion(
  entidad: EntidadObservacion,
  propietarioId: number,
  request: CrearObservacionRequest,
): Promise<ObservacionResponse> {
  return apiRequest<ObservacionResponse>(
    `/api/${entidad}/${propietarioId}/observaciones`,
    {
      method: "POST",
      body: request,
    },
  );
}
