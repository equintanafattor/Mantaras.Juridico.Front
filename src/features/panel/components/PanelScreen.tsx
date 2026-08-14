"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Files,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { usePanelResumen } from "../hooks/usePanelResumen";
import type {
  ActividadRecienteResponse,
  PanelAlertasResponse,
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
    titulo: "Casos",
    descripcion: "Asuntos activos",
    icon: BriefcaseBusiness,
    obtenerCantidad: (data: PanelResumenResponse) => data.metricas.casosActivos,
  },
  {
    href: "/expedientes",
    titulo: "Expedientes",
    descripcion: "Expedientes activos",
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
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
              {actividad.tipo}
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
          Últimos cambios registrados en casos y expedientes.
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

function AlertasPanel({ alertas }: { alertas: PanelAlertasResponse }) {
  const alertasDisponibles = alertas.disponible;

  return (
    <section className="relative overflow-hidden rounded-lg border bg-card p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-sidebar-primary" />

      <div className="flex items-start justify-between gap-4">
        <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <BellRing className="size-[18px]" />
        </span>

        <Badge
          variant="outline"
          className="rounded-sm bg-background text-muted-foreground"
        >
          {alertasDisponibles
            ? `${alertas.totalPendientes} pendientes`
            : "Próximamente"}
        </Badge>
      </div>

      <h2 className="mt-5 font-semibold">Agenda y alertas</h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {alertasDisponibles
          ? alertas.totalPendientes === 0
            ? "No hay alertas ni vencimientos pendientes."
            : "Tenés recordatorios o vencimientos que requieren atención."
          : "Este espacio reunirá vencimientos, recordatorios y tareas importantes del estudio."}
      </p>

      {!alertasDisponibles && (
        <div className="mt-5 rounded-md bg-muted/60 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          La agenda será incorporada en un próximo entregable.
        </div>
      )}
    </section>
  );
}

export default function PanelScreen() {
  const panelQuery = usePanelResumen();

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
      </section>

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

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <ActividadReciente
              actividades={panelQuery.data.actividadReciente}
            />

            <AlertasPanel alertas={panelQuery.data.alertas} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
