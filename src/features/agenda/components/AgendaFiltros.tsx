"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import { FILTROS_AGENDA_INICIALES, validarFechasFiltros, type FiltrosAgenda } from "../lib/filtrosAgenda";
import type { EstadoEntradaAgenda } from "../types/types";
import AgendaRelacionFiltro from "./AgendaRelacionFiltro";

const ESTADOS: { value: EstadoEntradaAgenda; label: string }[] = [
  { value: "Pendiente", label: "Pendiente" }, { value: "EnCurso", label: "En curso" },
  { value: "Pospuesta", label: "Pospuesta" }, { value: "Completada", label: "Completada" }, { value: "Cancelada", label: "Cancelada" },
];
const SELECT_CLASS = "h-9 w-full min-w-0 rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50";

export default function AgendaFiltros({ value, onApply }: { value: FiltrosAgenda; onApply: (value: FiltrosAgenda) => void }) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const opciones = useOpcionesAgenda();
  const pendientes = JSON.stringify(draft) !== JSON.stringify(value);
  function cambiar<K extends keyof FiltrosAgenda>(key: K, next: FiltrosAgenda[K]) {
    setDraft((prev) => ({ ...prev, [key]: next })); setError(null);
  }
  function limpiar() {
    setDraft(FILTROS_AGENDA_INICIALES); setError(null); setRevision((prev) => prev + 1); onApply(FILTROS_AGENDA_INICIALES);
  }
  return (
    <form aria-label="Filtros de Agenda" className="space-y-4 rounded-lg border bg-card p-4" onSubmit={(e) => {
      e.preventDefault(); const mensaje = validarFechasFiltros(draft); setError(mensaje);
      if (!mensaje) { const next = { ...draft, busqueda: draft.busqueda.trim() }; setDraft(next); onApply(next); }
    }}>
      <h2 className="font-semibold">Filtros</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="agenda-busqueda">Buscar en título y descripción</Label><Input id="agenda-busqueda" maxLength={150} value={draft.busqueda} onChange={(e) => cambiar("busqueda", e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="agenda-estado">Estado</Label><select id="agenda-estado" className={SELECT_CLASS} value={draft.estado} onChange={(e) => cambiar("estado", e.target.value as EstadoEntradaAgenda | "")}><option value="">Todos</option>{ESTADOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="agenda-tipo">Tipo de entrada</Label><select id="agenda-tipo" className={SELECT_CLASS} value={draft.tipoEntradaAgendaId ?? ""} disabled={!opciones.data} onChange={(e) => cambiar("tipoEntradaAgendaId", e.target.value ? Number(e.target.value) : null)}><option value="">Todos</option>{opciones.data?.tiposEntrada.map((item) => <option key={item.id} value={item.id}>{item.nombre}{!item.activo ? " (inactivo)" : ""}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="agenda-responsable">Responsable</Label><select id="agenda-responsable" className={SELECT_CLASS} value={draft.responsableId ?? ""} disabled={!opciones.data} onChange={(e) => cambiar("responsableId", e.target.value ? Number(e.target.value) : null)}><option value="">Todos</option>{opciones.data?.responsables.map((item) => <option key={item.id} value={item.id}>{item.nombre} · #{item.id}{!item.activo ? " (inactivo)" : ""}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="agenda-desde">Desde</Label><Input id="agenda-desde" type="date" min="0001-01-01" max="9999-12-31" value={draft.desde} onChange={(e) => cambiar("desde", e.target.value)} aria-describedby="agenda-fechas-ayuda" /></div>
        <div className="space-y-2"><Label htmlFor="agenda-hasta">Hasta</Label><Input id="agenda-hasta" type="date" min="0001-01-01" max="9999-12-31" value={draft.hasta} onChange={(e) => cambiar("hasta", e.target.value)} aria-describedby="agenda-fechas-ayuda" /></div>
      </div>
      <p id="agenda-fechas-ayuda" className="text-xs text-muted-foreground">Sin fechas, se consulta el mes elegido. Con fechas, lista y tarjetas consultan ese rango; el calendario muestra los días del rango que estén en el mes visible.</p>
      {opciones.isPending ? <p role="status" className="text-xs text-muted-foreground">Cargando tipos y responsables…</p> : opciones.isError ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm"><p>No pudimos cargar tipos y responsables.</p><Button type="button" variant="outline" size="sm" disabled={opciones.isFetching} onClick={() => void opciones.refetch()}>Reintentar</Button></div> : null}
      <div className="grid gap-3 lg:grid-cols-3">
        <AgendaRelacionFiltro key={`cliente-${revision}`} tipo="cliente" label="Cliente" value={draft.cliente} onChange={(item) => cambiar("cliente", item)} />
        <AgendaRelacionFiltro key={`caso-${revision}`} tipo="caso" label="Expediente administrativo" value={draft.caso} onChange={(item) => cambiar("caso", item)} />
        <AgendaRelacionFiltro key={`expediente-${revision}`} tipo="expediente" label="Expediente judicial" value={draft.expediente} onChange={(item) => cambiar("expediente", item)} />
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2"><Button type="submit">Aplicar filtros</Button><Button type="button" variant="outline" onClick={limpiar}>Limpiar filtros</Button>{pendientes ? <p role="status" className="text-xs text-muted-foreground">Hay cambios sin aplicar.</p> : null}</div>
    </form>
  );
}
