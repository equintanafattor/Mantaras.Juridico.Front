"use client";

import Link from "next/link";
import { useState } from "react";
import AgendaDetalleDialog from "@/features/agenda/components/AgendaDetalleDialog";
import AgendaFormDialog, { type EditorAgenda } from "@/features/agenda/components/AgendaFormDialog";
import type { ResumenEntradaAgenda } from "@/features/agenda/types/types";
import AgendaResumenPanel from "./AgendaResumenPanel";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Files,
  UsersRound,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { usePanelResumen } from "../hooks/usePanelResumen";
import type {
  ActividadRecienteResponse,
  PanelResumenResponse,
} from "../types/types";

const modulos = [
  {
    href: "/clientes",
    titulo: "Clientes",
    descripcion: "Personas activas",
    icon: UsersRound,
    obtenerCantidad: (data: PanelResumenResponse) =>
      data.metricas.clientesActivos,
  },
  {
    href: "/casos",
    titulo: "Expedientes administrativos",
    descripcion: "Asuntos activos",
    icon: BriefcaseBusiness,
    obtenerCantidad: (data: PanelResumenResponse) => data.metricas.casosActivos,
  },
  {
    href: "/expedientes",
    titulo: "Expedientes judiciales",
    descripcion: "Expedientes judiciales activos",
    icon: Files,
    obtenerCantidad: (data: PanelResumenResponse) =>
      data.metricas.expedientesActivos,
  },
];

function formatearFechaHora(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

function PanelSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-md" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>

              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,1fr)]">
        <div className="rounded-lg border bg-card">
          <div className="border-b p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>

          <div className="divide-y px-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 py-4">
                <Skeleton className="size-9 shrink-0 rounded-md" />

                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="min-h-52 rounded-lg" />
      </section>
    </div>
  );
}

function ModulosResumen({ data }: { data: PanelResumenResponse }) {
  return (
    <section
      aria-label="Resumen del estudio"
      className="grid gap-3 md:grid-cols-3"
    >
      {modulos.map((modulo) => {
        const Icon = modulo.icon;
        const cantidad = modulo.obtenerCantidad(data);

        return (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="group rounded-lg border bg-card p-5 transition-colors hover:border-primary/35 hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Icon className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">{modulo.titulo}</h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {modulo.descripcion}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl font-semibold tracking-tight text-primary">
                  {cantidad}
                </span>

                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

function ActividadItem({
  actividad,
}: {
  actividad: ActividadRecienteResponse;
}) {
  const esCaso = actividad.tipo === "Caso";
  const Icon = esCaso ? BriefcaseBusiness : FileText;
  const href = esCaso ? "/casos" : "/expedientes";

  return (
    <article>
      <Link
        href={href}
        className="group flex items-start gap-3 py-4 focus-visible:outline-none"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground">
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 text-sm font-medium leading-5 group-hover:text-primary">
              {actividad.titulo}
            </h3>

            <Badge
              variant="outline"
              className="h-5 rounded-sm bg-background px-1.5 text-[10px] font-medium text-muted-foreground"
            >
              {esCaso ? "Expediente administrativo" : "Expediente judicial"}
            </Badge>
          </div>

          {actividad.referencia && (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {actividad.referencia}
            </p>
          )}

          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {formatearFechaHora(actividad.fechaActividad)}
          </p>
        </div>

        <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </article>
  );
}

function ActividadReciente({
  actividades,
}: {
  actividades: ActividadRecienteResponse[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="border-b px-5 py-4 sm:px-6">
        <h2 className="font-semibold">Actividad reciente</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Últimos cambios registrados en expedientes administrativos y expedientes judiciales.
        </p>
      </header>

      {actividades.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock3 className="size-4" />
          </span>

          <p className="mt-3 text-sm font-medium">
            Todavía no hay actividad para mostrar
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Los cambios realizados aparecerán en este espacio.
          </p>
        </div>
      ) : (
        <div className="divide-y px-5 sm:px-6">
          {actividades.map((actividad) => (
            <ActividadItem
              key={`${actividad.tipo}-${actividad.expedienteId ?? actividad.casoId}`}
              actividad={actividad}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function PanelScreen() {
  const panelQuery = usePanelResumen();
  const [detalle, setDetalle] = useState<ResumenEntradaAgenda>();
  const [editor, setEditor] = useState<EditorAgenda>();
  const [mensaje, setMensaje] = useState<string>();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
          Panel principal
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Gestión del estudio jurídico
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Consultá el estado general del estudio y accedé a la actividad más
          reciente.
        </p>
        <Button className="mt-4" variant="outline" disabled={panelQuery.isFetching} onClick={() => void panelQuery.refetch()}><RotateCcw className={panelQuery.isFetching ? "animate-spin" : undefined} />Actualizar resumen</Button>
      </section>
      {mensaje ? <p role="status" className="text-sm text-muted-foreground">{mensaje}</p> : null}
      {detalle ? <AgendaDetalleDialog key={detalle.entradaAgendaId} entrada={detalle} onClose={() => setDetalle(undefined)} onEdit={(entrada) => { setDetalle(undefined); setEditor({ modo: "editar", entrada }); }} /> : null}
      {editor ? <AgendaFormDialog editor={editor} onClose={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setMensaje("Entrada de agenda guardada."); }} /> : null}

      {panelQuery.isLoading ? (
        <PanelSkeleton />
      ) : panelQuery.isError ? (
        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No pudimos cargar el resumen</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {panelQuery.error instanceof Error
              ? panelQuery.error.message
              : "Ocurrió un error al consultar la información del panel."}
          </p>

          <Button
            variant="outline"
            className="mt-5"
            onClick={() => panelQuery.refetch()}
          >
            Reintentar
          </Button>
        </section>
      ) : panelQuery.data ? (
        <div
          className={
            panelQuery.isFetching
              ? "space-y-6 opacity-70 transition-opacity"
              : "space-y-6 transition-opacity"
          }
        >
          <ModulosResumen data={panelQuery.data} />

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,1fr)]">
            <ActividadReciente
              actividades={panelQuery.data.actividadReciente}
            />

            <AgendaResumenPanel agenda={panelQuery.data.agenda} onSelect={setDetalle} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
