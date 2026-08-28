import { apiRequest } from "@/lib/api/apiClient";
import type {
  DatosHojaResumen,
  HojaResumenResponse,
} from "../types/hojaResumen";

export function obtenerHojaResumen(casoId: number, signal?: AbortSignal) {
  return apiRequest<HojaResumenResponse>(`/api/casos/${casoId}/hoja-resumen`, {
    method: "GET",
    signal,
  });
}

export function guardarHojaResumen(casoId: number, datos: DatosHojaResumen) {
  return apiRequest<HojaResumenResponse>(`/api/casos/${casoId}/hoja-resumen`, {
    method: "PUT",
    body: datos,
  });
}
