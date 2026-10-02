"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTiposEntradaAgenda } from "../hooks/useTiposEntradaAgenda";
import { colorTipoAgenda } from "../lib/tiposEntradaAgenda";
import type { TipoEntradaAgendaResponse } from "../types/tiposEntrada";
import TipoEntradaAgendaDialog, { EstadoTipoEntradaAgendaDialog } from "./TipoEntradaAgendaDialog";

export default function TiposEntradaAgendaPanel() {
  const [busqueda, setBusqueda] = useState(""), [termino, setTermino] = useState("");
  const [soloActivos, setSoloActivos] = useState(false), [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ id?: number }>(), [estado, setEstado] = useState<TipoEntradaAgendaResponse>();
  const [mensaje, setMensaje] = useState<string>();
  useEffect(() => { const timer = window.setTimeout(() => { setTermino(busqueda.trim()); setPage(1); }, 350); return () => window.clearTimeout(timer); }, [busqueda]);
  const consulta = useTiposEntradaAgenda({ busqueda: termino, soloActivos, page, pageSize: 20 });
  const total = consulta.data?.totalItems ?? 0, paginas = Math.max(1, Math.ceil(total / 20));
  return <section className="space-y-4 rounded-lg border bg-card p-5 sm:p-6" aria-label="Tipos de entrada de Agenda">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Tipos de entrada</h2><p className="mt-1 text-sm text-muted-foreground">Administrá nombre, descripción, color y disponibilidad.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>Actualizar</Button><Button onClick={() => { setMensaje(undefined); setEditor({}); }}>Nuevo tipo</Button></div></header>
    {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}
    <div className="space-y-2"><Label htmlFor="tipos-agenda-buscar">Buscar por nombre</Label><Input id="tipos-agenda-buscar" maxLength={150} value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={soloActivos} onChange={e => { setSoloActivos(e.target.checked); setPage(1); }} />Mostrar sólo tipos activos</label>
    {consulta.isPending ? <Skeleton className="h-36 w-full" aria-label="Cargando tipos" /> : consulta.isError ? <div role="alert"><p>{consulta.error.message}</p><Button variant="outline" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>Reintentar</Button></div> : consulta.data.items.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay tipos para esta consulta.</p> : <ul className="space-y-3" aria-busy={consulta.isFetching}>{consulta.data.items.map(tipo => <li key={tipo.tipoEntradaAgendaId} className="space-y-2 rounded-md border p-4"><div className="flex flex-wrap items-center gap-2">{colorTipoAgenda(tipo.color) ? <span aria-hidden="true" className="size-4 shrink-0 rounded border" style={{ backgroundColor: colorTipoAgenda(tipo.color) }} /> : null}<h3 className="min-w-0 break-words font-medium">{tipo.nombre}</h3><Badge variant={tipo.activo ? "secondary" : "outline"}>{tipo.activo ? "Activo" : "Inactivo"}</Badge></div>{tipo.descripcion ? <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{tipo.descripcion}</p> : null}<p className="text-xs text-muted-foreground">Color: {tipo.color ?? "Sin color"}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { setMensaje(undefined); setEditor({ id: tipo.tipoEntradaAgendaId }); }}>Editar</Button><Button size="sm" variant="outline" onClick={() => { setMensaje(undefined); setEstado(tipo); }}>{tipo.activo ? "Desactivar" : "Reactivar"}</Button></div></li>)}</ul>}
    {!consulta.isError && consulta.data ? <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{total} tipos · Página {page} de {paginas}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || consulta.isFetching} onClick={() => setPage(p => p - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page >= paginas || consulta.isFetching} onClick={() => setPage(p => p + 1)}>Siguiente</Button></div></div> : null}
    {editor ? <TipoEntradaAgendaDialog key={editor.id ?? "nuevo"} id={editor.id} onClose={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setPage(1); setMensaje("Tipo guardado. Agenda se actualizó."); }} /> : null}
    {estado ? <EstadoTipoEntradaAgendaDialog key={estado.tipoEntradaAgendaId} tipo={estado} onClose={() => setEstado(undefined)} onSaved={() => { setEstado(undefined); setPage(1); setMensaje(estado.activo ? "Tipo desactivado. Se conservaron las entradas existentes." : "Tipo reactivado."); }} /> : null}
  </section>;
}
