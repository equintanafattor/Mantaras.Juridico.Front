import { apiRequest } from "@/lib/api/apiClient";

import type {
  IniciarSesionRequest,
  IniciarSesionResponse,
} from "../types/types";

export function iniciarSesion(
  request: IniciarSesionRequest,
): Promise<IniciarSesionResponse> {
  return apiRequest<IniciarSesionResponse>("/api/auth/login", {
    method: "POST",
    body: request,
  });
}