import { apiRequest } from "@/lib/api/apiClient";
import { queryString, validarId } from "../lib/queryString";
import type { ReglaVencimientoResponse, GuardarReglaVencimientoRequest,
  AplicarReglaVencimientoRequest, AplicacionReglaVencimientoResponse } from "../types/types";

export function obtenerReglasVencimiento(soloActivas = true, signal?: AbortSignal) {
  return apiRequest<ReglaVencimientoResponse[]>(`/api/reglas-vencimiento${queryString({ soloActivas })}`, { signal });
}
export function obtenerReglaVencimiento(id: number, signal?: AbortSignal) {
  return apiRequest<ReglaVencimientoResponse>(`/api/reglas-vencimiento/${validarId(id)}`, { signal });
}
export function crearReglaVencimiento(request: GuardarReglaVencimientoRequest) {
  return apiRequest<ReglaVencimientoResponse>("/api/reglas-vencimiento", { method: "POST", body: request });
}
export function actualizarReglaVencimiento(id: number, request: GuardarReglaVencimientoRequest) {
  return apiRequest<ReglaVencimientoResponse>(`/api/reglas-vencimiento/${validarId(id)}`, { method: "PUT", body: request });
}
// Conservar claveIdempotencia al reintentar una misma aplicación de regla.
export function aplicarReglaVencimiento(id: number, request: AplicarReglaVencimientoRequest) {
  return apiRequest<AplicacionReglaVencimientoResponse>(`/api/reglas-vencimiento/${validarId(id)}/aplicar`, { method: "POST", body: request });
}
