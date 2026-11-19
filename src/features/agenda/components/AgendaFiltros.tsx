"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
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

export type CamposFiltrosAgenda = { estado: boolean; fechas: boolean };

export function filtrosActivosAgenda(filtros: FiltrosAgenda, campos: CamposFiltrosAgenda) {
  return [filtros.busqueda.trim(), filtros.responsableId, filtros.tipoEntradaAgendaId, filtros.cliente, filtros.caso, filtros.expediente,
    campos.estado ? filtros.estado : "", campos.fechas ? filtros.desde : "", campos.fechas ? filtros.hasta : ""].filter(Boolean).length;
}

export default function AgendaFiltros({ value, onApply, campos }: { value: FiltrosAgenda; onApply: (value: FiltrosAgenda) => void; campos: CamposFiltrosAgenda }) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const avanzados = filtrosActivosAgenda({ ...value, busqueda: "", responsableId: null }, campos);
  const [abierto, setAbierto] = useState(avanzados > 0);
  const opciones = useOpcionesAgenda();
  const pendientes = JSON.stringify(draft) !== JSON.stringify(value);
  const activos = filtrosActivosAgenda(value, campos);
  function cambiar<K extends keyof FiltrosAgenda>(key: K, next: FiltrosAgenda[K]) {
    setDraft((prev) => ({ ...prev, [key]: next })); setError(null);
  }
  function limpiar() {
    setDraft(FILTROS_AGENDA_INICIALES); setError(null); setRevision((prev) => prev + 1); onApply(FILTROS_AGENDA_INICIALES);
  }
  return (
    <form aria-label="Filtros de Agenda" className="@container space-y-3 rounded-lg border bg-card p-3 sm:p-4" onSubmit={(e) => {
      e.preventDefault(); const mensaje = campos.fechas ? validarFechasFiltros(draft) : null; setError(mensaje);
      if (!mensaje) { const next = { ...draft, busqueda: draft.busqueda.trim() }; setDraft(next); onApply(next); }
    }}>
      <div className="flex flex-col gap-2 @xl:flex-row @xl:items-end">
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="agenda-busqueda" className="sr-only">Buscar en Agenda</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="agenda-busqueda" maxLength={150} placeholder="Buscar por título o descripción" className="h-9 pl-8" value={draft.busqueda} onChange={(e) => cambiar("busqueda", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1 @xl:w-56">
          <Label htmlFor="agenda-responsable" className="sr-only">Responsable</Label>
          <select id="agenda-responsable" className={SELECT_CLASS} value={draft.responsableId ?? ""} disabled={!opciones.data} onChange={(e) => cambiar("responsableId", e.target.value ? Number(e.target.value) : null)}>
            <option value="">Todos los responsables</option>{opciones.data?.responsables.map((item) => <option key={item.id} value={item.id}>{item.nombre}{!item.activo ? " (inactivo)" : ""}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant={pendientes ? "default" : "outline"} className="h-9 flex-1 @xl:flex-none">Buscar</Button>
          <Button type="button" variant="ghost" className="h-9 flex-1 @xl:flex-none" aria-expanded={abierto} aria-controls="agenda-filtros-mas" onClick={() => setAbierto(!abierto)}>
            <SlidersHorizontal />Más filtros{avanzados > 0 ? ` (${avanzados})` : ""}
          </Button>
        </div>
      </div>
      {abierto ? <div id="agenda-filtros-mas" className="space-y-3 border-t pt-3">
        <div className="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-4">
          {campos.estado ? <div className="space-y-1"><Label htmlFor="agenda-estado">Estado</Label><select id="agenda-estado" className={SELECT_CLASS} value={draft.estado} onChange={(e) => cambiar("estado", e.target.value as EstadoEntradaAgenda | "")}><option value="">Todos</option>{ESTADOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div> : null}
          <div className="space-y-1"><Label htmlFor="agenda-tipo">Categoría</Label><select id="agenda-tipo" className={SELECT_CLASS} value={draft.tipoEntradaAgendaId ?? ""} disabled={!opciones.data} onChange={(e) => cambiar("tipoEntradaAgendaId", e.target.value ? Number(e.target.value) : null)}><option value="">Todas</option>{opciones.data?.tiposEntrada.map((item) => <option key={item.id} value={item.id}>{item.nombre}{!item.activo ? " (inactiva)" : ""}</option>)}</select></div>
          {campos.fechas ? <>
            <div className="space-y-1"><Label htmlFor="agenda-desde">Desde</Label><Input id="agenda-desde" type="date" min="0001-01-01" max="9999-12-31" value={draft.desde} onChange={(e) => cambiar("desde", e.target.value)} aria-describedby="agenda-fechas-ayuda" /></div>
            <div className="space-y-1"><Label htmlFor="agenda-hasta">Hasta</Label><Input id="agenda-hasta" type="date" min="0001-01-01" max="9999-12-31" value={draft.hasta} onChange={(e) => cambiar("hasta", e.target.value)} aria-describedby="agenda-fechas-ayuda" /></div>
          </> : null}
        </div>
        {campos.fechas ? <p id="agenda-fechas-ayuda" className="text-xs text-muted-foreground">Sin fechas se muestra el mes elegido.</p> : null}
        <div className="grid gap-3 @3xl:grid-cols-3">
          <AgendaRelacionFiltro key={`cliente-${revision}`} tipo="cliente" label="Cliente" value={draft.cliente} onChange={(item) => cambiar("cliente", item)} />
          <AgendaRelacionFiltro key={`caso-${revision}`} tipo="caso" label="Expediente administrativo" value={draft.caso} onChange={(item) => cambiar("caso", item)} />
          <AgendaRelacionFiltro key={`expediente-${revision}`} tipo="expediente" label="Expediente judicial" value={draft.expediente} onChange={(item) => cambiar("expediente", item)} />
        </div>
      </div> : null}
      {opciones.isError ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm"><p>No pudimos cargar categorías y responsables.</p><Button type="button" variant="outline" size="sm" disabled={opciones.isFetching} onClick={() => void opciones.refetch()}>Reintentar</Button></div> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {pendientes || activos > 0 ? <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {pendientes ? <p role="status">Hay cambios sin aplicar: tocá Buscar.</p> : <p>{activos === 1 ? "1 filtro aplicado." : `${activos} filtros aplicados.`}</p>}
        {activos > 0 ? <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={limpiar}>Limpiar filtros</Button> : null}
      </div> : null}
    </form>
  );
}
