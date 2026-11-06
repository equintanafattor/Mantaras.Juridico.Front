"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Repeat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCambiarEstadoAgenda } from "../hooks/useAgenda";
import { cuandoAgenda, estaAbierta, situacionAgenda } from "../lib/situacionAgenda";
import type { EntradaAgendaListadoResponse, EstadoEntradaAgenda, RelacionAgendaResponse } from "../types/types";
import { EstadoEtiqueta, PrioridadEtiqueta, SituacionEtiqueta } from "./AgendaEtiquetas";

const RUTAS = { clientes: "/clientes", casos: "/casos", expedientes: "/expedientes" } as const;
const ENLACE = "rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring";

export function RelacionesAgenda({ entrada, className }: { entrada: Pick<EntradaAgendaListadoResponse, "clientes" | "casos" | "expedientes">; className?: string }) {
  const items: { ruta: string; item: RelacionAgendaResponse; tipo: string }[] = [
    ...entrada.clientes.map(item => ({ ruta: RUTAS.clientes, item, tipo: "Cliente" })),
    ...entrada.casos.map(item => ({ ruta: RUTAS.casos, item, tipo: "Expediente administrativo" })),
    ...entrada.expedientes.map(item => ({ ruta: RUTAS.expedientes, item, tipo: "Expediente judicial" })),
  ];
  if (items.length === 0) return null;
  return <ul className={cn("flex flex-wrap gap-x-3 gap-y-1 text-xs", className)} aria-label="Relacionado con">
    {items.map(({ ruta, item, tipo }) => <li key={`${ruta}-${item.id}`} className="min-w-0"><Link href={`${ruta}/${item.id}`} className={cn(ENLACE, "break-words")} title={tipo}><span className="sr-only">{tipo}: </span>{item.nombre}</Link></li>)}
  </ul>;
}

export default function AgendaEntradaItem({ entrada, hoy, onDetail, onCompletar, completando = false, mostrarFecha = true }: {
  entrada: EntradaAgendaListadoResponse; hoy: string; onDetail: () => void; onCompletar?: () => void; completando?: boolean; mostrarFecha?: boolean;
}) {
  const situacion = situacionAgenda(entrada, hoy);
  const abierta = estaAbierta(entrada.estado);
  return <article className="flex min-w-0 flex-col gap-3 bg-card p-4 sm:flex-row sm:items-start sm:gap-4">
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {situacion.condicion ? <SituacionEtiqueta situacion={situacion} /> : null}
        <EstadoEtiqueta estado={entrada.estado} />
        <PrioridadEtiqueta prioridad={entrada.prioridad} />
      </div>
      <h3 className="break-words font-medium leading-6">
        <button type="button" onClick={onDetail} className="rounded-sm text-left underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{entrada.titulo}</button>
      </h3>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {mostrarFecha ? <span>{cuandoAgenda(entrada, hoy)}</span> : null}
        {mostrarFecha ? <span aria-hidden="true">·</span> : null}
        <span>{entrada.tipoEntradaNombre}</span>
        {entrada.recurrenciaAgendaId ? <span className="inline-flex items-center gap-1"><Repeat className="size-3.5" aria-hidden="true" />Se repite</span> : null}
        {entrada.responsables.length > 0 ? <><span aria-hidden="true">·</span><span className="break-words">{entrada.responsables.map(item => item.nombre).join(", ")}</span></> : null}
      </p>
      <RelacionesAgenda entrada={entrada} />
    </div>
    {abierta && onCompletar ? <Button type="button" variant="outline" size="sm" className="self-start" disabled={completando} onClick={onCompletar} aria-label={`Completar: ${entrada.titulo}`}>
      <Check />{completando ? "Guardando…" : "Completar"}
    </Button> : null}
  </article>;
}

type AvisoAccion = { tipo: "ok" | "error"; texto: string; deshacer?: { id: number; estado: EstadoEntradaAgenda } };

// "Completar" desde una lista, con opción de deshacer y mensaje claro si falla.
export function useCompletarAgenda() {
  const mutation = useCambiarEstadoAgenda();
  const [aviso, setAviso] = useState<AvisoAccion>();
  const [pendienteId, setPendienteId] = useState<number>();

  async function completar(entrada: Pick<EntradaAgendaListadoResponse, "entradaAgendaId" | "titulo" | "estado">) {
    if (pendienteId !== undefined) return;
    setPendienteId(entrada.entradaAgendaId); setAviso(undefined);
    try {
      await mutation.mutateAsync({ id: entrada.entradaAgendaId, request: { estado: "Completada" } });
      setAviso({ tipo: "ok", texto: `Completada: «${entrada.titulo}».`, deshacer: { id: entrada.entradaAgendaId, estado: "Pendiente" } });
    } catch (err) {
      setAviso({ tipo: "error", texto: `No pudimos completar «${entrada.titulo}». ${err instanceof Error ? err.message : "Probá de nuevo en unos segundos."}` });
    } finally { setPendienteId(undefined); }
  }

  async function deshacer() {
    const objetivo = aviso?.deshacer;
    if (!objetivo || pendienteId !== undefined) return;
    setPendienteId(objetivo.id);
    try {
      await mutation.mutateAsync({ id: objetivo.id, request: { estado: objetivo.estado } });
      setAviso({ tipo: "ok", texto: "Se volvió a abrir como pendiente." });
    } catch (err) {
      setAviso({ tipo: "error", texto: `No pudimos deshacer. ${err instanceof Error ? err.message : ""}`.trim() });
    } finally { setPendienteId(undefined); }
  }

  const elemento = aviso ? <div role={aviso.tipo === "error" ? "alert" : "status"} className={cn("flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm", aviso.tipo === "error" ? "border-destructive/40 text-destructive" : "bg-muted/40")}>
    <span className="min-w-0 flex-1 break-words">{aviso.texto}</span>
    {aviso.deshacer ? <Button type="button" variant="outline" size="sm" disabled={pendienteId !== undefined} onClick={() => void deshacer()}>Deshacer</Button> : null}
    <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar mensaje" onClick={() => setAviso(undefined)}><X /></Button>
  </div> : null;

  return { completar, pendienteId, aviso: elemento };
}
