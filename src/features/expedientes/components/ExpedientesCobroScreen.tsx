"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BellRing,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  RotateCcw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ApiError } from "@/lib/api/apiClient";

import { useExpedientesCobro } from "../hooks/useExpedientesCobro";
import {
  formatearFechaCobro,
  resumenAlertaCobro,
  TIPO_DOCUMENTO_COBRO_LABELS,
} from "../lib/cobro";
import type { ExpedienteCobroResponse } from "../types/types";

import AlertaSeguimientoCobroDialog from "./AlertaSeguimientoCobroDialog";
import SeguimientoCobroEstado from "./SeguimientoCobroEstado";

const PAGE_SIZE = 20;

type FiltroSeguimiento = "todos" | "pendientes" | "vencidos";

const FILTROS_SEGUIMIENTO: Record<FiltroSeguimiento, boolean | undefined> = {
  todos: undefined,
  pendientes: false,
  vencidos: true,
};

function resumirCasos(expediente: ExpedienteCobroResponse) {
  if (expediente.casos.length === 0) {
    return "Sin expediente administrativo";
  }

  const [primero, ...resto] = expediente.casos;

  return resto.length > 0
    ? `${primero.titulo} y ${resto.length} más`
    : primero.titulo;
}

function mensajeError(error: unknown) {
  if (error instanceof ApiError && error.status === 404) {
    return "El listado de cobro todavía no está disponible en el servidor. La integración con backend está pendiente.";
  }

  return error instanceof Error
    ? error.message
    : "Ocurrió un error al consultar la información.";
}

function ExpedienteInactivoBadge() {
  return (
    <Badge variant="outline" className="rounded-sm bg-muted text-muted-foreground">
      Inactivo
    </Badge>
  );
}

function BotonAlerta({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={(event) => {
        // No abrir el judicial al hacer clic en la alerta.
        event.stopPropagation();
        onClick();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <BellRing />
      Ver alerta
    </Button>
  );
}

function CobroSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/40 px-5 py-3">
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="divide-y px-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-40" />
            </div>

            <Skeleton className="hidden h-6 w-28 sm:block" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpedientesCobroScreen() {
  const router = useRouter();

  const [busqueda, setBusqueda] = useState("");
  const [filtroSeguimiento, setFiltroSeguimiento] =
    useState<FiltroSeguimiento>("todos");
  const [soloActivos, setSoloActivos] = useState(true);
  const [page, setPage] = useState(1);
  const [alerta, setAlerta] = useState<ExpedienteCobroResponse | null>(null);

  const busquedaDebounced = useDebouncedValue(busqueda.trim(), 400);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useExpedientesCobro({
      page,
      pageSize: PAGE_SIZE,
      busqueda: busquedaDebounced || undefined,
      soloActivos,
      seguimientoVencido: FILTROS_SEGUIMIENTO[filtroSeguimiento],
    });

  const hayFiltros =
    busqueda.trim().length > 0 || filtroSeguimiento !== "todos" || !soloActivos;

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroSeguimiento("todos");
    setSoloActivos(true);
    setPage(1);
  };

  const abrirExpediente = (expedienteId: number) =>
    router.push(`/expedientes/${expedienteId}`);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-lg border border-sky-800/15 border-l-4 border-l-sky-700 bg-sky-50/45 p-5 dark:bg-sky-950/10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Expedientes de cobro
        </h1>
      </section>

      <section
        aria-label="Filtros de expedientes de cobro"
        className="rounded-lg border bg-card p-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <div className="relative min-w-0 flex-1 md:basis-full lg:basis-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por número, carátula, juzgado, expediente administrativo o cliente..."
              className="h-10 bg-background pl-9"
              aria-label="Buscar expedientes de cobro"
            />
          </div>

          <select
            value={filtroSeguimiento}
            onChange={(event) => {
              setFiltroSeguimiento(event.target.value as FiltroSeguimiento);
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-1 lg:max-w-56 lg:flex-none"
            aria-label="Filtrar por estado del seguimiento"
          >
            <option value="todos">Todos los seguimientos</option>
            <option value="pendientes">Sin vencer</option>
            <option value="vencidos">Vencidos</option>
          </select>

          <label className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm">
            <input
              type="checkbox"
              checked={!soloActivos}
              onChange={(event) => {
                setSoloActivos(!event.target.checked);
                setPage(1);
              }}
              className="size-4 rounded border-input accent-primary"
            />
            Incluir inactivos
          </label>

          {hayFiltros && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 text-muted-foreground"
              onClick={limpiarFiltros}
            >
              <RotateCcw />
              Limpiar
            </Button>
          )}
        </div>
      </section>

      {isError ? (
        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">
            No pudimos cargar los expedientes de cobro
          </h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {mensajeError(error)}
          </p>

          <Button variant="outline" className="mt-5" onClick={() => refetch()}>
            Reintentar
          </Button>
        </section>
      ) : isLoading ? (
        <CobroSkeleton />
      ) : data && data.items.length === 0 ? (
        <section className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <HandCoins className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No hay expedientes de cobro</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {hayFiltros
              ? "Probá modificando o limpiando los filtros aplicados."
              : "Un expediente judicial aparece acá cuando se registra el envío de una cédula u oficio de cobro desde su detalle."}
          </p>

          {hayFiltros && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={limpiarFiltros}
            >
              <RotateCcw />
              Limpiar filtros
            </Button>
          )}
        </section>
      ) : data ? (
        <>
          <section
            aria-label="Resultados de expedientes de cobro"
            className={
              isFetching ? "opacity-60 transition-opacity" : "transition-opacity"
            }
          >
            <div className="grid gap-3 lg:hidden">
              {data.items.map((expediente) => (
                <article
                  key={expediente.expedienteId}
                  className="rounded-lg border bg-card p-4"
                >
                  <button
                    type="button"
                    className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => abrirExpediente(expediente.expedienteId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-medium leading-6 group-hover:text-primary">
                          {expediente.caratula}
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {expediente.numeroExpediente || "Sin número"}
                        </p>

                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {resumirCasos(expediente)}
                        </p>
                      </div>

                      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                    </div>
                  </button>

                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Documento</dt>
                      <dd className="mt-1">
                        {TIPO_DOCUMENTO_COBRO_LABELS[expediente.envioCobro.tipoDocumento]}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted-foreground">Envío</dt>
                      <dd className="mt-1">
                        {formatearFechaCobro(expediente.envioCobro.fechaEnvio)}
                      </dd>
                    </div>

                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Seguimiento</dt>
                      <dd className="mt-1">
                        <SeguimientoCobroEstado envio={expediente.envioCobro} compacto />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
                    {!expediente.activo ? <ExpedienteInactivoBadge /> : <span />}
                    <BotonAlerta onClick={() => setAlerta(expediente)} />
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Expediente judicial</th>
                      <th className="px-5 py-3 font-medium">Documento</th>
                      <th className="px-5 py-3 font-medium">Envío</th>
                      <th className="px-5 py-3 font-medium">Seguimiento</th>
                      <th className="px-5 py-3 text-right font-medium">
                        <span className="sr-only">Alerta</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {data.items.map((expediente) => (
                      <tr
                        key={expediente.expedienteId}
                        tabIndex={0}
                        role="button"
                        onClick={() => abrirExpediente(expediente.expedienteId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            abrirExpediente(expediente.expedienteId);
                          }
                        }}
                        className="group cursor-pointer transition-colors hover:bg-secondary/25 focus-visible:bg-secondary/25 focus-visible:outline-none"
                      >
                        <td className="px-5 py-4">
                          <div className="max-w-96 font-medium leading-5 group-hover:text-primary">
                            {expediente.caratula}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span>{expediente.numeroExpediente || "Sin número"}</span>
                            <span aria-hidden="true">·</span>
                            <span className="max-w-64 truncate">
                              {resumirCasos(expediente)}
                            </span>
                            {!expediente.activo && <ExpedienteInactivoBadge />}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {TIPO_DOCUMENTO_COBRO_LABELS[expediente.envioCobro.tipoDocumento]}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                          {formatearFechaCobro(expediente.envioCobro.fechaEnvio)}
                        </td>

                        <td className="px-5 py-4">
                          <SeguimientoCobroEstado envio={expediente.envioCobro} compacto />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <BotonAlerta onClick={() => setAlerta(expediente)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data.totalItems === 1
                ? "1 expediente de cobro"
                : `${data.totalItems} expedientes de cobro`}

              {data.totalPages > 0 && ` · Página ${data.page} de ${data.totalPages}`}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasPreviousPage || isFetching}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                <ChevronLeft />
                Anterior
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasNextPage || isFetching}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Siguiente
                <ChevronRight />
              </Button>
            </div>
          </footer>
        </>
      ) : null}

      {alerta && (
        <AlertaSeguimientoCobroDialog
          entrada={resumenAlertaCobro(alerta.envioCobro, alerta)}
          onClose={() => setAlerta(null)}
        />
      )}
    </div>
  );
}
