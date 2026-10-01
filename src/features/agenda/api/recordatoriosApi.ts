import { apiRequest } from "@/lib/api/apiClient";
import type { PagedResponse } from "@/features/casos/types/types";
import { queryString, validarId } from "../lib/queryString";
import type { BuscarRecordatoriosAgendaRequest, CrearRecordatorioAgendaRequest,
  RecordatorioAgendaResponse, GuardarRecordatoriosPredeterminadosRequest,
  RecordatorioPredeterminadoResponse } from "../types/types";

export type OrigenRecordatoriosPredeterminados = "tipos-entrada" | "reglas-vencimiento";

export function buscarRecordatoriosAgenda(params: BuscarRecordatoriosAgendaRequest = {}, signal?: AbortSignal) {
  return apiRequest<PagedResponse<RecordatorioAgendaResponse>>(`/api/recordatorios-agenda${queryString(params)}`, { signal });
}
export function crearRecordatorioAgenda(id: number, request: CrearRecordatorioAgendaRequest) {
  return apiRequest<RecordatorioAgendaResponse>(`/api/recordatorios-agenda/entrada/${validarId(id)}`, { method: "POST", body: request });
}
export function atenderRecordatorioAgenda(id: number) {
  return apiRequest<RecordatorioAgendaResponse>(`/api/recordatorios-agenda/${validarId(id)}/atender`, { method: "PATCH" });
}
export function obtenerRecordatoriosPredeterminados(origen: OrigenRecordatoriosPredeterminados, id: number, signal?: AbortSignal) {
  return apiRequest<RecordatorioPredeterminadoResponse[]>(`/api/recordatorios-predeterminados/${origen}/${validarId(id)}`, { signal });
}
export function guardarRecordatoriosPredeterminados(origen: OrigenRecordatoriosPredeterminados, id: number, request: GuardarRecordatoriosPredeterminadosRequest) {
  return apiRequest<RecordatorioPredeterminadoResponse[]>(`/api/recordatorios-predeterminados/${origen}/${validarId(id)}`, { method: "PUT", body: request });
}
