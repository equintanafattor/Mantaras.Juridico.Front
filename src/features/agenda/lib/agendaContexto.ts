import { FILTROS_AGENDA_INICIALES, type FiltrosAgenda } from "./filtrosAgenda";

export type ContextoAgenda = { tipo: "cliente" | "caso" | "expediente"; id: number; nombre: string };

export function filtrosAgendaContexto(contexto: ContextoAgenda): FiltrosAgenda {
  const seleccion = { id: contexto.id, nombre: contexto.nombre };
  return { ...FILTROS_AGENDA_INICIALES, cliente: contexto.tipo === "cliente" ? seleccion : null, caso: contexto.tipo === "caso" ? seleccion : null, expediente: contexto.tipo === "expediente" ? seleccion : null };
}
