"use client";

import { CalendarCheck2, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEstadoImportacionFeriados } from "../hooks/useImportacionFeriados";
import { ANIO_IMPORTACION_MAX, ANIO_IMPORTACION_MIN, fechaHoraImportacion } from "../lib/importacionFeriados";

// Cobertura del año filtrado: si tiene calendario oficial importado, de qué fuente y cuándo se sincronizó.
export default function CoberturaFeriadosAnio({ anio, onImportar }: { anio: number; onImportar: () => void }) {
  const fuera = anio < ANIO_IMPORTACION_MIN || anio > ANIO_IMPORTACION_MAX;
  const estado = useEstadoImportacionFeriados(fuera ? undefined : anio);
  if (fuera) return null;
  if (estado.isPending) return <p role="status" className="text-xs text-muted-foreground">Consultando el calendario importado de {anio}…</p>;
  if (estado.isError) return <p role="alert" className="text-xs text-muted-foreground">No pudimos consultar si {anio} tiene feriados importados. <button type="button" className="underline underline-offset-2" onClick={() => void estado.refetch()}>Reintentar</button></p>;
  const e = estado.data;
  if (!e.calendarioCargado) return <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
    <p className="flex min-w-0 gap-2"><CalendarX2 aria-hidden className="mt-0.5 size-4 shrink-0" /><span><strong>{anio} no tiene feriados nacionales importados.</strong> Los cálculos por días hábiles de ese año sólo excluyen fines de semana{e.diasManualesActivos > 0 ? ` y ${e.diasManualesActivos} ${e.diasManualesActivos === 1 ? "fecha cargada" : "fechas cargadas"} a mano` : ""}.</span></p>
    <Button size="sm" variant="outline" onClick={onImportar}>Importar {anio}</Button>
  </div>;
  return <div className="flex gap-2 rounded-md border bg-muted/30 p-3 text-sm">
    <CalendarCheck2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
    <div className="min-w-0 space-y-0.5">
      <p><strong>Feriados {anio} importados</strong> · {e.feriadosImportadosActivos} nacionales y {e.diasManualesActivos} manuales activos.</p>
      <p className="break-words text-xs text-muted-foreground">Fuente: {e.fuente ? <a className="underline underline-offset-2" href={e.fuente.url} target="_blank" rel="noreferrer">{e.fuente.nombre}</a> : "—"} · Última sincronización: {fechaHoraImportacion(e.ultimaSincronizacion)}{e.usuarioSincronizacion ? ` por ${e.usuarioSincronizacion}` : ""}</p>
    </div>
  </div>;
}
