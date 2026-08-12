import { apiRequest } from "@/lib/api/apiClient";

import type {
  ActualizarCasoRequest,
  BuscarCasosParams,
  CasoDetalleResponse,
  CasoResponse,
  CrearCasoRequest,
  PagedResponse,
} from "../types/types";

export async function buscarCasos(
  params: BuscarCasosParams,
  signal?: AbortSignal,
): Promise<PagedResponse<CasoResponse>> {
  const query = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
    soloActivos: params.soloActivos.toString(),
  });

  const busqueda = params.busqueda?.trim();

  if (busqueda) {
    query.set("busqueda", busqueda);
  }

  if (params.faseInterna) {
    query.set("faseInterna", params.faseInterna);
  }

  return apiRequest<PagedResponse<CasoResponse>>(
    `/api/casos?${query.toString()}`,
    {
      method: "GET",
      signal,
    },
  );
}

export async function obtenerCasoPorId(
  casoId: number,
  signal?: AbortSignal,
): Promise<CasoDetalleResponse> {
  return apiRequest<CasoDetalleResponse>(`/api/casos/${casoId}`, {
    method: "GET",
    signal,
  });
}

export async function crearCaso(
  request: CrearCasoRequest,
): Promise<CasoResponse> {
  return apiRequest<CasoResponse>("/api/casos", {
    method: "POST",
    body: request,
  });
}

export async function actualizarCaso(
  casoId: number,
  request: ActualizarCasoRequest,
): Promise<CasoResponse> {
  return apiRequest<CasoResponse>(`/api/casos/${casoId}`, {
    method: "PUT",
    body: request,
  });
}

export async function darDeBajaCaso(casoId: number): Promise<void> {
  await apiRequest<void>(`/api/casos/${casoId}`, {
    method: "DELETE",
  });
}

export async function restaurarCaso(casoId: number): Promise<void> {
  await apiRequest<void>(`/api/casos/${casoId}/restaurar`, {
    method: "PATCH",
  });
}
