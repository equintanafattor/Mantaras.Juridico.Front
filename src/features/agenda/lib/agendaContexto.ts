import type { BuscarAgendaRequest, EntradaAgendaListadoResponse } from "../types/types";

export type ContextoAgenda = { tipo: "cliente" | "caso" | "expediente"; id: number; nombre: string };

export function parametrosAgendaContexto(contexto: ContextoAgenda, hoy: string): BuscarAgendaRequest {
  return {
    desde: hoy, soloActivos: true, incluirVencimientos: true, pageSize: 100,
    ...(contexto.tipo === "cliente" ? { clienteId: contexto.id } : contexto.tipo === "caso" ? { casoId: contexto.id } : { expedienteId: contexto.id }),
  };
}

export function referenciaAgendaContexto(entrada: EntradaAgendaListadoResponse) {
  return { fecha: entrada.fechaVencimiento ?? entrada.fechaInicio, hora: entrada.fechaVencimiento ? entrada.horaVencimiento : entrada.horaInicio };
}

export function proximasAgendaContexto(entradas: EntradaAgendaListadoResponse[], hoy: string) {
  const prioridades = { Urgente: 0, Alta: 1, Normal: 2, Baja: 3 };
  return entradas.filter(entrada => entrada.activo && entrada.estado !== "Completada" && entrada.estado !== "Cancelada" && referenciaAgendaContexto(entrada).fecha >= hoy)
    .sort((a, b) => {
      const primero = referenciaAgendaContexto(a), segundo = referenciaAgendaContexto(b);
      return primero.fecha.localeCompare(segundo.fecha) || (primero.hora ?? "23:59:59").localeCompare(segundo.hora ?? "23:59:59") || prioridades[a.prioridad] - prioridades[b.prioridad] || a.entradaAgendaId - b.entradaAgendaId;
    });
}
