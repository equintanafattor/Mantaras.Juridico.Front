import { apiRequest } from "@/lib/api/apiClient";

import type { CrearUsuarioRequest, UsuarioResponse } from "../types/types";

export async function obtenerUsuarios(
  signal?: AbortSignal,
): Promise<UsuarioResponse[]> {
  return apiRequest<UsuarioResponse[]>("/api/usuarios", {
    method: "GET",
    signal,
  });
}

export async function crearUsuario(
  request: CrearUsuarioRequest,
): Promise<UsuarioResponse> {
  return apiRequest<UsuarioResponse>("/api/usuarios", {
    method: "POST",
    body: request,
  });
}

export async function darDeBajaUsuario(usuarioId: number): Promise<void> {
  await apiRequest<void>(`/api/usuarios/${usuarioId}`, {
    method: "DELETE",
  });
}

export async function restaurarUsuario(usuarioId: number): Promise<void> {
  await apiRequest<void>(`/api/usuarios/${usuarioId}/restaurar`, {
    method: "PATCH",
  });
}
