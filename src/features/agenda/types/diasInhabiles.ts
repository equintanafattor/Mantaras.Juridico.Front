export type OrigenDiaInhabil = "Manual" | "FeriadoNacional";
export type DiaInhabilResponse = {
  diaInhabilId: number;
  fecha: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
  // Opcionales: un backend sin la importación de feriados no los envía.
  origen?: OrigenDiaInhabil;
  fuente?: string | null;
  fechaFuente?: string | null;
  fechaSincronizacion?: string | null;
  modificadoManualmente?: boolean;
};
export type GuardarDiaInhabilRequest = { fecha: string; descripcion: string };
export type BuscarDiasInhabilesRequest = { anio?: number; soloActivos?: boolean; page?: number; pageSize?: number };

// Importación de feriados nacionales. El backend descarga e interpreta la fuente oficial
// y decide cobertura, duplicados y conflictos; la interfaz sólo muestra y confirma.
export type FuenteFeriados = { codigo: string; nombre: string; url: string };
export type EstadoItemImportacion = "Nuevo" | "Existente" | "Actualizable" | "Conflicto";
export type CategoriaItemImportacion = "FeriadoNacional" | "RequiereRevision";
export type ItemImportacionFeriados = {
  fecha: string;
  descripcion: string;
  categoria: CategoriaItemImportacion;
  estado: EstadoItemImportacion;
  registrosFuente: { nombre: string; tipo: string }[];
  diaInhabilIdExistente: number | null;
  fechaExistente: string | null;
  origenExistente: OrigenDiaInhabil | null;
  descripcionExistente: string | null;
  activoExistente: boolean | null;
  modificadoManualmenteExistente: boolean | null;
  motivo: string | null;
};
export type VistaPreviaImportacionFeriados = {
  anio: number;
  fuente: FuenteFeriados;
  fechaPublicacionFuente: string | null;
  consultadoEn: string;
  huella: string;
  calendarioCargado: boolean;
  ultimaSincronizacion: string | null;
  resumen: { nuevos: number; existentes: number; actualizables: number; conflictos: number; requierenRevision: number; omitidos: number; ausentesEnFuente: number };
  items: ItemImportacionFeriados[];
  requierenRevision: ItemImportacionFeriados[];
  omitidos: { fecha: string; descripcion: string; tipo: string; motivo: string }[];
  ausentesEnFuente: DiaInhabilResponse[];
};
export type ConfirmarImportacionFeriadosRequest = { huella: string; fechasRevisionIncluidas: string[] };
export type ResultadoImportacionFeriados = {
  anio: number;
  fuente: FuenteFeriados;
  creados: number;
  actualizados: number;
  existentes: number;
  conflictos: number;
  revisionIncluidos: number;
  sincronizadoEn: string;
  yaAplicada: boolean;
};
export type EstadoImportacionFeriados = {
  anio: number;
  calendarioCargado: boolean;
  fuente: FuenteFeriados | null;
  fechaPublicacionFuente: string | null;
  primeraSincronizacion: string | null;
  ultimaSincronizacion: string | null;
  usuarioSincronizacion: string | null;
  diasInhabilesActivos: number;
  feriadosImportadosActivos: number;
  diasManualesActivos: number;
};

// Se devuelve al calcular por días hábiles (aplicar regla, envío de cobro).
export type AdvertenciaCalculo = { codigo: string; mensaje: string; anio: number | null };
