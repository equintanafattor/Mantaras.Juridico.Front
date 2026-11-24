// Días inhábiles en el calendario: son datos de referencia, no entradas de agenda.
export type DiaInhabilCalendario = { fecha: string; descripcion: string; origen?: string; activo: boolean };
export function aniosEnRango(desde: string, hasta: string): number[] {
  const inicio = Number(desde.slice(0, 4)), fin = Number(hasta.slice(0, 4));
  return Array.from({ length: Math.max(0, fin - inicio + 1) }, (_, i) => inicio + i);
}
export function diasInhabilesPorFecha<T extends DiaInhabilCalendario>(dias: readonly T[], desde: string, hasta: string): Map<string, T> {
  const porFecha = new Map<string, T>();
  for (const dia of dias) if (dia.activo && dia.fecha >= desde && dia.fecha <= hasta) porFecha.set(dia.fecha, dia);
  return porFecha;
}
