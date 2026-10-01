// Fechas locales: yyyy-MM-dd. Horas locales: HH:mm:ss. Fechas UTC: ISO 8601.

export type EstadoEntradaAgenda = "Pendiente" | "EnCurso" | "Pospuesta" | "Completada" | "Cancelada";

export type PrioridadAgenda = "Baja" | "Normal" | "Alta" | "Urgente";

export type OrigenFechaBaseAgenda = "Manual" | "EntradaAgenda" | "ExpedienteAdministrativo" | "ExpedienteJudicial" | "Movimiento";

export type BaseCalculoRecordatorioAgenda = "Inicio" | "Vencimiento";

export type EstadoRecordatorioAgenda = "Pendiente" | "Vencido" | "Atendido";

export type CanalRecordatorioAgenda = "Interno";

export type TipoComputoPlazo = "DiasCorridos" | "DiasHabiles";

export type SentidoCalculoPlazo = "Despues" | "Antes";

export type AplicarReglaVencimientoRequest = {
  fechaBase: string;
  origenFechaBase: OrigenFechaBaseAgenda;
  entradaAgendaOrigenId: number | null;
  casoOrigenId: number | null;
  expedienteOrigenId: number | null;
  observacionOrigenId: number | null;
  claveIdempotencia: string;
  clienteIds: number[];
  casoIds: number[];
  expedienteIds: number[];
  responsableIds: number[];
};

export type BuscarAgendaRequest = {
  page?: number;
  pageSize?: number;
  desde?: string | null;
  hasta?: string | null;
  tipoEntradaAgendaId?: number | null;
  estado?: EstadoEntradaAgenda | null;
  responsableId?: number | null;
  clienteId?: number | null;
  casoId?: number | null;
  expedienteId?: number | null;
  busqueda?: string | null;
  incluirVencimientos?: boolean;
  soloActivos?: boolean;
};

export type BuscarRecordatoriosAgendaRequest = {
  entradaAgendaId?: number | null;
  estado?: EstadoRecordatorioAgenda | null;
  page?: number;
  pageSize?: number;
};

export type CambiarEstadoAgendaRequest = {
  estado: EstadoEntradaAgenda;
};

export type CrearRecordatorioAgendaRequest = {
  baseCalculo: BaseCalculoRecordatorioAgenda;
  minutosAnticipacion: number;
};

export type GuardarEntradaAgendaRequest = {
  tipoEntradaAgendaId: number;
  titulo: string;
  descripcion: string | null;
  prioridad: PrioridadAgenda;
  fechaInicio: string;
  horaInicio: string | null;
  fechaFin: string | null;
  horaFin: string | null;
  fechaVencimiento: string | null;
  horaVencimiento: string | null;
  clienteIds: number[];
  casoIds: number[];
  expedienteIds: number[];
  responsableIds: number[];
};

export type GuardarRecordatoriosPredeterminadosRequest = {
  recordatorios: RecordatorioPredeterminadoRequest[];
};

export type RecordatorioPredeterminadoRequest = {
  baseCalculo: BaseCalculoRecordatorioAgenda;
  minutosAnticipacion: number;
};

export type GuardarReglaVencimientoRequest = {
  tipoEntradaAgendaId: number;
  nombre: string;
  descripcion: string | null;
  cantidadDias: number;
  tipoComputo: TipoComputoPlazo;
  sentidoCalculo: SentidoCalculoPlazo;
  prioridadGenerada: PrioridadAgenda;
  horaSugerida: string | null;
  activo: boolean;
};

export type AplicacionReglaVencimientoResponse = {
  agendaGeneracionReglaId: number;
  reglaVencimientoId: number;
  reglaNombre: string;
  fechaBase: string;
  fechaCalculada: string;
  origenFechaBase: OrigenFechaBaseAgenda;
  entradaAgendaOrigenId: number | null;
  casoOrigenId: number | null;
  expedienteOrigenId: number | null;
  observacionOrigenId: number | null;
  claveIdempotencia: string;
  entrada: EntradaAgendaResponse;
};

export type EntradaAgendaListadoResponse = {
  entradaAgendaId: number;
  tipoEntradaAgendaId: number;
  tipoEntradaNombre: string;
  tipoEntradaColor: string | null;
  titulo: string;
  descripcion: string | null;
  estado: EstadoEntradaAgenda;
  prioridad: PrioridadAgenda;
  fechaInicio: string;
  horaInicio: string | null;
  fechaFin: string | null;
  horaFin: string | null;
  fechaVencimiento: string | null;
  horaVencimiento: string | null;
  diasParaVencimiento: number | null;
  estaVencida: boolean;
  proximaAVencer: boolean;
  clientes: RelacionAgendaResponse[];
  casos: RelacionAgendaResponse[];
  expedientes: RelacionAgendaResponse[];
  responsables: RelacionAgendaResponse[];
  activo: boolean;
};

export type RelacionAgendaResponse = {
  id: number;
  nombre: string;
  referencia: string | null;
};

export type EntradaAgendaResponse = {
  entradaAgendaId: number;
  tipoEntradaAgendaId: number;
  tipoEntradaNombre: string;
  tipoEntradaColor: string | null;
  titulo: string;
  descripcion: string | null;
  estado: EstadoEntradaAgenda;
  prioridad: PrioridadAgenda;
  fechaInicio: string;
  horaInicio: string | null;
  fechaFin: string | null;
  horaFin: string | null;
  fechaVencimiento: string | null;
  horaVencimiento: string | null;
  diasParaVencimiento: number | null;
  estaVencida: boolean;
  proximaAVencer: boolean;
  zonaHoraria: string;
  clienteIds: number[];
  casoIds: number[];
  expedienteIds: number[];
  responsableIds: number[];
  fechaCreacion: string;
  fechaModificacion: string | null;
  activo: boolean;
};

export type RecordatorioAgendaResponse = {
  recordatorioAgendaId: number;
  entradaAgendaId: number;
  entradaTitulo: string;
  tipoEntradaNombre: string;
  tipoEntradaColor: string | null;
  canal: CanalRecordatorioAgenda;
  fechaProgramadaUtc: string;
  estado: EstadoRecordatorioAgenda;
  atendido: boolean;
  fechaAtendidoUtc: string | null;
  usuarioAtendioId: number | null;
  fechaCreacion: string;
  activo: boolean;
};

export type RecordatorioPredeterminadoResponse = {
  recordatorioPredeterminadoId: number;
  baseCalculo: BaseCalculoRecordatorioAgenda;
  minutosAnticipacion: number;
  activo: boolean;
};

export type ReglaVencimientoResponse = {
  reglaVencimientoId: number;
  tipoEntradaAgendaId: number;
  tipoEntradaNombre: string;
  tipoEntradaColor: string | null;
  nombre: string;
  descripcion: string | null;
  cantidadDias: number;
  tipoComputo: TipoComputoPlazo;
  sentidoCalculo: SentidoCalculoPlazo;
  prioridadGenerada: PrioridadAgenda;
  horaSugerida: string | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
  activo: boolean;
};

export type OpcionAgendaResponse = { id: number; nombre: string; activo: boolean };
export type OpcionesAgendaResponse = { tiposEntrada: OpcionAgendaResponse[]; responsables: OpcionAgendaResponse[] };

export type ResumenEntradaAgenda = Pick<EntradaAgendaListadoResponse,
  "entradaAgendaId" | "titulo" | "tipoEntradaNombre" | "clientes" | "casos" | "expedientes" | "responsables"
>;
