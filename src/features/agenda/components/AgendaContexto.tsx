"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TACTIL } from "@/lib/tactil";
import { cn } from "@/lib/utils";
import { useAgendaPendientes } from "../hooks/useAgendaPendientes";
import { filtrosAgendaContexto, type ContextoAgenda } from "../lib/agendaContexto";
import { mostrarFechaAgenda } from "../lib/periodoAgenda";
import { agruparPendientes } from "../lib/situacionAgenda";
import type { ResumenEntradaAgenda } from "../types/types";
import AplicarReglaAgendaDialog from "./AplicarReglaAgendaDialog";
import AgendaDetalleDialog from "./AgendaDetalleDialog";
import AgendaEntradaItem, { useCompletarAgenda } from "./AgendaEntradaItem";
import AgendaFormDialog, { type EditorAgenda } from "./AgendaFormDialog";
import MensajeGuardado from "./MensajeGuardado";

const MAXIMO = 6;

// Pendientes de la ficha: lo vencido o atrasado primero, después lo próximo.
export default function AgendaContexto({ contexto, activo }: { contexto: ContextoAgenda; activo: boolean }) {
  const consulta = useAgendaPendientes(filtrosAgendaContexto(contexto), { diasAdelante: null });
  const { completar, pendienteId, aviso } = useCompletarAgenda();
  const [detalle, setDetalle] = useState<ResumenEntradaAgenda>();
  const [aplicarRegla, setAplicarRegla] = useState(false);
  const [editor, setEditor] = useState<EditorAgenda>();
  const [mensaje, setMensaje] = useState<{ texto: string; entrada?: ResumenEntradaAgenda }>();
  const hoy = consulta.data?.hoy ?? "";
  const ordenadas = consulta.data ? agruparPendientes(consulta.data.entradas, hoy).flatMap(grupo => grupo.entradas) : [];

  return <section className={cn("rounded-lg border bg-card p-4 sm:p-6", TACTIL)} aria-labelledby={`agenda-contexto-${contexto.tipo}`}>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={`agenda-contexto-${contexto.tipo}`} className="flex items-center gap-2 font-semibold"><CalendarDays className="size-5" aria-hidden="true" />Agenda{ordenadas.length > 0 ? ` · ${ordenadas.length} pendiente${ordenadas.length === 1 ? "" : "s"}` : ""}</h2>
      <div className="flex flex-wrap gap-2">
        {activo ? <Button type="button" size="sm" onClick={() => { setMensaje(undefined); setEditor({ modo: "entrada", contexto }); }}><Plus />Agregar</Button> : null}
        <Link href="/agenda" className="inline-flex h-7 items-center rounded-md border px-2.5 text-[0.8rem] font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:h-10">Ver agenda</Link>
      </div>
    </header>
    <div className="mt-4 space-y-3" aria-busy={consulta.isFetching}>
      {mensaje ? <MensajeGuardado mensaje={mensaje} onVer={entrada => { setMensaje(undefined); setDetalle(entrada); }} onClose={() => setMensaje(undefined)} /> : null}
      {aviso}
      {consulta.isPending ? <Skeleton className="h-24 w-full" aria-label="Cargando agenda" /> : consulta.isError ? <div role="alert" className="space-y-2 text-sm"><p>No pudimos cargar la agenda. {consulta.error.message}</p><Button type="button" variant="outline" size="sm" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>Reintentar</Button></div>
        : ordenadas.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay nada pendiente para esta ficha.</p>
          : <div className="divide-y overflow-hidden rounded-md border">{ordenadas.slice(0, MAXIMO).map(entrada => <AgendaEntradaItem key={entrada.entradaAgendaId} entrada={entrada} hoy={hoy} onDetail={() => setDetalle(entrada)} onCompletar={() => void completar(entrada)} completando={pendienteId === entrada.entradaAgendaId} />)}</div>}
      {ordenadas.length > MAXIMO ? <p className="text-sm text-muted-foreground">Se muestran {MAXIMO} de {ordenadas.length}. El resto está en Agenda (filtrá por esta ficha).</p> : null}
    </div>
    {aplicarRegla ? <AplicarReglaAgendaDialog contexto={contexto} onClose={() => setAplicarRegla(false)} onSaved={({ aplicacion, resumen }) => { setAplicarRegla(false); setMensaje({ texto: `Vencimiento calculado: vence el ${mostrarFechaAgenda(aplicacion.fechaCalculada)}.`, entrada: resumen }); }} /> : null}
    {detalle ? <AgendaDetalleDialog key={detalle.entradaAgendaId} entrada={detalle} onClose={() => setDetalle(undefined)} onEdit={entrada => { setDetalle(undefined); setEditor({ modo: "editar", entrada }); }} /> : null}
    {editor ? <AgendaFormDialog key={editor.modo === "editar" ? `editar-${editor.entrada.entradaAgendaId}` : editor.modo} editor={editor} onClose={() => setEditor(undefined)}
      onUsarRegla={editor.modo !== "editar" ? () => { setEditor(undefined); setAplicarRegla(true); } : undefined}
      onSaved={resultado => { setEditor(undefined); setMensaje(resultado ?? { texto: "Cambios guardados." }); }} /> : null}
  </section>;
}
