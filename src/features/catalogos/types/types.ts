export type TipoCatalogo =
  | "beneficios"
  | "administrativos"
  | "fases"
  | "tramites"
  | "estadosLegales";

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
  fases: { ruta: "/api/opciones-catalogo/fases-internas", campoId: "opcionCatalogoId", titulo: "Fases internas", limite: 200 },
  tramites: { ruta: "/api/opciones-catalogo/tipos-tramite", campoId: "opcionCatalogoId", titulo: "Tipos de trámite", limite: 200 },
  estadosLegales: { ruta: "/api/opciones-catalogo/estados-legales", campoId: "opcionCatalogoId", titulo: "Estados legales", limite: 200 },
} as const;

export type ReferenciaCatalogo = Pick<CatalogoItem, "id" | "nombre" | "activo">;

export type DatosAdministrativos = {
  numeroExpedienteAnses: string | null;
  numeroBeneficio: string | null;
  tipoBeneficioId: number | null;
  tipoBeneficioNombre: string | null;
  tipoBeneficioActivo: boolean | null;
  tipoExpedienteAdministrativoId: number | null;
  tipoExpedienteAdministrativoNombre: string | null;
  tipoExpedienteAdministrativoActivo: boolean | null;
};
