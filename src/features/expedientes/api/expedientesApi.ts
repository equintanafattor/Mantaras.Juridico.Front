import { apiRequest } from "@/lib/api/apiClient";

import type {
  ActualizarExpedienteRequest,
  BuscarExpedientesParams,
  CrearExpedienteRequest,
  ExpedienteDetalleResponse,
  ExpedienteResponse,
  PagedResponse,
  CrearCasoConExpedientePrincipalRequest,
  CrearCasoConExpedientePrincipalResponse,
} from "../types/types";

export async function buscarExpedientes(
  params: BuscarExpedientesParams,
  signal?: AbortSignal,
): Promise<PagedResponse<ExpedienteResponse>> {
  const query = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
    soloActivos: params.soloActivos.toString(),
  });

  if (params.casoId !== undefined) {
    query.set("casoId", params.casoId.toString());
  }

  const busqueda = params.busqueda?.trim();

  if (busqueda) {
    query.set("busqueda", busqueda);
  }

  return apiRequest<PagedResponse<ExpedienteResponse>>(
    `/api/expedientes?${query.toString()}`,
    {
      method: "GET",
      signal,
    },
  );
}

export async function obtenerExpedientePorId(
  expedienteId: number,
  signal?: AbortSignal,
): Promise<ExpedienteDetalleResponse> {
  return apiRequest<ExpedienteDetalleResponse>(
    `/api/expedientes/${expedienteId}`,
    {
      method: "GET",
      signal,
    },
  );
}

export async function crearExpediente(
  request: CrearExpedienteRequest,
): Promise<ExpedienteResponse> {
  return apiRequest<ExpedienteResponse>("/api/expedientes", {
    method: "POST",
    body: request,
  });
}

export async function actualizarExpediente(
  expedienteId: number,
  request: ActualizarExpedienteRequest,
): Promise<ExpedienteResponse> {
  return apiRequest<ExpedienteResponse>(`/api/expedientes/${expedienteId}`, {
    method: "PUT",
    body: request,
  });
}

export async function darDeBajaExpediente(expedienteId: number): Promise<void> {
  await apiRequest<void>(`/api/expedientes/${expedienteId}`, {
    method: "DELETE",
  });
}

export async function restaurarExpediente(expedienteId: number): Promise<void> {
  await apiRequest<void>(`/api/expedientes/${expedienteId}/restaurar`, {
    method: "PATCH",
  });
}

export async function crearCasoConExpedientePrincipal(
  request: CrearCasoConExpedientePrincipalRequest,
): Promise<CrearCasoConExpedientePrincipalResponse> {
  return apiRequest<CrearCasoConExpedientePrincipalResponse>(
    "/api/casos/con-expediente-principal",
    {
      method: "POST",
      body: request,
    },
  );
}
