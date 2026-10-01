"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/apiClient";
import { aplicarReglaVencimiento } from "../api/reglasVencimientoApi";
import { useReglasVencimiento } from "../hooks/useReglasVencimiento";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import { useInvalidarAgenda } from "../hooks/useInvalidarAgenda";
import { aplicarReglaAgendaInicial, prepararAplicacionAgenda, resumenAplicacionAgenda, type AplicarReglaAgendaForm, type IntentoAplicarReglaAgenda } from "../lib/aplicarReglaAgenda";
import { mostrarFechaAgenda } from "../lib/periodoAgenda";
import type { ContextoAgenda } from "../lib/agendaContexto";
import type { SeleccionAgenda } from "../lib/filtrosAgenda";
import type { AplicacionReglaVencimientoResponse, ResumenEntradaAgenda } from "../types/types";
import AgendaConfiguracionDialog, { useEventosConfiguracionAgenda } from "./AgendaConfiguracionDialog";
import AgendaRelacionFiltro from "./AgendaRelacionFiltro";

export type ResultadoAplicarReglaAgenda = { aplicacion: AplicacionReglaVencimientoResponse; resumen: ResumenEntradaAgenda };
const RELACIONES = [{ campo: "clientes", tipo: "cliente", label: "Clientes" }, { campo: "casos", tipo: "caso", label: "Expedientes administrativos" }, { campo: "expedientes", tipo: "expediente", label: "Expedientes judiciales" }] as const;

function Asociaciones({ form, contexto, onChange }: { form: AplicarReglaAgendaForm; contexto?: ContextoAgenda; onChange: (campo: "clientes" | "casos" | "expedientes", items: SeleccionAgenda[]) => void }) {
  return <div className="space-y-4">{RELACIONES.map(({ campo, tipo, label }) => <section key={campo} className="space-y-2" aria-label={label}>
    <h3 className="text-sm font-medium">{label} ({form[campo].length}/100)</h3>
    <ul className="space-y-1">{form[campo].map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"><span className="break-words">{item.nombre}</span>{contexto?.tipo === tipo && contexto.id === item.id ? <span className="text-xs text-muted-foreground">Ficha de origen</span> : <Button type="button" variant="ghost" size="sm" aria-label={`Quitar ${item.nombre}`} onClick={() => onChange(campo, form[campo].filter(x => x.id !== item.id))}>Quitar</Button>}</li>)}</ul>
    {form[campo].length < 100 ? <AgendaRelacionFiltro tipo={tipo} label={`Agregar ${label.toLowerCase()}`} value={null} soloActivos onChange={item => { if (item && !form[campo].some(x => x.id === item.id)) onChange(campo, [...form[campo], item]); }} /> : null}
  </section>)}</div>;
}

function Formulario({ contexto, onSaved, onUncertain }: { contexto?: ContextoAgenda; onSaved: (resultado: ResultadoAplicarReglaAgenda) => void; onUncertain: (value: boolean) => void }) {
  const { onClose, onDirty, onPending } = useEventosConfiguracionAgenda();
  const [inicial] = useState(() => aplicarReglaAgendaInicial(contexto));
  const [form, setForm] = useState(inicial);
  const [intento, setIntento] = useState<IntentoAplicarReglaAgenda>();
  const [incierto, setIncierto] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState<string>();
  const [resultado, setResultado] = useState<ResultadoAplicarReglaAgenda>();
  const lock = useRef(false);
  const reglas = useReglasVencimiento(true), opciones = useOpcionesAgenda(), invalidar = useInvalidarAgenda();
  const regla = reglas.data?.find(item => item.reglaVencimientoId === form.reglaId);
  function cambiar<K extends keyof AplicarReglaAgendaForm>(campo: K, value: AplicarReglaAgendaForm[K]) {
    const next = { ...form, [campo]: value }; setForm(next); setError(undefined); onDirty(JSON.stringify(next) !== JSON.stringify(inicial));
  }
  async function actualizarConsultas() { try { await invalidar(); } catch { /* La respuesta confirmada se muestra aunque falle la actualización de consultas. */ } }
  async function generar(event: React.FormEvent) {
    event.preventDefault(); if (lock.current || resultado) return; setError(undefined);
    try {
      let solicitud = intento;
      if (!incierto) {
        if (!regla?.activo) throw new Error("Seleccioná una regla activa.");
        if (!opciones.data) throw new Error("Esperá a que se carguen los responsables.");
        if (form.responsableIds.some(id => !opciones.data!.responsables.some(item => item.id === id && item.activo))) throw new Error("Quitá los responsables inactivos o no disponibles.");
        solicitud = prepararAplicacionAgenda(form, contexto, intento, () => crypto.randomUUID());
      }
      if (!solicitud) throw new Error("No hay una solicitud para reintentar.");
      setIntento(solicitud); lock.current = true; setPending(true); onPending(true); onDirty(true);
      let aplicacion: AplicacionReglaVencimientoResponse;
      try { aplicacion = await aplicarReglaVencimiento(solicitud.reglaId, solicitud.request); }
      catch (err) {
        const desconocido = !(err instanceof ApiError && [400, 404, 422].includes(err.status));
        setIncierto(desconocido); onUncertain(desconocido);
        throw err;
      }
      const next = { aplicacion, resumen: resumenAplicacionAgenda(aplicacion.entrada, form) };
      setResultado(next); setIncierto(false); onUncertain(false); onDirty(false);
      await actualizarConsultas();
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos aplicar la regla."); }
    finally { lock.current = false; setPending(false); onPending(false); }
  }
  if (resultado) return <div className="space-y-4"><p role="status" className="rounded-md border p-4 text-sm">Vencimiento generado: <strong>{resultado.aplicacion.entrada.titulo}</strong> para el <strong>{mostrarFechaAgenda(resultado.aplicacion.fechaCalculada)}</strong>. Entrada #{resultado.aplicacion.entrada.entradaAgendaId}.</p><p className="text-sm text-muted-foreground">Se aplicaron los recordatorios predeterminados del tipo y de la regla que correspondan.</p><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onClose}>Cerrar</Button><Button onClick={() => onSaved(resultado)}>Ver vencimiento</Button></div></div>;
  return <form className="space-y-4" onSubmit={generar}>
    <fieldset disabled={pending || incierto} className="min-w-0 space-y-4">
      <div className="space-y-2"><Label htmlFor="aplicar-regla">Regla activa *</Label><select id="aplicar-regla" required className="h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring" disabled={!reglas.data} value={form.reglaId ?? ""} onChange={e => cambiar("reglaId", e.target.value ? Number(e.target.value) : null)}><option value="">Seleccionar regla</option>{reglas.data?.map(item => <option key={item.reglaVencimientoId} value={item.reglaVencimientoId}>{item.nombre} · {item.tipoEntradaNombre}</option>)}{form.reglaId && reglas.data && !regla ? <option value={form.reglaId} disabled>Regla no disponible</option> : null}</select></div>
      {reglas.isPending ? <p role="status" className="text-sm">Cargando reglas…</p> : reglas.isError ? <div role="alert"><p>{reglas.error.message}</p><Button type="button" variant="outline" onClick={() => void reglas.refetch()}>Reintentar</Button></div> : reglas.data.length === 0 ? <p className="text-sm text-muted-foreground">No hay reglas activas. Podés crearlas desde Configuración de Agenda.</p> : null}
      {regla ? <p className="rounded-md border p-3 text-sm">{regla.cantidadDias} días {regla.tipoComputo === "DiasHabiles" ? "hábiles" : "corridos"} {regla.sentidoCalculo === "Antes" ? "antes" : "después"} de la fecha base. Prioridad: {regla.prioridadGenerada}. {regla.horaSugerida ? `Hora: ${regla.horaSugerida}.` : "Sin hora sugerida."}</p> : null}
      <div className="space-y-2"><Label htmlFor="aplicar-fecha-base">Fecha base *</Label><Input id="aplicar-fecha-base" type="date" min="0001-01-02" max="9999-12-31" required value={form.fechaBase} onChange={e => cambiar("fechaBase", e.target.value)} /><p className="text-xs text-muted-foreground">Indicá la fecha que inicia el cómputo. El vencimiento lo calculará el sistema.</p></div>
      {contexto ? <p className="break-words text-sm">Ficha de origen: {contexto.nombre}. Su vinculación se conservará en el vencimiento.</p> : null}
      <div className="space-y-2"><h3 className="text-sm font-medium">Responsables</h3>{opciones.isPending ? <p role="status">Cargando responsables…</p> : opciones.isError ? <div role="alert"><p>{opciones.error.message}</p><Button type="button" variant="outline" onClick={() => void opciones.refetch()}>Reintentar</Button></div> : <div className="grid gap-2 sm:grid-cols-2">{opciones.data.responsables.filter(item => item.activo || form.responsableIds.includes(item.id)).map(item => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.responsableIds.includes(item.id)} disabled={!item.activo && !form.responsableIds.includes(item.id)} onChange={e => cambiar("responsableIds", e.target.checked ? [...form.responsableIds, item.id] : form.responsableIds.filter(id => id !== item.id))} />{item.nombre}{item.activo ? "" : " (inactivo: quitar)"}</label>)}</div>}</div>
      <Asociaciones form={form} contexto={contexto} onChange={cambiar} />
      {form.responsableIds.filter(id => opciones.data && !opciones.data.responsables.some(item => item.id === id)).map(id => <Button key={id} type="button" variant="outline" size="sm" onClick={() => cambiar("responsableIds", form.responsableIds.filter(item => item !== id))}>Quitar responsable #{id} no disponible</Button>)}
      <p className="text-xs text-muted-foreground">Los días hábiles excluyen fines de semana y días inhábiles registrados. Se creará una entrada pendiente con los avisos predeterminados del tipo y de la regla.</p>
    </fieldset>
    {incierto ? <p role="status" className="rounded-md border p-3 text-sm">No pudimos confirmar el resultado. Reintentá esta misma solicitud para recuperar el vencimiento si ya se creó. Los datos quedan bloqueados hasta resolver este intento.</p> : null}
    {error ? <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{error}</p> : null}
    <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={pending || !incierto && (!regla || !opciones.data)}>{pending ? "Generando…" : incierto ? "Reintentar solicitud" : "Generar vencimiento"}</Button></div>
  </form>;
}
export default function AplicarReglaAgendaDialog({ contexto, onClose, onSaved }: { contexto?: ContextoAgenda; onClose: () => void; onSaved: (resultado: ResultadoAplicarReglaAgenda) => void }) {
  const [incierto, setIncierto] = useState(false);
  return <AgendaConfiguracionDialog titulo="Generar vencimiento por regla" descripcion="Seleccioná una regla y la fecha base para calcular el vencimiento." avisoCierre={incierto ? "La solicitud pudo haberse guardado. Reintentá antes de cerrar para recuperar su resultado. Al cerrar se pierde este intento y una nueva solicitud podría generar otro vencimiento." : undefined} onClose={onClose}><Formulario contexto={contexto} onSaved={onSaved} onUncertain={setIncierto} /></AgendaConfiguracionDialog>;
}
