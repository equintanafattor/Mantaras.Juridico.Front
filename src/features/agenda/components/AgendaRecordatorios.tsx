"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtenderRecordatorioAgenda, useCrearRecordatorioAgenda, useRecordatoriosAgenda } from "../hooks/useRecordatoriosAgenda";
import { AVISOS_SOLO_EN_SISTEMA, BASE_AVISO, calcularFechaAviso, describirOrigenAviso, entradaCerrada, ESTADO_AVISO, fechaHoraAviso } from "../lib/avisosAgenda";
import { NOMBRES_ESTADO_AGENDA } from "../lib/estadosAgenda";
import { FACTORES_ANTICIPACION, MAX_MINUTOS_RECORDATORIO, requestDesdeRecordatorioForm, type UnidadAnticipacionAgenda } from "../lib/recordatorioForm";
import type { BaseCalculoRecordatorioAgenda, EntradaAgendaResponse, EstadoRecordatorioAgenda, OpcionAgendaResponse } from "../types/types";

import RecordatorioAgendaAccionDialog, { type AccionRecordatorioAgenda } from "./RecordatorioAgendaAccionDialog";

const SELECT_CLASS = "h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";

export function EstadoAvisoEtiqueta({ estado }: { estado: EstadoRecordatorioAgenda }) {
  return <Badge variant={estado === "Vencido" ? "destructive" : estado === "Atendido" ? "secondary" : "outline"}>{ESTADO_AVISO[estado]}</Badge>;
}

function vistaPrevia(entrada: EntradaAgendaResponse, base: BaseCalculoRecordatorioAgenda, cantidad: string, unidad: UnidadAnticipacionAgenda) {
  try {
    const fecha = calcularFechaAviso(entrada, requestDesdeRecordatorioForm(base, cantidad, unidad, entrada.fechaVencimiento !== null));
    return fecha ? `Aparecerá el ${fechaHoraAviso(fecha)}.` : undefined;
  } catch { return undefined; }
}

export default function AgendaRecordatorios({ entrada, disabled, nombresUsuarios, onPending }: { entrada: EntradaAgendaResponse; disabled: boolean; nombresUsuarios?: OpcionAgendaResponse[]; onPending: (value: boolean) => void }) {
  const [estado, setEstado] = useState<EstadoRecordatorioAgenda | "">("");
  const [page, setPage] = useState(1);
  const [base, setBase] = useState<BaseCalculoRecordatorioAgenda>("Inicio");
  const [cantidad, setCantidad] = useState("30");
  const [unidad, setUnidad] = useState<UnidadAnticipacionAgenda>("Minutos");
  const [mensaje, setMensaje] = useState<string>();
  const [error, setError] = useState<string>();
  const [atendiendoId, setAtendiendoId] = useState<number>();
  const [accion, setAccion] = useState<AccionRecordatorioAgenda>();
  const lock = useRef(false);
  const consulta = useRecordatoriosAgenda({ entradaAgendaId: entrada.entradaAgendaId, estado: estado || undefined, page, pageSize: 5 }, 60_000);
  const crear = useCrearRecordatorioAgenda();
  const atender = useAtenderRecordatorioAgenda();
  const ocupado = crear.isPending || atender.isPending;
  const bloqueado = disabled || ocupado || accion !== undefined;
  const maxCantidad = MAX_MINUTOS_RECORDATORIO / FACTORES_ANTICIPACION[unidad];
  const cerrada = entradaCerrada(entrada.estado);
  const previa = vistaPrevia(entrada, base, cantidad, unidad);

  // Sólo registra que el aviso se vio: la entrada conserva su estado (PATCH /atender no la toca).
  async function marcarVisto(id: number) {
    if (bloqueado || lock.current) return;
    lock.current = true; setError(undefined); setMensaje(undefined); setAtendiendoId(id); onPending(true);
    try { await atender.mutateAsync(id); setPage(1); setMensaje(`Aviso marcado como visto. La entrada sigue ${NOMBRES_ESTADO_AGENDA[entrada.estado].toLowerCase()}.`); }
    catch (err) { setError(err instanceof Error ? err.message : "No pudimos marcar el aviso como visto."); }
    finally { lock.current = false; setAtendiendoId(undefined); onPending(false); }
  }

  return <section className="space-y-4" aria-label="Avisos">
    <div className="space-y-1 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
      <p>{AVISOS_SOLO_EN_SISTEMA}</p>
      <p>«Marcar como visto» sólo registra que alguien lo vio: <strong className="font-medium text-foreground">no completa la entrada</strong>. Horarios de Argentina.</p>
      {cerrada ? <p className="text-foreground">Esta entrada está {NOMBRES_ESTADO_AGENDA[entrada.estado].toLowerCase()}: sus avisos ya no aparecen en Pendientes, pero se conservan acá.</p> : null}
    </div>
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div className="min-w-0 flex-1 space-y-2 @lg:max-w-64"><Label htmlFor="agenda-recordatorios-estado">Mostrar</Label><select id="agenda-recordatorios-estado" value={estado} disabled={bloqueado} className={SELECT_CLASS} onChange={e => { setEstado(e.target.value as EstadoRecordatorioAgenda | ""); setPage(1); }}><option value="">Todos los avisos</option><option value="Pendiente">Programados (todavía no llegaron)</option><option value="Vencido">Pendientes de ver</option><option value="Atendido">Vistos</option></select></div>
      <Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching} onClick={() => void consulta.refetch()}>Actualizar avisos</Button>
    </div>
    {consulta.isPending ? <p role="status" className="text-sm text-muted-foreground">Cargando avisos…</p> : consulta.isError ? <div role="alert" className="space-y-2 text-sm"><p>{consulta.error.message}</p><Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching} onClick={() => void consulta.refetch()}>Reintentar</Button></div> : <div className="space-y-3" aria-busy={consulta.isFetching}>
      <p className="text-xs text-muted-foreground" role="status">{consulta.data.totalItems === 1 ? "1 aviso" : `${consulta.data.totalItems} avisos`}</p>
      {consulta.data.items.length === 0 ? <p className="text-sm text-muted-foreground">No hay avisos para mostrar.</p> : <ul className="space-y-2">{consulta.data.items.map(item => {
        return <li key={item.recordatorioAgendaId} data-aviso-id={item.recordatorioAgendaId} className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0"><p className="text-xs text-muted-foreground">Fecha del aviso</p><time dateTime={item.fechaProgramadaUtc} className="text-sm font-medium">{fechaHoraAviso(item.fechaProgramadaUtc)}</time></div>
            <EstadoAvisoEtiqueta estado={item.estado} />
          </div>
          <p className="text-xs text-muted-foreground">{describirOrigenAviso(item)}</p>
          {item.estado === "Pendiente" ? <p className="text-xs text-muted-foreground">Si lo marcás como visto antes de su fecha, ya no aparecerá como pendiente de ver.</p> : null}
          {item.fechaAtendidoUtc ? <p className="text-xs text-muted-foreground">Visto el {fechaHoraAviso(item.fechaAtendidoUtc)}{item.usuarioAtendioId ? ` por ${nombresUsuarios?.find(x => x.id === item.usuarioAtendioId)?.nombre ?? `usuario #${item.usuarioAtendioId}`}` : ""}.</p> : null}
          {!item.atendido ? <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching} title={item.estado === "Pendiente" ? "Cuando llegue su fecha, este aviso ya no aparecerá como pendiente de ver." : undefined} onClick={() => void marcarVisto(item.recordatorioAgendaId)}>{atender.isPending && atendiendoId === item.recordatorioAgendaId ? "Guardando…" : "Marcar como visto"}</Button>
            <Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching} onClick={() => { onPending(true); setMensaje(undefined); setError(undefined); setAccion({ modo: "reprogramar", recordatorio: item }); }}>Reprogramar</Button>
            <Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching} onClick={() => { onPending(true); setMensaje(undefined); setError(undefined); setAccion({ modo: "quitar", recordatorio: item }); }}>Quitar</Button>
          </div> : null}
        </li>;
      })}</ul>}
      {consulta.data.totalPages > 1 ? <nav aria-label="Paginación de avisos" className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>Página {consulta.data.page} de {consulta.data.totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching || !consulta.data.hasPreviousPage} onClick={() => setPage(page - 1)}>Anterior</Button><Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching || !consulta.data.hasNextPage} onClick={() => setPage(page + 1)}>Siguiente</Button></div></nav> : null}
    </div>}
    <form className="space-y-3 rounded-md border p-3" onSubmit={async e => {
      e.preventDefault(); if (bloqueado || lock.current) return; setError(undefined); setMensaje(undefined);
      try {
        const request = requestDesdeRecordatorioForm(base, cantidad, unidad, entrada.fechaVencimiento !== null);
        lock.current = true; onPending(true);
        await crear.mutateAsync({ id: entrada.entradaAgendaId, request });
        setPage(1); setEstado(""); setMensaje("Aviso agregado.");
      } catch (err) { setError(err instanceof Error ? err.message : "No pudimos agregar el aviso."); }
      finally { lock.current = false; onPending(false); }
    }}>
      <h4 className="text-sm font-medium">Agregar aviso</h4>
      <fieldset disabled={bloqueado || !entrada.activo} className="grid min-w-0 gap-3 @lg:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="agenda-recordatorio-base">Antes de</Label><select id="agenda-recordatorio-base" className={SELECT_CLASS} value={base} onChange={e => { setBase(e.target.value as BaseCalculoRecordatorioAgenda); setError(undefined); }}><option value="Inicio">{BASE_AVISO.Inicio}</option><option value="Vencimiento" disabled={!entrada.fechaVencimiento}>{BASE_AVISO.Vencimiento}</option></select></div>
        <div className="space-y-2"><Label htmlFor="agenda-recordatorio-cantidad">Anticipación</Label><Input id="agenda-recordatorio-cantidad" type="number" min={0} max={maxCantidad} step={1} required value={cantidad} onChange={e => { setCantidad(e.target.value); setError(undefined); }} /></div>
        <div className="space-y-2"><Label htmlFor="agenda-recordatorio-unidad">Unidad</Label><select id="agenda-recordatorio-unidad" className={SELECT_CLASS} value={unidad} onChange={e => { setUnidad(e.target.value as UnidadAnticipacionAgenda); setError(undefined); }}><option value="Minutos">Minutos</option><option value="Horas">Horas</option><option value="Dias">Días</option></select></div>
      </fieldset>
      {previa ? <p className="text-sm" role="status">{previa}</p> : null}
      <p className="text-xs text-muted-foreground">Con 0 avisa en el momento. Si la fecha no tiene hora, el aviso se calcula desde las 9:00. Hasta 365 días antes.</p>
      <Button type="submit" disabled={bloqueado || !entrada.activo}>{crear.isPending ? "Guardando…" : "Agregar aviso"}</Button>
    </form>
    <p className="text-xs text-muted-foreground">Si cambiás las fechas de la entrada, los avisos no se mueven solos: usá Reprogramar. Los vistos quedan como historial.</p>
    {accion ? <RecordatorioAgendaAccionDialog key={`${accion.modo}-${accion.recordatorio.recordatorioAgendaId}`} accion={accion} entrada={entrada} onClose={() => { setAccion(undefined); onPending(false); }} onSaved={() => { setAccion(undefined); setPage(1); setEstado(""); setMensaje(accion.modo === "quitar" ? "Aviso quitado." : "Aviso reprogramado."); onPending(false); }} /> : null}
    {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}{error ? <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{error}</p> : null}
  </section>;
}
