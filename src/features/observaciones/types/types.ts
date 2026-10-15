export type EntidadObservacion = "clientes" | "casos" | "expedientes";

export type ObservacionResponse = {
  observacionId: number;
  texto: string;
  fechaMovimiento: string | null;
  fechaCreacion: string;
  usuarioCreacion: string;
};

export type CrearObservacionRequest = {
  texto: string;
  fechaMovimiento?: string | null;
};
