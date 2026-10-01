"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useReglasVencimiento } from "../hooks/useReglasVencimiento";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import ReglaVencimientoDialog from "./ReglaVencimientoDialog";
import RecordatoriosPredeterminadosDialog, { type DestinoPredeterminadosAgenda } from "./RecordatoriosPredeterminadosDialog";

export default function AgendaConfiguracionScreen() {
  const [soloActivas, setSoloActivas] = useState(false);
  const [tipoId, setTipoId] = useState("");
  const [editor, setEditor] = useState<{ id?: number }>();
  const [destino, setDestino] = useState<DestinoPredeterminadosAgenda>();
  const [mensaje, setMensaje] = useState<string>();
  const reglas = useReglasVencimiento(soloActivas), opciones = useOpcionesAgenda();
  const tipo = opciones.data?.tiposEntrada.find(item => item.id === Number(tipoId));
  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Configuración de Agenda</h1><p className="mt-2 text-sm text-muted-foreground">Reglas de cálculo y avisos predeterminados para futuros compromisos.</p></div><Link href="/agenda" className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Volver a Agenda</Link></header>
    {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}
    <section className="space-y-4 rounded-lg border bg-card p-5 sm:p-6" aria-label="Recordatorios por tipo de entrada">
      <div><h2 className="font-semibold">Recordatorios por tipo de entrada</h2><p className="mt-1 text-sm text-muted-foreground">Elegí el tipo para consultar, reemplazar o desactivar sus avisos predeterminados.</p></div>
      {opciones.isPending ? <Skeleton className="h-10 w-full" aria-label="Cargando tipos" /> : opciones.isError ? <div role="alert"><p>{opciones.error.message}</p><Button variant="outline" onClick={() => void opciones.refetch()}>Reintentar</Button></div> : <div className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="agenda-config-tipo">Tipo de entrada</Label><select id="agenda-config-tipo" className="h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring" value={tipoId} onChange={e => setTipoId(e.target.value)}><option value="">Seleccionar tipo</option>{opciones.data.tiposEntrada.map(item => <option key={item.id} value={item.id}>{item.nombre}{item.activo ? "" : " (inactivo)"}</option>)}</select></div><Button variant="outline" disabled={!tipo} onClick={() => { if (tipo) { setMensaje(undefined); setDestino({ origen: "tipos-entrada", id: tipo.id, nombre: tipo.nombre }); } }}>Configurar avisos</Button></div>}
    </section>
    <section className="space-y-4 rounded-lg border bg-card p-5 sm:p-6" aria-label="Reglas de vencimiento">
      <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Reglas de vencimiento</h2><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={reglas.isFetching} onClick={() => void reglas.refetch()}>Actualizar</Button><Button onClick={() => { setMensaje(undefined); setEditor({}); }}>Nueva regla</Button></div></header>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={soloActivas} onChange={e => setSoloActivas(e.target.checked)} />Mostrar sólo reglas activas</label>
      {reglas.isPending ? <Skeleton className="h-36 w-full" aria-label="Cargando reglas" /> : reglas.isError ? <div role="alert" className="space-y-2"><p>{reglas.error.message}</p><Button variant="outline" disabled={reglas.isFetching} onClick={() => void reglas.refetch()}>Reintentar</Button></div> : reglas.data.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay reglas para esta consulta.</p> : <ul className="space-y-3" aria-busy={reglas.isFetching}>{reglas.data.map(regla => <li key={regla.reglaVencimientoId} className="space-y-3 rounded-md border p-4">
        <div className="flex flex-wrap gap-2"><Badge variant={regla.activo ? "secondary" : "outline"}>{regla.activo ? "Activa" : "Inactiva"}</Badge><Badge variant="outline">{regla.tipoEntradaNombre}</Badge><Badge variant="outline">{regla.prioridadGenerada}</Badge></div>
        <h3 className="break-words font-medium">{regla.nombre}</h3>
        {regla.descripcion ? <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{regla.descripcion}</p> : null}
        <p className="text-sm">{regla.cantidadDias} días {regla.tipoComputo === "DiasHabiles" ? "hábiles" : "corridos"} {regla.sentidoCalculo === "Antes" ? "antes" : "después"} de la fecha base · {regla.horaSugerida ? `Hora: ${regla.horaSugerida}` : "Sin hora sugerida"}</p>
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { setMensaje(undefined); setEditor({ id: regla.reglaVencimientoId }); }}>Editar regla</Button><Button variant="outline" size="sm" onClick={() => { setMensaje(undefined); setDestino({ origen: "reglas-vencimiento", id: regla.reglaVencimientoId, nombre: regla.nombre }); }}>Recordatorios</Button></div>
      </li>)}</ul>}
    </section>
    {editor ? <ReglaVencimientoDialog key={editor.id ?? "nueva"} id={editor.id} onClose={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setMensaje("Regla guardada. La consulta se actualizó."); }} /> : null}
    {destino ? <RecordatoriosPredeterminadosDialog key={`${destino.origen}-${destino.id}`} destino={destino} onClose={() => setDestino(undefined)} onSaved={() => { setDestino(undefined); setMensaje("Configuración de recordatorios guardada."); }} /> : null}
  </div>;
}
