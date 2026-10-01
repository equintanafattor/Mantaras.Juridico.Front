"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import type { AgendaForm } from "../lib/agendaForm";
import type { PrioridadAgenda } from "../types/types";
import AgendaRelacionFiltro from "./AgendaRelacionFiltro";

const SELECT_CLASS = "h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";
const FECHAS = [
  { fecha: "fechaInicio", hora: "horaInicio", label: "Inicio" },
  { fecha: "fechaFin", hora: "horaFin", label: "Fin" },
  { fecha: "fechaVencimiento", hora: "horaVencimiento", label: "Vencimiento" },
] as const;
const RELACIONES = [{ campo: "clientes", tipo: "cliente", label: "Clientes" }, { campo: "casos", tipo: "caso", label: "Expedientes administrativos" }, { campo: "expedientes", tipo: "expediente", label: "Expedientes judiciales" }] as const;

export default function AgendaFormFields({ form, onChange, vencimientoManual }: { form: AgendaForm; onChange: (next: AgendaForm) => void; vencimientoManual: boolean }) {
  const opciones = useOpcionesAgenda();
  function cambiar<K extends keyof AgendaForm>(key: K, value: AgendaForm[K]) { onChange({ ...form, [key]: value }); }
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="agenda-form-tipo">Tipo de entrada *</Label><select id="agenda-form-tipo" required value={form.tipoEntradaAgendaId ?? ""} disabled={!opciones.data} className={SELECT_CLASS} onChange={(e) => cambiar("tipoEntradaAgendaId", e.target.value ? Number(e.target.value) : null)}>
        <option value="">Seleccionar</option>{opciones.data?.tiposEntrada.filter(item => item.activo || item.id === form.tipoEntradaAgendaId).map(item => <option key={item.id} value={item.id} disabled={!item.activo}>{item.nombre}{!item.activo ? " (inactivo: elegí otro tipo)" : ""}</option>)}
        {form.tipoEntradaAgendaId && opciones.data && !opciones.data.tiposEntrada.some(x => x.id === form.tipoEntradaAgendaId) ? <option value={form.tipoEntradaAgendaId} disabled>Tipo #{form.tipoEntradaAgendaId} (no disponible)</option> : null}
      </select></div>
      <div className="space-y-2"><Label htmlFor="agenda-form-prioridad">Prioridad</Label><select id="agenda-form-prioridad" value={form.prioridad} className={SELECT_CLASS} onChange={(e) => cambiar("prioridad", e.target.value as PrioridadAgenda)}>{["Baja", "Normal", "Alta", "Urgente"].map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    </div>
    <div className="space-y-2"><Label htmlFor="agenda-form-titulo">Título *</Label><Input id="agenda-form-titulo" required maxLength={300} value={form.titulo} onChange={(e) => cambiar("titulo", e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="agenda-form-descripcion">Descripción</Label><Textarea id="agenda-form-descripcion" maxLength={4000} rows={4} value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} /></div>
    <div className="grid gap-4 sm:grid-cols-3">{FECHAS.map(item => <div key={item.fecha} className="space-y-2">
      <Label htmlFor={`agenda-form-${item.fecha}`}>{item.label}{item.fecha === "fechaInicio" || item.fecha === "fechaVencimiento" && vencimientoManual ? " *" : ""}</Label>
      <Input id={`agenda-form-${item.fecha}`} type="date" min={item.fecha === "fechaInicio" ? "0001-01-02" : form.fechaInicio || "0001-01-01"} max="9999-12-31" required={item.fecha === "fechaInicio" || item.fecha === "fechaVencimiento" && vencimientoManual} value={form[item.fecha]} onChange={(e) => onChange({ ...form, [item.fecha]: e.target.value, ...(item.fecha !== "fechaInicio" && !e.target.value ? { [item.hora]: "" } : {}) })} />
      <Label htmlFor={`agenda-form-${item.hora}`}>Hora de {item.label.toLowerCase()}</Label><Input id={`agenda-form-${item.hora}`} type="time" step={1} disabled={!form[item.fecha]} value={form[item.hora]} onChange={(e) => cambiar(item.hora, e.target.value)} />
    </div>)}</div>
    <p className="text-xs text-muted-foreground">Horarios de Argentina. Dejá la hora vacía si no corresponde.</p>
    <div className="space-y-2"><h3 className="font-medium">Responsables</h3>
      {opciones.isPending ? <p role="status">Cargando opciones…</p> : opciones.isError ? <div role="alert"><p>No pudimos cargar tipos y responsables.</p><Button type="button" variant="outline" onClick={() => void opciones.refetch()}>Reintentar</Button></div> : <div className="grid gap-2 sm:grid-cols-2">{opciones.data.responsables.filter(item => item.activo || form.responsableIds.includes(item.id)).map(item => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.responsableIds.includes(item.id)} onChange={(e) => cambiar("responsableIds", e.target.checked ? [...form.responsableIds, item.id] : form.responsableIds.filter(id => id !== item.id))} disabled={!item.activo && !form.responsableIds.includes(item.id)} />{item.nombre} · #{item.id}{!item.activo ? " (inactivo: quitar para guardar)" : ""}</label>)}</div>}
      {form.responsableIds.filter(id => !opciones.data?.responsables.some(x => x.id === id)).map(id => <Button key={id} type="button" variant="outline" size="sm" onClick={() => cambiar("responsableIds", form.responsableIds.filter(x => x !== id))}>Quitar responsable #{id}</Button>)}
      <p className="text-xs text-muted-foreground">Podés elegir varios responsables o dejar la entrada sin asignar.</p>
    </div>
    <div className="space-y-4">{RELACIONES.map(({ campo, tipo, label }) => <section key={campo} className="space-y-2" aria-label={label}>
      <h3 className="font-medium">{label} ({form[campo].length}/100)</h3>
      <ul className="space-y-1">{form[campo].map(item => <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"><span className="break-words">{item.nombre} · #{item.id}</span><Button type="button" variant="ghost" size="sm" aria-label={`Quitar ${item.nombre}`} onClick={() => cambiar(campo, form[campo].filter(x => x.id !== item.id))}>Quitar</Button></li>)}</ul>
      {form[campo].length < 100 ? <AgendaRelacionFiltro tipo={tipo} label={`Agregar ${label.toLowerCase()}`} value={null} soloActivos onChange={(item) => { if (item && !form[campo].some(x => x.id === item.id)) cambiar(campo, [...form[campo], item]); }} /> : null}
    </section>)}</div>
  </div>;
}
