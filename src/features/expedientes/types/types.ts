import type { DatosAdministrativos } from "@/features/catalogos/types/types";

import type { CrearCasoRequest } from "@/features/casos/types/types";
import type { EstadoEntradaAgenda } from "@/features/agenda/types/types";

export type TipoExpediente =
  | "Principal"
  | "Incidente"
  | "Apelacion"
  | "Ejecucion";

export type ExpedienteRelacionadoResponse = {
  expedienteId: number;
  tipoExpediente: TipoExpediente;
  numeroExpediente: string | null;
  caratula: string;
  activo: boolean;
};

export type CasoExpedienteResponse = {
  casoId: number;
  titulo: string;
  numeroExpedienteAnses: string | null;
  numeroBeneficio: string | null;
  tipoBeneficioId: number | null;
  tipoBeneficioNombre: string | null;
  tipoBeneficioActivo: boolean | null;
  activo: boolean;
};

export type ExpedienteResponse = {
  expedienteId: number;
  casos: CasoExpedienteResponse[];
  expedientePadreId: number | null;
  tipoExpediente: TipoExpediente;
  numeroExpediente: string | null;
  caratula: string;
  juzgado: string | null;
  fechaInicio: string | null;
  estadoLegal: string | null;
  tipoTramite: string | null;
  // Opcional: un backend sin seguimiento de cobro no informa el campo.
  envioCobro?: EnvioCobroResponse | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
  activo: boolean;
};

export type ExpedienteDetalleResponse = ExpedienteResponse & {
  expedientePadre: ExpedienteRelacionadoResponse | null;
  expedientesDerivados: ExpedienteRelacionadoResponse[];
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

export type BuscarExpedientesParams = {
  page: number;
  pageSize: number;
  casoId?: number;
  busqueda?: string;
  soloActivos: boolean;
};

export type CrearExpedienteRequest = {
  casoIds: number[];
  expedientePadreId: number | null;
  tipoExpediente: TipoExpediente;
  numeroExpediente: string | null;
  caratula: string;
  juzgado: string | null;
  fechaInicio: string | null;
  estadoLegal: string | null;
  tipoTramite: string | null;
};

export type CrearExpedientePrincipalRequest = Omit<
  CrearExpedienteRequest,
  "casoIds" | "expedientePadreId" | "tipoExpediente"
>;

export type CrearCasoConExpedientePrincipalRequest = {
  caso: CrearCasoRequest;
  expediente: CrearExpedientePrincipalRequest;
};

export type CrearCasoConExpedientePrincipalResponse = DatosAdministrativos & {
  casoId: number;
  expedienteId: number;
  tituloCaso: string;
  numeroExpediente: string | null;
  caratula: string;
  fechaCreacion: string;
};

export type ActualizarExpedienteRequest = CrearExpedienteRequest & {
  // null u omitido no modifica el envío registrado.
  envioCobro?: RegistrarEnvioCobroRequest | null;
};

// Seguimiento de cobro. Contratos propuestos por backend en
// feat/agenda-entregable-2 (docs/brief-seguimiento-cobro-judicial.md),
// pendientes de confirmación.
export type TipoDocumentoCobro = "Cedula" | "Oficio";

export type RegistrarEnvioCobroRequest = {
  tipoDocumento: TipoDocumentoCobro;
  fechaEnvio: string;
};

export type EnvioCobroResponse = {
  envioCobroExpedienteId: number;
  tipoDocumento: TipoDocumentoCobro;
  fechaEnvio: string;
  agendaGeneracionReglaId: number;
  reglaVencimientoId: number;
  entradaAgendaId: number;
  fechaSeguimiento: string;
  estadoSeguimiento: EstadoEntradaAgenda;
  diasParaSeguimiento: number;
  seguimientoVencido: boolean;
  fechaRegistro: string;
  usuarioRegistro: string | null;
};

export type ExpedienteCobroResponse = {
  expedienteId: number;
  casos: CasoExpedienteResponse[];
  tipoExpediente: TipoExpediente;
  numeroExpediente: string | null;
  caratula: string;
  juzgado: string | null;
  estadoLegal: string | null;
  activo: boolean;
  envioCobro: EnvioCobroResponse;
};

export type BuscarExpedientesCobroParams = {
  page: number;
  pageSize: number;
  busqueda?: string;
  soloActivos: boolean;
  seguimientoVencido?: boolean;
};
