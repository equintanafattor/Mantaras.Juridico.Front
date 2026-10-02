import type { AgendaForm } from "./agendaForm";
export function firmaFechasRecordatoriosAgenda(form: AgendaForm): string {
  const hora = (value: string) => value ? value.length === 5 ? `${value}:00` : value : "09:00:00";
  return JSON.stringify([form.fechaInicio, hora(form.horaInicio), form.fechaVencimiento, form.fechaVencimiento ? hora(form.horaVencimiento) : null]);
}
export function cambianFechasRecordatoriosAgenda(original: AgendaForm, actual: AgendaForm): boolean {
  return firmaFechasRecordatoriosAgenda(original) !== firmaFechasRecordatoriosAgenda(actual);
}
