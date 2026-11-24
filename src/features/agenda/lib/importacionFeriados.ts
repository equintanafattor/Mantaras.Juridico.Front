import type { DiaInhabilResponse, EstadoItemImportacion, ItemImportacionFeriados } from "../types/diasInhabiles";

// Mismo rango que valida el backend.
export const ANIO_IMPORTACION_MIN = 2000, ANIO_IMPORTACION_MAX = 2100;

export function anioImportacionValido(anio: number): number {
  if (!Number.isInteger(anio) || anio < ANIO_IMPORTACION_MIN || anio > ANIO_IMPORTACION_MAX) throw new Error(`Ingresá un año entre ${ANIO_IMPORTACION_MIN} y ${ANIO_IMPORTACION_MAX}.`);
  return anio;
}
export function leerAnioImportacion(valor: string): number {
  const texto = valor.trim();
  if (!/^\d{4}$/.test(texto)) throw new Error(`Ingresá un año de cuatro cifras entre ${ANIO_IMPORTACION_MIN} y ${ANIO_IMPORTACION_MAX}.`);
  return anioImportacionValido(Number(texto));
}

export type TipoErrorImportacion = "anio-no-disponible" | "fuente-no-disponible" | "fuente-invalida" | "desactualizada" | "datos-invalidos" | "otro";
export type ErrorImportacion = { tipo: TipoErrorImportacion; titulo: string; mensaje: string };
const ERRORES: Record<string, Omit<ErrorImportacion, "mensaje"> & { mensaje?: string }> = {
  "DiasInhabiles.AnioNoDisponible": { tipo: "anio-no-disponible", titulo: "Año no disponible", mensaje: "La fuente oficial todavía no publica los feriados de ese año. Probá más adelante o cargá las fechas a mano." },
  "DiasInhabiles.FuenteNoDisponible": { tipo: "fuente-no-disponible", titulo: "La fuente oficial no responde", mensaje: "No pudimos consultar el calendario oficial. El calendario guardado no cambió. Intentá de nuevo en unos minutos." },
  "DiasInhabiles.FuenteInvalida": { tipo: "fuente-invalida", titulo: "La fuente oficial respondió con un formato inesperado", mensaje: "No se importó nada y el calendario guardado no cambió. Si se repite, avisá a soporte." },
  "DiasInhabiles.VistaPreviaDesactualizada": { tipo: "desactualizada", titulo: "La vista previa quedó desactualizada", mensaje: "La fuente o algún día inhábil cambió después de la consulta. No se importó nada. Revisá la vista previa actualizada y volvé a confirmar." },
  "DiasInhabiles.DatosInvalidos": { tipo: "datos-invalidos", titulo: "Datos inválidos" },
};
// Acepta ApiError sin importarlo para poder probarse fuera de Next.
export function interpretarErrorImportacion(err: unknown): ErrorImportacion {
  const items = typeof err === "object" && err !== null && Array.isArray((err as { errors?: unknown }).errors) ? (err as { errors: { code?: string; message?: string }[] }).errors : [];
  for (const item of items) {
    const conocido = item.code ? ERRORES[item.code] : undefined;
    if (conocido) return { tipo: conocido.tipo, titulo: conocido.titulo, mensaje: conocido.mensaje ?? item.message ?? "Revisá los datos e intentá de nuevo." };
  }
  return { tipo: "otro", titulo: "No pudimos completar la operación", mensaje: err instanceof Error && err.message ? err.message : "Intentá de nuevo." };
}

export const ESTADO_ITEM_IMPORTACION: Record<EstadoItemImportacion, { etiqueta: string; ayuda: string }> = {
  Nuevo: { etiqueta: "Nuevo", ayuda: "Se va a agregar al calendario." },
  Actualizable: { etiqueta: "Se actualiza", ayuda: "Ya estaba importado y la fuente cambió la descripción." },
  Existente: { etiqueta: "Ya cargado", ayuda: "Ya hay un día inhábil activo en esa fecha. No se modifica." },
  Conflicto: { etiqueta: "Revisar", ayuda: "No se importa: hay un registro que se cambió a mano." },
};
const TIPOS_FUENTE: Record<string, string> = { inamovible: "Inamovible", trasladable: "Trasladable", no_laborable: "No laborable", turistico: "Puente turístico", especial: "Regional" };
export function tipoRegistroFuente(tipo: string) { return TIPOS_FUENTE[tipo] ?? tipo; }

// Explica el conflicto con los datos del registro existente si el backend no envía motivo.
export function explicarConflicto(item: ItemImportacionFeriados): string {
  if (item.motivo) return item.motivo;
  if (item.fechaExistente && item.fechaExistente !== item.fecha) return `Este feriado ya se importó y alguien lo movió al ${fechaCorta(item.fechaExistente)}. Se respeta ese cambio.`;
  if (item.activoExistente === false) return "Hay un día inhábil desactivado en esa fecha. No se reactiva automáticamente; si corresponde, reactivalo desde el listado.";
  return "Hay un registro modificado a mano en esa fecha. Se respeta ese cambio.";
}

export function fechaCorta(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}
export function fechaHoraImportacion(valor: string | null | undefined) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short", hourCycle: "h23" }).format(fecha);
}

export function origenDiaInhabil(dia: DiaInhabilResponse): { etiqueta: string; importado: boolean } {
  if (dia.origen !== "FeriadoNacional") return { etiqueta: "Manual", importado: false };
  return { etiqueta: dia.modificadoManualmente ? "Feriado nacional · modificado" : "Feriado nacional", importado: true };
}

// Fechas de revisión que siguen en la vista previa actual (tras refrescarla pueden desaparecer).
export function fechasRevisionVigentes(seleccion: readonly string[], revision: readonly ItemImportacionFeriados[]) {
  const disponibles = new Set(revision.filter(item => item.estado === "Nuevo" || item.estado === "Actualizable").map(item => item.fecha));
  return seleccion.filter(fecha => disponibles.has(fecha)).sort();
}
export function seAplicaAlConfirmar(item: ItemImportacionFeriados) { return item.estado === "Nuevo" || item.estado === "Actualizable"; }
