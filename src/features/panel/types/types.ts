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
};

export type PanelAlertasResponse = {
  disponible: boolean;
  totalPendientes: number;
};
