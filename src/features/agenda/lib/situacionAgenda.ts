import type { EntradaAgendaListadoResponse, EstadoEntradaAgenda, PrioridadAgenda } from "../types/types";
import { mostrarFechaAgenda } from "./periodoAgenda";

// Lo que la persona ve, separado del estado de trabajo:
// - Vencida: tiene fecha de vencimiento, ya pasó y la entrada sigue abierta (lo informa backend).
// - Atrasada: no tiene vencimiento, su fecha ya pasó y sigue abierta.
// Completada o Cancelada nunca se muestran como vencidas ni atrasadas.
export type CondicionAgenda = "vencida" | "atrasada" | "hoy" | "pronto" | "futura";

type EntradaFechas = Pick<EntradaAgendaListadoResponse,
  "estado" | "fechaInicio" | "horaInicio" | "fechaFin" | "horaFin" | "fechaVencimiento" | "horaVencimiento" | "diasParaVencimiento" | "estaVencida"
>;

export const ESTADOS_ABIERTOS: readonly EstadoEntradaAgenda[] = ["Pendiente", "EnCurso", "Pospuesta"];
export const DIAS_PROXIMOS = 7;

export function estaAbierta(estado: EstadoEntradaAgenda) {
  return ESTADOS_ABIERTOS.includes(estado);
}

function numeroDia(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  const valor = new Date(0);
  valor.setUTCFullYear(anio, mes - 1, dia);
  return Math.round(valor.getTime() / 86_400_000);
}

export function diasEntre(desde: string, hasta: string) {
  return numeroDia(hasta) - numeroDia(desde);
}

export function sumarDias(fecha: string, dias: number) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const valor = new Date(0);
  valor.setUTCFullYear(anio, mes - 1, dia + dias);
  return `${String(valor.getUTCFullYear()).padStart(4, "0")}-${String(valor.getUTCMonth() + 1).padStart(2, "0")}-${String(valor.getUTCDate()).padStart(2, "0")}`;
}

// Fecha corta y legible: "jue 12 nov" (agrega el año si no es el actual).
export function mostrarFechaCorta(fecha: string, hoy?: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const valor = new Date(0);
  valor.setUTCFullYear(anio, mes - 1, dia);
  const mismoAnio = hoy ? hoy.slice(0, 4) === fecha.slice(0, 4) : true;
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", ...(mismoAnio ? {} : { year: "numeric" }), timeZone: "UTC" })
    .format(valor).replace(/,/g, "").replace(/\./g, "");
}

export function mostrarHora(hora: string | null | undefined) {
  return hora ? hora.slice(0, 5) : null;
}

// Fecha que ordena la entrada: el vencimiento si lo tiene; si no, su fecha.
export function fechaReferencia(entrada: EntradaFechas, hoy: string) {
  if (entrada.fechaVencimiento) return { fecha: entrada.fechaVencimiento, hora: entrada.horaVencimiento, esVencimiento: true };
  const enCurso = entrada.fechaFin && entrada.fechaInicio < hoy && entrada.fechaFin >= hoy;
  return enCurso ? { fecha: hoy, hora: null, esVencimiento: false } : { fecha: entrada.fechaFin ?? entrada.fechaInicio, hora: entrada.fechaFin ? entrada.horaFin : entrada.horaInicio, esVencimiento: false };
}

function enDias(dias: number) {
  return dias === 1 ? "mañana" : `en ${dias} días`;
}

function haceDias(dias: number) {
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

export type SituacionAgenda = { condicion: CondicionAgenda | null; texto: string; dias: number };

export function situacionAgenda(entrada: EntradaFechas, hoy: string): SituacionAgenda {
  const ref = fechaReferencia(entrada, hoy);
  const dias = ref.esVencimiento && entrada.diasParaVencimiento !== null ? entrada.diasParaVencimiento : diasEntre(hoy, ref.fecha);
  const abierta = estaAbierta(entrada.estado);
  const fecha = mostrarFechaCorta(ref.fecha, hoy);
  if (ref.esVencimiento) {
    if (!abierta) return { condicion: null, texto: `Vencimiento: ${fecha}`, dias };
    if (entrada.estaVencida) return { condicion: "vencida", texto: dias === -1 ? "Venció ayer" : `Venció ${haceDias(-dias)}`, dias };
    if (dias === 0) return { condicion: "hoy", texto: "Vence hoy", dias };
    if (dias > 0 && dias <= DIAS_PROXIMOS) return { condicion: "pronto", texto: `Vence ${enDias(dias)}`, dias };
    return { condicion: "futura", texto: `Vence el ${fecha}`, dias };
  }
  if (!abierta) return { condicion: null, texto: fecha, dias };
  if (dias < 0) return { condicion: "atrasada", texto: `Atrasada: era para el ${fecha}`, dias };
  if (dias === 0) return { condicion: "hoy", texto: entrada.fechaInicio < hoy ? `Hoy (sigue hasta el ${mostrarFechaCorta(entrada.fechaFin ?? hoy, hoy)})` : "Hoy", dias };
  if (dias <= DIAS_PROXIMOS) return { condicion: "pronto", texto: dias === 1 ? "Mañana" : `En ${dias} días`, dias };
  return { condicion: "futura", texto: fecha, dias };
}

// "jue 12 nov · 10:00 a 11:30" o "Vence jue 12 nov · 13:00".
export function cuandoAgenda(entrada: EntradaFechas, hoy: string) {
  const ref = fechaReferencia(entrada, hoy);
  if (ref.esVencimiento) {
    const hora = mostrarHora(entrada.horaVencimiento);
    return `Vence ${mostrarFechaCorta(ref.fecha, hoy)}${hora ? ` · ${hora}` : ""}`;
  }
  const inicio = mostrarHora(entrada.horaInicio), fin = mostrarHora(entrada.horaFin);
  const multiDia = entrada.fechaFin && entrada.fechaFin !== entrada.fechaInicio;
  if (multiDia) return `${mostrarFechaCorta(entrada.fechaInicio, hoy)}${inicio ? ` ${inicio}` : ""} al ${mostrarFechaCorta(entrada.fechaFin!, hoy)}${fin ? ` ${fin}` : ""}`;
  return `${mostrarFechaCorta(entrada.fechaInicio, hoy)}${inicio ? ` · ${inicio}${fin ? ` a ${fin}` : ""}` : ""}`;
}

export function fechaHoraLarga(fecha: string | null, hora: string | null) {
  if (!fecha) return null;
  return `${mostrarFechaAgenda(fecha)}${hora ? ` · ${hora.slice(0, 5)}` : ""}`;
}

export const NOMBRES_PRIORIDAD: Record<PrioridadAgenda, string> = { Baja: "Baja", Normal: "Normal", Alta: "Alta", Urgente: "Urgente" };
const PESO_PRIORIDAD: Record<PrioridadAgenda, number> = { Urgente: 0, Alta: 1, Normal: 2, Baja: 3 };

export type GrupoPendientes = { id: "atrasadas" | "hoy" | "proximos" | "despues"; titulo: string; entradas: EntradaAgendaListadoResponse[] };

export function agruparPendientes(entradas: EntradaAgendaListadoResponse[], hoy: string): GrupoPendientes[] {
  const grupos: GrupoPendientes[] = [
    { id: "atrasadas", titulo: "Vencidas y atrasadas", entradas: [] },
    { id: "hoy", titulo: "Hoy", entradas: [] },
    { id: "proximos", titulo: `Próximos ${DIAS_PROXIMOS} días`, entradas: [] },
    { id: "despues", titulo: "Más adelante", entradas: [] },
  ];
  const ordenadas = [...entradas].filter(entrada => entrada.activo && estaAbierta(entrada.estado)).sort((a, b) => {
    const x = fechaReferencia(a, hoy), y = fechaReferencia(b, hoy);
    return x.fecha.localeCompare(y.fecha) || (x.hora ?? "99").localeCompare(y.hora ?? "99") || PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad] || a.entradaAgendaId - b.entradaAgendaId;
  });
  for (const entrada of ordenadas) {
    const { condicion } = situacionAgenda(entrada, hoy);
    const grupo = condicion === "vencida" || condicion === "atrasada" ? 0 : condicion === "hoy" ? 1 : condicion === "pronto" ? 2 : 3;
    grupos[grupo].entradas.push(entrada);
  }
  return grupos.filter(grupo => grupo.entradas.length > 0);
}
