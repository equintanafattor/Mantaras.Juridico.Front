import { apiRequest } from "@/lib/api/apiClient";
import type { PagedResponse } from "@/features/casos/types/types";
import { queryString, validarId } from "../lib/queryString";
import type { BuscarDiasInhabilesRequest, GuardarDiaInhabilRequest, DiaInhabilResponse } from "../types/diasInhabiles";
const BASE = "/api/dias-inhabiles";
export function buscarDiasInhabiles(params: BuscarDiasInhabilesRequest, signal?: AbortSignal) {
  return apiRequest<PagedResponse<DiaInhabilResponse>>(`${BASE}${queryString(params)}`, { signal });
}
export function obtenerDiaInhabil(id: number, signal?: AbortSignal) {
  return apiRequest<DiaInhabilResponse>(`${BASE}/${validarId(id)}`, { signal });
}
export function crearDiaInhabil(request: GuardarDiaInhabilRequest) {
  return apiRequest<DiaInhabilResponse>(BASE, { method: "POST", body: request });
}
export function actualizarDiaInhabil(id: number, request: GuardarDiaInhabilRequest) {
  return apiRequest<DiaInhabilResponse>(`${BASE}/${validarId(id)}`, { method: "PUT", body: request });
}
export function cambiarActivoDiaInhabil(id: number, activo: boolean) {
  return apiRequest<void>(`${BASE}/${validarId(id)}${activo ? "/reactivar" : ""}`, { method: activo ? "PATCH" : "DELETE" });
}
