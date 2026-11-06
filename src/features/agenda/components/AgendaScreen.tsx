"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, ListChecks, List, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAgenda } from "../hooks/useAgenda";
import { fechaHoyAgenda } from "../lib/agendaForm";
import { desplazarMes, mesActualArgentina, mostrarFechaAgenda, nombreMes } from "../lib/periodoAgenda";
import { FILTROS_AGENDA_INICIALES, parametrosFiltrosAgenda, rangoListadoAgenda, type FiltrosAgenda } from "../lib/filtrosAgenda";
import type { ResumenEntradaAgenda } from "../types/types";
import AplicarReglaAgendaDialog from "./AplicarReglaAgendaDialog";
import AgendaCalendario from "./AgendaCalendario";
import AgendaFiltros from "./AgendaFiltros";
import AgendaDetalleDialog from "./AgendaDetalleDialog";
import AgendaEntradaItem, { useCompletarAgenda } from "./AgendaEntradaItem";
import AgendaFormDialog, { type EditorAgenda } from "./AgendaFormDialog";
import AgendaPendientes from "./AgendaPendientes";
import MensajeGuardado from "./MensajeGuardado";

type VistaAgenda = "pendientes" | "calendario" | "todas";
const PAGE_SIZE = 20;
const VISTAS: { id: VistaAgenda; label: string; icono: typeof List }[] = [
  { id: "pendientes", label: "Pendientes", icono: ListChecks },
  { id: "calendario", label: "Calendario", icono: CalendarDays },
  { id: "todas", label: "Todas", icono: List },
];

type Mensaje = { texto: string; entrada?: ResumenEntradaAgenda };

function ListadoMes({ mes, filtros, page, setPage, onDetail }: { mes: string; filtros: FiltrosAgenda; page: number; setPage: (page: number) => void; onDetail: (entrada: ResumenEntradaAgenda) => void }) {
  const agenda = useAgenda({ ...parametrosFiltrosAgenda(filtros), ...rangoListadoAgenda(mes, filtros), page, pageSize: PAGE_SIZE, soloActivos: true, incluirVencimientos: true });
  const { completar, pendienteId, aviso } = useCompletarAgenda();
  const hoy = fechaHoyAgenda();
  if (agenda.isPending) return <div className="space-y-3" aria-label="Cargando Agenda" aria-busy="true">{[0, 1, 2].map((id) => <Skeleton key={id} className="h-24 w-full rounded-lg" />)}</div>;
  if (agenda.isError) return <div role="alert" className="rounded-lg border border-destructive/25 bg-card p-6">
    <div className="flex items-center gap-2 font-medium"><AlertCircle className="size-5 text-destructive" />No pudimos cargar la agenda</div>
    <p className="mt-2 break-words text-sm text-muted-foreground">{agenda.error.message}</p>
    <Button className="mt-4" variant="outline" disabled={agenda.isFetching} onClick={() => void agenda.refetch()}>Reintentar</Button>
  </div>;
  return <div className="space-y-3">
    {aviso}
    <p className="text-sm text-muted-foreground" role="status">{agenda.data.totalItems === 1 ? "1 resultado" : `${agenda.data.totalItems} resultados`}</p>
    {agenda.data.items.length === 0 ? <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <CalendarDays className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 font-semibold">No hay nada en este período</h2>
      <p className="mt-2 text-sm text-muted-foreground">Probá con otro mes o limpiá los filtros.</p>
    </div> : <div aria-busy={agenda.isFetching} className="divide-y overflow-hidden rounded-lg border">
      {agenda.data.items.map((entrada) => <AgendaEntradaItem key={entrada.entradaAgendaId} entrada={entrada} hoy={hoy} onDetail={() => onDetail(entrada)} onCompletar={() => void completar(entrada)} completando={pendienteId === entrada.entradaAgendaId} />)}
    </div>}
    {agenda.data.totalPages > 1 ? <nav aria-label="Paginación de Agenda" className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Página {agenda.data.page} de {agenda.data.totalPages}</span>
      <div className="flex gap-2">
        <Button variant="outline" disabled={!agenda.data.hasPreviousPage || agenda.isFetching} onClick={() => setPage(page - 1)}><ChevronLeft />Anterior</Button>
        <Button variant="outline" disabled={!agenda.data.hasNextPage || agenda.isFetching} onClick={() => setPage(page + 1)}>Siguiente<ChevronRight /></Button>
      </div>
    </nav> : null}
  </div>;
}

export default function AgendaScreen() {
  const [mes, setMes] = useState(mesActualArgentina);
  const [vista, setVista] = useState<VistaAgenda>("pendientes");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<EditorAgenda>();
  const [detalle, setDetalle] = useState<ResumenEntradaAgenda>();
  const [aplicarRegla, setAplicarRegla] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>();
  const [filtros, setFiltros] = useState<FiltrosAgenda>(FILTROS_AGENDA_INICIALES);

  function cambiarMes(nuevoMes: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(nuevoMes) || nuevoMes < "0001-01" || nuevoMes > "9999-12") return;
    setMes(nuevoMes);
    setPage(1);
  }
  function agregar() { setMensaje(undefined); setEditor({ modo: "entrada" }); }
  const conMes = vista !== "pendientes";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Agenda</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/agenda/configuracion" className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"><Settings className="size-4" aria-hidden="true" />Configuración</Link>
          <Button size="lg" onClick={agregar}><Plus />Agregar</Button>
        </div>
      </header>

      {mensaje ? <MensajeGuardado mensaje={mensaje} onVer={(entrada) => { setMensaje(undefined); setDetalle(entrada); }} onClose={() => setMensaje(undefined)} /> : null}
      {editor ? <AgendaFormDialog editor={editor} onClose={() => setEditor(undefined)}
        onUsarRegla={editor.modo !== "editar" ? () => { setEditor(undefined); setAplicarRegla(true); } : undefined}
        onSaved={(resultado) => { setEditor(undefined); setPage(1); setMensaje(resultado ? { texto: resultado.texto, entrada: resultado.entrada } : { texto: "Cambios guardados." }); }} /> : null}
      {aplicarRegla ? <AplicarReglaAgendaDialog onClose={() => setAplicarRegla(false)} onSaved={({ aplicacion, resumen }) => { setAplicarRegla(false); setPage(1); setMensaje({ texto: `Vencimiento calculado: «${aplicacion.entrada.titulo}» vence el ${mostrarFechaAgenda(aplicacion.fechaCalculada)}.`, entrada: resumen }); }} /> : null}
      {detalle ? <AgendaDetalleDialog key={detalle.entradaAgendaId} entrada={detalle} onClose={() => setDetalle(undefined)} onEdit={(entrada) => { setDetalle(undefined); setEditor({ modo: "editar", entrada }); }} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5" role="group" aria-label="Vista de Agenda">
          {VISTAS.map(({ id, label, icono: Icono }) => <Button key={id} variant={vista === id ? "secondary" : "ghost"} className={cn("h-8", vista === id && "bg-background shadow-sm")} aria-pressed={vista === id} onClick={() => { setVista(id); setPage(1); }}><Icono />{label}</Button>)}
        </div>
        {conMes ? <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Mes anterior" disabled={mes === "0001-01"} onClick={() => cambiarMes(desplazarMes(mes, -1))}><ChevronLeft /></Button>
          <label className="sr-only" htmlFor="agenda-periodo">Mes</label>
          <input id="agenda-periodo" type="month" min="0001-01" max="9999-12" value={mes} onChange={(event) => cambiarMes(event.target.value)} className="h-8 max-w-40 rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring" />
          <Button variant="outline" size="icon" aria-label="Mes siguiente" disabled={mes === "9999-12"} onClick={() => cambiarMes(desplazarMes(mes, 1))}><ChevronRight /></Button>
          {mes !== mesActualArgentina() ? <Button variant="ghost" onClick={() => cambiarMes(mesActualArgentina())}>Hoy</Button> : null}
        </div> : null}
      </div>

      <AgendaFiltros key={vista} value={filtros} campos={{ estado: vista !== "pendientes", fechas: vista === "todas" }} onApply={(next) => { setFiltros(next); setPage(1); }} />

      {conMes ? <h2 className="text-lg font-semibold capitalize">{vista === "todas" && (filtros.desde || filtros.hasta) ? "Rango de fechas elegido" : nombreMes(mes)}</h2> : null}

      {vista === "pendientes" ? <AgendaPendientes filtros={{ ...filtros, estado: "", desde: "", hasta: "" }}onDetail={setDetalle} onAgregar={agregar} />
        : vista === "calendario" ? <AgendaCalendario key={`${mes}-${JSON.stringify(filtros)}`} mes={mes} filtros={{ ...filtros, desde: "", hasta: "" }} onDetail={setDetalle} />
          : <ListadoMes mes={mes} filtros={filtros} page={page} setPage={setPage} onDetail={setDetalle} />}
    </div>
  );
}
