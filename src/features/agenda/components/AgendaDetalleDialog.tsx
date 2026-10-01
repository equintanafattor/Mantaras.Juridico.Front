"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCambiarEstadoAgenda, useEntradaAgenda } from "../hooks/useAgenda";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import { accionesEstadoAgenda, mostrarFechaAuditoriaAgenda, NOMBRES_ESTADO_AGENDA, relacionesDetalleAgenda } from "../lib/estadosAgenda";
import { mostrarFechaAgenda } from "../lib/periodoAgenda";
import type { EntradaAgendaListadoResponse, EstadoEntradaAgenda, RelacionAgendaResponse } from "../types/types";

function Asociaciones({ titulo, items, ruta, disabled }: { titulo: string; items: RelacionAgendaResponse[]; ruta: string; disabled: boolean }) {
  return <section className="space-y-1"><h3 className="text-sm font-medium">{titulo}</h3>{items.length === 0 ? <p className="text-sm text-muted-foreground">Sin asociaciones</p> : <ul className="space-y-1">{items.map(item => <li key={item.id}>{disabled ? <span className="break-words text-sm">{item.nombre}</span> : <Link href={`${ruta}/${item.id}`} className="break-words text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{item.nombre}</Link>}{item.referencia ? <span className="ml-2 text-xs text-muted-foreground">{item.referencia}</span> : null}</li>)}</ul>}</section>;
}

export default function AgendaDetalleDialog({ entrada, onClose, onEdit, onStateChanged }: { onStateChanged: () => void; entrada: EntradaAgendaListadoResponse; onClose: () => void; onEdit: (entrada: EntradaAgendaListadoResponse) => void }) {
  const detalle = useEntradaAgenda(entrada.entradaAgendaId);
  const opciones = useOpcionesAgenda();
  const cambiarEstado = useCambiarEstadoAgenda();
  const [mensaje, setMensaje] = useState<string>();
  const [error, setError] = useState<string>();
  const [objetivo, setObjetivo] = useState<EstadoEntradaAgenda>();
  const data = detalle.data;
  const bloqueado = cambiarEstado.isPending || detalle.isFetching;

  async function cambiar(estado: EstadoEntradaAgenda) {
    if (bloqueado || !data || !accionesEstadoAgenda(data.estado).some(item => item.estado === estado)) return;
    setMensaje(undefined); setError(undefined); setObjetivo(estado);
    try {
      await cambiarEstado.mutateAsync({ id: entrada.entradaAgendaId, request: { estado } });
      onStateChanged();
      setMensaje(`Estado actualizado: ${NOMBRES_ESTADO_AGENDA[estado]}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos cambiar el estado."); }
    finally { setObjetivo(undefined); }
  }

  return <Dialog open onOpenChange={open => { if (!open && !cambiarEstado.isPending) onClose(); }}>
    <DialogContent showCloseButton={!cambiarEstado.isPending} className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle className="pr-6 break-words">{data?.titulo ?? entrada.titulo}</DialogTitle><DialogDescription>{data?.tipoEntradaNombre ?? entrada.tipoEntradaNombre} · Entrada #{entrada.entradaAgendaId}</DialogDescription></DialogHeader>
      {detalle.isPending ? <Skeleton className="h-60 w-full" aria-label="Cargando detalle de Agenda" /> : detalle.isError ? <div role="alert"><p>{detalle.error.message}</p><Button className="mt-3" variant="outline" disabled={detalle.isFetching || cambiarEstado.isPending} onClick={() => void detalle.refetch()}>Reintentar</Button></div> : data ? <div className="space-y-5" aria-busy={bloqueado}>
        <div className="flex flex-wrap gap-2"><Badge variant="outline">{NOMBRES_ESTADO_AGENDA[data.estado]}</Badge><Badge variant={data.prioridad === "Urgente" ? "destructive" : "secondary"}>{data.prioridad}</Badge>{data.estaVencida ? <Badge variant="destructive">Vencida</Badge> : data.proximaAVencer ? <Badge variant="outline">Próxima a vencer</Badge> : null}</div>
        {data.descripcion ? <p className="whitespace-pre-wrap break-words text-sm">{data.descripcion}</p> : <p className="text-sm text-muted-foreground">Sin descripción</p>}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Inicio</dt><dd><time dateTime={data.fechaInicio}>{mostrarFechaAgenda(data.fechaInicio)}</time>{data.horaInicio ? ` · ${data.horaInicio}` : " · Sin hora"}</dd></div>
          <div><dt className="text-muted-foreground">Fin</dt><dd>{data.fechaFin ? `${mostrarFechaAgenda(data.fechaFin)}${data.horaFin ? ` · ${data.horaFin}` : " · Sin hora"}` : "Sin fecha de fin"}</dd></div>
          <div><dt className="text-muted-foreground">Vencimiento</dt><dd>{data.fechaVencimiento ? `${mostrarFechaAgenda(data.fechaVencimiento)}${data.horaVencimiento ? ` · ${data.horaVencimiento}` : " · Sin hora"}` : "Sin vencimiento"}</dd></div>
        </dl>
        <section className="space-y-1"><h3 className="text-sm font-medium">Responsables</h3>{data.responsableIds.length === 0 ? <p className="text-sm text-muted-foreground">Sin responsables asignados</p> : <ul className="space-y-1 text-sm">{data.responsableIds.map(id => <li key={id}>{opciones.data?.responsables.find(item => item.id === id)?.nombre ?? entrada.responsables.find(item => item.id === id)?.nombre ?? `ID ${id}`} · #{id}</li>)}</ul>}</section>
        <div className="grid gap-4 sm:grid-cols-2">
          <Asociaciones titulo="Clientes" items={relacionesDetalleAgenda(data.clienteIds, entrada.clientes)} ruta="/clientes" disabled={cambiarEstado.isPending} />
          <Asociaciones titulo="Expedientes administrativos" items={relacionesDetalleAgenda(data.casoIds, entrada.casos)} ruta="/casos" disabled={cambiarEstado.isPending} />
          <Asociaciones titulo="Expedientes judiciales" items={relacionesDetalleAgenda(data.expedienteIds, entrada.expedientes)} ruta="/expedientes" disabled={cambiarEstado.isPending} />
        </div>
        <dl className="grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2"><div><dt>Creada</dt><dd>{mostrarFechaAuditoriaAgenda(data.fechaCreacion)}</dd></div>{data.fechaModificacion ? <div><dt>Última modificación</dt><dd>{mostrarFechaAuditoriaAgenda(data.fechaModificacion)}</dd></div> : null}</dl>
        <p className="text-xs text-muted-foreground">Horarios de Argentina.</p>
        <section className="space-y-3 border-t pt-4" aria-label="Acciones de Agenda">
          <Button variant="outline" disabled={bloqueado} onClick={() => onEdit(entrada)}>Editar entrada</Button>
          <div className="flex flex-wrap gap-2">{accionesEstadoAgenda(data.estado).map(item => <Button key={item.estado} variant={item.estado === "Cancelada" ? "destructive" : "outline"} disabled={bloqueado} onClick={() => void cambiar(item.estado)}>{cambiarEstado.isPending && objetivo === item.estado ? "Actualizando…" : item.label}</Button>)}</div>
          <p className="text-xs text-muted-foreground">Posponer cambia el estado de la entrada. Para cambiar sus fechas, usá Editar entrada.</p>
        </section>
      </div> : null}
      {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}
      {error ? <div role="alert" className="space-y-2 text-sm text-destructive"><p className="whitespace-pre-wrap">{error}</p><Button variant="outline" size="sm" disabled={bloqueado} onClick={() => void detalle.refetch()}>Actualizar detalle</Button></div> : null}
      <div className="flex justify-end"><Button variant="outline" disabled={cambiarEstado.isPending} onClick={onClose}>Cerrar</Button></div>
    </DialogContent>
  </Dialog>;
}
