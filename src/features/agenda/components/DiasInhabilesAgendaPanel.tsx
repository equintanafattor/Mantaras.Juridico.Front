"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiasInhabiles } from "../hooks/useDiasInhabilesAgenda";
import { anioDiasInhabiles, fechaDiaInhabil } from "../lib/diasInhabilesAgenda";
import type { DiaInhabilResponse } from "../types/diasInhabiles";
import DiaInhabilDialog, { EstadoDiaInhabilDialog } from "./DiaInhabilAgendaDialog";

export default function DiasInhabilesAgendaPanel() {
  const [anioInicial] = useState(() => new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()));
  const [anio, setAnio] = useState(anioInicial), [filtroAnio, setFiltroAnio] = useState<number | undefined>(Number(anioInicial));
  const [soloActivos, setSoloActivos] = useState(false), [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ id?: number }>(), [estado, setEstado] = useState<DiaInhabilResponse>();
  const [mensaje, setMensaje] = useState<string>(), [errorFiltro, setErrorFiltro] = useState<string>();
  const consulta = useDiasInhabiles({ anio: filtroAnio, soloActivos, page, pageSize: 20 });
  const total = consulta.data?.totalItems ?? 0, paginas = Math.max(1, Math.ceil(total / 20));
  return <section className="space-y-4 rounded-lg border bg-card p-5 sm:p-6" aria-label="Días inhábiles">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Días inhábiles</h2><p className="mt-1 text-sm text-muted-foreground">Fechas que se excluyen del cómputo por días hábiles, además de sábados y domingos.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>Actualizar</Button><Button onClick={() => { setMensaje(undefined); setEditor({}); }}>Nuevo día inhábil</Button></div></header>
    {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}
    <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); try { setFiltroAnio(anioDiasInhabiles(anio)); setPage(1); setErrorFiltro(undefined); } catch (err) { setErrorFiltro(err instanceof Error ? err.message : "Año inválido."); } }}><div className="space-y-2"><Label htmlFor="dias-inhabiles-anio">Año (vacío: todos)</Label><Input id="dias-inhabiles-anio" inputMode="numeric" maxLength={4} value={anio} onChange={e => { setAnio(e.target.value); setErrorFiltro(undefined); }} /></div><Button type="submit" variant="outline">Aplicar año</Button></form>
    {errorFiltro ? <p role="alert" className="text-sm text-destructive">{errorFiltro}</p> : null}
    <p className="text-xs text-muted-foreground">Consulta: {filtroAnio ?? "todos los años"}.</p>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={soloActivos} onChange={e => { setSoloActivos(e.target.checked); setPage(1); }} />Mostrar sólo días activos</label>
    {consulta.isPending ? <Skeleton className="h-36 w-full" aria-label="Cargando días inhábiles" /> : consulta.isError ? <div role="alert"><p>{consulta.error.message}</p><Button variant="outline" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>Reintentar</Button></div> : consulta.data.items.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay días inhábiles para esta consulta.</p> : <ul className="space-y-3" aria-busy={consulta.isFetching}>{consulta.data.items.map(dia => <li key={dia.diaInhabilId} className="space-y-2 rounded-md border p-4"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{fechaDiaInhabil(dia.fecha)}</h3><Badge variant={dia.activo ? "secondary" : "outline"}>{dia.activo ? "Activo" : "Inactivo"}</Badge></div><p className="whitespace-pre-wrap break-words text-sm">{dia.descripcion}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { setMensaje(undefined); setEditor({ id: dia.diaInhabilId }); }}>Editar</Button><Button size="sm" variant="outline" onClick={() => { setMensaje(undefined); setEstado(dia); }}>{dia.activo ? "Desactivar" : "Reactivar"}</Button></div></li>)}</ul>}
    {!consulta.isError && consulta.data ? <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{total} días · Página {page} de {paginas}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || consulta.isFetching} onClick={() => setPage(p => p - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page >= paginas || consulta.isFetching} onClick={() => setPage(p => p + 1)}>Siguiente</Button></div></div> : null}
    <p className="text-xs text-muted-foreground">La carga es manual. Las fechas activas se aplican a todas las reglas por días hábiles del sistema. No se recalculan vencimientos existentes.</p>
    {editor ? <DiaInhabilDialog key={editor.id ?? "nuevo"} id={editor.id} onClose={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setPage(1); setMensaje("Día guardado. Si no aparece, revisá el filtro de año o de activos."); }} /> : null}
    {estado ? <EstadoDiaInhabilDialog key={estado.diaInhabilId} dia={estado} onClose={() => setEstado(undefined)} onSaved={() => { setEstado(undefined); setPage(1); setMensaje(estado.activo ? "Día desactivado." : "Día reactivado."); }} /> : null}
  </section>;
}
