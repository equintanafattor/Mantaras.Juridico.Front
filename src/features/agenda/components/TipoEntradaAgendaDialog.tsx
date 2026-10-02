"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { obtenerTipoEntradaAgenda } from "../api/tiposEntradaAgendaApi";
import { tiposEntradaAgendaKeys, useGuardarTipoEntradaAgenda, useCambiarActivoTipoEntradaAgenda } from "../hooks/useTiposEntradaAgenda";
import { COLORES_TIPO_AGENDA, colorTipoAgenda, requestTipoEntradaAgenda, tipoEntradaAgendaInicial, type TipoEntradaAgendaForm } from "../lib/tiposEntradaAgenda";
import type { TipoEntradaAgendaResponse } from "../types/tiposEntrada";
import AgendaConfiguracionDialog, { useEventosConfiguracionAgenda } from "./AgendaConfiguracionDialog";

function Formulario({ tipo, onSaved }: { tipo?: TipoEntradaAgendaResponse; onSaved: () => void }) {
  const { onClose, onDirty, onPending } = useEventosConfiguracionAgenda();
  const [inicial] = useState(() => tipoEntradaAgendaInicial(tipo));
  const [form, setForm] = useState(inicial), [error, setError] = useState<string>();
  const lock = useRef(false), guardar = useGuardarTipoEntradaAgenda();
  const color = colorTipoAgenda(form.color);
  function cambiar(key: keyof TipoEntradaAgendaForm, value: string) {
    const next = { ...form, [key]: value }; setForm(next); setError(undefined);
    onDirty(JSON.stringify(next) !== JSON.stringify(inicial));
  }
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); if (lock.current) return; setError(undefined);
    try {
      const request = requestTipoEntradaAgenda(form);
      lock.current = true; onPending(true);
      await guardar.mutateAsync({ id: tipo?.tipoEntradaAgendaId, request });
      onDirty(false); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos guardar el tipo."); }
    finally { lock.current = false; onPending(false); }
  }}>
    <fieldset disabled={guardar.isPending} className="min-w-0 space-y-4">
      <div className="space-y-2"><Label htmlFor="tipo-agenda-nombre">Nombre *</Label><Input id="tipo-agenda-nombre" required maxLength={150} value={form.nombre} onChange={e => cambiar("nombre", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="tipo-agenda-descripcion">Descripción</Label><Textarea id="tipo-agenda-descripcion" maxLength={500} value={form.descripcion} onChange={e => cambiar("descripcion", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="tipo-agenda-color">Color</Label><div className="flex items-center gap-3"><Input id="tipo-agenda-color" maxLength={30} value={form.color} placeholder="#2563EB o blue" onChange={e => cambiar("color", e.target.value)} />{color ? <span aria-label={`Color ${form.color}`} className="size-7 shrink-0 rounded border" style={{ backgroundColor: color }} /> : null}</div><p className="text-xs text-muted-foreground">Opcional: hexadecimal de seis dígitos o blue, red, purple, yellow, green, orange, pink, gray.</p><div className="flex flex-wrap gap-2">{Object.entries(COLORES_TIPO_AGENDA).map(([nombre, valor]) => <Button key={nombre} type="button" size="sm" variant="outline" aria-label={`Usar color ${nombre}`} onClick={() => cambiar("color", nombre)}><span aria-hidden="true" className="size-3 rounded-full border" style={{ backgroundColor: valor }} />{nombre}</Button>)}<Button type="button" size="sm" variant="outline" onClick={() => cambiar("color", "")}>Sin color</Button></div></div>
      <p className="text-xs text-muted-foreground">Los nombres se guardan en mayúsculas. Un nombre usado por un tipo inactivo queda reservado. Los cambios se reflejan también en las entradas vinculadas.</p>
    </fieldset>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={guardar.isPending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={guardar.isPending}>{guardar.isPending ? "Guardando…" : "Guardar tipo"}</Button></div>
  </form>;
}
function Edicion({ id, onSaved }: { id: number; onSaved: () => void }) {
  const consulta = useQuery({ queryKey: tiposEntradaAgendaKeys.detalle(id), queryFn: ({ signal }) => obtenerTipoEntradaAgenda(id, signal), refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false });
  if (consulta.isPending || consulta.isFetching && !consulta.isFetchedAfterMount) return <Skeleton className="h-64 w-full" aria-label="Cargando tipo" />;
  if (!consulta.data) return <div role="alert"><p>{consulta.error?.message}</p><Button variant="outline" onClick={() => void consulta.refetch()}>Reintentar</Button></div>;
  return <Formulario tipo={consulta.data} onSaved={onSaved} />;
}
export default function TipoEntradaAgendaDialog({ id, onClose, onSaved }: { id?: number; onClose: () => void; onSaved: () => void }) {
  return <AgendaConfiguracionDialog titulo={id ? "Editar tipo de entrada" : "Nuevo tipo de entrada"} descripcion="Definí nombre, descripción y color. El nombre es obligatorio." onClose={onClose}>{id ? <Edicion id={id} onSaved={onSaved} /> : <Formulario onSaved={onSaved} />}</AgendaConfiguracionDialog>;
}
function ConfirmacionEstado({ tipo, onSaved }: { tipo: TipoEntradaAgendaResponse; onSaved: () => void }) {
  const { onClose, onPending } = useEventosConfiguracionAgenda();
  const mutacion = useCambiarActivoTipoEntradaAgenda(), lock = useRef(false);
  const [error, setError] = useState<string>();
  return <div className="space-y-4"><p className="break-words font-medium">{tipo.nombre}</p><p className="text-sm">{tipo.activo ? "Las entradas y recordatorios existentes se conservan. Este tipo dejará de estar disponible para nuevas entradas y generaciones por reglas hasta que lo reactives." : "El tipo volverá a estar disponible para nuevas entradas y generaciones por reglas activas."}</p>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end gap-2"><Button variant="outline" disabled={mutacion.isPending} onClick={onClose}>Cancelar</Button><Button variant={tipo.activo ? "destructive" : "default"} disabled={mutacion.isPending} onClick={async () => {
    if (lock.current) return; lock.current = true; onPending(true); setError(undefined);
    try { await mutacion.mutateAsync({ id: tipo.tipoEntradaAgendaId, activo: !tipo.activo }); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : "No pudimos cambiar el estado."); }
    finally { lock.current = false; onPending(false); }
  }}>{mutacion.isPending ? "Guardando…" : tipo.activo ? "Desactivar tipo" : "Reactivar tipo"}</Button></div></div>;
}
export function EstadoTipoEntradaAgendaDialog({ tipo, onClose, onSaved }: { tipo: TipoEntradaAgendaResponse; onClose: () => void; onSaved: () => void }) {
  return <AgendaConfiguracionDialog titulo={tipo.activo ? "Desactivar tipo de entrada" : "Reactivar tipo de entrada"} descripcion="Confirmá el cambio de disponibilidad." onClose={onClose}><ConfirmacionEstado tipo={tipo} onSaved={onSaved} /></AgendaConfiguracionDialog>;
}
