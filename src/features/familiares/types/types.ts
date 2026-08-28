export const PARENTESCOS = {
  Progenitor: "Padre/madre",
  Hijo: "Hijo/a",
  Hermano: "Hermano/a",
  Conyuge: "Cónyuge",
  Pareja: "Pareja",
  Abuelo: "Abuelo/a",
  Nieto: "Nieto/a",
  Tio: "Tío/a",
  Sobrino: "Sobrino/a",
  OtroFamiliar: "Otro familiar",
} as const;

export type TipoParentesco = keyof typeof PARENTESCOS;

export function esParentesco(value: string): value is TipoParentesco {
  return Object.prototype.hasOwnProperty.call(PARENTESCOS, value);
}

export type FamiliarResponse = {
  relacionFamiliarId: number;
  familiarId: number;
  nombreCompleto: string;
  dni: string | null;
  cuil: string | null;
  parentesco: TipoParentesco;
  activo: boolean;
  fechaCreacion: string;
  usuarioCreacion: string | null;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
};

export type VincularFamiliarRequest = {
  familiarId: number;
  parentesco: TipoParentesco;
};
