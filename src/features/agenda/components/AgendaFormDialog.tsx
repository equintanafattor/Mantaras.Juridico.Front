"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { obtenerEntradaAgenda } from "../api/agendaApi";
import { agendaKeys } from "../hooks/agendaKeys";
import { useActualizarEntradaAgenda, useCrearEntradaAgenda, useCrearVencimientoManual } from "../hooks/useAgenda";
import { useOpcionesAgenda } from "../hooks/useOpcionesAgenda";
import { agendaFormDesdeEntrada, agendaFormInicial, requestDesdeAgendaForm, type AgendaForm } from "../lib/agendaForm";
import type { EntradaAgendaListadoResponse } from "../types/types";
import AgendaFormFields from "./AgendaFormFields";

export type EditorAgenda = { modo: "entrada" | "vencimiento" } | { modo: "editar"; entrada: EntradaAgendaListadoResponse };
function Formulario({ inicial, id, vencimientoManual, onClose, onPending, onSaved }: { inicial: AgendaForm; id?: number; vencimientoManual: boolean; onClose: () => void; onPending: (value: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = useState(inicial);
  const [error, setError] = useState<string>();
  const crear = useCrearEntradaAgenda(); const vencimiento = useCrearVencimientoManual(); const editar = useActualizarEntradaAgenda();
  const opciones = useOpcionesAgenda();
  const pending = crear.isPending || vencimiento.isPending || editar.isPending;
  return <form className="space-y-4" onSubmit={async e => {
    e.preventDefault(); if (pending) return; setError(undefined);
    try {
      const request = requestDesdeAgendaForm(form, vencimientoManual);
      if (!opciones.data?.tiposEntrada.some(x => x.id === request.tipoEntradaAgendaId && x.activo)) throw new Error("Seleccioná un tipo de entrada activo.");
      if (request.responsableIds.some(id => !opciones.data?.responsables.some(x => x.id === id && x.activo))) throw new Error("Quitá los responsables inactivos o no disponibles.");
      onPending(true);
      if (id !== undefined) await editar.mutateAsync({ id, request });
      else if (vencimientoManual) await vencimiento.mutateAsync(request);
      else await crear.mutateAsync(request);
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos guardar la entrada."); }
    finally { onPending(false); }
  }}>
    <fieldset disabled={pending} className="min-w-0"><AgendaFormFields form={form} vencimientoManual={vencimientoManual} onChange={next => { setForm(next); setError(undefined); }} /></fieldset>
    {error ? <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{error}</p> : null}
    <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-popover py-3"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={pending || !opciones.data}>{pending ? "Guardando…" : id !== undefined ? "Guardar cambios" : vencimientoManual ? "Crear vencimiento" : "Crear entrada"}</Button></div>
  </form>;
}
function Edicion({ entrada, ...props }: { entrada: EntradaAgendaListadoResponse; onClose: () => void; onPending: (value: boolean) => void; onSaved: () => void }) {
  const detalle = useQuery({ queryKey: agendaKeys.entrada(entrada.entradaAgendaId), queryFn: ({ signal }) => obtenerEntradaAgenda(entrada.entradaAgendaId, signal), refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false });
  if (detalle.isPending || detalle.isFetching) return <Skeleton className="h-64 w-full" aria-label="Cargando entrada para editar" />;
  if (detalle.isError) return <div role="alert"><p>{detalle.error.message}</p><Button variant="outline" onClick={() => void detalle.refetch()}>Reintentar</Button></div>;
  return <Formulario inicial={agendaFormDesdeEntrada(detalle.data, entrada)} id={entrada.entradaAgendaId} vencimientoManual={false} {...props} />;
}
export default function AgendaFormDialog({ editor, onClose, onSaved }: { editor: EditorAgenda; onClose: () => void; onSaved: () => void }) {
  const [pending, setPending] = useState(false);
  const props = { onClose, onSaved, onPending: setPending };
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent showCloseButton={!pending} className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>{editor.modo === "editar" ? "Editar entrada" : editor.modo === "vencimiento" ? "Nuevo vencimiento manual" : "Nueva entrada de agenda"}</DialogTitle><DialogDescription>Completá los datos y las asociaciones. Los campos con * son obligatorios.</DialogDescription></DialogHeader>
      {editor.modo === "editar" ? <Edicion entrada={editor.entrada} {...props} /> : <Formulario inicial={agendaFormInicial(editor.modo === "vencimiento")} vencimientoManual={editor.modo === "vencimiento"} {...props} />}
    </DialogContent>
  </Dialog>;
}
