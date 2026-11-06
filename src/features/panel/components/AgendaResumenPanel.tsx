"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { EstadoEtiqueta, PrioridadEtiqueta } from "@/features/agenda/components/AgendaEtiquetas";
import { fechaHoyAgenda } from "@/features/agenda/lib/agendaForm";
import { diasEntre, mostrarFechaCorta, mostrarHora } from "@/features/agenda/lib/situacionAgenda";
import type { ResumenEntradaAgenda } from "@/features/agenda/types/types";
import { cn } from "@/lib/utils";
import { resumenEntradaDesdePanel, rutaContextoAgendaPanel } from "../lib/agendaPanel";
import type { PanelAgendaResponse } from "../types/types";

function cuando(fecha: string, hoy: string) {
  const dias = diasEntre(hoy, fecha);
  return dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : mostrarFechaCorta(fecha, hoy);
}

export default function AgendaResumenPanel({ agenda, onSelect }: { agenda: PanelAgendaResponse; onSelect: (entrada: ResumenEntradaAgenda) => void }) {
  const hoy = fechaHoyAgenda();
  const metricas = [
    { label: "Vencidas", value: agenda.vencidos, alerta: true },
    { label: "Atrasadas", value: agenda.atrasados ?? 0, alerta: true },
    { label: "Hoy", value: agenda.hoy, alerta: false },
    { label: "Próximas", value: agenda.proximos, alerta: false },
  ];
  return <section className="overflow-hidden rounded-lg border bg-card" aria-labelledby="panel-agenda">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b p-5 sm:px-6">
      <h2 id="panel-agenda" className="flex items-center gap-2 font-semibold"><CalendarDays className="size-5" aria-hidden="true" />Agenda pendiente</h2>
      <Link href="/agenda" className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Ver pendientes</Link>
    </header>
    <div className="space-y-4 p-5 sm:px-6">
      <dl className="grid grid-cols-2 gap-2">{metricas.map(item => {
        const destacado = item.alerta && item.value > 0;
        return <div key={item.label} className={cn("rounded-md border p-3", destacado ? "border-destructive/40 bg-destructive/5" : "bg-muted/20")}>
          <dt className={cn("flex items-center gap-1 text-xs", destacado ? "text-destructive" : "text-muted-foreground")}>{destacado ? <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" /> : null}{item.label}</dt>
          <dd className={cn("mt-1 text-2xl font-semibold", destacado && "text-destructive")}>{item.value}</dd>
        </div>;
      })}</dl>
      <h3 className="text-sm font-semibold">Hoy y lo que viene</h3>
      {agenda.elementosProximos.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Nada para hoy ni para los próximos días.{agenda.vencidos + (agenda.atrasados ?? 0) > 0 ? " Revisá lo vencido o atrasado en Agenda." : ""}</p> : <ul className="divide-y rounded-md border">{agenda.elementosProximos.map(item => {
        const hora = mostrarHora(item.horaReferencia);
        return <li key={item.entradaAgendaId} className="space-y-1 p-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><time dateTime={item.fechaReferencia} className={cn("font-medium", item.esDeHoy && "text-foreground")}>{item.esDeHoy ? "Hoy" : cuando(item.fechaReferencia, hoy)}{hora ? ` · ${hora}` : ""}</time><span aria-hidden="true">·</span><span>{item.tipoEntradaNombre}</span><EstadoEtiqueta estado={item.estado} /><PrioridadEtiqueta prioridad={item.prioridad} /></p>
          <h4 className="break-words text-sm font-medium"><button type="button" className="rounded-sm text-left underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => onSelect(resumenEntradaDesdePanel(item))}>{item.titulo}</button></h4>
          {item.contextos.length > 0 ? <ul className="flex flex-wrap gap-x-3 gap-y-1">{item.contextos.map(contexto => { const ruta = rutaContextoAgendaPanel(contexto); return <li key={`${contexto.tipo}-${contexto.id}`} className="text-xs">{ruta ? <Link href={ruta} className="break-words text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{contexto.nombre}</Link> : <span className="break-words text-muted-foreground">{contexto.nombre}</span>}</li>; })}</ul> : null}
        </li>;
      })}</ul>}
    </div>
  </section>;
}
