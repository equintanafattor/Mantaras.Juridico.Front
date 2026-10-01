import type { ResumenEntradaAgenda } from "@/features/agenda/types/types";
import type { PanelAgendaContextoResponse, PanelAgendaItemResponse } from "../types/types";

export function rutaContextoAgendaPanel(contexto: PanelAgendaContextoResponse): string | undefined {
  if (!Number.isSafeInteger(contexto.id) || contexto.id <= 0) return undefined;
  const rutas = new Map([["Cliente", "/clientes"], ["ExpedienteAdministrativo", "/casos"], ["ExpedienteJudicial", "/expedientes"]]);
  const ruta = rutas.get(contexto.tipo);
  return ruta ? `${ruta}/${contexto.id}` : undefined;
}
export function resumenEntradaDesdePanel(item: PanelAgendaItemResponse): ResumenEntradaAgenda {
  function relaciones(tipo: string) {
    return [...new Map(item.contextos.filter(contexto => contexto.tipo === tipo).map(contexto => [contexto.id, { id: contexto.id, nombre: contexto.nombre, referencia: null }])).values()];
  }
  return { entradaAgendaId: item.entradaAgendaId, titulo: item.titulo, tipoEntradaNombre: item.tipoEntradaNombre,
    clientes: relaciones("Cliente"), casos: relaciones("ExpedienteAdministrativo"), expedientes: relaciones("ExpedienteJudicial"), responsables: [] };
}
