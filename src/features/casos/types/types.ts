export type FaseCaso = "Preadministrativa" | "Juicio" | "Postjuicio";

export type TipoParticipacionCliente =
  | "Titular"
  | "Conyuge"
  | "Continuador"
  | "Heredero"
  | "Otro";

export type TipoExpediente =
  | "Principal"
  | "Incidente"
  | "Apelacion"
  | "Ejecucion";

export type CasoClienteResponse = {
  clienteId: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dni: string | null;
  cuil: string | null;
  tipoParticipacion: TipoParticipacionCliente;
  esPrincipal: boolean;
};

export type ExpedienteCasoDetalleResponse = {
  expedienteId: number;
  tipoExpediente: TipoExpediente;
  expedientePadreId: number | null;
  numeroExpediente: string | null;
  caratula: string;
  juzgado: string | null;
  fechaInicio: string | null;
  estadoLegal: string | null;
  observaciones: string | null;
  activo: boolean;
};

export type CasoResponse = {
  casoId: number;
  titulo: string;
  faseInterna: FaseCaso;
  tipoTramite: string | null;
  observaciones: string | null;
  clientes: CasoClienteResponse[];
  fechaCreacion: string;
  fechaModificacion: string | null;
  activo: boolean;
};

export type CasoDetalleResponse = CasoResponse & {
  expedientes: ExpedienteCasoDetalleResponse[];
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

export type BuscarCasosParams = {
  page: number;
  pageSize: number;
  busqueda?: string;
  faseInterna?: FaseCaso;
  soloActivos: boolean;
};

export type CasoClienteRequest = {
  clienteId: number;
  tipoParticipacion: TipoParticipacionCliente;
  esPrincipal: boolean;
};

export type CrearCasoRequest = {
  titulo: string;
  faseInterna: FaseCaso;
  tipoTramite: string | null;
  observaciones: string | null;
  clientes: CasoClienteRequest[];
};

export type ActualizarCasoRequest = CrearCasoRequest;


