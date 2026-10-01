"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { obtenerReglaVencimiento } from "../api/reglasVencimientoApi";
import { agendaKeys } from "../hooks/agendaKeys";
import { useCrearReglaVencimiento, useActualizarReglaVencimiento } from "../hooks/useReglasVencimiento";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import { reglaAgendaInicial, requestDesdeReglaAgenda, type ReglaAgendaForm } from "../lib/configuracionAgenda";
import type { ReglaVencimientoResponse } from "../types/types";
import AgendaConfiguracionDialog, { useEventosConfiguracionAgenda } from "./AgendaConfiguracionDialog";

const SELECT_CLASS = "h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";
function Formulario({ regla, onSaved }: { regla?: ReglaVencimientoResponse; onSaved: () => void }) {
  const { onClose, onDirty, onPending } = useEventosConfiguracionAgenda();
  const [inicial] = useState(() => reglaAgendaInicial(regla));
  const [form, setForm] = useState(inicial), [error, setError] = useState<string>();
  const lock = useRef(false);
  const opciones = useOpcionesAgenda(), crear = useCrearReglaVencimiento(), editar = useActualizarReglaVencimiento();
  const pending = crear.isPending || editar.isPending;
  function cambiar<K extends keyof ReglaAgendaForm>(key: K, value: ReglaAgendaForm[K]) {
    const next = { ...form, [key]: value }; setForm(next); setError(undefined); onDirty(JSON.stringify(next) !== JSON.stringify(inicial));
  }
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); if (lock.current) return; setError(undefined);
    try {
      const request = requestDesdeReglaAgenda(form);
      if (!opciones.data?.tiposEntrada.some(item => item.id === request.tipoEntradaAgendaId && item.activo)) throw new Error("Seleccioná un tipo de entrada activo.");
      lock.current = true; onPending(true);
      if (regla) await editar.mutateAsync({ id: regla.reglaVencimientoId, request }); else await crear.mutateAsync(request);
      onDirty(false); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos guardar la regla."); }
    finally { lock.current = false; onPending(false); }
  }}>
    <fieldset disabled={pending} className="min-w-0 space-y-4">
      <div className="space-y-2"><Label htmlFor="regla-nombre">Nombre *</Label><Input id="regla-nombre" required maxLength={200} value={form.nombre} onChange={e => cambiar("nombre", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="regla-tipo">Tipo de entrada *</Label><select id="regla-tipo" required disabled={!opciones.data} className={SELECT_CLASS} value={form.tipoEntradaAgendaId || ""} onChange={e => cambiar("tipoEntradaAgendaId", Number(e.target.value))}><option value="">Seleccionar</option>{opciones.data?.tiposEntrada.filter(item => item.activo || item.id === form.tipoEntradaAgendaId).map(item => <option key={item.id} value={item.id} disabled={!item.activo}>{item.nombre}{item.activo ? "" : " (inactivo)"}</option>)}{form.tipoEntradaAgendaId > 0 && opciones.data && !opciones.data.tiposEntrada.some(item => item.id === form.tipoEntradaAgendaId) ? <option value={form.tipoEntradaAgendaId} disabled>Tipo #{form.tipoEntradaAgendaId} (no disponible)</option> : null}</select></div>
      {opciones.isError ? <div role="alert"><p>No pudimos cargar los tipos de entrada.</p><Button type="button" variant="outline" onClick={() => void opciones.refetch()}>Reintentar</Button></div> : null}
      <div className="space-y-2"><Label htmlFor="regla-descripcion">Descripción</Label><Textarea id="regla-descripcion" maxLength={1000} value={form.descripcion} onChange={e => cambiar("descripcion", e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="regla-dias">Cantidad de días *</Label><Input id="regla-dias" type="number" min={0} max={36500} step={1} required value={form.cantidadDias} onChange={e => cambiar("cantidadDias", e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="regla-computo">Cómputo</Label><select id="regla-computo" className={SELECT_CLASS} value={form.tipoComputo} onChange={e => cambiar("tipoComputo", e.target.value as ReglaAgendaForm["tipoComputo"])}><option value="DiasHabiles">Días hábiles</option><option value="DiasCorridos">Días corridos</option></select></div>
        <div className="space-y-2"><Label htmlFor="regla-sentido">Desde la fecha base</Label><select id="regla-sentido" className={SELECT_CLASS} value={form.sentidoCalculo} onChange={e => cambiar("sentidoCalculo", e.target.value as ReglaAgendaForm["sentidoCalculo"])}><option value="Despues">Después</option><option value="Antes">Antes</option></select></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="regla-prioridad">Prioridad generada</Label><select id="regla-prioridad" className={SELECT_CLASS} value={form.prioridadGenerada} onChange={e => cambiar("prioridadGenerada", e.target.value as ReglaAgendaForm["prioridadGenerada"])}>{["Baja", "Normal", "Alta", "Urgente"].map(p => <option key={p}>{p}</option>)}</select></div><div className="space-y-2"><Label htmlFor="regla-hora">Hora sugerida</Label><Input id="regla-hora" type="time" step={1} value={form.horaSugerida} onChange={e => cambiar("horaSugerida", e.target.value)} /></div></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.activo} onChange={e => cambiar("activo", e.target.checked)} />Regla activa</label>
      <p className="text-xs text-muted-foreground">Los días hábiles excluyen sábados, domingos y días inhábiles registrados. Dejar la hora vacía permite crear un vencimiento sin hora. Los cambios se aplican a futuras generaciones.</p>
    </fieldset>
    {error ? <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{error}</p> : null}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={pending || !opciones.data}>{pending ? "Guardando…" : "Guardar regla"}</Button></div>
  </form>;
}
function Edicion({ id, ...props }: { id: number; onSaved: () => void }) {
  const consulta = useQuery({ queryKey: agendaKeys.regla(id), queryFn: ({ signal }) => obtenerReglaVencimiento(id, signal), refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false });
  if (consulta.isPending || consulta.isFetching && !consulta.isFetchedAfterMount) return <Skeleton className="h-64 w-full" aria-label="Cargando regla" />;
  if (!consulta.data) return <div role="alert"><p>{consulta.error?.message}</p><Button variant="outline" onClick={() => void consulta.refetch()}>Reintentar</Button></div>;
  return <Formulario regla={consulta.data} {...props} />;
}
export default function ReglaVencimientoDialog({ id, onClose, onSaved }: { id?: number; onClose: () => void; onSaved: () => void }) {
  return <AgendaConfiguracionDialog titulo={id ? "Editar regla de vencimiento" : "Nueva regla de vencimiento"} descripcion="Definí cómo calcular el plazo desde una fecha base. Los campos con * son obligatorios." onClose={onClose}>{id ? <Edicion id={id} onSaved={onSaved} /> : <Formulario onSaved={onSaved} />}</AgendaConfiguracionDialog>;
}
