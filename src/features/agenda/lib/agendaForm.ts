import type { ResumenEntradaAgenda, EntradaAgendaResponse, GuardarEntradaAgendaRequest, PrioridadAgenda } from "../types/types";
import type { ContextoAgenda } from "./agendaContexto";
import type { SeleccionAgenda } from "./filtrosAgenda";

// Clase: sólo organiza el formulario. Vencimiento se crea con el endpoint de vencimientos.
export type ClaseAgenda = "evento" | "tarea" | "vencimiento";
export type AgendaForm = {
  clase: ClaseAgenda | null;
  recurrenciaFrecuencia: "" | "Diaria" | "Semanal" | "Mensual" | "Anual"; recurrenciaIntervalo: number; recurrenciaCantidad: number;
  tipoEntradaAgendaId: number | null; titulo: string; descripcion: string; prioridad: PrioridadAgenda;
  fechaInicio: string; horaInicio: string; fechaFin: string; horaFin: string; fechaVencimiento: string; horaVencimiento: string;
  clientes: SeleccionAgenda[]; casos: SeleccionAgenda[]; expedientes: SeleccionAgenda[]; responsableIds: number[];
};
export function fechaHoyAgenda(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(fecha);
  return `${partes.find(p => p.type === "year")!.value}-${partes.find(p => p.type === "month")!.value}-${partes.find(p => p.type === "day")!.value}`;
}
export function agendaFormInicial(vencimiento = false, contexto?: ContextoAgenda): AgendaForm {
  const hoy = fechaHoyAgenda();
  return { clase: vencimiento ? "vencimiento" : null, tipoEntradaAgendaId: null, titulo: "", descripcion: "", prioridad: "Normal", fechaInicio: hoy, horaInicio: "", fechaFin: "", horaFin: "", fechaVencimiento: vencimiento ? hoy : "", horaVencimiento: "", recurrenciaFrecuencia: "", recurrenciaIntervalo: 1, recurrenciaCantidad: 2, clientes: contexto?.tipo === "cliente" ? [{ id: contexto.id, nombre: contexto.nombre }] : [], casos: contexto?.tipo === "caso" ? [{ id: contexto.id, nombre: contexto.nombre }] : [], expedientes: contexto?.tipo === "expediente" ? [{ id: contexto.id, nombre: contexto.nombre }] : [], responsableIds: [] };
}
export function agendaFormDesdeEntrada(entrada: EntradaAgendaResponse, listado: ResumenEntradaAgenda): AgendaForm {
  function relaciones(ids: number[], items: SeleccionAgenda[]) { return ids.map(id => ({ id, nombre: items.find(item => item.id === id)?.nombre ?? `ID ${id}` })); }
  const clase: ClaseAgenda = entrada.fechaVencimiento ? "vencimiento" : entrada.horaInicio || entrada.fechaFin ? "evento" : "tarea";
  return { clase, tipoEntradaAgendaId: entrada.tipoEntradaAgendaId, titulo: entrada.titulo, descripcion: entrada.descripcion ?? "", prioridad: entrada.prioridad, recurrenciaFrecuencia: "", recurrenciaIntervalo: 1, recurrenciaCantidad: 2,
    fechaInicio: entrada.fechaInicio, horaInicio: entrada.horaInicio ?? "", fechaFin: entrada.fechaFin ?? "", horaFin: entrada.horaFin ?? "", fechaVencimiento: entrada.fechaVencimiento ?? "", horaVencimiento: entrada.horaVencimiento ?? "",
    clientes: relaciones(entrada.clienteIds, listado.clientes), casos: relaciones(entrada.casoIds, listado.casos), expedientes: relaciones(entrada.expedienteIds, listado.expedientes), responsableIds: [...entrada.responsableIds] };
}
function fechaValida(valor: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(valor) || valor.startsWith("0000")) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}
function normalizarHora(valor: string): string | null { return valor ? (valor.length === 5 ? `${valor}:00` : valor) : null; }
export function requestDesdeAgendaForm(form: AgendaForm, vencimientoManual = false): GuardarEntradaAgendaRequest {
  if (!form.clase) throw new Error("Elegí si es un evento, una tarea o un vencimiento.");
  if (!form.tipoEntradaAgendaId || !Number.isSafeInteger(form.tipoEntradaAgendaId) || form.tipoEntradaAgendaId < 1) throw new Error("Elegí la categoría.");
  if (!form.titulo.trim()) throw new Error("Escribí un título: qué hay que hacer o a qué hay que ir.");
  if (form.titulo.trim().length > 300) throw new Error("El título admite hasta 300 caracteres.");
  if (form.descripcion.trim().length > 4000) throw new Error("La descripción admite hasta 4000 caracteres.");
  if (!["Baja", "Normal", "Alta", "Urgente"].includes(form.prioridad)) throw new Error("Seleccioná una prioridad válida.");
  if (vencimientoManual && !form.fechaVencimiento) throw new Error("Indicá cuándo vence.");
  if (!fechaValida(form.fechaInicio) || form.fechaInicio === "0001-01-01") throw new Error("Indicá una fecha válida.");
  if (form.fechaFin && (!fechaValida(form.fechaFin) || form.fechaFin < form.fechaInicio)) throw new Error("La fecha en que termina no puede ser anterior a la fecha de inicio.");
  if (form.fechaVencimiento && (!fechaValida(form.fechaVencimiento) || form.fechaVencimiento < form.fechaInicio)) throw new Error("La fecha de vencimiento o límite no puede ser anterior a la fecha de inicio.");
  if (form.recurrenciaFrecuencia && (!Number.isInteger(form.recurrenciaIntervalo) || form.recurrenciaIntervalo < 1 || form.recurrenciaIntervalo > 365 || !Number.isInteger(form.recurrenciaCantidad) || form.recurrenciaCantidad < 2 || form.recurrenciaCantidad > 100)) throw new Error("La recurrencia admite intervalos de 1 a 365 y entre 2 y 100 ocurrencias.");
  for (const hora of [form.horaInicio, form.horaFin, form.horaVencimiento]) if (hora && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora)) throw new Error("Ingresá una hora válida.");
  // La hora de fin sin otra fecha se toma en el mismo día del inicio.
  const fechaFin = form.fechaFin || (form.horaFin ? form.fechaInicio : "");
  if (form.horaVencimiento && !form.fechaVencimiento) throw new Error("La hora de vencimiento requiere una fecha de vencimiento.");
  if (fechaFin === form.fechaInicio && form.horaInicio && form.horaFin && normalizarHora(form.horaFin)! < normalizarHora(form.horaInicio)!) throw new Error("La hora en que termina no puede ser anterior a la de inicio.");
  const grupos = [form.clientes.map(x => x.id), form.casos.map(x => x.id), form.expedientes.map(x => x.id), form.responsableIds];
  for (const ids of grupos) if (ids.length > 100 || ids.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length) throw new Error("Cada grupo admite hasta 100 asociaciones diferentes.");
  return { tipoEntradaAgendaId: form.tipoEntradaAgendaId, titulo: form.titulo.trim(), descripcion: form.descripcion.trim() || null, prioridad: form.prioridad,
    recurrencia: form.recurrenciaFrecuencia ? { frecuencia: form.recurrenciaFrecuencia, intervalo: form.recurrenciaIntervalo, cantidadOcurrencias: form.recurrenciaCantidad } : null,
    fechaInicio: form.fechaInicio, horaInicio: normalizarHora(form.horaInicio), fechaFin: fechaFin || null, horaFin: normalizarHora(form.horaFin), fechaVencimiento: form.fechaVencimiento || null, horaVencimiento: normalizarHora(form.horaVencimiento),
    clienteIds: grupos[0], casoIds: grupos[1], expedienteIds: grupos[2], responsableIds: grupos[3] };
}
