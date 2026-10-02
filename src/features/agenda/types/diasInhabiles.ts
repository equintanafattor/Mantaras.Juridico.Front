export type DiaInhabilResponse = {
  diaInhabilId: number;
  fecha: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
};
export type GuardarDiaInhabilRequest = { fecha: string; descripcion: string };
export type BuscarDiasInhabilesRequest = { anio?: number; soloActivos?: boolean; page?: number; pageSize?: number };
