"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAgendaCalendario } from "../hooks/useAgendaCalendario";
import { useEntradaAgenda } from "../hooks/useAgenda";
import { agruparEntradasCalendario, diasCalendario, type ElementoCalendario } from "../lib/calendarioAgenda";
import { rangoCalendarioFiltrado, type FiltrosAgenda } from "../lib/filtrosAgenda";
import { mostrarFechaAgenda } from "../lib/periodoAgenda";
import type { EntradaAgendaListadoResponse } from "../types/types";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function Elemento({ elemento, onSelect }: { elemento: ElementoCalendario; onSelect: () => void }) {
  const { entrada, esVencimiento } = elemento;
  const hora = esVencimiento ? entrada.horaVencimiento : entrada.horaInicio;
  return (
    <button type="button" onClick={onSelect} title={`${esVencimiento ? "Vencimiento: " : ""}${entrada.titulo}`} className={cn("w-full min-w-0 rounded-md border-l-2 px-2 py-1 text-left text-xs focus-visible:outline-2 focus-visible:outline-ring", esVencimiento ? "border-destructive bg-destructive/10 text-foreground" : "border-primary bg-primary/10 text-foreground")}>
      <span className="block text-[10px] font-medium">{esVencimiento ? "Vence" : "Evento"}{hora ? ` · ${hora.slice(0, 5)}` : ""}</span>
      <span className="block truncate">{entrada.titulo}</span>
    </button>
  );
}

function DetalleCalendario({ entrada, onClose, onEdit }: { entrada?: EntradaAgendaListadoResponse; onClose: () => void; onEdit: (entrada: EntradaAgendaListadoResponse) => void }) {
  const detalle = useEntradaAgenda(entrada?.entradaAgendaId);
  return (
    <Dialog open={entrada !== undefined} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-6 break-words">{entrada?.titulo ?? "Detalle de Agenda"}</DialogTitle>
          <DialogDescription>{entrada?.tipoEntradaNombre}</DialogDescription>
        </DialogHeader>
        {detalle.isPending ? <Skeleton className="h-40 w-full" /> : detalle.isError ? (
          <div role="alert"><p>{detalle.error.message}</p><Button className="mt-3" variant="outline" onClick={() => void detalle.refetch()}>Reintentar</Button></div>
        ) : detalle.data ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2"><Badge variant="outline">{detalle.data.estado === "EnCurso" ? "En curso" : detalle.data.estado}</Badge><Badge variant="secondary">{detalle.data.prioridad}</Badge></div>
            {detalle.data.descripcion ? <p className="whitespace-pre-wrap break-words text-sm">{detalle.data.descripcion}</p> : null}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Inicio</dt><dd>{mostrarFechaAgenda(detalle.data.fechaInicio)}{detalle.data.horaInicio ? ` · ${detalle.data.horaInicio.slice(0, 5)}` : " · Sin hora"}</dd></div>
              {detalle.data.fechaFin ? <div><dt className="text-muted-foreground">Fin</dt><dd>{mostrarFechaAgenda(detalle.data.fechaFin)}{detalle.data.horaFin ? ` · ${detalle.data.horaFin.slice(0, 5)}` : ""}</dd></div> : null}
              {detalle.data.fechaVencimiento ? <div><dt className="text-muted-foreground">Vencimiento</dt><dd>{mostrarFechaAgenda(detalle.data.fechaVencimiento)}{detalle.data.horaVencimiento ? ` · ${detalle.data.horaVencimiento.slice(0, 5)}` : " · Sin hora"}</dd></div> : null}
            </dl>
            {entrada?.responsables.length ? <p className="text-sm">Responsables: {entrada.responsables.map((item) => item.nombre).join(", ")}</p> : null}
            <div className="flex flex-col gap-2">
              {entrada?.clientes.map((item) => <Link key={`cliente-${item.id}`} href={`/clientes/${item.id}`} className="text-sm text-primary hover:underline">Cliente: {item.nombre}</Link>)}
              {entrada?.casos.map((item) => <Link key={`caso-${item.id}`} href={`/casos/${item.id}`} className="text-sm text-primary hover:underline">Expediente administrativo: {item.nombre}</Link>)}
              {entrada?.expedientes.map((item) => <Link key={`expediente-${item.id}`} href={`/expedientes/${item.id}`} className="text-sm text-primary hover:underline">Expediente judicial: {item.nombre}</Link>)}
            </div>
            <p className="text-xs text-muted-foreground">Horarios de Argentina.</p>
            {entrada ? <Button variant="outline" onClick={() => { onClose(); onEdit(entrada); }}>Editar entrada</Button> : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function AgendaCalendario({ mes, filtros, onEdit }: { mes: string; filtros: FiltrosAgenda; onEdit: (entrada: EntradaAgendaListadoResponse) => void }) {
  const agenda = useAgendaCalendario(mes, filtros);
  const rango = rangoCalendarioFiltrado(mes, filtros);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>();
  const [entradaSeleccionada, setEntradaSeleccionada] = useState<EntradaAgendaListadoResponse>();
  const dias = diasCalendario(mes);
  const porDia = agruparEntradasCalendario(dias.map((dia) => ({ ...dia, valido: dia.valido && rango !== null && dia.fecha >= rango.desde && dia.fecha <= rango.hasta })), agenda.data ?? []);

  function seleccionarEntrada(entrada: EntradaAgendaListadoResponse) {
    setDiaSeleccionado(undefined);
    setEntradaSeleccionada(entrada);
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
        <p className="text-sm text-muted-foreground">Eventos en su fecha de inicio y duración; vencimientos en su fecha límite.</p>
        <Button variant="outline" disabled={agenda.isFetching || rango === null} onClick={() => void agenda.refetch()}><RotateCcw className={agenda.isFetching ? "animate-spin" : undefined} />Actualizar calendario</Button>
      </div>
      {(agenda.data?.length ?? 0) === 0 ? <p role="status" className="text-sm text-muted-foreground">No hay entradas para los filtros y el mes seleccionado.</p> : null}
      <div className="overflow-x-auto rounded-lg border bg-card" tabIndex={0} aria-label="Grilla del calendario, desplazable horizontalmente">
        <div className="min-w-[700px]" aria-busy={agenda.isFetching}>
          <div className="grid grid-cols-7 border-b bg-muted/40">{DIAS.map((dia) => <div key={dia} className="px-3 py-2 text-center text-xs font-semibold">{dia}</div>)}</div>
          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              const elementos = porDia.get(dia.fecha) ?? [];
              return (
                <div key={dia.fecha} className={cn("min-h-36 min-w-0 border-b border-r p-2", !dia.enMes && "bg-muted/30")}>
                  <time dateTime={dia.valido ? dia.fecha : undefined} className={cn("mb-2 block text-sm font-medium", !dia.enMes && "text-muted-foreground")}>{dia.numero}</time>
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
          <DialogHeader><DialogTitle>{diaSeleccionado ? mostrarFechaAgenda(diaSeleccionado) : "Entradas del día"}</DialogTitle><DialogDescription>Seleccioná una entrada para ver su detalle.</DialogDescription></DialogHeader>
          <div className="space-y-2">{(porDia.get(diaSeleccionado ?? "") ?? []).map((elemento) => <Elemento key={elemento.entrada.entradaAgendaId} elemento={elemento} onSelect={() => seleccionarEntrada(elemento.entrada)} />)}</div>
        </DialogContent>
      </Dialog>
      <DetalleCalendario onEdit={onEdit} entrada={entradaSeleccionada} onClose={() => setEntradaSeleccionada(undefined)} />
    </section>
  );
}
