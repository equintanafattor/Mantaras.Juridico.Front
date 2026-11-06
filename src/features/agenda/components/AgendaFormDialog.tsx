"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { actualizarEntradaAgenda, crearEntradaAgenda, crearVencimientoManual, obtenerEntradaAgenda } from "../api/agendaApi";
import { crearRecordatorioAgenda } from "../api/recordatoriosApi";
import { agendaKeys } from "../hooks/agendaKeys";
import { useInvalidarAgenda } from "../hooks/useInvalidarAgenda";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import { agendaFormDesdeEntrada, agendaFormInicial, requestDesdeAgendaForm, type AgendaForm } from "../lib/agendaForm";
import { guardarAgendaConRecordatorios, type ProgresoGuardadoAgenda } from "../lib/guardarAgendaForm";
import { cambianFechasRecordatoriosAgenda, firmaFechasRecordatoriosAgenda } from "../lib/fechasRecordatoriosAgenda";
import { requestDesdeRecordatorioForm } from "../lib/recordatorioForm";
import type { ContextoAgenda } from "../lib/agendaContexto";
import type { CrearRecordatorioAgendaRequest, ResumenEntradaAgenda } from "../types/types";
import { mostrarFechaAgenda } from "../lib/periodoAgenda";
import AgendaFormFields from "./AgendaFormFields";
import AgendaRecordatoriosAlta from "./AgendaRecordatoriosAlta";

export type EditorAgenda = { modo: "entrada" | "vencimiento"; contexto?: ContextoAgenda } | { modo: "editar"; entrada: ResumenEntradaAgenda };
export type ResultadoGuardadoAgenda = { texto: string; entrada: ResumenEntradaAgenda };
type FormEvents = { onClose: () => void; onPending: (value: boolean) => void; onSaved: (resultado?: ResultadoGuardadoAgenda) => void; onChanges: (dirty: boolean, entradaCreada: boolean) => void; onUsarRegla?: () => void };

function resultadoGuardado(form: AgendaForm, entradaAgendaId: number, editada: boolean, tipoNombre: string): ResultadoGuardadoAgenda {
  const relaciones = (items: AgendaForm["clientes"]) => items.map(item => ({ id: item.id, nombre: item.nombre, referencia: null }));
  const fecha = form.fechaVencimiento ? `vence el ${mostrarFechaAgenda(form.fechaVencimiento)}` : `para el ${mostrarFechaAgenda(form.fechaInicio)}`;
  const repetida = !editada && form.recurrenciaFrecuencia ? ` Se crearon ${form.recurrenciaCantidad} repeticiones.` : "";
  return {
    texto: editada ? `Cambios guardados en «${form.titulo.trim()}».` : `Agendado: «${form.titulo.trim()}», ${fecha}.${repetida}`,
    entrada: { entradaAgendaId, titulo: form.titulo.trim(), tipoEntradaNombre: tipoNombre, clientes: relaciones(form.clientes), casos: relaciones(form.casos), expedientes: relaciones(form.expedientes), responsables: [] },
  };
}

function Formulario({ inicial, id, vencimientoManual, onClose, onPending, onSaved, onChanges, onUsarRegla }: FormEvents & { inicial: AgendaForm; id?: number; vencimientoManual: boolean }) {
  const [original] = useState(inicial);
  const [form, setForm] = useState(inicial);
  const [recordatorios, setRecordatorios] = useState<CrearRecordatorioAgendaRequest[]>([]);
  const [draftDirty, setDraftDirty] = useState(false);
  const [progreso, setProgreso] = useState<ProgresoGuardadoAgenda>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [fechasConfirmadas, setFechasConfirmadas] = useState<string>();
  const lock = useRef(false);
  const opciones = useOpcionesAgenda();
  const invalidar = useInvalidarAgenda();
  const queryClient = useQueryClient();
  const esVencimiento = id === undefined && (vencimientoManual || form.clase === "vencimiento");
  const entradaGuardada = progreso?.entradaId !== undefined;
  const cambianFechas = id !== undefined && cambianFechasRecordatoriosAgenda(original, form);
  const firmaFechas = firmaFechasRecordatoriosAgenda(form);

  function informar(nextForm: AgendaForm, nextRecordatorios: CrearRecordatorioAgendaRequest[], nextDraft: boolean) {
    onChanges(JSON.stringify(nextForm) !== JSON.stringify(original) || nextRecordatorios.length > 0 || nextDraft, false);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault(); if (lock.current) return; setError(undefined);
    let ultimo: ProgresoGuardadoAgenda = progreso ?? { pendientes: recordatorios };
    let completo = false;
    try {
      // Tras un guardado parcial, sólo se reintentan los recordatorios pendientes.
      const request = entradaGuardada ? undefined : requestDesdeAgendaForm(form, esVencimiento);
      if (request) {
        if (cambianFechas && fechasConfirmadas !== firmaFechas) throw new Error("Marcá la casilla sobre los avisos (abajo) para confirmar que vas a revisar sus horarios.");
        if (!opciones.data?.tiposEntrada.some(x => x.id === request.tipoEntradaAgendaId && x.activo)) throw new Error("Elegí una categoría activa.");
        if (request.responsableIds.some(id => !opciones.data?.responsables.some(x => x.id === id && x.activo))) throw new Error("Quitá los responsables inactivos o no disponibles.");
        if (draftDirty) throw new Error("En Más opciones › Avisos quedó un aviso sin agregar: tocá «Agregar a la lista» o «Descartar».");
        for (const item of recordatorios) requestDesdeRecordatorioForm(item.baseCalculo, String(item.minutosAnticipacion), "Minutos", !!request.fechaVencimiento);
      }
      lock.current = true; setPending(true); onPending(true);
      await guardarAgendaConRecordatorios(ultimo, () => id !== undefined ? actualizarEntradaAgenda(id, request!) : esVencimiento ? crearVencimientoManual(request!) : crearEntradaAgenda(request!), crearRecordatorioAgenda, next => {
        ultimo = next; setProgreso(next); onChanges(next.pendientes.length > 0, id === undefined);
      });
      completo = true;
    } catch (err) { setError(err instanceof Error ? `No se pudo guardar. ${err.message}` : "No se pudo guardar. Revisá la conexión y probá de nuevo."); }
    finally {
      if (ultimo.entradaId !== undefined) {
        try { await Promise.all([invalidar(), queryClient.invalidateQueries({ queryKey: agendaKeys.entrada(ultimo.entradaId) })]); }
        catch { completo = false; setError("Se guardó, pero no pudimos actualizar la pantalla. Tocá Reintentar para refrescarla."); }
      }
      lock.current = false; setPending(false); onPending(false);
    }
    if (completo && ultimo.entradaId !== undefined) onSaved(resultadoGuardado(form, ultimo.entradaId, id !== undefined, opciones.data?.tiposEntrada.find(x => x.id === form.tipoEntradaAgendaId)?.nombre ?? ""));
    else if (completo) onSaved();
  }

  const actualizar = (next: AgendaForm) => { setForm(next); setError(undefined); informar(next, recordatorios, draftDirty); };
  const masOpciones = id === undefined ? <>
    <div className="space-y-2 border-t pt-4">
      <label className="block text-sm font-medium" htmlFor="agenda-recurrencia">Repetir</label>
      <select id="agenda-recurrencia" className="h-9 w-full rounded-md border bg-background px-2 text-sm sm:max-w-56" value={form.recurrenciaFrecuencia} onChange={e => actualizar({ ...form, recurrenciaFrecuencia: e.target.value as AgendaForm["recurrenciaFrecuencia"] })}>
        <option value="">No se repite</option><option value="Diaria">Cada día</option><option value="Semanal">Cada semana</option><option value="Mensual">Cada mes</option><option value="Anual">Cada año</option>
      </select>
      {form.recurrenciaFrecuencia ? <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Cada cuántos {form.recurrenciaFrecuencia === "Diaria" ? "días" : form.recurrenciaFrecuencia === "Semanal" ? "semanas" : form.recurrenciaFrecuencia === "Mensual" ? "meses" : "años"}<input className="mt-1 h-9 w-full rounded-md border bg-background px-2" type="number" min={1} max={365} required value={form.recurrenciaIntervalo} onChange={e => actualizar({ ...form, recurrenciaIntervalo: Number(e.target.value) })} /></label>
        <label className="text-sm">Cantidad total (incluye la primera)<input className="mt-1 h-9 w-full rounded-md border bg-background px-2" type="number" min={2} max={100} required value={form.recurrenciaCantidad} onChange={e => actualizar({ ...form, recurrenciaCantidad: Number(e.target.value) })} /></label>
      </div> : null}
      {form.recurrenciaFrecuencia ? <p className="text-xs text-muted-foreground">Se crean todas ahora y cada una se completa por separado. Los avisos que agregues abajo son sólo para la primera; los avisos automáticos de la categoría se crean en todas.</p> : null}
    </div>
    <AgendaRecordatoriosAlta items={recordatorios} tieneVencimiento={!!form.fechaVencimiento} onChange={(next, resetDraft) => { setRecordatorios(next); if (resetDraft) setDraftDirty(false); setError(undefined); informar(form, next, resetDraft ? false : draftDirty); }} onDraftChange={dirty => { setDraftDirty(dirty); informar(form, recordatorios, dirty); }} />
  </> : <p className="border-t pt-4 text-sm text-muted-foreground">Los avisos de esta entrada se agregan, reprograman o quitan desde su detalle.</p>;

  return <form className="space-y-4" onSubmit={guardar}>
    <fieldset disabled={pending || entradaGuardada} className="min-w-0 space-y-4">
      <AgendaFormFields form={form} claseFija={vencimientoManual} abrirMasOpciones={cambianFechas} onUsarRegla={id === undefined && onUsarRegla ? () => onUsarRegla() : undefined} masOpciones={masOpciones} onChange={actualizar} />
      {cambianFechas ? <div className="space-y-2 rounded-md border border-amber-600/40 bg-amber-50/50 p-3 dark:bg-amber-950/10"><p className="text-sm">Cambiaste fechas u horas. Los avisos ya programados <strong>no se mueven solos</strong>: después de guardar, revisalos en el detalle y usá Reprogramar o Quitar.</p><label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4 accent-primary" checked={fechasConfirmadas === firmaFechas} onChange={e => setFechasConfirmadas(e.target.checked ? firmaFechas : undefined)} />Entendido, voy a revisar los avisos.</label></div> : null}
    </fieldset>
    {entradaGuardada && progreso.pendientes.length > 0 ? <p role="status" className="rounded-md border p-3 text-sm">Ya se guardó, pero faltan {progreso.pendientes.length === 1 ? "1 aviso" : `${progreso.pendientes.length} avisos`}. Tocá «Reintentar» para agregarlos o «Cerrar» para seguir sin ellos.</p> : null}
    {error ? <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{error}</p> : null}
    <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-popover py-3"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>{entradaGuardada ? "Cerrar" : "Cancelar"}</Button><Button type="submit" disabled={pending || !entradaGuardada && !opciones.data}>{pending ? "Guardando…" : entradaGuardada ? "Reintentar" : id !== undefined ? "Guardar cambios" : "Guardar"}</Button></div>
  </form>;
}

function Edicion({ entrada, ...props }: FormEvents & { entrada: ResumenEntradaAgenda }) {
  const detalle = useQuery({ queryKey: agendaKeys.entrada(entrada.entradaAgendaId), queryFn: ({ signal }) => obtenerEntradaAgenda(entrada.entradaAgendaId, signal), refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false });
  if (detalle.isPending || detalle.isFetching && !detalle.isFetchedAfterMount) return <Skeleton className="h-64 w-full" aria-label="Cargando entrada para editar" />;
  if (!detalle.data) return <div role="alert"><p>{detalle.error?.message ?? "No pudimos cargar la entrada."}</p><Button variant="outline" onClick={() => void detalle.refetch()}>Reintentar</Button></div>;
  return <Formulario inicial={agendaFormDesdeEntrada(detalle.data, entrada)} id={entrada.entradaAgendaId} vencimientoManual={false} {...props} />;
}

export default function AgendaFormDialog({ editor, onClose, onSaved, onUsarRegla }: { editor: EditorAgenda; onClose: () => void; onSaved: (resultado?: ResultadoGuardadoAgenda) => void; onUsarRegla?: () => void }) {
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [entradaCreada, setEntradaCreada] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const ocupado = useRef(false);
  const cambios = useRef({ dirty: false, entradaCreada: false });
  useEffect(() => {
    if (!dirty && !pending) return;
    const proteger = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", proteger);
    return () => window.removeEventListener("beforeunload", proteger);
  }, [dirty, pending]);
  function pedirCierre() {
    if (ocupado.current) return;
    if (cambios.current.dirty) setConfirmar(true);
    else if (cambios.current.entradaCreada) onSaved();
    else onClose();
  }
  const props: FormEvents = { onClose: pedirCierre, onSaved, onUsarRegla: onUsarRegla ? () => { if (!cambios.current.dirty || window.confirm("Se descartará lo que cargaste en este formulario. ¿Seguir?")) onUsarRegla(); } : undefined, onPending: value => { ocupado.current = value; setPending(value); }, onChanges: (value, creada) => { cambios.current = { dirty: value, entradaCreada: creada }; setDirty(value); setEntradaCreada(creada); } };
  return <Dialog open onOpenChange={(open, details) => { if (!open) { if (ocupado.current || cambios.current.dirty) details.cancel(); pedirCierre(); } }}>
    <DialogContent showCloseButton={!pending} className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>{editor.modo === "editar" ? "Editar" : editor.modo === "vencimiento" ? "Agregar vencimiento" : "Agregar a la agenda"}</DialogTitle><DialogDescription>Los campos con * son obligatorios.</DialogDescription></DialogHeader>
      {editor.modo === "editar" ? <Edicion entrada={editor.entrada} {...props} /> : <Formulario inicial={agendaFormInicial(editor.modo === "vencimiento", editor.contexto)} vencimientoManual={editor.modo === "vencimiento"} {...props} />}
      <Dialog open={confirmar} onOpenChange={setConfirmar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{entradaCreada ? "¿Cerrar con avisos pendientes?" : "¿Descartar los cambios?"}</DialogTitle><DialogDescription>{entradaCreada ? "Lo guardado se conserva. Los avisos que faltan no se agregarán si cerrás ahora." : "Tenés cambios sin guardar. Si cerrás ahora, se perderán."}</DialogDescription></DialogHeader>
          <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => setConfirmar(false)}>Seguir en el formulario</Button><Button type="button" variant="destructive" onClick={() => { if (entradaCreada) onSaved(); else onClose(); }}>{entradaCreada ? "Cerrar" : "Descartar cambios"}</Button></div>
        </DialogContent>
      </Dialog>
    </DialogContent>
  </Dialog>;
}
