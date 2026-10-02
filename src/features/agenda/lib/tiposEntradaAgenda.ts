import type { GuardarTipoEntradaAgendaRequest, TipoEntradaAgendaResponse } from "../types/tiposEntrada";

export const COLORES_TIPO_AGENDA: Record<string, string> = {
  blue: "#2563eb", red: "#dc2626", purple: "#9333ea", yellow: "#ca8a04",
  green: "#16a34a", orange: "#ea580c", pink: "#db2777", gray: "#6b7280",
};
export type TipoEntradaAgendaForm = { nombre: string; descripcion: string; color: string };
export function tipoEntradaAgendaInicial(tipo?: TipoEntradaAgendaResponse): TipoEntradaAgendaForm {
  return { nombre: tipo?.nombre ?? "", descripcion: tipo?.descripcion ?? "", color: tipo?.color ?? "" };
}
export function colorTipoAgenda(color: string | null): string | undefined {
  const valor = color?.trim().toLowerCase() ?? "";
  return /^#[0-9a-f]{6}$/.test(valor) ? valor : Object.prototype.hasOwnProperty.call(COLORES_TIPO_AGENDA, valor) ? COLORES_TIPO_AGENDA[valor] : undefined;
}
export function requestTipoEntradaAgenda(form: TipoEntradaAgendaForm): GuardarTipoEntradaAgendaRequest {
  const nombre = form.nombre.trim().replace(/\s+/g, " ").toUpperCase();
  const descripcion = form.descripcion.trim() || null;
  const color = form.color.trim().toLowerCase() || null;
  if (!nombre || nombre.length > 150) throw new Error("Ingresá un nombre de hasta 150 caracteres.");
  if (descripcion && descripcion.length > 500) throw new Error("La descripción no puede superar los 500 caracteres.");
  if (color && !colorTipoAgenda(color)) throw new Error("Usá un color de la lista o un hexadecimal de seis dígitos (#2563EB).");
  return { nombre, descripcion, color };
}
