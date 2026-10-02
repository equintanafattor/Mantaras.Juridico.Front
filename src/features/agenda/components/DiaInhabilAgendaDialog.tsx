"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { obtenerDiaInhabil } from "../api/diasInhabilesAgendaApi";
import { diasInhabilesAgendaKeys, useGuardarDiaInhabil, useCambiarActivoDiaInhabil } from "../hooks/useDiasInhabilesAgenda";
import { requestDiaInhabil, diaInhabilInicial, type DiaInhabilForm } from "../lib/diasInhabilesAgenda";
import type { DiaInhabilResponse } from "../types/diasInhabiles";
import AgendaConfiguracionDialog, { useEventosConfiguracionAgenda } from "./AgendaConfiguracionDialog";

function Formulario({ dia, onSaved }: { dia?: DiaInhabilResponse; onSaved: () => void }) {
  const { onClose, onDirty, onPending } = useEventosConfiguracionAgenda();
  const [inicial] = useState(() => diaInhabilInicial(dia));
  const [form, setForm] = useState(inicial), [error, setError] = useState<string>();
  const lock = useRef(false), guardar = useGuardarDiaInhabil();
  function cambiar(key: keyof DiaInhabilForm, value: string) {
    const next = { ...form, [key]: value }; setForm(next); setError(undefined);
    onDirty(JSON.stringify(next) !== JSON.stringify(inicial));
  }
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); if (lock.current) return; setError(undefined);
    try {
      const request = requestDiaInhabil(form);
      lock.current = true; onPending(true);
      await guardar.mutateAsync({ id: dia?.diaInhabilId, request });
      onDirty(false); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos guardar el día inhábil."); }
    finally { lock.current = false; onPending(false); }
  }}>
    <fieldset disabled={guardar.isPending} className="min-w-0 space-y-4">
      <div className="space-y-2"><Label htmlFor="dia-inhabil-fecha">Fecha *</Label><Input id="dia-inhabil-fecha" type="date" required min="0001-01-02" max="9999-12-31" value={form.fecha} onChange={e => cambiar("fecha", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="dia-inhabil-descripcion">Descripción *</Label><Textarea id="dia-inhabil-descripcion" required maxLength={300} value={form.descripcion} onChange={e => cambiar("descripcion", e.target.value)} /></div>
      <p className="text-xs text-muted-foreground">Cada fecha tiene un único registro, incluso si está inactivo. Los cambios afectan las nuevas generaciones por días hábiles; los vencimientos ya creados conservan su fecha.</p>
    </fieldset>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={guardar.isPending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={guardar.isPending}>{guardar.isPending ? "Guardando…" : "Guardar día inhábil"}</Button></div>
  </form>;
}
function Edicion({ id, onSaved }: { id: number; onSaved: () => void }) {
  const consulta = useQuery({ queryKey: diasInhabilesAgendaKeys.detalle(id), queryFn: ({ signal }) => obtenerDiaInhabil(id, signal), refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false });
  if (consulta.isPending || consulta.isFetching && !consulta.isFetchedAfterMount) return <Skeleton className="h-64 w-full" aria-label="Cargando día inhábil" />;
  if (!consulta.data) return <div role="alert"><p>{consulta.error?.message}</p><Button variant="outline" onClick={() => void consulta.refetch()}>Reintentar</Button></div>;
  return <Formulario dia={consulta.data} onSaved={onSaved} />;
}
export default function DiaInhabilDialog({ id, onClose, onSaved }: { id?: number; onClose: () => void; onSaved: () => void }) {
  return <AgendaConfiguracionDialog titulo={id ? "Editar día inhábil" : "Nuevo día inhábil"} descripcion="Indicá la fecha y el motivo. Ambos campos son obligatorios." onClose={onClose}>{id ? <Edicion id={id} onSaved={onSaved} /> : <Formulario onSaved={onSaved} />}</AgendaConfiguracionDialog>;
}
function ConfirmacionEstado({ dia, onSaved }: { dia: DiaInhabilResponse; onSaved: () => void }) {
  const { onClose, onPending } = useEventosConfiguracionAgenda();
  const mutacion = useCambiarActivoDiaInhabil(), lock = useRef(false);
  const [error, setError] = useState<string>();
  return <div className="space-y-4"><p className="break-words font-medium">{dia.fecha.split("-").reverse().join("/")} · {dia.descripcion}</p><p className="text-sm">{dia.activo ? "La fecha dejará de excluirse del cómputo de días hábiles. Los vencimientos ya creados conservan su fecha. Sábados y domingos seguirán excluyéndose." : "La fecha volverá a excluirse de las nuevas generaciones por días hábiles. Los vencimientos ya creados conservan su fecha."}</p>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end gap-2"><Button variant="outline" disabled={mutacion.isPending} onClick={onClose}>Cancelar</Button><Button variant={dia.activo ? "destructive" : "default"} disabled={mutacion.isPending} onClick={async () => {
    if (lock.current) return; lock.current = true; onPending(true); setError(undefined);
    try { await mutacion.mutateAsync({ id: dia.diaInhabilId, activo: !dia.activo }); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : "No pudimos cambiar el estado."); }
    finally { lock.current = false; onPending(false); }
  }}>{mutacion.isPending ? "Guardando…" : dia.activo ? "Desactivar día inhábil" : "Reactivar día inhábil"}</Button></div></div>;
}
export function EstadoDiaInhabilDialog({ dia, onClose, onSaved }: { dia: DiaInhabilResponse; onClose: () => void; onSaved: () => void }) {
  return <AgendaConfiguracionDialog titulo={dia.activo ? "Desactivar día inhábil" : "Reactivar día inhábil"} descripcion="Confirmá el cambio de disponibilidad." onClose={onClose}><ConfirmacionEstado dia={dia} onSaved={onSaved} /></AgendaConfiguracionDialog>;
}
