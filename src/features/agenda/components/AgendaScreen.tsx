"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle, CalendarDays, ChevronLeft, ChevronRight,
  LayoutGrid, List, RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAgenda } from "../hooks/useAgenda";
import {
  desplazarMes, mesActualArgentina, mostrarFechaAgenda, nombreMes,
} from "../lib/periodoAgenda";
import type { EntradaAgendaListadoResponse, RelacionAgendaResponse } from "../types/types";

import AgendaCalendario from "./AgendaCalendario";
import AgendaFiltros from "./AgendaFiltros";
import AgendaDetalleDialog from "./AgendaDetalleDialog";
import AgendaFormDialog, { type EditorAgenda } from "./AgendaFormDialog";
import { FILTROS_AGENDA_INICIALES, parametrosFiltrosAgenda, rangoListadoAgenda, type FiltrosAgenda } from "../lib/filtrosAgenda";

type VistaAgenda = "lista" | "tarjetas" | "calendario";
const PAGE_SIZE = 12;

function Contextos({ items, ruta }: { items: RelacionAgendaResponse[]; ruta: string }) {
  return items.map((item) => (
    <Link
      key={item.id}
      href={`${ruta}/${item.id}`}
      className="rounded-sm text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
    >
      {item.nombre}
    </Link>
  ));
}

function Entrada({ entrada, vista, onEdit, onDetail }: { entrada: EntradaAgendaListadoResponse; vista: VistaAgenda; onEdit: () => void; onDetail: () => void }) {
  const tieneContextos = entrada.clientes.length + entrada.casos.length + entrada.expedientes.length > 0;
  return (
    <article className={cn("min-w-0 bg-card p-4 sm:p-5", vista === "tarjetas" ? "rounded-lg border" : "sm:grid sm:grid-cols-[minmax(0,1fr)_13rem] sm:gap-6")}>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{entrada.tipoEntradaNombre}</span>
          <Badge variant="outline">{entrada.estado === "EnCurso" ? "En curso" : entrada.estado}</Badge>
          <Badge variant={entrada.prioridad === "Urgente" ? "destructive" : "secondary"}>{entrada.prioridad}</Badge>
          {entrada.estaVencida ? <Badge variant="destructive">Vencida</Badge> : entrada.proximaAVencer ? <Badge variant="outline">Próxima a vencer</Badge> : null}
        </div>
        <h2 className="break-words font-semibold leading-6">{entrada.titulo}</h2>
        <div className="mt-2 flex gap-2"><Button type="button" variant="outline" size="sm" onClick={onDetail}>Ver detalle</Button><Button type="button" variant="outline" size="sm" onClick={onEdit}>Editar</Button></div>
        {entrada.descripcion ? <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{entrada.descripcion}</p> : null}
        {tieneContextos ? (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2" aria-label="Contextos relacionados">
            <Contextos items={entrada.clientes} ruta="/clientes" />
            <Contextos items={entrada.casos} ruta="/casos" />
            <Contextos items={entrada.expedientes} ruta="/expedientes" />
          </div>
        ) : null}
        {entrada.responsables.length > 0 ? (
          <p className="mt-2 break-words text-xs text-muted-foreground">Responsables: {entrada.responsables.map((item) => item.nombre).join(", ")}</p>
        ) : null}
      </div>
      <dl className={cn("mt-4 space-y-2 text-sm", vista === "lista" && "sm:mt-0")}>
        <div>
          <dt className="text-xs text-muted-foreground">Inicio</dt>
          <dd><time dateTime={entrada.fechaInicio}>{mostrarFechaAgenda(entrada.fechaInicio)}</time>{entrada.horaInicio ? ` · ${entrada.horaInicio.slice(0, 5)}` : " · Sin hora"}</dd>
        </div>
        {entrada.fechaFin ? <div><dt className="text-xs text-muted-foreground">Fin</dt><dd>{mostrarFechaAgenda(entrada.fechaFin)}{entrada.horaFin ? ` · ${entrada.horaFin.slice(0, 5)}` : ""}</dd></div> : null}
        {entrada.fechaVencimiento ? <div><dt className="text-xs text-muted-foreground">Vencimiento</dt><dd className={entrada.estaVencida ? "font-medium text-destructive" : undefined}>{mostrarFechaAgenda(entrada.fechaVencimiento)}{entrada.horaVencimiento ? ` · ${entrada.horaVencimiento.slice(0, 5)}` : " · Sin hora"}</dd></div> : null}
      </dl>
    </article>
  );
}

export default function AgendaScreen() {
  const [mes, setMes] = useState(mesActualArgentina);
  const [vista, setVista] = useState<VistaAgenda>("lista");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<EditorAgenda>();
  const [detalle, setDetalle] = useState<EntradaAgendaListadoResponse>();
  const [mensaje, setMensaje] = useState<string>();
  const [filtros, setFiltros] = useState<FiltrosAgenda>(FILTROS_AGENDA_INICIALES);
  const rango = rangoListadoAgenda(mes, filtros);
  const agenda = useAgenda({ ...parametrosFiltrosAgenda(filtros), ...rango, page, pageSize: PAGE_SIZE, soloActivos: true, incluirVencimientos: true }, vista !== "calendario");

  function cambiarMes(nuevoMes: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(nuevoMes) || nuevoMes < "0001-01" || nuevoMes > "9999-12") return;
    setMes(nuevoMes);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Organización del estudio</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Agenda</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tareas, compromisos y vencimientos. Horarios de Argentina.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/agenda/configuracion" className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Configuración</Link>
          <Button onClick={() => setEditor({ modo: "entrada" })}>Nueva entrada</Button>
          <Button variant="outline" onClick={() => setEditor({ modo: "vencimiento" })}>Nuevo vencimiento</Button>
        <Button className={vista === "calendario" ? "hidden" : undefined} variant="outline" onClick={() => void agenda.refetch()} disabled={agenda.isFetching}>
          <RotateCcw className={agenda.isFetching ? "animate-spin" : undefined} />Actualizar
        </Button>
        </div>
      </header>
      {mensaje ? <p role="status" className="text-sm text-muted-foreground">{mensaje}</p> : null}
      {editor ? <AgendaFormDialog editor={editor} onClose={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setPage(1); setMensaje("Entrada guardada. Si no aparece, revisá el período y los filtros seleccionados."); }} /> : null}

      {detalle ? <AgendaDetalleDialog key={detalle.entradaAgendaId} entrada={detalle} onClose={() => setDetalle(undefined)} onStateChanged={() => setPage(1)} onEdit={(entrada) => { setDetalle(undefined); setEditor({ modo: "editar", entrada }); }} /> : null}

      <section aria-label="Período y vista de Agenda" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Mes anterior" disabled={mes === "0001-01"} onClick={() => cambiarMes(desplazarMes(mes, -1))}><ChevronLeft /></Button>
          <label className="sr-only" htmlFor="agenda-periodo">Período de Agenda</label>
          <input id="agenda-periodo" type="month" min="0001-01" max="9999-12" value={mes} onChange={(event) => cambiarMes(event.target.value)} className="h-9 max-w-44 rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring" />
          <Button variant="outline" size="icon" aria-label="Mes siguiente" disabled={mes === "9999-12"} onClick={() => cambiarMes(desplazarMes(mes, 1))}><ChevronRight /></Button>
          <Button variant="ghost" onClick={() => cambiarMes(mesActualArgentina())}>Mes actual</Button>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Vista de Agenda">
          <Button variant={vista === "calendario" ? "secondary" : "ghost"} aria-pressed={vista === "calendario"} onClick={() => setVista("calendario")}><CalendarDays />Calendario</Button>
          <Button variant={vista === "lista" ? "secondary" : "ghost"} aria-pressed={vista === "lista"} onClick={() => setVista("lista")}><List />Lista</Button>
          <Button variant={vista === "tarjetas" ? "secondary" : "ghost"} aria-pressed={vista === "tarjetas"} onClick={() => setVista("tarjetas")}><LayoutGrid />Tarjetas</Button>
        </div>
      </section>

      <AgendaFiltros value={filtros} onApply={(next) => { setFiltros(next); setPage(1); }} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold capitalize">{vista !== "calendario" && (filtros.desde || filtros.hasta) ? "Resultados del rango de fechas" : nombreMes(mes)}</h2>
        <p className={cn("text-sm text-muted-foreground", vista === "calendario" && "hidden")} role="status">{agenda.isPending ? "Cargando entradas…" : agenda.isError ? "Consulta pendiente de reintento" : `${agenda.data.totalItems} ${agenda.data.totalItems === 1 ? "entrada" : "entradas"} en el período`}</p>
      </div>

      {vista === "calendario" ? <AgendaCalendario key={`${mes}-${JSON.stringify(filtros)}`} mes={mes} filtros={filtros} onDetail={setDetalle} /> : agenda.isPending ? (
        <div className="space-y-3" aria-label="Cargando Agenda" aria-busy="true">{[0, 1, 2].map((id) => <Skeleton key={id} className="h-32 w-full rounded-lg" />)}</div>
      ) : agenda.isError ? (
        <div role="alert" className="rounded-lg border border-destructive/25 bg-card p-6">
          <div className="flex items-center gap-2 font-medium"><AlertCircle className="size-5 text-destructive" />No pudimos cargar la agenda</div>
          <p className="mt-2 break-words text-sm text-muted-foreground">{agenda.error.message}</p>
          <Button className="mt-4" variant="outline" disabled={agenda.isFetching} onClick={() => void agenda.refetch()}>Reintentar</Button>
        </div>
      ) : agenda.data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
          <CalendarDays className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No hay entradas para esta consulta</h2>
          <p className="mt-2 text-sm text-muted-foreground">Probá cambiar el período o limpiar los filtros.</p>
        </div>
      ) : (
        <div aria-busy={agenda.isFetching} className={vista === "tarjetas" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "divide-y overflow-hidden rounded-lg border"}>
          {agenda.data.items.map((entrada) => <Entrada key={entrada.entradaAgendaId} entrada={entrada} vista={vista} onDetail={() => setDetalle(entrada)} onEdit={() => setEditor({ modo: "editar", entrada })} />)}
        </div>
      )}

      {vista !== "calendario" && agenda.data && !agenda.isError && agenda.data.totalPages > 1 ? (
        <nav aria-label="Paginación de Agenda" className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Página {agenda.data.page} de {agenda.data.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!agenda.data.hasPreviousPage || agenda.isFetching} onClick={() => setPage((actual) => actual - 1)}><ChevronLeft />Anterior</Button>
            <Button variant="outline" disabled={!agenda.data.hasNextPage || agenda.isFetching} onClick={() => setPage((actual) => actual + 1)}>Siguiente<ChevronRight /></Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
