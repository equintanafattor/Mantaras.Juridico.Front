import type { ReferenciaCatalogo } from "../types/types";

type JuzgadoEnResponse = {
  juzgadoId: number | null;
  juzgadoNombre: string | null;
  juzgadoActivo: boolean | null;
};

/** Referencia al juzgado vinculado, o null si el expediente no tiene. */
export function referenciaJuzgado(expediente: JuzgadoEnResponse): ReferenciaCatalogo | null {
  if (expediente.juzgadoId === null || !expediente.juzgadoNombre) return null;
  return {
    id: expediente.juzgadoId,
    nombre: expediente.juzgadoNombre,
    activo: expediente.juzgadoActivo !== false,
  };
}

/** Nombre para mostrar; marca los juzgados dados de baja. */
export function nombreJuzgado(expediente: JuzgadoEnResponse): string | null {
  const juzgado = referenciaJuzgado(expediente);
  if (!juzgado) return null;
  return juzgado.activo ? juzgado.nombre : `${juzgado.nombre} (inactivo)`;
}

/** Normaliza para buscar sin distinguir mayúsculas, tildes ni espacios repetidos. */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}
