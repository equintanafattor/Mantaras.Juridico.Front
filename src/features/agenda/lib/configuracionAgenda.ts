import { requestDesdeRecordatorioForm } from "./recordatorioForm";
import type { CrearRecordatorioAgendaRequest, GuardarReglaVencimientoRequest, ReglaVencimientoResponse } from "../types/types";

export type ReglaAgendaForm = Omit<GuardarReglaVencimientoRequest, "cantidadDias" | "horaSugerida" | "descripcion"> & { cantidadDias: string; horaSugerida: string; descripcion: string };
export function reglaAgendaInicial(regla?: ReglaVencimientoResponse): ReglaAgendaForm {
  return { tipoEntradaAgendaId: regla?.tipoEntradaAgendaId ?? 0, nombre: regla?.nombre ?? "", descripcion: regla?.descripcion ?? "", cantidadDias: String(regla?.cantidadDias ?? 90), tipoComputo: regla?.tipoComputo ?? "DiasHabiles", sentidoCalculo: regla?.sentidoCalculo ?? "Despues", prioridadGenerada: regla?.prioridadGenerada ?? "Normal", horaSugerida: regla?.horaSugerida ?? "", activo: regla?.activo ?? true };
}
export function requestDesdeReglaAgenda(form: ReglaAgendaForm): GuardarReglaVencimientoRequest {
  if (!Number.isSafeInteger(form.tipoEntradaAgendaId) || form.tipoEntradaAgendaId < 1) throw new Error("Seleccioná un tipo de entrada.");
  if (!form.nombre.trim() || form.nombre.trim().length > 200) throw new Error("El nombre es obligatorio y admite hasta 200 caracteres.");
  if (form.descripcion.trim().length > 1000) throw new Error("La descripción admite hasta 1000 caracteres.");
  if (!/^\d+$/.test(form.cantidadDias.trim()) || Number(form.cantidadDias) > 36500) throw new Error("La cantidad de días debe ser un entero entre 0 y 36500.");
  if (!["DiasHabiles", "DiasCorridos"].includes(form.tipoComputo) || !["Antes", "Despues"].includes(form.sentidoCalculo)) throw new Error("Seleccioná un cómputo y sentido válidos.");
  if (!["Baja", "Normal", "Alta", "Urgente"].includes(form.prioridadGenerada)) throw new Error("Seleccioná una prioridad válida.");
  if (form.horaSugerida && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(form.horaSugerida)) throw new Error("Ingresá una hora válida.");
  return { ...form, nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, cantidadDias: Number(form.cantidadDias), horaSugerida: form.horaSugerida ? form.horaSugerida.length === 5 ? `${form.horaSugerida}:00` : form.horaSugerida : null };
}
export function requestPredeterminadosAgenda(items: CrearRecordatorioAgendaRequest[]) {
  if (items.length > 10) throw new Error("Podés configurar hasta diez recordatorios predeterminados.");
  const recordatorios = items.map(item => requestDesdeRecordatorioForm(item.baseCalculo, String(item.minutosAnticipacion), "Minutos", true));
  if (new Set(recordatorios.map(item => `${item.baseCalculo}-${item.minutosAnticipacion}`)).size !== recordatorios.length) throw new Error("Hay recordatorios repetidos.");
  return { recordatorios };
}
export function firmaPredeterminadosAgenda(items: CrearRecordatorioAgendaRequest[]) {
  return items.map(item => `${item.baseCalculo}-${item.minutosAnticipacion}`).sort().join("|");
}
