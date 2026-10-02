import type { DiaInhabilResponse, GuardarDiaInhabilRequest } from "../types/diasInhabiles";
export type DiaInhabilForm = { fecha: string; descripcion: string };
export function diaInhabilInicial(dia?: DiaInhabilResponse): DiaInhabilForm {
  return { fecha: dia?.fecha ?? "", descripcion: dia?.descripcion ?? "" };
}
export function requestDiaInhabil(form: DiaInhabilForm): GuardarDiaInhabilRequest {
  const fecha = form.fecha.trim(), descripcion = form.descripcion.trim();
  const parsed = new Date(`${fecha}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha <= "0001-01-01" || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha) throw new Error("Ingresá una fecha válida posterior al 01/01/0001.");
  if (!descripcion || descripcion.length > 300) throw new Error("Ingresá una descripción de hasta 300 caracteres.");
  return { fecha, descripcion };
}
export function anioDiasInhabiles(valor: string): number | undefined {
  const texto = valor.trim();
  if (!texto) return undefined;
  if (!/^\d{1,4}$/.test(texto) || Number(texto) < 1 || Number(texto) > 9999) throw new Error("Ingresá un año entre 1 y 9999, o dejalo vacío para consultar todos.");
  return Number(texto);
}
export function fechaDiaInhabil(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}
