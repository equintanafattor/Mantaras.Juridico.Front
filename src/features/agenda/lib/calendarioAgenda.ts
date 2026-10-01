import type { EntradaAgendaListadoResponse } from "../types/types";
import { rangoMes } from "./periodoAgenda";

export type DiaCalendario = { fecha: string; numero: number; enMes: boolean; valido: boolean };
export type ElementoCalendario = { entrada: EntradaAgendaListadoResponse; esVencimiento: boolean };

function fechaIso(fecha: Date): string {
  return `${String(fecha.getUTCFullYear()).padStart(4, "0")}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}-${String(fecha.getUTCDate()).padStart(2, "0")}`;
}

export function diasCalendario(mes: string): DiaCalendario[] {
  rangoMes(mes);
  const [anio, numeroMes] = mes.split("-").map(Number);
  const inicio = new Date(0);
  inicio.setUTCFullYear(anio, numeroMes - 1, 1);
  const desplazamiento = (inicio.getUTCDay() + 6) % 7;
  const fin = new Date(0);
  fin.setUTCFullYear(anio, numeroMes, 0);
  const cantidad = Math.ceil((desplazamiento + fin.getUTCDate()) / 7) * 7;
  inicio.setUTCDate(inicio.getUTCDate() - desplazamiento);
  return Array.from({ length: cantidad }, (_, index) => {
    const dia = new Date(inicio);
    dia.setUTCDate(dia.getUTCDate() + index);
    return { fecha: fechaIso(dia), numero: dia.getUTCDate(), enMes: dia.getUTCFullYear() === anio && dia.getUTCMonth() === numeroMes - 1, valido: dia.getUTCFullYear() >= 1 && dia.getUTCFullYear() <= 9999 };
  });
}

export function rangoCalendario(mes: string) {
  const dias = diasCalendario(mes).filter((dia) => dia.valido);
  return { desde: dias[0].fecha, hasta: dias[dias.length - 1].fecha };
}

export function agruparEntradasCalendario(dias: DiaCalendario[], entradas: EntradaAgendaListadoResponse[]) {
  const porDia = new Map<string, ElementoCalendario[]>();
  for (const dia of dias) {
    const elementos = entradas.filter((entrada) => {
      const enEvento = entrada.fechaInicio <= dia.fecha && (entrada.fechaFin ?? entrada.fechaInicio) >= dia.fecha;
      return dia.valido && (enEvento || entrada.fechaVencimiento === dia.fecha);
    }).map((entrada) => ({ entrada, esVencimiento: entrada.fechaVencimiento === dia.fecha }));
    elementos.sort((a, b) => {
      const horaA = (a.esVencimiento ? a.entrada.horaVencimiento : a.entrada.horaInicio) ?? "";
      const horaB = (b.esVencimiento ? b.entrada.horaVencimiento : b.entrada.horaInicio) ?? "";
      return horaA.localeCompare(horaB) || a.entrada.entradaAgendaId - b.entrada.entradaAgendaId;
    });
    porDia.set(dia.fecha, elementos);
  }
  return porDia;
}
