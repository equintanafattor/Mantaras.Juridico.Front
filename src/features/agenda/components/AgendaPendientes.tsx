"use client";

import { useState } from "react";
import { AlertCircle, BellRing, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgendaPendientes } from "../hooks/useAgendaPendientes";
import { useAtenderRecordatorioAgenda, useRecordatoriosAgenda } from "../hooks/useRecordatoriosAgenda";
import { mostrarFechaAuditoriaAgenda } from "../lib/estadosAgenda";
import type { FiltrosAgenda } from "../lib/filtrosAgenda";
import { agruparPendientes } from "../lib/situacionAgenda";
import type { EntradaAgendaListadoResponse, ResumenEntradaAgenda } from "../types/types";
import AgendaEntradaItem, { useCompletarAgenda } from "./AgendaEntradaItem";
import { EstadoEtiqueta } from "./AgendaEtiquetas";

function resumenDesdeAlerta(id: number, titulo: string, tipo: string, conocidas: EntradaAgendaListadoResponse[]): ResumenEntradaAgenda {
  return conocidas.find(item => item.entradaAgendaId === id) ?? { entradaAgendaId: id, titulo, tipoEntradaNombre: tipo, clientes: [], casos: [], expedientes: [], responsables: [] };
}

// Avisos cuyo horario ya pasó y que nadie marcó como atendidos.
function AlertasSinAtender({ conocidas, onDetail }: { conocidas: EntradaAgendaListadoResponse[]; onDetail: (entrada: ResumenEntradaAgenda) => void }) {
  const consulta = useRecordatoriosAgenda({ estado: "Vencido", soloEntradasAbiertas: true, page: 1, pageSize: 10 }, 60_000);
  const atender = useAtenderRecordatorioAgenda();
  const [error, setError] = useState<string>();
  if (!consulta.data || consulta.data.totalItems === 0) return null;
  return <section aria-labelledby="agenda-alertas" className="rounded-lg border border-amber-600/30 bg-amber-50/50 p-4 dark:bg-amber-950/10">
    <h2 id="agenda-alertas" className="flex items-center gap-2 font-semibold"><BellRing className="size-4" aria-hidden="true" />Alertas sin atender ({consulta.data.totalItems})</h2>
    <ul className="mt-3 divide-y rounded-md border bg-card">
      {consulta.data.items.map(item => <li key={item.recordatorioAgendaId} className="flex flex-wrap items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <button type="button" className="break-words text-left text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => onDetail(resumenDesdeAlerta(item.entradaAgendaId, item.entradaTitulo, item.tipoEntradaNombre, conocidas))}>{item.entradaTitulo}</button>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><span>Aviso del {mostrarFechaAuditoriaAgenda(item.fechaProgramadaUtc)} · {item.tipoEntradaNombre}</span>{item.entradaEstado ? <EstadoEtiqueta estado={item.entradaEstado} /> : null}</p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={atender.isPending} onClick={() => { setError(undefined); atender.mutate(item.recordatorioAgendaId, { onError: err => setError(err instanceof Error ? err.message : "No pudimos marcar la alerta como atendida.") }); }}>
          {atender.isPending && atender.variables === item.recordatorioAgendaId ? "Guardando…" : "Marcar atendida"}
        </Button>
      </li>)}
    </ul>
    {consulta.data.totalItems > consulta.data.items.length ? <p className="mt-2 text-xs text-muted-foreground">Se muestran las primeras {consulta.data.items.length}. Al atenderlas aparecen las siguientes.</p> : null}
    {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
  </section>;
}

export default function AgendaPendientes({ filtros, onDetail, onAgregar }: { filtros: FiltrosAgenda; onDetail: (entrada: ResumenEntradaAgenda) => void; onAgregar: () => void }) {
  const consulta = useAgendaPendientes(filtros);
  const { completar, pendienteId, aviso } = useCompletarAgenda();

  if (consulta.isPending) return <div className="space-y-3" aria-busy="true" aria-label="Cargando pendientes">{[0, 1, 2].map(id => <Skeleton key={id} className="h-24 w-full rounded-lg" />)}</div>;
  if (consulta.isError) return <div role="alert" className="rounded-lg border border-destructive/25 bg-card p-6">
    <div className="flex items-center gap-2 font-medium"><AlertCircle className="size-5 text-destructive" />No pudimos cargar los pendientes</div>
    <p className="mt-2 break-words text-sm text-muted-foreground">{consulta.error.message}</p>
    <Button className="mt-4" variant="outline" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>Reintentar</Button>
  </div>;

  const { hoy, entradas } = consulta.data;
  const grupos = agruparPendientes(entradas, hoy);
  return <div className="space-y-6" aria-busy={consulta.isFetching}>
    {aviso}
    <AlertasSinAtender conocidas={entradas} onDetail={onDetail} />
    {grupos.length === 0 ? <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <CalendarCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 font-semibold">No hay pendientes</h2>
      <p className="mt-2 text-sm text-muted-foreground">No hay nada vencido ni previsto para los próximos 30 días.</p>
      <Button className="mt-4" onClick={onAgregar}>Agregar</Button>
    </div> : grupos.map(grupo => <section key={grupo.id} aria-labelledby={`pendientes-${grupo.id}`} className="space-y-2">
      <h2 id={`pendientes-${grupo.id}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{grupo.titulo} <span className="font-normal">({grupo.entradas.length})</span></h2>
      <div className="divide-y overflow-hidden rounded-lg border">
        {grupo.entradas.map(entrada => <AgendaEntradaItem key={entrada.entradaAgendaId} entrada={entrada} hoy={hoy} onDetail={() => onDetail(entrada)} onCompletar={() => void completar(entrada)} completando={pendienteId === entrada.entradaAgendaId} />)}
      </div>
    </section>)}
  </div>;
}
