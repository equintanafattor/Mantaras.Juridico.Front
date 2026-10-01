"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgendaContexto } from "../hooks/useAgendaContexto";
import { referenciaAgendaContexto, type ContextoAgenda } from "../lib/agendaContexto";
import { mostrarFechaAgenda } from "../lib/periodoAgenda";
import { NOMBRES_ESTADO_AGENDA } from "../lib/estadosAgenda";
import type { ResumenEntradaAgenda } from "../types/types";
import AgendaDetalleDialog from "./AgendaDetalleDialog";
import AgendaFormDialog, { type EditorAgenda } from "./AgendaFormDialog";

export default function AgendaContexto({ contexto, activo }: { contexto: ContextoAgenda; activo: boolean }) {
  const agenda = useAgendaContexto(contexto);
  const [detalle, setDetalle] = useState<ResumenEntradaAgenda>();
  const [editor, setEditor] = useState<EditorAgenda>();
  const [mensaje, setMensaje] = useState<string>();
  const entradas = agenda.data ?? [];

  return <section className="rounded-lg border bg-card p-5 sm:p-6" aria-label="Agenda vinculada">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="flex items-center gap-2 font-semibold"><CalendarDays className="size-5" />Agenda vinculada</h2><p className="mt-1 text-sm text-muted-foreground">Compromisos de hoy y próximos de esta ficha.</p></div>
      <div className="flex flex-wrap gap-2">
        {activo ? <><Button type="button" size="sm" onClick={() => { setMensaje(undefined); setEditor({ modo: "entrada", contexto }); }}>Nueva entrada</Button><Button type="button" variant="outline" size="sm" onClick={() => { setMensaje(undefined); setEditor({ modo: "vencimiento", contexto }); }}>Nuevo vencimiento</Button></> : null}
        <Link href="/agenda" className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Ver agenda</Link>
      </div>
    </header>
    {mensaje ? <p role="status" className="mt-3 text-sm">{mensaje}</p> : null}
    <div className="mt-4 space-y-3" aria-busy={agenda.isFetching}>
      {agenda.isPending ? <Skeleton className="h-24 w-full" aria-label="Cargando agenda vinculada" /> : agenda.isError ? <div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{agenda.error.message}</p><Button type="button" variant="outline" size="sm" disabled={agenda.isFetching} onClick={() => void agenda.refetch()}>Reintentar</Button></div> : entradas.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay compromisos de hoy ni próximos vinculados a esta ficha.</p> : <ul className="space-y-3">{entradas.slice(0, 5).map(entrada => {
        const referencia = referenciaAgendaContexto(entrada);
        return <li key={entrada.entradaAgendaId} className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap gap-2"><Badge variant="outline">{entrada.tipoEntradaNombre}</Badge><Badge variant="outline">{NOMBRES_ESTADO_AGENDA[entrada.estado]}</Badge><Badge variant={entrada.prioridad === "Urgente" ? "destructive" : "secondary"}>{entrada.prioridad}</Badge></div>
          <h3 className="break-words text-sm font-medium">{entrada.titulo}</h3>
          <p className="text-sm text-muted-foreground">{entrada.fechaVencimiento ? "Vencimiento: " : "Inicio: "}<time dateTime={referencia.fecha}>{mostrarFechaAgenda(referencia.fecha)}</time>{referencia.hora ? ` · ${referencia.hora.slice(0, 5)}` : " · Sin hora"}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setDetalle(entrada)}>Ver detalle</Button>
        </li>;
      })}</ul>}
      {entradas.length > 5 ? <p className="text-sm text-muted-foreground">Se muestran los primeros 5 de {entradas.length} compromisos. Podés consultar el resto en Agenda.</p> : null}
      <p className="text-xs text-muted-foreground">Entradas pendientes, en curso y pospuestas. Se toma el vencimiento o, si no lo hay, el inicio. Horarios de Argentina.</p>
    </div>
    {detalle ? <AgendaDetalleDialog key={detalle.entradaAgendaId} entrada={detalle} onClose={() => setDetalle(undefined)} onEdit={entrada => { setDetalle(undefined); setEditor({ modo: "editar", entrada }); }} /> : null}
    {editor ? <AgendaFormDialog key={editor.modo === "editar" ? `editar-${editor.entrada.entradaAgendaId}` : editor.modo} editor={editor} onClose={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setMensaje("Entrada guardada. La agenda vinculada se actualizó."); }} /> : null}
  </section>;
}
