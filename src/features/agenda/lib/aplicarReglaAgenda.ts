import { agendaFormInicial, requestDesdeAgendaForm } from "./agendaForm";
import type { ContextoAgenda } from "./agendaContexto";
import type { SeleccionAgenda } from "./filtrosAgenda";
import type { AplicarReglaVencimientoRequest, EntradaAgendaResponse, ResumenEntradaAgenda } from "../types/types";

export type AplicarReglaAgendaForm = { reglaId: number | null; fechaBase: string; clientes: SeleccionAgenda[]; casos: SeleccionAgenda[]; expedientes: SeleccionAgenda[]; responsableIds: number[] };
export type IntentoAplicarReglaAgenda = { reglaId: number; request: AplicarReglaVencimientoRequest; firma: string };
export function aplicarReglaAgendaInicial(contexto?: ContextoAgenda): AplicarReglaAgendaForm {
  const form = agendaFormInicial(false, contexto);
  return { reglaId: null, fechaBase: form.fechaInicio, clientes: form.clientes, casos: form.casos, expedientes: form.expedientes, responsableIds: [] };
}
export function prepararAplicacionAgenda(form: AplicarReglaAgendaForm, contexto: ContextoAgenda | undefined, anterior: IntentoAplicarReglaAgenda | undefined, nuevaClave: () => string): IntentoAplicarReglaAgenda {
  if (!form.reglaId || !Number.isSafeInteger(form.reglaId) || form.reglaId < 1) throw new Error("Seleccioná una regla de vencimiento.");
  if (contexto && (!Number.isSafeInteger(contexto.id) || contexto.id < 1)) throw new Error("La ficha de origen no es válida.");
  const conservarOrigen = (tipo: ContextoAgenda["tipo"], items: SeleccionAgenda[]) => contexto?.tipo === tipo && !items.some(item => item.id === contexto.id) ? [...items, { id: contexto.id, nombre: contexto.nombre }] : items;
  const base = requestDesdeAgendaForm({ ...agendaFormInicial(false, contexto), tipoEntradaAgendaId: 1, titulo: "Aplicación de regla", fechaInicio: form.fechaBase, clientes: conservarOrigen("cliente", form.clientes), casos: conservarOrigen("caso", form.casos), expedientes: conservarOrigen("expediente", form.expedientes), responsableIds: form.responsableIds });
  const request = {
    fechaBase: base.fechaInicio,
    origenFechaBase: contexto?.tipo === "caso" ? "ExpedienteAdministrativo" as const : contexto?.tipo === "expediente" ? "ExpedienteJudicial" as const : "Manual" as const,
    entradaAgendaOrigenId: null, casoOrigenId: contexto?.tipo === "caso" ? contexto.id : null, expedienteOrigenId: contexto?.tipo === "expediente" ? contexto.id : null, observacionOrigenId: null,
    clienteIds: base.clienteIds, casoIds: base.casoIds, expedienteIds: base.expedienteIds, responsableIds: base.responsableIds,
  };
  const firma = JSON.stringify({ reglaId: form.reglaId, ...request, clienteIds: [...request.clienteIds].sort((a,b) => a-b), casoIds: [...request.casoIds].sort((a,b) => a-b), expedienteIds: [...request.expedienteIds].sort((a,b) => a-b), responsableIds: [...request.responsableIds].sort((a,b) => a-b) });
  if (anterior?.firma === firma) return anterior;
  return { reglaId: form.reglaId, firma, request: { ...request, claveIdempotencia: nuevaClave() } };
}
export function resumenAplicacionAgenda(entrada: EntradaAgendaResponse, form: AplicarReglaAgendaForm): ResumenEntradaAgenda {
  const relaciones = (ids: number[], items: SeleccionAgenda[]) => ids.map(id => ({ id, nombre: items.find(item => item.id === id)?.nombre ?? `ID ${id}`, referencia: null }));
  return { entradaAgendaId: entrada.entradaAgendaId, titulo: entrada.titulo, tipoEntradaNombre: entrada.tipoEntradaNombre, clientes: relaciones(entrada.clienteIds, form.clientes), casos: relaciones(entrada.casoIds, form.casos), expedientes: relaciones(entrada.expedienteIds, form.expedientes), responsables: relaciones(entrada.responsableIds, []) };
}
