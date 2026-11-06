"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAgendaCalendario } from "../hooks/useAgendaCalendario";
import { agruparEntradasCalendario, diasCalendario, type ElementoCalendario } from "../lib/calendarioAgenda";
import { rangoCalendarioFiltrado, type FiltrosAgenda } from "../lib/filtrosAgenda";
import { mostrarFechaAgenda } from "../lib/periodoAgenda";
import { estaAbierta, mostrarFechaCorta } from "../lib/situacionAgenda";
import { fechaHoyAgenda } from "../lib/agendaForm";
import type { EntradaAgendaListadoResponse } from "../types/types";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function Elemento({ elemento, onSelect }: { elemento: ElementoCalendario; onSelect: () => void }) {
  const { entrada, esVencimiento } = elemento;
  const hora = esVencimiento ? entrada.horaVencimiento : entrada.horaInicio;
  const cerrada = !estaAbierta(entrada.estado);
  const Icono = cerrada ? CheckCircle2 : (entrada.estaVencida && esVencimiento) || entrada.estaAtrasada ? AlertTriangle : esVencimiento ? CalendarClock : null;
  const etiqueta = cerrada ? (entrada.estado === "Completada" ? "Completada" : "Cancelada") : esVencimiento ? (entrada.estaVencida ? "Vencida" : "Vence") : entrada.estaAtrasada ? "Atrasada" : null;
  return (
    <button type="button" onClick={onSelect} title={`${etiqueta ? `${etiqueta}: ` : ""}${entrada.titulo}`} className={cn("w-full min-w-0 rounded-md border-l-2 px-2 py-1 text-left text-xs focus-visible:outline-2 focus-visible:outline-ring", cerrada ? "border-muted-foreground/40 bg-muted text-muted-foreground" : esVencimiento || entrada.estaAtrasada ? "border-destructive bg-destructive/10 text-foreground" : "border-primary bg-primary/10 text-foreground")}>
      {etiqueta || hora ? <span className="flex items-center gap-1 text-[10px] font-medium">{Icono ? <Icono className="size-3" aria-hidden="true" /> : null}{etiqueta}{etiqueta && hora ? " · " : ""}{hora ? hora.slice(0, 5) : ""}</span> : null}
      <span className={cn("block truncate", cerrada && "line-through")}>{entrada.titulo}</span>
    </button>
  );
}

export default function AgendaCalendario({ mes, filtros, onDetail }: { mes: string; filtros: FiltrosAgenda; onDetail: (entrada: EntradaAgendaListadoResponse) => void }) {
  const agenda = useAgendaCalendario(mes, filtros);
  const rango = rangoCalendarioFiltrado(mes, filtros);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>();
  const hoy = fechaHoyAgenda();
  const dias = diasCalendario(mes);
  const porDia = agruparEntradasCalendario(dias.map((dia) => ({ ...dia, valido: dia.valido && rango !== null && dia.fecha >= rango.desde && dia.fecha <= rango.hasta })), agenda.data ?? []);

  function seleccionarEntrada(entrada: EntradaAgendaListadoResponse) {
    setDiaSeleccionado(undefined);
    onDetail(entrada);
  }

  if (rango !== null && agenda.isPending) return <Skeleton aria-label="Cargando calendario" className="h-96 w-full" />;
  if (agenda.isError) return (
    <div role="alert" className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2 font-medium"><AlertCircle className="size-5 text-destructive" />No pudimos cargar el calendario</div>
      <p className="mt-2 text-sm text-muted-foreground">{agenda.error.message}</p>
      <Button className="mt-4" variant="outline" disabled={agenda.isFetching} onClick={() => void agenda.refetch()}>Reintentar</Button>
    </div>
  );

  return (
    <section aria-label="Calendario mensual" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Los vencimientos se muestran el día en que vencen.</p>
        <Button variant="outline" disabled={agenda.isFetching || rango === null} onClick={() => void agenda.refetch()}><RotateCcw className={agenda.isFetching ? "animate-spin" : undefined} />Actualizar</Button>
      </div>
      {(agenda.data?.length ?? 0) === 0 ? <p role="status" className="text-sm text-muted-foreground">No hay nada agendado en este mes.</p> : null}
      {/* En celular: lista de los días que tienen algo. */}
      <ol className="space-y-3 sm:hidden" aria-label="Días del mes con actividad">
        {dias.filter(dia => dia.enMes && (porDia.get(dia.fecha)?.length ?? 0) > 0).map(dia => <li key={dia.fecha} className="rounded-lg border bg-card p-3">
          <h3 className={cn("mb-2 text-sm font-semibold capitalize", dia.fecha === hoy && "text-primary")}><time dateTime={dia.fecha}>{mostrarFechaCorta(dia.fecha, hoy)}</time>{dia.fecha === hoy ? " · Hoy" : ""}</h3>
          <div className="space-y-1">{(porDia.get(dia.fecha) ?? []).map(elemento => <Elemento key={`${elemento.entrada.entradaAgendaId}-${elemento.esVencimiento}`} elemento={elemento} onSelect={() => seleccionarEntrada(elemento.entrada)} />)}</div>
        </li>)}
      </ol>
      <div className="hidden overflow-x-auto rounded-lg border bg-card sm:block" tabIndex={0} aria-label="Calendario del mes">
        <div className="min-w-[700px]" aria-busy={agenda.isFetching}>
          <div className="grid grid-cols-7 border-b bg-muted/40">{DIAS.map((dia) => <div key={dia} className="px-3 py-2 text-center text-xs font-semibold">{dia}</div>)}</div>
          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              const elementos = porDia.get(dia.fecha) ?? [];
              return (
                <div key={dia.fecha} className={cn("min-h-36 min-w-0 border-b border-r p-2", !dia.enMes && "bg-muted/30")}>
                  <time dateTime={dia.valido ? dia.fecha : undefined} aria-current={dia.fecha === hoy ? "date" : undefined} className={cn("mb-2 inline-flex size-6 items-center justify-center rounded-full text-sm font-medium", !dia.enMes && "text-muted-foreground", dia.fecha === hoy && "bg-primary text-primary-foreground")}>{dia.numero}</time>
                  <div className="space-y-1">{elementos.slice(0, 3).map((elemento) => <Elemento key={elemento.entrada.entradaAgendaId} elemento={elemento} onSelect={() => seleccionarEntrada(elemento.entrada)} />)}</div>
                  {elementos.length > 3 ? <button type="button" className="mt-2 rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring" aria-label={`Ver los ${elementos.length} elementos del ${mostrarFechaAgenda(dia.fecha)}`} onClick={() => setDiaSeleccionado(dia.fecha)}>+{elementos.length - 3} más</button> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Dialog open={diaSeleccionado !== undefined} onOpenChange={(open) => { if (!open) setDiaSeleccionado(undefined); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{diaSeleccionado ? mostrarFechaAgenda(diaSeleccionado) : "Del día"}</DialogTitle><DialogDescription>Elegí uno para ver el detalle.</DialogDescription></DialogHeader>
          <div className="space-y-2">{(porDia.get(diaSeleccionado ?? "") ?? []).map((elemento) => <Elemento key={elemento.entrada.entradaAgendaId} elemento={elemento} onSelect={() => seleccionarEntrada(elemento.entrada)} />)}</div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
