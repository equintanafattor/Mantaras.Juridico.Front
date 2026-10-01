"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { obtenerRecordatoriosPredeterminados, type OrigenRecordatoriosPredeterminados } from "../api/recordatoriosApi";
import { agendaKeys } from "../hooks/agendaKeys";
import { useGuardarRecordatoriosPredeterminados } from "../hooks/useRecordatoriosAgenda";
import { firmaPredeterminadosAgenda, requestPredeterminadosAgenda } from "../lib/configuracionAgenda";
import type { CrearRecordatorioAgendaRequest, RecordatorioPredeterminadoResponse } from "../types/types";
import AgendaRecordatoriosAlta from "./AgendaRecordatoriosAlta";
import AgendaConfiguracionDialog, { useEventosConfiguracionAgenda } from "./AgendaConfiguracionDialog";

export type DestinoPredeterminadosAgenda = { origen: OrigenRecordatoriosPredeterminados; id: number; nombre: string };
function Formulario({ destino, inicial, onSaved }: { destino: DestinoPredeterminadosAgenda; inicial: RecordatorioPredeterminadoResponse[]; onSaved: () => void }) {
  const { onClose, onDirty, onPending } = useEventosConfiguracionAgenda();
  const [original] = useState(() => inicial.filter(item => item.activo).map(({ baseCalculo, minutosAnticipacion }) => ({ baseCalculo, minutosAnticipacion })));
  const [items, setItems] = useState<CrearRecordatorioAgendaRequest[]>(original), [draft, setDraft] = useState(false), [error, setError] = useState<string>();
  const guardar = useGuardarRecordatoriosPredeterminados(), lock = useRef(false);
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); if (lock.current) return; setError(undefined);
    try {
      if (draft) throw new Error("Agregá el aviso a la lista o restablecé su borrador antes de guardar.");
      const request = requestPredeterminadosAgenda(items); lock.current = true; onPending(true);
      await guardar.mutateAsync({ ...destino, request }); onDirty(false); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos guardar la configuración."); }
    finally { lock.current = false; onPending(false); }
  }}>
    <fieldset disabled={guardar.isPending} className="min-w-0"><AgendaRecordatoriosAlta predeterminados items={items} tieneVencimiento onChange={(next, resetDraft) => { setItems(next); if (resetDraft) setDraft(false); setError(undefined); onDirty(firmaPredeterminadosAgenda(next) !== firmaPredeterminadosAgenda(original) || (!resetDraft && draft)); }} onDraftChange={value => { setDraft(value); onDirty(firmaPredeterminadosAgenda(items) !== firmaPredeterminadosAgenda(original) || value); }} /></fieldset>
    <p className="text-xs text-muted-foreground">Esta lista reemplaza la configuración de futuros avisos. Guardarla vacía desactiva los predeterminados de este origen. Los recordatorios de entradas existentes se conservan. Los avisos basados en vencimiento se generan sólo si la nueva entrada tiene esa fecha.</p>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={guardar.isPending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={guardar.isPending}>{guardar.isPending ? "Guardando…" : "Guardar configuración"}</Button></div>
  </form>;
}
function Carga({ destino, ...props }: { destino: DestinoPredeterminadosAgenda; onSaved: () => void }) {
  const consulta = useQuery({ queryKey: agendaKeys.predeterminados(destino.origen, destino.id), queryFn: ({ signal }) => obtenerRecordatoriosPredeterminados(destino.origen, destino.id, signal), refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false });
  if (consulta.isPending || consulta.isFetching && !consulta.isFetchedAfterMount) return <Skeleton className="h-48 w-full" aria-label="Cargando configuración" />;
  if (!consulta.data) return <div role="alert"><p>{consulta.error?.message}</p><Button variant="outline" onClick={() => void consulta.refetch()}>Reintentar</Button></div>;
  return <Formulario destino={destino} inicial={consulta.data} {...props} />;
}
export default function RecordatoriosPredeterminadosDialog({ destino, onClose, onSaved }: { destino: DestinoPredeterminadosAgenda; onClose: () => void; onSaved: () => void }) {
  return <AgendaConfiguracionDialog titulo="Recordatorios predeterminados" descripcion={`${destino.origen === "tipos-entrada" ? "Tipo" : "Regla"}: ${destino.nombre}`} onClose={onClose}><Carga destino={destino} onSaved={onSaved} /></AgendaConfiguracionDialog>;
}
