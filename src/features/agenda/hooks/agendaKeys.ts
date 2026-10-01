import type { BuscarAgendaRequest, BuscarRecordatoriosAgendaRequest } from "../types/types";
import type { OrigenRecordatoriosPredeterminados } from "../api/recordatoriosApi";

export const agendaKeys = {
  all: ["agenda"] as const,
  listado: (params: BuscarAgendaRequest) => ["agenda", "listado", params] as const,
  entrada: (id: number | undefined) => ["agenda", "entrada", id] as const,
  reglas: (soloActivas: boolean) => ["agenda", "reglas", soloActivas] as const,
  regla: (id: number | undefined) => ["agenda", "regla", id] as const,
  recordatorios: (params: BuscarRecordatoriosAgendaRequest) => ["agenda", "recordatorios", params] as const,
  predeterminados: (origen: OrigenRecordatoriosPredeterminados, id: number | undefined) => ["agenda", "predeterminados", origen, id] as const,
};
