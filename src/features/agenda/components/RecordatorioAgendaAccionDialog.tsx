"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DIALOG_ACCIONES } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReprogramarRecordatorioAgenda, useQuitarRecordatorioAgenda } from "../hooks/useRecordatoriosAgenda";
import { FACTORES_ANTICIPACION, MAX_MINUTOS_RECORDATORIO, requestDesdeRecordatorioForm, type UnidadAnticipacionAgenda } from "../lib/recordatorioForm";
import { mostrarFechaAuditoriaAgenda } from "../lib/estadosAgenda";
import type { BaseCalculoRecordatorioAgenda, EntradaAgendaResponse, RecordatorioAgendaResponse } from "../types/types";
import AgendaConfiguracionDialog, { useEventosConfiguracionAgenda } from "./AgendaConfiguracionDialog";

export type AccionRecordatorioAgenda = { modo: "quitar" | "reprogramar"; recordatorio: RecordatorioAgendaResponse };
function Formulario({ accion, entrada, onSaved }: { accion: AccionRecordatorioAgenda; entrada: EntradaAgendaResponse; onSaved: () => void }) {
  const { onClose, onDirty, onPending } = useEventosConfiguracionAgenda();
  const [base, setBase] = useState<BaseCalculoRecordatorioAgenda>("Inicio");
  const [cantidad, setCantidad] = useState("30"), [unidad, setUnidad] = useState<UnidadAnticipacionAgenda>("Minutos");
  const [error, setError] = useState<string>();
  const reprogramar = useReprogramarRecordatorioAgenda(), quitar = useQuitarRecordatorioAgenda(), lock = useRef(false);
  const pending = reprogramar.isPending || quitar.isPending;
  return <form className="flex flex-1 flex-col gap-4" onSubmit={async event => {
    event.preventDefault(); if (lock.current) return; setError(undefined);
    try {
      if (accion.recordatorio.atendido) throw new Error("Los avisos atendidos quedan como historial.");
      const request = accion.modo === "reprogramar" ? requestDesdeRecordatorioForm(base, cantidad, unidad, !!entrada.fechaVencimiento) : undefined;
      lock.current = true; onPending(true);
      if (request) await reprogramar.mutateAsync({ id: accion.recordatorio.recordatorioAgendaId, request });
      else await quitar.mutateAsync(accion.recordatorio.recordatorioAgendaId);
      onDirty(false); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos actualizar el aviso."); }
    finally { lock.current = false; onPending(false); }
  }}>
    <p className="text-sm">Horario actual: <strong>{mostrarFechaAuditoriaAgenda(accion.recordatorio.fechaProgramadaUtc)}</strong></p>
    {accion.modo === "quitar" ? <p className="text-sm">Este aviso deja de mostrarse. Lo agendado y los demás avisos se conservan.</p> : <>
      <p className="text-sm text-muted-foreground">Elegí cuánto antes avisar. Se calcula con las fechas actuales.</p>
      <fieldset disabled={pending} className="grid min-w-0 gap-3 @lg:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="reprogramar-base">Antes de</Label><select id="reprogramar-base" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={base} onChange={e => { setBase(e.target.value as BaseCalculoRecordatorioAgenda); onDirty(true); setError(undefined); }}><option value="Inicio">Inicio</option><option value="Vencimiento" disabled={!entrada.fechaVencimiento}>Vencimiento</option></select></div>
        <div className="space-y-2"><Label htmlFor="reprogramar-cantidad">Anticipación</Label><Input id="reprogramar-cantidad" type="number" min={0} max={MAX_MINUTOS_RECORDATORIO / FACTORES_ANTICIPACION[unidad]} step={1} required value={cantidad} onChange={e => { setCantidad(e.target.value); onDirty(true); setError(undefined); }} /></div>
        <div className="space-y-2"><Label htmlFor="reprogramar-unidad">Unidad</Label><select id="reprogramar-unidad" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={unidad} onChange={e => { setUnidad(e.target.value as UnidadAnticipacionAgenda); onDirty(true); setError(undefined); }}><option value="Minutos">Minutos</option><option value="Horas">Horas</option><option value="Dias">Días</option></select></div>
      </fieldset><p className="text-xs text-muted-foreground">Con 0 avisa en el momento. Si no hay hora, se toman las 9:00. Hasta 365 días antes.</p>
    </>}
    {error ? <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{error}</p> : null}
    <div className={DIALOG_ACCIONES}><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button><Button type="submit" variant={accion.modo === "quitar" ? "destructive" : "default"} disabled={pending}>{pending ? "Guardando…" : accion.modo === "quitar" ? "Quitar aviso" : "Reprogramar aviso"}</Button></div>
  </form>;
}
export default function RecordatorioAgendaAccionDialog({ accion, entrada, onClose, onSaved }: { accion: AccionRecordatorioAgenda; entrada: EntradaAgendaResponse; onClose: () => void; onSaved: () => void }) {
  return <AgendaConfiguracionDialog titulo={accion.modo === "quitar" ? "Quitar aviso" : "Reprogramar aviso"} descripcion="Los avisos atendidos quedan como historial." onClose={onClose}><Formulario accion={accion} entrada={entrada} onSaved={onSaved} /></AgendaConfiguracionDialog>;
}
