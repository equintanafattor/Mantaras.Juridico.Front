import type { BaseCalculoRecordatorioAgenda, CrearRecordatorioAgendaRequest } from "../types/types";
export type UnidadAnticipacionAgenda = "Minutos" | "Horas" | "Dias";
export const FACTORES_ANTICIPACION: Record<UnidadAnticipacionAgenda, number> = { Minutos: 1, Horas: 60, Dias: 1440 };
export const MAX_MINUTOS_RECORDATORIO = 525600;
export function requestDesdeRecordatorioForm(baseCalculo: BaseCalculoRecordatorioAgenda, cantidad: string, unidad: UnidadAnticipacionAgenda, tieneVencimiento: boolean): CrearRecordatorioAgendaRequest {
  if (baseCalculo !== "Inicio" && baseCalculo !== "Vencimiento") throw new Error("Seleccioná una base de cálculo válida.");
  if (baseCalculo === "Vencimiento" && !tieneVencimiento) throw new Error("La entrada necesita una fecha de vencimiento para usar esa base.");
  if (!/^\d+$/.test(cantidad.trim())) throw new Error("Ingresá una anticipación entera, igual o mayor que cero.");
  const factor = FACTORES_ANTICIPACION[unidad];
  if (!factor) throw new Error("Seleccioná una unidad de anticipación válida.");
  const minutosAnticipacion = Number(cantidad.trim()) * factor;
  if (!Number.isSafeInteger(minutosAnticipacion) || minutosAnticipacion > MAX_MINUTOS_RECORDATORIO) throw new Error("La anticipación no puede superar 365 días.");
  return { baseCalculo, minutosAnticipacion };
}
