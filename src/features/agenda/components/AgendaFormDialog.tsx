"use client";

import { useEffect, useRef, useState } from "react";
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
import { requestDesdeRecordatorioForm } from "../lib/recordatorioForm";
import type { ContextoAgenda } from "../lib/agendaContexto";
import type { CrearRecordatorioAgendaRequest, ResumenEntradaAgenda } from "../types/types";
import AgendaFormFields from "./AgendaFormFields";
import AgendaRecordatoriosAlta from "./AgendaRecordatoriosAlta";

export type EditorAgenda = { modo: "entrada" | "vencimiento"; contexto?: ContextoAgenda } | { modo: "editar"; entrada: ResumenEntradaAgenda };
type FormEvents = { onClose: () => void; onPending: (value: boolean) => void; onSaved: () => void; onChanges: (dirty: boolean, entradaCreada: boolean) => void };

function Formulario({ inicial, id, vencimientoManual, onClose, onPending, onSaved, onChanges }: FormEvents & { inicial: AgendaForm; id?: number; vencimientoManual: boolean }) {
  const [original] = useState(inicial);
  const [form, setForm] = useState(inicial);
  const [recordatorios, setRecordatorios] = useState<CrearRecordatorioAgendaRequest[]>([]);
  const [draftDirty, setDraftDirty] = useState(false);
  const [progreso, setProgreso] = useState<ProgresoGuardadoAgenda>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const opciones = useOpcionesAgenda();
  const invalidar = useInvalidarAgenda();
  const entradaGuardada = progreso?.entradaId !== undefined;

  function informar(nextForm: AgendaForm, nextRecordatorios: CrearRecordatorioAgendaRequest[], nextDraft: boolean) {
    onChanges(JSON.stringify(nextForm) !== JSON.stringify(original) || nextRecordatorios.length > 0 || nextDraft, false);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault(); if (lock.current) return; setError(undefined);
    let ultimo: ProgresoGuardadoAgenda = progreso ?? { pendientes: recordatorios };
    let completo = false;
    try {
      // Tras un guardado parcial, sólo se reintentan los recordatorios pendientes.
      const request = entradaGuardada ? undefined : requestDesdeAgendaForm(form, vencimientoManual);
      if (request) {
        if (!opciones.data?.tiposEntrada.some(x => x.id === request.tipoEntradaAgendaId && x.activo)) throw new Error("Seleccioná un tipo de entrada activo.");
        if (request.responsableIds.some(id => !opciones.data?.responsables.some(x => x.id === id && x.activo))) throw new Error("Quitá los responsables inactivos o no disponibles.");
        if (draftDirty) throw new Error("Agregá el aviso a la lista o restablecé su borrador antes de guardar.");
        for (const item of recordatorios) requestDesdeRecordatorioForm(item.baseCalculo, String(item.minutosAnticipacion), "Minutos", !!request.fechaVencimiento);
      }
      lock.current = true; setPending(true); onPending(true);
      await guardarAgendaConRecordatorios(ultimo, () => id !== undefined ? actualizarEntradaAgenda(id, request!) : vencimientoManual ? crearVencimientoManual(request!) : crearEntradaAgenda(request!), crearRecordatorioAgenda, next => {
        ultimo = next; setProgreso(next); onChanges(next.pendientes.length > 0, id === undefined);
      });
      completo = true;
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos guardar la entrada."); }
    finally {
      if (ultimo.entradaId !== undefined) {
        try { await invalidar(); }
        catch { completo = false; setError("Los datos se guardaron, pero no pudimos actualizar la consulta. Reintentá para actualizarla."); }
      }
      lock.current = false; setPending(false); onPending(false);
    }
    if (completo) onSaved();
  }

  return <form className="space-y-4" onSubmit={guardar}>
    <fieldset disabled={pending || entradaGuardada} className="min-w-0 space-y-4">
      <AgendaFormFields form={form} vencimientoManual={vencimientoManual} onChange={next => { setForm(next); setError(undefined); informar(next, recordatorios, draftDirty); }} />
      {id === undefined ? <AgendaRecordatoriosAlta items={recordatorios} tieneVencimiento={!!form.fechaVencimiento} onChange={(next, resetDraft) => { setRecordatorios(next); if (resetDraft) setDraftDirty(false); setError(undefined); informar(form, next, resetDraft ? false : draftDirty); }} onDraftChange={dirty => { setDraftDirty(dirty); informar(form, recordatorios, dirty); }} /> : <p className="text-sm text-muted-foreground">Podés consultar y agregar recordatorios desde el detalle de la entrada.</p>}
    </fieldset>
    {entradaGuardada && progreso.pendientes.length > 0 ? <p role="status" className="rounded-md border p-3 text-sm">La entrada #{progreso.entradaId} ya se guardó. Quedan {progreso.pendientes.length} recordatorios por guardar. Reintentá para continuar con esos avisos.</p> : null}
    {error ? <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{error}</p> : null}
    <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-popover py-3"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>{entradaGuardada ? "Cerrar" : "Cancelar"}</Button><Button type="submit" disabled={pending || !entradaGuardada && !opciones.data}>{pending ? "Guardando…" : entradaGuardada ? "Reintentar guardado" : id !== undefined ? "Guardar cambios" : vencimientoManual ? "Crear vencimiento" : "Crear entrada"}</Button></div>
  </form>;
}

function Edicion({ entrada, ...props }: FormEvents & { entrada: ResumenEntradaAgenda }) {
  const detalle = useQuery({ queryKey: agendaKeys.entrada(entrada.entradaAgendaId), queryFn: ({ signal }) => obtenerEntradaAgenda(entrada.entradaAgendaId, signal), refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false });
  if (detalle.isPending || detalle.isFetching && !detalle.isFetchedAfterMount) return <Skeleton className="h-64 w-full" aria-label="Cargando entrada para editar" />;
  if (!detalle.data) return <div role="alert"><p>{detalle.error?.message ?? "No pudimos cargar la entrada."}</p><Button variant="outline" onClick={() => void detalle.refetch()}>Reintentar</Button></div>;
  return <Formulario inicial={agendaFormDesdeEntrada(detalle.data, entrada)} id={entrada.entradaAgendaId} vencimientoManual={false} {...props} />;
}

export default function AgendaFormDialog({ editor, onClose, onSaved }: { editor: EditorAgenda; onClose: () => void; onSaved: () => void }) {
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
  const props: FormEvents = { onClose: pedirCierre, onSaved, onPending: value => { ocupado.current = value; setPending(value); }, onChanges: (value, creada) => { cambios.current = { dirty: value, entradaCreada: creada }; setDirty(value); setEntradaCreada(creada); } };
  return <Dialog open onOpenChange={(open, details) => { if (!open) { if (ocupado.current || cambios.current.dirty) details.cancel(); pedirCierre(); } }}>
    <DialogContent showCloseButton={!pending} className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>{editor.modo === "editar" ? "Editar entrada" : editor.modo === "vencimiento" ? "Nuevo vencimiento manual" : "Nueva entrada de agenda"}</DialogTitle><DialogDescription>Completá los datos y las asociaciones. Los campos con * son obligatorios.</DialogDescription></DialogHeader>
      {editor.modo === "editar" ? <Edicion entrada={editor.entrada} {...props} /> : <Formulario inicial={agendaFormInicial(editor.modo === "vencimiento", editor.contexto)} vencimientoManual={editor.modo === "vencimiento"} {...props} />}
      <Dialog open={confirmar} onOpenChange={setConfirmar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{entradaCreada ? "¿Cerrar con avisos pendientes?" : "¿Descartar los cambios?"}</DialogTitle><DialogDescription>{entradaCreada ? "La entrada y los avisos ya guardados se conservan. Los recordatorios pendientes no se agregarán si cerrás ahora." : "Tenés cambios sin guardar. Si cerrás ahora, se perderán."}</DialogDescription></DialogHeader>
          <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => setConfirmar(false)}>Seguir en el formulario</Button><Button type="button" variant="destructive" onClick={() => { if (entradaCreada) onSaved(); else onClose(); }}>{entradaCreada ? "Cerrar" : "Descartar cambios"}</Button></div>
        </DialogContent>
      </Dialog>
    </DialogContent>
  </Dialog>;
}
