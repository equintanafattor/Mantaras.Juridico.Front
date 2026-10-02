export type TipoEntradaAgendaResponse = {
  tipoEntradaAgendaId: number;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
};
export type GuardarTipoEntradaAgendaRequest = {
  nombre: string;
  descripcion: string | null;
  color: string | null;
};
export type BuscarTiposEntradaAgendaRequest = {
  busqueda?: string;
  soloActivos?: boolean;
  page?: number;
  pageSize?: number;
};
