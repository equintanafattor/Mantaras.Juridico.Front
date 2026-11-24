import { apiRequest } from "@/lib/api/apiClient";
import type { PagedResponse } from "@/features/casos/types/types";
import { queryString, validarId } from "../lib/queryString";
import { anioImportacionValido } from "../lib/importacionFeriados";
import type { BuscarDiasInhabilesRequest, ConfirmarImportacionFeriadosRequest, DiaInhabilResponse, EstadoImportacionFeriados, GuardarDiaInhabilRequest, ResultadoImportacionFeriados, VistaPreviaImportacionFeriados } from "../types/diasInhabiles";
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
const IMPORTACION = `${BASE}/importacion-nacional`;
export function obtenerEstadoImportacionFeriados(anio: number, signal?: AbortSignal) {
  return apiRequest<EstadoImportacionFeriados>(`${IMPORTACION}/estado${queryString({ anio })}`, { signal });
}
export function obtenerVistaPreviaImportacionFeriados(anio: number, signal?: AbortSignal) {
  return apiRequest<VistaPreviaImportacionFeriados>(`${IMPORTACION}/${anioImportacionValido(anio)}/vista-previa`, { signal });
}
export function confirmarImportacionFeriados(anio: number, request: ConfirmarImportacionFeriadosRequest) {
  return apiRequest<ResultadoImportacionFeriados>(`${IMPORTACION}/${anioImportacionValido(anio)}`, { method: "POST", body: request });
}
