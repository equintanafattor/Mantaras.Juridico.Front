import type { EstadoEntradaAgenda, PrioridadAgenda } from "@/features/agenda/types/types";

export type PanelMetricasResponse = {
  clientesActivos: number;
  casosActivos: number;
  expedientesActivos: number;
};

export type ActividadRecienteResponse = {
  tipo: "Caso" | "Expediente";
  casoId: number;
  expedienteId: number | null;
  titulo: string;
  referencia: string | null;
  fechaActividad: string;
};

export type PanelResumenResponse = {
  metricas: PanelMetricasResponse;
  actividadReciente: ActividadRecienteResponse[];
  alertas: PanelAlertasResponse;
  agenda: PanelAgendaResponse;
};

export type PanelAlertasResponse = {
  disponible: boolean;
  totalPendientes: number;
};

export type PanelAgendaResponse = {
  hoy: number;
  proximos: number;
  // Con vencimiento pasado.
  vencidos: number;
  // Sin vencimiento y con la fecha pasada.
  atrasados: number;
  elementosProximos: PanelAgendaItemResponse[];
};

export type PanelAgendaItemResponse = {
  entradaAgendaId: number;
  titulo: string;
  tipoEntradaNombre: string;
  tipoEntradaColor: string | null;
  estado: EstadoEntradaAgenda;
  prioridad: PrioridadAgenda;
  fechaReferencia: string;
  horaReferencia: string | null;
  esDeHoy: boolean;
  contextos: PanelAgendaContextoResponse[];
};

export type PanelAgendaContextoResponse = {
  tipo: string;
  id: number;
  nombre: string;
  url: string;
};
