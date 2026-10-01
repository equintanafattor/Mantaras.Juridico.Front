"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FACTORES_ANTICIPACION, MAX_MINUTOS_RECORDATORIO, requestDesdeRecordatorioForm, type UnidadAnticipacionAgenda } from "../lib/recordatorioForm";
import type { BaseCalculoRecordatorioAgenda, CrearRecordatorioAgendaRequest } from "../types/types";

const SELECT_CLASS = "h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";
export default function AgendaRecordatoriosAlta({ items, tieneVencimiento, onChange, onDraftChange }: {
  items: CrearRecordatorioAgendaRequest[]; tieneVencimiento: boolean;
  onChange: (items: CrearRecordatorioAgendaRequest[], resetDraft?: boolean) => void; onDraftChange: (dirty: boolean) => void;
}) {
  const [base, setBase] = useState<BaseCalculoRecordatorioAgenda>("Inicio");
  const [cantidad, setCantidad] = useState("30");
  const [unidad, setUnidad] = useState<UnidadAnticipacionAgenda>("Minutos");
  const [error, setError] = useState<string>();
  function agregar() {
    try {
      const request = requestDesdeRecordatorioForm(base, cantidad, unidad, tieneVencimiento);
      if (items.some(item => item.baseCalculo === request.baseCalculo && item.minutosAnticipacion === request.minutosAnticipacion)) throw new Error("Este recordatorio ya está en la lista.");
      onChange([...items, request], true);
      setBase("Inicio"); setCantidad("30"); setUnidad("Minutos"); setError(undefined);
    } catch (err) { setError(err instanceof Error ? err.message : "Revisá el recordatorio."); }
  }
  return <section className="space-y-3 border-t pt-4" aria-label="Recordatorios al guardar">
    <h3 className="font-medium">Recordatorios internos</h3>
    <p className="text-sm text-muted-foreground">Agregá los avisos a esta lista. Se crearán al guardar la entrada, junto con los predeterminados que correspondan.</p>
    {items.length ? <ul className="space-y-2">{items.map((item, index) => <li key={`${item.baseCalculo}-${item.minutosAnticipacion}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"><span>{item.minutosAnticipacion === 0 ? "En el momento del" : `${item.minutosAnticipacion} minutos antes del`} {item.baseCalculo === "Inicio" ? "inicio" : "vencimiento"}</span><Button type="button" variant="outline" size="sm" onClick={() => onChange(items.filter((_, i) => i !== index))}>Quitar</Button></li>)}</ul> : <p className="text-sm text-muted-foreground">Sin avisos personalizados en esta lista.</p>}
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-2"><Label htmlFor="agenda-alta-recordatorio-base">Antes de</Label><select id="agenda-alta-recordatorio-base" className={SELECT_CLASS} value={base} onChange={e => { const value = e.target.value as BaseCalculoRecordatorioAgenda; setBase(value); setError(undefined); onDraftChange(value !== "Inicio" || cantidad !== "30" || unidad !== "Minutos"); }}><option value="Inicio">Inicio</option><option value="Vencimiento" disabled={!tieneVencimiento}>Vencimiento</option></select></div>
      <div className="space-y-2"><Label htmlFor="agenda-alta-recordatorio-cantidad">Anticipación</Label><Input id="agenda-alta-recordatorio-cantidad" type="number" min={0} max={MAX_MINUTOS_RECORDATORIO / FACTORES_ANTICIPACION[unidad]} step={1} value={cantidad} onChange={e => { setCantidad(e.target.value); setError(undefined); onDraftChange(base !== "Inicio" || e.target.value !== "30" || unidad !== "Minutos"); }} /></div>
      <div className="space-y-2"><Label htmlFor="agenda-alta-recordatorio-unidad">Unidad</Label><select id="agenda-alta-recordatorio-unidad" className={SELECT_CLASS} value={unidad} onChange={e => { const value = e.target.value as UnidadAnticipacionAgenda; setUnidad(value); setError(undefined); onDraftChange(base !== "Inicio" || cantidad !== "30" || value !== "Minutos"); }}><option value="Minutos">Minutos</option><option value="Horas">Horas</option><option value="Dias">Días</option></select></div>
    </div>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={agregar}>Agregar a la lista</Button><Button type="button" variant="ghost" onClick={() => { setBase("Inicio"); setCantidad("30"); setUnidad("Minutos"); setError(undefined); onDraftChange(false); }}>Restablecer borrador</Button></div>
    <p className="text-xs text-muted-foreground">Cero avisa en el momento indicado. Sin hora se toman las 09:00 de Argentina. Máximo: 365 días de anticipación.</p>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </section>;
}
