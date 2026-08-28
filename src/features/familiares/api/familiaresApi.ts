import { apiRequest } from "@/lib/api/apiClient";

import type { FamiliarResponse, VincularFamiliarRequest } from "../types/types";

export function obtenerFamiliares(clienteId: number, signal?: AbortSignal) {
  return apiRequest<FamiliarResponse[]>(
    `/api/clientes/${clienteId}/familiares`,
    {
      method: "GET",
      signal,
    },
  );
}

export function vincularFamiliar(
  clienteId: number,
  request: VincularFamiliarRequest,
) {
  return apiRequest<FamiliarResponse>(`/api/clientes/${clienteId}/familiares`, {
    method: "POST",
    body: request,
  });
}

export function desvincularFamiliar(clienteId: number, familiarId: number) {
  return apiRequest<void>(
    `/api/clientes/${clienteId}/familiares/${familiarId}`,
    {
      method: "DELETE",
    },
  );
}
