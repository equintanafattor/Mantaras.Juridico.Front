export type DatosHojaResumen = {
  tieneCalculoPrevio: boolean | null;
  haberInicialReajustadoCaracteristicas: string | null;
  haberInicialPbu: number | null;
  haberInicialObservacion: string | null;
  haberInicialMonto: number | null;
  movilidadActualizacionMes: number | null;
  movilidadActualizacionAnio: number | null;
  movilidadObservaciones: string | null;
  movilidadMonto: number | null;
  retroactivoFechaInicio: string | null;
  retroactivoFechaActualizacion: string | null;
  retroactivoObservacion: string | null;
  retroactivoMonto: number | null;
};

export type HojaResumenResponse = DatosHojaResumen & {
  casoId: number;
  registrada: boolean;
  fechaCreacion: string | null;
  usuarioCreacion: string | null;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
};
