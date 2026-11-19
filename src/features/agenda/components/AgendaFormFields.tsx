"use client";
import { useState, type ReactNode } from "react";
import { CalendarClock, CalendarDays, ChevronDown, ListTodo, Calculator, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import type { AgendaForm, ClaseAgenda } from "../lib/agendaForm";
import type { OpcionAgendaResponse, PrioridadAgenda } from "../types/types";
import AgendaRelacionFiltro from "./AgendaRelacionFiltro";

const SELECT_CLASS = "h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";
const RELACIONES = [{ campo: "clientes", tipo: "cliente", label: "Cliente" }, { campo: "casos", tipo: "caso", label: "Expediente administrativo" }, { campo: "expedientes", tipo: "expediente", label: "Expediente judicial" }] as const;

export const CLASES_AGENDA: { id: ClaseAgenda; label: string; ayuda: string; icono: typeof CalendarDays }[] = [
  { id: "evento", label: "Evento", ayuda: "Audiencia, reunión o llamado con día y hora", icono: CalendarDays },
  { id: "tarea", label: "Tarea", ayuda: "Algo para hacer, con o sin fecha límite", icono: ListTodo },
  { id: "vencimiento", label: "Vencimiento", ayuda: "Plazo con fecha límite", icono: CalendarClock },
];
const CATEGORIA_SUGERIDA: Record<ClaseAgenda, RegExp> = { evento: /audiencia|reuni|turno|llamad/i, tarea: /tarea/i, vencimiento: /venc|plazo/i };

export function categoriaSugerida(clase: ClaseAgenda, tipos: OpcionAgendaResponse[] | undefined) {
  return tipos?.find(item => item.activo && CATEGORIA_SUGERIDA[clase].test(item.nombre))?.id ?? null;
}

function Campo({ id, label, children, className }: { id: string; label: string; children: ReactNode; className?: string }) {
  return <div className={cn("min-w-0 space-y-1.5", className)}><Label htmlFor={id}>{label}</Label>{children}</div>;
}

export function tieneOpcionesAvanzadas(form: AgendaForm) {
  const finOtroDia = form.fechaFin && form.fechaFin !== form.fechaInicio;
  return Boolean(form.descripcion || form.prioridad !== "Normal" || form.recurrenciaFrecuencia || finOtroDia
    || (form.clase === "evento" && form.fechaVencimiento) || (form.clase !== "evento" && (form.horaInicio || form.horaFin)));
}

export default function AgendaFormFields({ form, onChange, claseFija = false, onUsarRegla, masOpciones, abrirMasOpciones = false }: {
  form: AgendaForm; onChange: (next: AgendaForm) => void; claseFija?: boolean; onUsarRegla?: () => void; masOpciones?: ReactNode; abrirMasOpciones?: boolean;
}) {
  const opciones = useOpcionesAgenda();
  const [abierto, setAbierto] = useState(abrirMasOpciones || tieneOpcionesAvanzadas(form));
  const [relacion, setRelacion] = useState<(typeof RELACIONES)[number]["tipo"]>("cliente");
  function cambiar<K extends keyof AgendaForm>(key: K, value: AgendaForm[K]) { onChange({ ...form, [key]: value }); }
  function elegirClase(clase: ClaseAgenda) {
    onChange({ ...form, clase, tipoEntradaAgendaId: form.tipoEntradaAgendaId ?? categoriaSugerida(clase, opciones.data?.tiposEntrada) });
  }
  function cambiarFecha(campo: "fechaInicio" | "fechaFin" | "fechaVencimiento", valor: string) {
    const next = { ...form, [campo]: valor };
    if (!valor && campo === "fechaFin") next.horaFin = "";
    if (!valor && campo === "fechaVencimiento") next.horaVencimiento = "";
    // En un vencimiento el inicio está oculto: si el vencimiento es anterior, se acompaña.
    if (campo === "fechaVencimiento" && form.clase === "vencimiento" && valor && valor < form.fechaInicio) next.fechaInicio = valor;
    onChange(next);
  }
  const relacionadas = RELACIONES.flatMap(({ campo, label }) => form[campo].map(item => ({ campo, label, item })));
  const clase = form.clase;

  const fechaInicio = <Campo id="agenda-form-fechaInicio" label={clase === "vencimiento" ? "Fecha de inicio" : "Fecha *"}><Input id="agenda-form-fechaInicio" type="date" min="0001-01-02" max="9999-12-31" required={clase !== "vencimiento"} value={form.fechaInicio} onChange={e => cambiarFecha("fechaInicio", e.target.value)} /></Campo>;
  const horaInicio = <Campo id="agenda-form-horaInicio" label={clase === "evento" ? "Desde" : "Hora"}><Input id="agenda-form-horaInicio" type="time" value={form.horaInicio.slice(0, 5)} onChange={e => cambiar("horaInicio", e.target.value)} /></Campo>;
  const horaFin = <Campo id="agenda-form-horaFin" label={clase === "evento" ? "Hasta" : "Hora en que termina"}><Input id="agenda-form-horaFin" type="time" value={form.horaFin.slice(0, 5)} onChange={e => cambiar("horaFin", e.target.value)} /></Campo>;
  const fechaFin = <Campo id="agenda-form-fechaFin" label="Termina otro día"><Input id="agenda-form-fechaFin" type="date" min={form.fechaInicio || "0001-01-01"} max="9999-12-31" value={form.fechaFin} onChange={e => cambiarFecha("fechaFin", e.target.value)} /></Campo>;
  const fechaVenc = <Campo id="agenda-form-fechaVencimiento" label={clase === "vencimiento" ? "Vence el *" : clase === "tarea" ? "Fecha límite (opcional)" : "Fecha límite"}><Input id="agenda-form-fechaVencimiento" type="date" min="0001-01-02" max="9999-12-31" required={clase === "vencimiento"} value={form.fechaVencimiento} onChange={e => cambiarFecha("fechaVencimiento", e.target.value)} /></Campo>;
  const horaVenc = <Campo id="agenda-form-horaVencimiento" label="Hora límite"><Input id="agenda-form-horaVencimiento" type="time" disabled={!form.fechaVencimiento} value={form.horaVencimiento.slice(0, 5)} onChange={e => cambiar("horaVencimiento", e.target.value)} /></Campo>;

  return <div className="space-y-5">
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">¿Qué querés agendar? *</legend>
      <div className="grid gap-2 @lg:grid-cols-3">
        {CLASES_AGENDA.map(({ id, label, ayuda, icono: Icono }) => <label key={id} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring", clase === id ? "border-primary bg-primary/5" : "hover:bg-muted/50", claseFija && clase !== id && "cursor-not-allowed opacity-50")}>
          <input type="radio" name="agenda-clase" value={id} className="sr-only" checked={clase === id} disabled={claseFija && clase !== id} onChange={() => elegirClase(id)} />
          <Icono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span><span className="block font-medium">{label}</span><span className="block text-xs text-muted-foreground">{ayuda}</span></span>
        </label>)}
      </div>
    </fieldset>

    {clase ? <>
      <div className="grid gap-4 @lg:grid-cols-[minmax(0,1fr)_14rem]">
        <Campo id="agenda-form-titulo" label="Título *"><Input id="agenda-form-titulo" required maxLength={300} placeholder={clase === "evento" ? "Ej.: Audiencia de conciliación" : clase === "vencimiento" ? "Ej.: Contestar traslado" : "Ej.: Pedir documentación al cliente"} value={form.titulo} onChange={(e) => cambiar("titulo", e.target.value)} /></Campo>
        <Campo id="agenda-form-tipo" label="Categoría *">
          <select id="agenda-form-tipo" required value={form.tipoEntradaAgendaId ?? ""} disabled={!opciones.data} className={SELECT_CLASS} onChange={(e) => cambiar("tipoEntradaAgendaId", e.target.value ? Number(e.target.value) : null)}>
            <option value="">Elegir</option>{opciones.data?.tiposEntrada.filter(item => item.activo || item.id === form.tipoEntradaAgendaId).map(item => <option key={item.id} value={item.id} disabled={!item.activo}>{item.nombre}{!item.activo ? " (inactiva: elegí otra)" : ""}</option>)}
            {form.tipoEntradaAgendaId && opciones.data && !opciones.data.tiposEntrada.some(x => x.id === form.tipoEntradaAgendaId) ? <option value={form.tipoEntradaAgendaId} disabled>Categoría no disponible</option> : null}
          </select>
        </Campo>
      </div>

      <div className="grid gap-4 @lg:grid-cols-3">
        {clase === "evento" ? <>{fechaInicio}{horaInicio}{horaFin}</> : clase === "tarea" ? <>{fechaInicio}{fechaVenc}{horaVenc}</> : <>{fechaVenc}{horaVenc}</>}
      </div>
      {clase === "vencimiento" && onUsarRegla ? <p className="text-sm text-muted-foreground">¿El plazo se cuenta en días hábiles desde una notificación? <Button type="button" variant="link" className="h-auto p-0" onClick={onUsarRegla}><Calculator />Calcular con una regla</Button></p> : null}

      <section className="space-y-2" aria-labelledby="agenda-form-relaciones">
        <h3 id="agenda-form-relaciones" className="text-sm font-medium">Relacionado con</h3>
        {relacionadas.length > 0 ? <ul className="flex flex-wrap gap-2">{relacionadas.map(({ campo, label, item }) => <li key={`${campo}-${item.id}`} className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/40 py-1 pl-2 pr-1 text-sm">
          <span className="min-w-0 break-words"><span className="text-xs text-muted-foreground">{label}: </span>{item.nombre}</span>
          <Button type="button" variant="ghost" size="icon-xs" aria-label={`Quitar ${item.nombre}`} onClick={() => cambiar(campo, form[campo].filter(x => x.id !== item.id))}><X /></Button>
        </li>)}</ul> : <p className="text-sm text-muted-foreground">Sin cliente ni expediente.</p>}
        <div className="grid gap-2 @lg:grid-cols-[14rem_minmax(0,1fr)] @lg:items-start">
          <div className="space-y-1"><Label htmlFor="agenda-form-relacion-tipo" className="sr-only">Tipo de relación</Label><select id="agenda-form-relacion-tipo" className={SELECT_CLASS} value={relacion} onChange={e => setRelacion(e.target.value as typeof relacion)}>{RELACIONES.map(item => <option key={item.tipo} value={item.tipo}>{item.label}</option>)}</select></div>
          {RELACIONES.filter(item => item.tipo === relacion).map(({ campo, tipo, label }) => form[campo].length < 100 ? <AgendaRelacionFiltro key={tipo} tipo={tipo} label={`Agregar ${label.toLowerCase()}`} modo="agregar" value={null} soloActivos onChange={(item) => { if (item && !form[campo].some(x => x.id === item.id)) cambiar(campo, [...form[campo], item]); }} /> : <p key={tipo} className="text-sm text-muted-foreground">Llegaste al máximo de 100.</p>)}
        </div>
      </section>

      <section className="space-y-2" aria-labelledby="agenda-form-responsables">
        <h3 id="agenda-form-responsables" className="text-sm font-medium">Responsables</h3>
        {opciones.isPending ? <p role="status" className="text-sm text-muted-foreground">Cargando…</p> : opciones.isError ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm"><p>No pudimos cargar categorías y responsables.</p><Button type="button" variant="outline" size="sm" onClick={() => void opciones.refetch()}>Reintentar</Button></div> : <div className="flex flex-wrap gap-2">{opciones.data.responsables.filter(item => item.activo || form.responsableIds.includes(item.id)).map(item => <label key={item.id} className={cn("inline-flex max-w-full cursor-pointer items-center gap-2 break-words rounded-md border px-2.5 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring pointer-coarse:min-h-10", form.responsableIds.includes(item.id) && "border-primary bg-primary/5")}><input type="checkbox" className="size-4 accent-primary" checked={form.responsableIds.includes(item.id)} onChange={(e) => cambiar("responsableIds", e.target.checked ? [...form.responsableIds, item.id] : form.responsableIds.filter(id => id !== item.id))} disabled={!item.activo && !form.responsableIds.includes(item.id)} />{item.nombre}{!item.activo ? " (inactivo: quitalo para guardar)" : ""}</label>)}</div>}
        {form.responsableIds.filter(id => opciones.data && !opciones.data.responsables.some(x => x.id === id)).map(id => <Button key={id} type="button" variant="outline" size="sm" onClick={() => cambiar("responsableIds", form.responsableIds.filter(x => x !== id))}>Quitar responsable no disponible</Button>)}
      </section>

      <section className="rounded-lg border">
        <button type="button" className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring" aria-expanded={abierto} aria-controls="agenda-form-mas" onClick={() => setAbierto(!abierto)}>
          <span>Más opciones <span className="font-normal text-muted-foreground">· notas, prioridad, otras fechas, repetición y avisos</span></span>
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", abierto && "rotate-180")} aria-hidden="true" />
        </button>
        <div id="agenda-form-mas" hidden={!abierto} className="space-y-4 border-t p-3">
          <Campo id="agenda-form-descripcion" label="Notas"><Textarea id="agenda-form-descripcion" maxLength={4000} rows={3} value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} /></Campo>
          <Campo id="agenda-form-prioridad" label="Prioridad" className="@lg:max-w-56"><select id="agenda-form-prioridad" value={form.prioridad} className={SELECT_CLASS} onChange={(e) => cambiar("prioridad", e.target.value as PrioridadAgenda)}>{["Baja", "Normal", "Alta", "Urgente"].map(value => <option key={value} value={value}>{value}</option>)}</select></Campo>
          <div className="grid gap-4 @lg:grid-cols-3">
            {clase === "evento" ? <>{fechaFin}{fechaVenc}{horaVenc}</> : clase === "tarea" ? <>{horaInicio}{fechaFin}{form.fechaFin ? horaFin : null}</> : <>{fechaInicio}{horaInicio}</>}
          </div>
          <p className="text-xs text-muted-foreground">Horarios de Argentina. Dejá la hora vacía si no corresponde.</p>
          {masOpciones}
        </div>
      </section>
    </> : null}
  </div>;
}
