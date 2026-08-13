"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
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
    descripcion: "Personas registradas y activas en el estudio.",
    icon: UsersRound,
    obtenerCantidad: (data: PanelResumenResponse) =>
      data.metricas.clientesActivos,
  },
  {
    href: "/casos",
    titulo: "Casos",
    descripcion: "Asuntos jurídicos que se encuentran activos.",
    icon: BriefcaseBusiness,
    obtenerCantidad: (data: PanelResumenResponse) => data.metricas.casosActivos,
  },
  {
    href: "/expedientes",
    titulo: "Expedientes",
    descripcion: "Expedientes procesales actualmente activos.",
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
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border bg-background p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="size-11 rounded-lg" />
              <Skeleton className="h-8 w-16" />
            </div>

            <Skeleton className="mt-5 h-5 w-28" />
            <Skeleton className="mt-3 h-4 w-full" />
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-background p-5 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />

        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border p-4"
            >
              <Skeleton className="size-10 shrink-0 rounded-lg" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModulosResumen({ data }: { data: PanelResumenResponse }) {
  return (
    <section
      aria-label="Resumen de módulos"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {modulos.map((modulo) => {
        const Icon = modulo.icon;
        const cantidad = modulo.obtenerCantidad(data);

        return (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="group rounded-xl border bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>

              <span className="text-3xl font-semibold tracking-tight">
                {cantidad}
              </span>
            </div>

            <h2 className="mt-5 font-semibold">{modulo.titulo}</h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {modulo.descripcion}
            </p>

            <span className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
              Ingresar
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
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
    <article className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{actividad.titulo}</h3>

            <Badge variant="outline">{actividad.tipo}</Badge>
          </div>

          {actividad.referencia && (
            <p className="mt-1 text-sm text-muted-foreground">
              {actividad.referencia}
            </p>
          )}

          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {formatearFechaHora(actividad.fechaActividad)}
          </p>
        </div>
      </div>

      <Button
        nativeButton={false}
        variant="outline"
        size="sm"
        className="w-full shrink-0 sm:w-auto"
        render={<Link href={href} />}
      >
        Abrir módulo
        <ArrowUpRight />
      </Button>
    </article>
  );
}

function ActividadReciente({
  actividades,
}: {
  actividades: ActividadRecienteResponse[];
}) {
  return (
    <section className="rounded-xl border bg-background p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-sm font-medium">Actividad reciente</p>

        <p className="mt-1 text-sm text-muted-foreground">
          Últimos cambios registrados en casos y expedientes activos.
        </p>
      </div>

      {actividades.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed px-5 py-10 text-center">
          <Clock3 className="mx-auto size-5 text-muted-foreground" />

          <p className="mt-3 text-sm font-medium">
            Todavía no hay actividad para mostrar
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Los casos y expedientes creados o modificados aparecerán acá.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
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
  return (
    <section className="rounded-xl border border-dashed bg-background p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <BellRing className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Agenda y alertas</h2>

            <Badge variant="outline">
              {alertas.disponible
                ? `${alertas.totalPendientes} pendientes`
                : "Próximamente"}
            </Badge>
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {alertas.disponible
              ? alertas.totalPendientes === 0
                ? "No hay alertas pendientes."
                : "Tenés recordatorios o vencimientos pendientes."
              : "Este espacio queda reservado para futuros vencimientos, recordatorios y tareas de agenda."}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function PanelScreen() {
  const panelQuery = usePanelResumen();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section>
        <p className="text-sm font-medium text-primary">Panel principal</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Gestión del estudio jurídico
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Consultá el estado general del estudio y accedé rápidamente a las
          tareas frecuentes.
        </p>
      </section>

      {panelQuery.isLoading ? (
        <PanelSkeleton />
      ) : panelQuery.isError ? (
        <section className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
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
              ? "space-y-8 opacity-70 transition-opacity"
              : "space-y-8 transition-opacity"
          }
        >
          <ModulosResumen data={panelQuery.data} />

          <ActividadReciente actividades={panelQuery.data.actividadReciente} />

          <AlertasPanel alertas={panelQuery.data.alertas} />
        </div>
      ) : null}
    </div>
  );
}
