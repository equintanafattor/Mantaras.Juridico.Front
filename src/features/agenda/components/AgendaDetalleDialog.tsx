"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Pencil, Repeat, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DIALOG_PANEL, DIALOG_PANEL_ENCABEZADO, DIALOG_PIE, Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TACTIL } from "@/lib/tactil";
import { cn } from "@/lib/utils";
import { useCambiarEstadoAgenda, useEntradaAgenda } from "../hooks/useAgenda";
import { fechaHoyAgenda } from "../lib/agendaForm";
import { accionesEstadoAgenda, mostrarFechaAuditoriaAgenda, NOMBRES_ESTADO_AGENDA, relacionesDetalleAgenda } from "../lib/estadosAgenda";
import { estaAbierta, fechaHoraLarga, situacionAgenda } from "../lib/situacionAgenda";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import type { ResumenEntradaAgenda, EstadoEntradaAgenda, RelacionAgendaResponse } from "../types/types";
import AgendaRecordatorios from "./AgendaRecordatorios";
import { EstadoEtiqueta, PrioridadEtiqueta, SituacionEtiqueta } from "./AgendaEtiquetas";

const ENLACE = "break-words text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring";

function Relaciones({ grupos, disabled }: { grupos: { titulo: string; ruta: string; items: RelacionAgendaResponse[] }[]; disabled: boolean }) {
  const conItems = grupos.filter(grupo => grupo.items.length > 0);
  if (conItems.length === 0) return <p className="text-sm text-muted-foreground">Sin cliente ni expediente.</p>;
  return <dl className="space-y-2">{conItems.map(grupo => <div key={grupo.ruta}>
    <dt className="text-xs text-muted-foreground">{grupo.titulo}</dt>
    <dd><ul className="space-y-0.5">{grupo.items.map(item => <li key={item.id}>{disabled ? <span className="break-words text-sm">{item.nombre}</span> : <Link href={`${grupo.ruta}/${item.id}`} className={ENLACE}>{item.nombre}</Link>}{item.referencia ? <span className="ml-2 text-xs text-muted-foreground">{item.referencia}</span> : null}</li>)}</ul></dd>
  </div>)}</dl>;
}

export default function AgendaDetalleDialog({ entrada, onClose, onEdit, onStateChanged }: { onStateChanged?: () => void; entrada: ResumenEntradaAgenda; onClose: () => void; onEdit: (entrada: ResumenEntradaAgenda) => void }) {
  const detalle = useEntradaAgenda(entrada.entradaAgendaId);
  const opciones = useOpcionesAgenda();
  const cambiarEstado = useCambiarEstadoAgenda();
  const [recordatoriosPendientes, setRecordatoriosPendientes] = useState(false);
  const ocupado = cambiarEstado.isPending || recordatoriosPendientes;
  const [mensaje, setMensaje] = useState<string>();
  const [error, setError] = useState<string>();
  const [objetivo, setObjetivo] = useState<EstadoEntradaAgenda>();
  const [masAcciones, setMasAcciones] = useState(false);
  const [avisosAbiertos, setAvisosAbiertos] = useState(false);
  const data = detalle.data;
  const bloqueado = ocupado || detalle.isFetching;
  const hoy = fechaHoyAgenda();

  async function cambiar(estado: EstadoEntradaAgenda) {
    if (bloqueado || !data || !data.transicionesPermitidas.includes(estado)) return;
    setMensaje(undefined); setError(undefined); setObjetivo(estado);
    try {
      await cambiarEstado.mutateAsync({ id: entrada.entradaAgendaId, request: { estado } });
      onStateChanged?.();
      setMasAcciones(false);
      setMensaje(estado === "Completada" ? "Listo: quedó completada." : estado === "Pendiente" ? "Se volvió a abrir como pendiente." : `Estado actualizado: ${NOMBRES_ESTADO_AGENDA[estado]}.`);
    } catch (err) { setError(`No pudimos cambiar el estado. ${err instanceof Error ? err.message : "Probá de nuevo."}`); }
    finally { setObjetivo(undefined); }
  }

  const acciones = data ? accionesEstadoAgenda(data.estado, data.transicionesPermitidas ?? []) : [];
  const principal = acciones.find(item => item.estado === "Completada") ?? acciones.find(item => item.estado === "Pendiente");
  const otras = acciones.filter(item => item !== principal);
  const situacion = data ? situacionAgenda(data, hoy) : null;
  const nombreResponsable = (id: number) => data?.responsables?.find(item => item.id === id)?.nombre ?? opciones.data?.responsables.find(item => item.id === id)?.nombre ?? entrada.responsables.find(item => item.id === id)?.nombre ?? "Usuario no disponible";

  return <Dialog open onOpenChange={open => { if (!open && !ocupado) onClose(); }}>
    <DialogContent showCloseButton={!ocupado} className={cn(DIALOG_PANEL, TACTIL, "sm:max-w-2xl")}>
      <DialogHeader className={DIALOG_PANEL_ENCABEZADO}>
        <DialogTitle className="break-words leading-snug">{data?.titulo ?? entrada.titulo}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{data?.tipoEntradaNombre ?? entrada.tipoEntradaNombre}</span>
          {(data?.recurrenciaAgendaId ?? entrada.recurrenciaAgendaId) ? <span className="inline-flex items-center gap-1"><Repeat className="size-3.5" aria-hidden="true" />Se repite (los cambios aplican sólo a esta)</span> : null}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="pb-4">
      {detalle.isPending ? <Skeleton className="h-60 w-full" aria-label="Cargando detalle" /> : detalle.isError ? <div role="alert" className="space-y-3"><p>No pudimos abrir el detalle. {detalle.error.message}</p><Button variant="outline" disabled={detalle.isFetching || ocupado} onClick={() => void detalle.refetch()}>Reintentar</Button></div> : data && situacion ? <div className="space-y-5" aria-busy={bloqueado}>
        <div className="flex flex-wrap items-center gap-1.5">
          {situacion.condicion ? <SituacionEtiqueta situacion={situacion} /> : null}
          <EstadoEtiqueta estado={data.estado} mostrarPendiente />
          <PrioridadEtiqueta prioridad={data.prioridad} />
        </div>

        <section aria-label="Acciones" className="flex flex-wrap gap-2">
          {principal ? <Button disabled={bloqueado} variant={principal.estado === "Completada" ? "default" : "outline"} onClick={() => void cambiar(principal.estado)}>
            {principal.estado === "Completada" ? <Check /> : <RotateCcw />}{cambiarEstado.isPending && objetivo === principal.estado ? "Guardando…" : principal.label}
          </Button> : null}
          <Button variant="outline" disabled={bloqueado} onClick={() => onEdit({ ...entrada, titulo: data.titulo, tipoEntradaNombre: data.tipoEntradaNombre, clientes: data.clientes ?? entrada.clientes, casos: data.casos ?? entrada.casos, expedientes: data.expedientes ?? entrada.expedientes, responsables: data.responsables ?? entrada.responsables })}><Pencil />Editar</Button>
          {otras.length > 0 ? <Button variant="ghost" aria-expanded={masAcciones} aria-controls="agenda-detalle-mas" disabled={bloqueado} onClick={() => setMasAcciones(!masAcciones)}>Más acciones<ChevronDown className={cn("transition-transform", masAcciones && "rotate-180")} /></Button> : null}
          {masAcciones ? <div id="agenda-detalle-mas" className="flex w-full flex-wrap gap-2 rounded-md border bg-muted/30 p-2">
            {otras.map(item => <Button key={item.estado} size="sm" variant={item.estado === "Cancelada" ? "destructive" : "outline"} disabled={bloqueado} onClick={() => void cambiar(item.estado)}>{cambiarEstado.isPending && objetivo === item.estado ? "Guardando…" : item.label}</Button>)}
            <p className="w-full text-xs text-muted-foreground">Posponer sólo cambia el estado. Para mover la fecha, usá Editar.</p>
          </div> : null}
        </section>
        {mensaje ? <p role="status" className="rounded-md border border-emerald-600/30 bg-emerald-50/60 px-3 py-2 text-sm dark:bg-emerald-950/20">{mensaje}</p> : null}
        {error ? <div role="alert" className="space-y-2 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive"><p className="whitespace-pre-wrap">{error}</p><Button variant="outline" size="sm" disabled={bloqueado} onClick={() => void detalle.refetch()}>Actualizar detalle</Button></div> : null}

        <dl className="grid gap-3 text-sm @lg:grid-cols-3">
          {data.fechaVencimiento ? <div><dt className="text-xs text-muted-foreground">Fecha límite</dt><dd className="font-medium"><time dateTime={data.fechaVencimiento}>{fechaHoraLarga(data.fechaVencimiento, data.horaVencimiento)}</time>{data.horaVencimiento ? null : <span className="font-normal text-muted-foreground"> · sin hora</span>}</dd></div> : null}
          <div><dt className="text-xs text-muted-foreground">{data.fechaVencimiento ? "Inicio" : "Fecha del evento"}</dt><dd><time dateTime={data.fechaInicio}>{fechaHoraLarga(data.fechaInicio, data.horaInicio)}</time>{data.horaInicio ? null : <span className="text-muted-foreground"> · sin hora</span>}</dd></div>
          {data.fechaFin || data.horaFin ? <div><dt className="text-xs text-muted-foreground">Termina</dt><dd>{data.fechaFin && data.fechaFin !== data.fechaInicio ? fechaHoraLarga(data.fechaFin, data.horaFin) : data.horaFin ? data.horaFin.slice(0, 5) : "—"}</dd></div> : null}
        </dl>

        <div className="grid gap-5 @lg:grid-cols-2">
          <section className="space-y-2"><h3 className="text-sm font-medium">Relacionado con</h3>
            <Relaciones disabled={ocupado} grupos={[
              { titulo: "Cliente", ruta: "/clientes", items: data.clientes ?? relacionesDetalleAgenda(data.clienteIds, entrada.clientes) },
              { titulo: "Expediente administrativo", ruta: "/casos", items: data.casos ?? relacionesDetalleAgenda(data.casoIds, entrada.casos) },
              { titulo: "Expediente judicial", ruta: "/expedientes", items: data.expedientes ?? relacionesDetalleAgenda(data.expedienteIds, entrada.expedientes) },
            ]} />
          </section>
          <section className="space-y-2"><h3 className="text-sm font-medium">Responsables</h3>{data.responsableIds.length === 0 ? <p className="text-sm text-muted-foreground">Sin asignar</p> : <ul className="space-y-0.5 text-sm">{data.responsableIds.map(id => <li key={id}>{nombreResponsable(id)}</li>)}</ul>}</section>
        </div>

        {data.descripcion ? <section className="space-y-1"><h3 className="text-sm font-medium">Notas</h3><p className="whitespace-pre-wrap break-words text-sm">{data.descripcion}</p></section> : null}

        <section className="rounded-lg border">
          <button type="button" className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring" aria-expanded={avisosAbiertos} aria-controls="agenda-detalle-avisos" onClick={() => setAvisosAbiertos(!avisosAbiertos)} disabled={recordatoriosPendientes}>
            Avisos<ChevronDown className={cn("size-4 transition-transform", avisosAbiertos && "rotate-180")} aria-hidden="true" />
          </button>
          {avisosAbiertos ? <div id="agenda-detalle-avisos" className="px-3 pb-3">
            <AgendaRecordatorios entrada={data} nombresUsuarios={opciones.data?.responsables} disabled={cambiarEstado.isPending || detalle.isFetching} onPending={setRecordatoriosPendientes} />
          </div> : null}
        </section>

        <p className="text-xs text-muted-foreground">N.º {data.entradaAgendaId} · Creada el {mostrarFechaAuditoriaAgenda(data.fechaCreacion)}{data.fechaModificacion ? ` · Última modificación: ${mostrarFechaAuditoriaAgenda(data.fechaModificacion)}` : ""} · Horarios de Argentina{estaAbierta(data.estado) ? "" : ` · ${NOMBRES_ESTADO_AGENDA[data.estado]}`}</p>
      </div> : null}
      </DialogBody>
      <div className={DIALOG_PIE}><Button variant="outline" disabled={ocupado} onClick={onClose}>Cerrar</Button></div>
    </DialogContent>
  </Dialog>;
}
