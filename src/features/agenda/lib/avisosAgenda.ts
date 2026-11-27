import type {
  BaseCalculoRecordatorioAgenda,
  CrearRecordatorioAgendaRequest,
  EstadoEntradaAgenda,
  EstadoRecordatorioAgenda,
  RecordatorioPredeterminadoResponse,
} from "../types/types";

// Vocabulario de los avisos (recordatorios internos de la API).
// El estado lo calcula backend: Pendiente = su fecha todavía no llegó;
// Vencido = ya llegó y nadie lo marcó como visto; Atendido = alguien lo marcó como visto.
// "Vencido" se reserva para el plazo de la entrada, por eso acá no se usa.

// "2 días antes de la fecha límite", "En el momento del inicio".
export function describirAnticipacion(minutos: number, base: BaseCalculoRecordatorioAgenda) {
  const destino = base === "Inicio" ? "del inicio" : "de la fecha límite";
  if (minutos === 0) return `En el momento ${destino}`;
  const [valor, unidad] = minutos % 1440 === 0 ? [minutos / 1440, "día"] : minutos % 60 === 0 ? [minutos / 60, "hora"] : [minutos, "minuto"];
  return `${valor} ${unidad}${valor === 1 ? "" : "s"} antes ${destino}`;
}

export const ESTADO_AVISO: Record<EstadoRecordatorioAgenda, string> = {
  Pendiente: "Programado",
  Vencido: "Pendiente de ver",
  Atendido: "Visto",
};

export const BASE_AVISO: Record<BaseCalculoRecordatorioAgenda, string> = {
  Inicio: "Fecha del evento (inicio)",
  Vencimiento: "Fecha límite",
};

// Backend usa las 9:00 cuando la fecha base no tiene hora (RecordatoriosAgendaService.HoraPredeterminada).
export const HORA_AVISO_SIN_HORA = "09:00";

export const AVISOS_SOLO_EN_SISTEMA =
  "Los avisos aparecen dentro del sistema (en Agenda › Pendientes y en el panel de inicio) cuando llega su fecha. No se envían por correo ni por WhatsApp.";

const ZONA = "America/Argentina/Buenos_Aires";
const FORMATO = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "mié 25/11/2026, 09:00" en horario de Argentina. */
export function fechaHoraAviso(valor: string | Date): string {
  const fecha = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(fecha.getTime())) return "Fecha no disponible";
  return FORMATO.format(fecha).replace(/\.(?=\s)/, "");
}

// Argentina no tiene horario de verano: la zona de las entradas es UTC-3 fija.
export function instanteArgentina(fecha: string, hora: string | null): Date {
  const hhmm = (hora ?? HORA_AVISO_SIN_HORA).slice(0, 5);
  return new Date(`${fecha}T${hhmm}:00-03:00`);
}

type FechasEntrada = {
  fechaInicio: string;
  horaInicio: string | null;
  fechaVencimiento: string | null;
  horaVencimiento: string | null;
};

/** Instante en que aparecerá un aviso, con el mismo cálculo que backend; null si falta la fecha base. */
export function calcularFechaAviso(entrada: FechasEntrada, aviso: CrearRecordatorioAgendaRequest): Date | null {
  const base = aviso.baseCalculo === "Inicio"
    ? entrada.fechaInicio ? instanteArgentina(entrada.fechaInicio, entrada.horaInicio) : null
    : entrada.fechaVencimiento ? instanteArgentina(entrada.fechaVencimiento, entrada.horaVencimiento) : null;
  if (!base || Number.isNaN(base.getTime())) return null;
  return new Date(base.getTime() - aviso.minutosAnticipacion * 60_000);
}

export const ORIGEN_NO_DISPONIBLE = "Origen no disponible";

/**
 * Texto del origen informado por la API (RecordatorioAgendaResponse.origen y origenNombre).
 * No se deduce nada: ante "Desconocido" (históricos), null, un campo ausente o un valor no previsto,
 * se muestra "Origen no disponible".
 */
export function describirOrigenAviso(aviso: { origen?: string | null; origenNombre?: string | null }): string {
  const nombre = aviso.origenNombre?.trim();
  switch (aviso.origen) {
    case "Manual": return "Agregado a mano";
    case "Categoria": return nombre ? `Automático · categoría «${nombre}»` : ORIGEN_NO_DISPONIBLE;
    case "Regla": return nombre ? `Automático · regla «${nombre}»` : ORIGEN_NO_DISPONIBLE;
    default: return ORIGEN_NO_DISPONIBLE;
  }
}

export type AvisoResumen = { clave: string; descripcion: string; fecha: Date | null; automatico: boolean; motivoSinFecha?: string };

/** Resumen del formulario: qué avisos se crearán al guardar y cuándo aparecerán. */
export function resumenAvisosFormulario(
  entrada: FechasEntrada,
  predeterminados: RecordatorioPredeterminadoResponse[],
  adicionales: CrearRecordatorioAgendaRequest[],
): AvisoResumen[] {
  const vistos = new Set<number>();
  const items: AvisoResumen[] = [];
  const agregar = (aviso: CrearRecordatorioAgendaRequest, automatico: boolean) => {
    const fecha = calcularFechaAviso(entrada, aviso);
    // Backend no duplica avisos con el mismo instante.
    if (fecha && vistos.has(fecha.getTime())) return;
    if (fecha) vistos.add(fecha.getTime());
    items.push({
      clave: `${automatico ? "a" : "m"}-${aviso.baseCalculo}-${aviso.minutosAnticipacion}`,
      descripcion: describirAnticipacion(aviso.minutosAnticipacion, aviso.baseCalculo),
      fecha,
      automatico,
      motivoSinFecha: fecha ? undefined : "No se crea: la entrada no tiene fecha límite.",
    });
  };
  predeterminados.filter(item => item.activo).forEach(item => agregar(item, true));
  adicionales.forEach(item => agregar(item, false));
  return items.sort((a, b) => (a.fecha?.getTime() ?? Infinity) - (b.fecha?.getTime() ?? Infinity));
}

export function entradaCerrada(estado: EstadoEntradaAgenda) {
  return estado === "Completada" || estado === "Cancelada";
}
