import { apiRequest } from "@/lib/api/apiClient";
import type { PagedResponse } from "@/features/casos/types/types";
import { queryString, validarId } from "../lib/queryString";
import type {
  BuscarAgendaRequest, GuardarEntradaAgendaRequest, CambiarEstadoAgendaRequest,
  EntradaAgendaResponse, EntradaAgendaListadoResponse,
} from "../types/types";

export function buscarAgenda(params: BuscarAgendaRequest = {}, signal?: AbortSignal) {
  return apiRequest<PagedResponse<EntradaAgendaListadoResponse>>(
    `/api/agenda${queryString(params)}`, { signal },
  );
}

export function obtenerEntradaAgenda(id: number, signal?: AbortSignal) {
  return apiRequest<EntradaAgendaResponse>(`/api/agenda/${validarId(id)}`, { signal });
}

export function crearEntradaAgenda(request: GuardarEntradaAgendaRequest) {
  return apiRequest<EntradaAgendaResponse>("/api/agenda", { method: "POST", body: request });
}

export function crearVencimientoManual(request: GuardarEntradaAgendaRequest) {
  return apiRequest<EntradaAgendaResponse>("/api/agenda/vencimientos", { method: "POST", body: request });
}

export function actualizarEntradaAgenda(id: number, request: GuardarEntradaAgendaRequest) {
  return apiRequest<EntradaAgendaResponse>(`/api/agenda/${validarId(id)}`, { method: "PUT", body: request });
}

export function cambiarEstadoAgenda(id: number, request: CambiarEstadoAgendaRequest) {
  return apiRequest<EntradaAgendaResponse>(`/api/agenda/${validarId(id)}/estado`, { method: "PATCH", body: request });
}
