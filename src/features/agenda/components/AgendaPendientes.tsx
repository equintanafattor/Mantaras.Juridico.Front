"use client";

import { AlertCircle, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgendaPendientes } from "../hooks/useAgendaPendientes";
import type { FiltrosAgenda } from "../lib/filtrosAgenda";
import { agruparPendientes } from "../lib/situacionAgenda";
import type { ResumenEntradaAgenda } from "../types/types";
import AgendaEntradaItem, { useCompletarAgenda } from "./AgendaEntradaItem";
import AvisosPendientesDeVer from "./AvisosPendientesDeVer";

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
    <AvisosPendientesDeVer conocidas={entradas} onDetail={onDetail} />
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
