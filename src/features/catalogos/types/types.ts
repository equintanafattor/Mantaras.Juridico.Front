export type TipoCatalogo = "beneficios" | "administrativos";

export type CatalogoItem = {
  id: number;
  nombre: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
};

export const CATALOGOS = {
  beneficios: { ruta: "/api/tipos-beneficio", campoId: "tipoBeneficioId", titulo: "Tipos de beneficio", limite: 100 },
  administrativos: { ruta: "/api/tipos-expediente-administrativo", campoId: "tipoExpedienteAdministrativoId", titulo: "Tipos de expediente administrativo", limite: 150 },
} as const;

export type ReferenciaCatalogo = Pick<CatalogoItem, "id" | "nombre" | "activo">;

export type DatosAdministrativos = {
  numeroExpedienteAnses: string | null;
  tipoBeneficioId: number | null;
  tipoBeneficioNombre: string | null;
  tipoBeneficioActivo: boolean | null;
  tipoExpedienteAdministrativoId: number | null;
  tipoExpedienteAdministrativoNombre: string | null;
  tipoExpedienteAdministrativoActivo: boolean | null;
};
