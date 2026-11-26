"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAtenderRecordatorioAgenda, useRecordatoriosAgenda } from "../hooks/useRecordatoriosAgenda";
import { AVISOS_SOLO_EN_SISTEMA, fechaHoraAviso } from "../lib/avisosAgenda";
import { fechaHoraLarga } from "../lib/situacionAgenda";
import type { EntradaAgendaListadoResponse, ResumenEntradaAgenda } from "../types/types";
import { EstadoEtiqueta } from "./AgendaEtiquetas";

function resumenDesdeAviso(id: number, titulo: string, tipo: string, conocidas: EntradaAgendaListadoResponse[]): ResumenEntradaAgenda {
  return conocidas.find(item => item.entradaAgendaId === id) ?? { entradaAgendaId: id, titulo, tipoEntradaNombre: tipo, clientes: [], casos: [], expedientes: [], responsables: [] };
}

/**
 * Avisos cuya fecha ya llegó y que nadie marcó como vistos, de entradas abiertas.
 * Es el mismo bloque en Agenda › Pendientes y en el panel de inicio.
 * Marcar como visto no cambia la entrada; abrir el aviso tampoco lo marca.
 */
export default function AvisosPendientesDeVer({ conocidas = [], onDetail, limite = 10, className }: { conocidas?: EntradaAgendaListadoResponse[]; onDetail: (entrada: ResumenEntradaAgenda) => void; limite?: number; className?: string }) {
  const consulta = useRecordatoriosAgenda({ estado: "Vencido", soloEntradasAbiertas: true, page: 1, pageSize: limite }, 60_000);
  const atender = useAtenderRecordatorioAgenda();
  const [error, setError] = useState<string>();
  if (!consulta.data || consulta.data.totalItems === 0) return null;
  return <section aria-labelledby="avisos-pendientes-de-ver" className={cn("rounded-lg border border-amber-600/30 bg-amber-50/50 p-4 dark:bg-amber-950/10", className)}>
    <h2 id="avisos-pendientes-de-ver" className="flex items-center gap-2 font-semibold"><BellRing className="size-4" aria-hidden="true" />Avisos pendientes de ver ({consulta.data.totalItems})</h2>
    <p className="mt-1 text-xs text-muted-foreground">{AVISOS_SOLO_EN_SISTEMA} «Marcar como visto» no completa la entrada.</p>
    <ul className="mt-3 divide-y rounded-md border bg-card">
      {consulta.data.items.map(item => {
        const conocida = conocidas.find(x => x.entradaAgendaId === item.entradaAgendaId);
        const abrir = () => onDetail(resumenDesdeAviso(item.entradaAgendaId, item.entradaTitulo, item.tipoEntradaNombre, conocidas));
        return <li key={item.recordatorioAgendaId} data-aviso-id={item.recordatorioAgendaId} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 space-y-0.5">
            <button type="button" className="break-words text-left text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring" onClick={abrir}>{item.entradaTitulo}</button>
            <p className="text-xs"><span className="text-muted-foreground">Fecha del aviso:</span> <time dateTime={item.fechaProgramadaUtc}>{fechaHoraAviso(item.fechaProgramadaUtc)}</time></p>
            {conocida?.fechaVencimiento ? <p className="text-xs"><span className="text-muted-foreground">Fecha límite:</span> {fechaHoraLarga(conocida.fechaVencimiento, conocida.horaVencimiento)}{conocida.horaVencimiento ? "" : " (sin hora)"}</p> : null}
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><span>{item.tipoEntradaNombre}</span><EstadoEtiqueta estado={item.entradaEstado} /></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={abrir}>Abrir entrada</Button>
            <Button type="button" variant="outline" size="sm" disabled={atender.isPending} onClick={() => { setError(undefined); atender.mutate(item.recordatorioAgendaId, { onError: err => setError(err instanceof Error ? err.message : "No pudimos marcar el aviso como visto.") }); }}>
              {atender.isPending && atender.variables === item.recordatorioAgendaId ? "Guardando…" : "Marcar como visto"}
            </Button>
          </div>
        </li>;
      })}
    </ul>
    {consulta.data.totalItems > consulta.data.items.length ? <p className="mt-2 text-xs text-muted-foreground">Se muestran los primeros {consulta.data.items.length}. Al marcarlos como vistos aparecen los siguientes.</p> : null}
    {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
  </section>;
}
