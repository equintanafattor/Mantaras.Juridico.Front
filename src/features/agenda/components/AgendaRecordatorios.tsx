"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtenderRecordatorioAgenda, useCrearRecordatorioAgenda, useRecordatoriosAgenda } from "../hooks/useRecordatoriosAgenda";
import { mostrarFechaAuditoriaAgenda } from "../lib/estadosAgenda";
import { FACTORES_ANTICIPACION, MAX_MINUTOS_RECORDATORIO, requestDesdeRecordatorioForm, type UnidadAnticipacionAgenda } from "../lib/recordatorioForm";
import type { BaseCalculoRecordatorioAgenda, EntradaAgendaResponse, EstadoRecordatorioAgenda, OpcionAgendaResponse } from "../types/types";

const SELECT_CLASS = "h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";
export default function AgendaRecordatorios({ entrada, disabled, nombresUsuarios, onPending }: { entrada: EntradaAgendaResponse; disabled: boolean; nombresUsuarios?: OpcionAgendaResponse[]; onPending: (value: boolean) => void }) {
  const [estado, setEstado] = useState<EstadoRecordatorioAgenda | "">("");
  const [page, setPage] = useState(1);
  const [base, setBase] = useState<BaseCalculoRecordatorioAgenda>("Inicio");
  const [cantidad, setCantidad] = useState("30");
  const [unidad, setUnidad] = useState<UnidadAnticipacionAgenda>("Minutos");
  const [mensaje, setMensaje] = useState<string>();
  const [error, setError] = useState<string>();
  const [atendiendoId, setAtendiendoId] = useState<number>();
  const lock = useRef(false);
  const consulta = useRecordatoriosAgenda({ entradaAgendaId: entrada.entradaAgendaId, estado: estado || undefined, page, pageSize: 5 }, 60_000);
  const crear = useCrearRecordatorioAgenda();
  const atender = useAtenderRecordatorioAgenda();
  const ocupado = crear.isPending || atender.isPending;
  const bloqueado = disabled || ocupado;
  const maxCantidad = MAX_MINUTOS_RECORDATORIO / FACTORES_ANTICIPACION[unidad];

  async function marcarAtendido(id: number) {
    if (bloqueado || lock.current) return;
    lock.current = true; setError(undefined); setMensaje(undefined); setAtendiendoId(id); onPending(true);
    try { await atender.mutateAsync(id); setPage(1); setMensaje("Recordatorio marcado como atendido."); }
    catch (err) { setError(err instanceof Error ? err.message : "No pudimos atender el recordatorio."); }
    finally { lock.current = false; setAtendiendoId(undefined); onPending(false); }
  }

  return <section className="space-y-4 border-t pt-4" aria-label="Recordatorios internos">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Recordatorios internos</h3><Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching} onClick={() => void consulta.refetch()}>Actualizar avisos</Button></div>
    <div className="space-y-2"><Label htmlFor="agenda-recordatorios-estado">Estado del recordatorio</Label><select id="agenda-recordatorios-estado" value={estado} disabled={bloqueado} className={SELECT_CLASS} onChange={e => { setEstado(e.target.value as EstadoRecordatorioAgenda | ""); setPage(1); }}><option value="">Todos</option><option value="Pendiente">Pendientes</option><option value="Vencido">Vencidos</option><option value="Atendido">Atendidos</option></select></div>
    {consulta.isPending ? <p role="status" className="text-sm text-muted-foreground">Cargando recordatorios…</p> : consulta.isError ? <div role="alert" className="space-y-2 text-sm"><p>{consulta.error.message}</p><Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching} onClick={() => void consulta.refetch()}>Reintentar</Button></div> : <div className="space-y-3" aria-busy={consulta.isFetching}>
      <p className="text-xs text-muted-foreground" role="status">{consulta.data.totalItems} {consulta.data.totalItems === 1 ? "recordatorio" : "recordatorios"} en esta consulta</p>
      {consulta.data.items.length === 0 ? <p className="text-sm text-muted-foreground">No hay recordatorios para este filtro.</p> : <ul className="space-y-2">{consulta.data.items.map(item => <li key={item.recordatorioAgendaId} className="space-y-2 rounded-md border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><time dateTime={item.fechaProgramadaUtc} className="text-sm font-medium">{mostrarFechaAuditoriaAgenda(item.fechaProgramadaUtc)}</time><Badge variant={item.estado === "Vencido" ? "destructive" : "outline"}>{item.estado}</Badge></div>
        {item.fechaAtendidoUtc ? <p className="text-xs text-muted-foreground">Atendido el {mostrarFechaAuditoriaAgenda(item.fechaAtendidoUtc)}{item.usuarioAtendioId ? ` por ${nombresUsuarios?.find(x => x.id === item.usuarioAtendioId)?.nombre ?? `usuario #${item.usuarioAtendioId}`}` : ""}.</p> : null}
        {!item.atendido ? <Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching} onClick={() => void marcarAtendido(item.recordatorioAgendaId)}>{atender.isPending && atendiendoId === item.recordatorioAgendaId ? "Actualizando…" : "Marcar atendido"}</Button> : null}
      </li>)}</ul>}
      {consulta.data.totalPages > 1 ? <nav aria-label="Paginación de recordatorios" className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>Página {consulta.data.page} de {consulta.data.totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching || !consulta.data.hasPreviousPage} onClick={() => setPage(page - 1)}>Anterior</Button><Button type="button" variant="outline" size="sm" disabled={bloqueado || consulta.isFetching || !consulta.data.hasNextPage} onClick={() => setPage(page + 1)}>Siguiente</Button></div></nav> : null}
    </div>}
    <form className="space-y-3 rounded-md border p-3" onSubmit={async e => {
      e.preventDefault(); if (bloqueado || lock.current) return; setError(undefined); setMensaje(undefined);
      try {
        const request = requestDesdeRecordatorioForm(base, cantidad, unidad, entrada.fechaVencimiento !== null);
        lock.current = true; onPending(true);
        await crear.mutateAsync({ id: entrada.entradaAgendaId, request });
        setPage(1); setEstado(""); setMensaje("Recordatorio creado.");
      } catch (err) { setError(err instanceof Error ? err.message : "No pudimos crear el recordatorio."); }
      finally { lock.current = false; onPending(false); }
    }}>
      <h4 className="text-sm font-medium">Agregar recordatorio</h4>
      <fieldset disabled={bloqueado || !entrada.activo} className="grid min-w-0 gap-3 sm:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="agenda-recordatorio-base">Antes de</Label><select id="agenda-recordatorio-base" className={SELECT_CLASS} value={base} onChange={e => { setBase(e.target.value as BaseCalculoRecordatorioAgenda); setError(undefined); }}><option value="Inicio">Inicio</option><option value="Vencimiento" disabled={!entrada.fechaVencimiento}>Vencimiento</option></select></div>
        <div className="space-y-2"><Label htmlFor="agenda-recordatorio-cantidad">Anticipación</Label><Input id="agenda-recordatorio-cantidad" type="number" min={0} max={maxCantidad} step={1} required value={cantidad} onChange={e => { setCantidad(e.target.value); setError(undefined); }} /></div>
        <div className="space-y-2"><Label htmlFor="agenda-recordatorio-unidad">Unidad</Label><select id="agenda-recordatorio-unidad" className={SELECT_CLASS} value={unidad} onChange={e => { setUnidad(e.target.value as UnidadAnticipacionAgenda); setError(undefined); }}><option value="Minutos">Minutos</option><option value="Horas">Horas</option><option value="Dias">Días</option></select></div>
      </fieldset>
      <p className="text-xs text-muted-foreground">Cero avisa en el momento indicado. Si la entrada no tiene hora, se toman las 09:00 de Argentina. Máximo: 365 días de anticipación.</p>
      <Button type="submit" disabled={bloqueado || !entrada.activo}>{crear.isPending ? "Creando…" : "Agregar recordatorio"}</Button>
    </form>
    {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}{error ? <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{error}</p> : null}
  </section>;
}
