export type ClienteResponse = {
  clienteId: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dni: string | null;
  cuil: string | null;
  fechaNacimiento: string | null;
  telefono: string | null;
  email: string | null;
  domicilio: string | null;
  localidad: string | null;
  provincia: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  activo: boolean;
};

export type ExpedienteClienteDetalleResponse = {
  expedienteId: number;
  expedientePadreId: number | null;
  numeroExpediente: string | null;
  caratula: string | null;
  juzgado: string | null;
  fechaInicio: string | null;
  estadoLegal: string | number;
  activo: boolean;
};

export type CasoClienteDetalleResponse = {
  casoId: number;
  titulo: string;
  faseInterna: string | number;
  tipoTramite: string | null;
  observaciones: string | null;
  tipoParticipacion: string | number;
  esPrincipal: boolean;
  activo: boolean;
  expedientes: ExpedienteClienteDetalleResponse[];
};

export type ClienteDetalleResponse = ClienteResponse & {
  fechaModificacion: string | null;
  casos: CasoClienteDetalleResponse[];
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type BuscarClientesParams = {
  page: number;
  pageSize: number;
  busqueda?: string;
  soloActivos: boolean;
};

export type CrearClienteRequest = {
  nombre: string;
  apellido: string;
  dni: string | null;
  cuil: string | null;
  claveSeguridadSocial: string | null;
  fechaNacimiento: string | null;
  telefono: string | null;
  email: string | null;
  domicilio: string | null;
  localidad: string | null;
  provincia: string | null;
  observaciones: string | null;
};

export type ActualizarClienteRequest = CrearClienteRequest;
