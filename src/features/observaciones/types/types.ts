export type EntidadObservacion = "clientes" | "casos" | "expedientes";

export type ObservacionResponse = {
  observacionId: number;
  texto: string;
  fechaCreacion: string;
  usuarioCreacion: string;
};

export type CrearObservacionRequest = {
  texto: string;
};
