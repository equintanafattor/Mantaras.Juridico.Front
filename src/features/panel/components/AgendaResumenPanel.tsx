"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NOMBRES_ESTADO_AGENDA } from "@/features/agenda/lib/estadosAgenda";
import { mostrarFechaAgenda } from "@/features/agenda/lib/periodoAgenda";
import type { ResumenEntradaAgenda } from "@/features/agenda/types/types";
import { resumenEntradaDesdePanel, rutaContextoAgendaPanel } from "../lib/agendaPanel";
import type { PanelAgendaResponse } from "../types/types";

export default function AgendaResumenPanel({ agenda, onSelect }: { agenda: PanelAgendaResponse; onSelect: (entrada: ResumenEntradaAgenda) => void }) {
  return <section className="overflow-hidden rounded-lg border bg-card" aria-label="Resumen de Agenda">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b p-5 sm:px-6"><div><h2 className="flex items-center gap-2 font-semibold"><CalendarDays className="size-5" />Agenda del estudio</h2><p className="mt-1 text-sm text-muted-foreground">Entradas pendientes, en curso y pospuestas.</p></div><Link href="/agenda" className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Ver agenda</Link></header>
    <div className="space-y-4 p-5 sm:px-6">
      <dl className="grid grid-cols-3 gap-2">{[{ label: "Hoy", value: agenda.hoy }, { label: "Próximas", value: agenda.proximos }, { label: "Vencidas", value: agenda.vencidos }].map(item => <div key={item.label} className="rounded-md border bg-muted/20 p-3"><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className={item.label === "Vencidas" && item.value > 0 ? "mt-1 text-2xl font-semibold text-destructive" : "mt-1 text-2xl font-semibold"}>{item.value}</dd></div>)}</dl>
      <p className="text-xs leading-5 text-muted-foreground">Se toma la fecha de vencimiento o, si no hay vencimiento, la de inicio. Horarios de Argentina.</p>
      <h3 className="text-sm font-semibold">Hoy y próximas entradas</h3>
      {agenda.elementosProximos.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay entradas para hoy ni para fechas próximas.{agenda.vencidos > 0 ? " Revisá en Agenda las entradas vencidas." : ""}</p> : <ul className="space-y-3">{agenda.elementosProximos.map(item => <li key={item.entradaAgendaId} className="space-y-3 rounded-md border p-3">
        <div className="flex flex-wrap gap-2"><Badge variant="outline">{item.tipoEntradaNombre}</Badge><Badge variant="outline">{NOMBRES_ESTADO_AGENDA[item.estado]}</Badge><Badge variant={item.prioridad === "Urgente" ? "destructive" : "secondary"}>{item.prioridad}</Badge>{item.esDeHoy ? <Badge>Hoy</Badge> : null}</div>
        <h4 className="break-words text-sm font-medium">{item.titulo}</h4>
        <p className="text-sm text-muted-foreground"><time dateTime={item.fechaReferencia}>{mostrarFechaAgenda(item.fechaReferencia)}</time>{item.horaReferencia ? ` · ${item.horaReferencia.slice(0, 5)}` : " · Sin hora"}</p>
        {item.contextos.length > 0 ? <ul className="space-y-1">{item.contextos.map(contexto => { const ruta = rutaContextoAgendaPanel(contexto); return <li key={`${contexto.tipo}-${contexto.id}`} className="text-xs">{ruta ? <Link href={ruta} className="break-words text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{contexto.nombre}</Link> : <span className="break-words text-muted-foreground">{contexto.nombre}</span>}</li>; })}</ul> : null}
        <Button type="button" variant="outline" size="sm" onClick={() => onSelect(resumenEntradaDesdePanel(item))}>Ver detalle</Button>
      </li>)}</ul>}
    </div>
  </section>;
}
