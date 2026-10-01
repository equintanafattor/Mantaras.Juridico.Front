import type { EstadoEntradaAgenda, RelacionAgendaResponse } from "../types/types";

export const NOMBRES_ESTADO_AGENDA: Record<EstadoEntradaAgenda, string> = {
  Pendiente: "Pendiente", EnCurso: "En curso", Pospuesta: "Pospuesta", Completada: "Completada", Cancelada: "Cancelada",
};
const TRANSICIONES: Record<EstadoEntradaAgenda, readonly EstadoEntradaAgenda[]> = {
  Pendiente: ["EnCurso", "Pospuesta", "Completada", "Cancelada"],
  EnCurso: ["Pendiente", "Pospuesta", "Completada", "Cancelada"],
  Pospuesta: ["Pendiente", "EnCurso", "Completada", "Cancelada"],
  Completada: ["Pendiente"], Cancelada: ["Pendiente"],
};
export function accionesEstadoAgenda(actual: EstadoEntradaAgenda) {
  const etiquetas: Record<EstadoEntradaAgenda, string> = {
    Pendiente: actual === "Completada" || actual === "Cancelada" ? "Reabrir como pendiente" : "Volver a pendiente",
    EnCurso: actual === "Pospuesta" ? "Retomar" : "Iniciar", Pospuesta: "Posponer", Completada: "Completar", Cancelada: "Cancelar entrada",
  };
  return (TRANSICIONES[actual] ?? []).map(estado => ({ estado, label: etiquetas[estado] }));
}
export function relacionesDetalleAgenda(ids: number[], conocidas: RelacionAgendaResponse[]): RelacionAgendaResponse[] {
  const porId = new Map(conocidas.map(item => [item.id, item]));
  return ids.map(id => porId.get(id) ?? { id, nombre: `ID ${id}`, referencia: null });
}
export function mostrarFechaAuditoriaAgenda(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short", hourCycle: "h23" }).format(valor);
}
