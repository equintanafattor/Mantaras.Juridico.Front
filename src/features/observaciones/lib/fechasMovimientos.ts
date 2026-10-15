import type { ObservacionResponse } from "../types/types";

export function fechaHoyMovimiento(fecha = new Date()): string {
  if (Number.isNaN(fecha.getTime())) return "";
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find(parte => parte.type === tipo)!.value;
  return `${valor("year").padStart(4, "0")}-${valor("month")}-${valor("day")}`;
}

export function fechaMovimientoValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor <= "0001-01-01") return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

export function fechaEfectivaMovimiento(item: ObservacionResponse): string {
  return item.fechaMovimiento ?? fechaHoyMovimiento(new Date(item.fechaCreacion));
}

export function ordenarHistorial(items: ObservacionResponse[], esMovimiento: boolean): ObservacionResponse[] {
  return [...items].sort((a, b) => {
    if (esMovimiento) {
      const fecha = fechaEfectivaMovimiento(b).localeCompare(fechaEfectivaMovimiento(a));
      if (fecha !== 0) return fecha;
    }
    return (Date.parse(b.fechaCreacion) || 0) - (Date.parse(a.fechaCreacion) || 0)
      || b.observacionId - a.observacionId;
  });
}

export function formatearFechaMovimiento(valor: string): string {
  if (!fechaMovimientoValida(valor)) return "Fecha no disponible";
  const [anio, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${anio}`;
}
