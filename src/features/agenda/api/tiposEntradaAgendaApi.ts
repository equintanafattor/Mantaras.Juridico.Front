import { apiRequest } from "@/lib/api/apiClient";
import type { PagedResponse } from "@/features/casos/types/types";
import { queryString, validarId } from "../lib/queryString";
import type { BuscarTiposEntradaAgendaRequest, GuardarTipoEntradaAgendaRequest, TipoEntradaAgendaResponse } from "../types/tiposEntrada";
const BASE = "/api/tipos-entrada-agenda";
export function buscarTiposEntradaAgenda(params: BuscarTiposEntradaAgendaRequest, signal?: AbortSignal) {
  return apiRequest<PagedResponse<TipoEntradaAgendaResponse>>(`${BASE}${queryString(params)}`, { signal });
}
export function obtenerTipoEntradaAgenda(id: number, signal?: AbortSignal) {
  return apiRequest<TipoEntradaAgendaResponse>(`${BASE}/${validarId(id)}`, { signal });
}
export function crearTipoEntradaAgenda(request: GuardarTipoEntradaAgendaRequest) {
  return apiRequest<TipoEntradaAgendaResponse>(BASE, { method: "POST", body: request });
}
export function actualizarTipoEntradaAgenda(id: number, request: GuardarTipoEntradaAgendaRequest) {
  return apiRequest<TipoEntradaAgendaResponse>(`${BASE}/${validarId(id)}`, { method: "PUT", body: request });
}
export function cambiarActivoTipoEntradaAgenda(id: number, activo: boolean) {
  return apiRequest<void>(`${BASE}/${validarId(id)}${activo ? "/reactivar" : ""}`, { method: activo ? "PATCH" : "DELETE" });
}
