import type { BuscarAgendaRequest, EstadoEntradaAgenda } from "../types/types";
import { rangoMes } from "./periodoAgenda";
import { rangoCalendario } from "./calendarioAgenda";

export type SeleccionAgenda = { id: number; nombre: string };
export type FiltrosAgenda = {
  busqueda: string;
  estado: EstadoEntradaAgenda | "";
  tipoEntradaAgendaId: number | null;
  responsableId: number | null;
  cliente: SeleccionAgenda | null;
  caso: SeleccionAgenda | null;
  expediente: SeleccionAgenda | null;
  desde: string;
  hasta: string;
};
export const FILTROS_AGENDA_INICIALES: FiltrosAgenda = {
  busqueda: "", estado: "", tipoEntradaAgendaId: null, responsableId: null,
  cliente: null, caso: null, expediente: null, desde: "", hasta: "",
};
export function parametrosFiltrosAgenda(filtros: FiltrosAgenda): BuscarAgendaRequest {
  return {
    busqueda: filtros.busqueda.trim() || undefined,
    estado: filtros.estado || undefined,
    tipoEntradaAgendaId: filtros.tipoEntradaAgendaId ?? undefined,
    responsableId: filtros.responsableId ?? undefined,
    clienteId: filtros.cliente?.id,
    casoId: filtros.caso?.id,
    expedienteId: filtros.expediente?.id,
  };
}
export function rangoListadoAgenda(mes: string, filtros: FiltrosAgenda) {
  if (filtros.desde || filtros.hasta) return { desde: filtros.desde || undefined, hasta: filtros.hasta || undefined };
  return rangoMes(mes);
}
export function rangoCalendarioFiltrado(mes: string, filtros: FiltrosAgenda) {
  const visible = rangoCalendario(mes);
  const desde = filtros.desde && filtros.desde > visible.desde ? filtros.desde : visible.desde;
  const hasta = filtros.hasta && filtros.hasta < visible.hasta ? filtros.hasta : visible.hasta;
  return desde <= hasta ? { desde, hasta } : null;
}
export function validarFechasFiltros(filtros: FiltrosAgenda): string | null {
  for (const valor of [filtros.desde, filtros.hasta]) {
    if (!valor) continue;
    if (!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(valor) || valor.slice(0, 4) === "0000") return "Ingresá una fecha válida entre los años 1 y 9999.";
    const fecha = new Date(`${valor}T00:00:00Z`);
    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) return "Ingresá una fecha válida.";
  }
  return filtros.desde && filtros.hasta && filtros.desde > filtros.hasta ? "La fecha desde debe ser anterior o igual a la fecha hasta." : null;
}
