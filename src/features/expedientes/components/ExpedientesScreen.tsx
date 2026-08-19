"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Files,
  FolderTree,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { useCasos } from "@/features/casos/hooks/useCasos";

import { useExpedientes } from "../hooks/useExpedientes";
import type { ExpedienteResponse, TipoExpediente } from "../types/types";

import NuevoExpedienteDialog from "./NuevoExpedienteDialog";

const PAGE_SIZE = 10;

const TIPO_EXPEDIENTE_LABELS: Record<TipoExpediente, string> = {
  Principal: "Principal",
  Incidente: "Incidente",
  Apelacion: "Apelación",
  Ejecucion: "Ejecución",
};

function mostrarValor(value: string | null) {
  return value?.trim() || "—";
}

function formatearFecha(value: string | null) {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function ExpedienteStatus({ activo }: { activo: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        activo
          ? "rounded-sm border-emerald-700/15 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
          : "rounded-sm bg-muted text-muted-foreground"
      }
    >
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  );
}

function TipoExpedienteBadge({ tipo }: { tipo: TipoExpediente }) {
  const className =
    tipo === "Principal"
      ? "border-transparent bg-primary/10 text-primary"
      : tipo === "Incidente"
        ? "border-transparent bg-secondary text-secondary-foreground"
        : tipo === "Apelacion"
          ? "border-transparent bg-accent text-accent-foreground"
          : "border-transparent bg-muted text-foreground";

  return (
    <Badge variant="outline" className={`rounded-sm ${className}`}>
      {TIPO_EXPEDIENTE_LABELS[tipo]}
    </Badge>
  );
}

function ExpedientesSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/40 px-5 py-3">
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="divide-y px-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-4">
            <Skeleton className="size-9 shrink-0 rounded-md" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-44" />
            </div>

            <Skeleton className="hidden h-6 w-20 sm:block" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpedienteMobileCard({
  expediente,
  onSelect,
}: {
  expediente: ExpedienteResponse;
  onSelect: () => void;
}) {
  const esDerivado = expediente.expedientePadreId !== null;
  const Icon = esDerivado ? FolderTree : FileText;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/25 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 font-medium leading-5 group-hover:text-primary">
            {expediente.caratula}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {mostrarValor(expediente.numeroExpediente)}
          </p>
        </div>

        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
        <TipoExpedienteBadge tipo={expediente.tipoExpediente} />
        <ExpedienteStatus activo={expediente.activo} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Caso</dt>
          <dd className="mt-1 font-medium">{expediente.tituloCaso}</dd>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground">Estado legal</dt>
            <dd className="mt-1">{mostrarValor(expediente.estadoLegal)}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Fecha de inicio</dt>
            <dd className="mt-1">{formatearFecha(expediente.fechaInicio)}</dd>
          </div>
        </div>
      </dl>
    </button>
  );
}

export default function ExpedientesScreen() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [casoId, setCasoId] = useState<number | "">("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [page, setPage] = useState(1);

  const [nuevoExpedienteOpen, setNuevoExpedienteOpen] = useState(false);

  const busquedaDebounced = useDebouncedValue(busqueda.trim(), 400);

  const casosQuery = useCasos({
    page: 1,
    pageSize: 100,
    soloActivos: false,
  });

  const { data, isLoading, isFetching, isError, error, refetch } =
    useExpedientes({
      page,
      pageSize: PAGE_SIZE,
      casoId: casoId === "" ? undefined : casoId,
      busqueda: busquedaDebounced || undefined,
      soloActivos,
    });

  const hayFiltros =
    busqueda.trim().length > 0 || casoId !== "" || !soloActivos;

  const cambiarBusqueda = (value: string) => {
    setBusqueda(value);
    setPage(1);
  };

  const cambiarCaso = (value: string) => {
    setCasoId(value ? Number(value) : "");
    setPage(1);
  };

  const cambiarFiltroActivos = (incluirInactivos: boolean) => {
    setSoloActivos(!incluirInactivos);
    setPage(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setCasoId("");
    setSoloActivos(true);
    setPage(1);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
            Gestión
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Expedientes
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Consultá expedientes judiciales, sus relaciones y datos procesales.
          </p>
        </div>

        <Button onClick={() => setNuevoExpedienteOpen(true)}>
          <Plus />
          Nuevo expediente
        </Button>
      </section>

      <section
        aria-label="Filtros de expedientes"
        className="rounded-lg border bg-card p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              onChange={(event) => cambiarBusqueda(event.target.value)}
              placeholder="Buscar por número, carátula, juzgado, estado, caso o cliente..."
              className="h-10 bg-background pl-9"
              aria-label="Buscar expedientes"
            />
          </div>

          <select
            value={casoId}
            disabled={casosQuery.isLoading}
            onChange={(event) => cambiarCaso(event.target.value)}
            className="h-10 min-w-56 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 lg:max-w-64"
            aria-label="Filtrar por caso"
          >
            <option value="">Todos los casos</option>

            {casosQuery.data?.items.map((caso) => (
              <option key={caso.casoId} value={caso.casoId}>
                {caso.titulo}
                {!caso.activo ? " (inactivo)" : ""}
              </option>
            ))}
          </select>

          <label className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm">
            <input
              type="checkbox"
              checked={!soloActivos}
              onChange={(event) => cambiarFiltroActivos(event.target.checked)}
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

        {casosQuery.isError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            No pudimos cargar los casos para el filtro.
          </div>
        )}
      </section>

      {isError ? (
        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">
            No pudimos cargar los expedientes
          </h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Ocurrió un error al consultar la información."}
          </p>

          <Button variant="outline" className="mt-5" onClick={() => refetch()}>
            Reintentar
          </Button>
        </section>
      ) : isLoading ? (
        <ExpedientesSkeleton />
      ) : data && data.items.length === 0 ? (
        <section className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Files className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No se encontraron expedientes</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {hayFiltros
              ? "Probá modificando o limpiando los filtros aplicados."
              : "Todavía no hay expedientes activos registrados."}
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
            aria-label="Resultados de expedientes"
            className={
              isFetching
                ? "opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
            <div className="grid gap-3 lg:hidden">
              {data.items.map((expediente) => (
                <ExpedienteMobileCard
                  key={expediente.expedienteId}
                  expediente={expediente}
                  onSelect={() =>
                    router.push(`/expedientes/${expediente.expedienteId}`)
                  }
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Expediente</th>
                      <th className="px-5 py-3 font-medium">Caso</th>
                      <th className="px-5 py-3 font-medium">Tipo</th>
                      <th className="px-5 py-3 font-medium">Estado legal</th>
                      <th className="px-5 py-3 font-medium">Inicio</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Estado
                      </th>
                      <th className="w-10 px-3 py-3">
                        <span className="sr-only">Abrir</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {data.items.map((expediente) => {
                      const Icon = expediente.expedientePadreId
                        ? FolderTree
                        : FileText;

                      return (
                        <tr
                          key={expediente.expedienteId}
                          tabIndex={0}
                          role="button"
                          onClick={() =>
                            router.push(
                              `/expedientes/${expediente.expedienteId}`,
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();

                              router.push(
                                `/expedientes/${expediente.expedienteId}`,
                              );
                            }
                          }}
                          className="group cursor-pointer transition-colors hover:bg-secondary/25 focus-visible:bg-secondary/25 focus-visible:outline-none"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                                <Icon className="size-4" />
                              </span>

                              <div className="min-w-0">
                                <div className="max-w-80 font-medium leading-5 group-hover:text-primary">
                                  {expediente.caratula}
                                </div>

                                <div className="mt-1 text-xs text-muted-foreground">
                                  {mostrarValor(expediente.numeroExpediente)}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="max-w-56 px-5 py-4">
                            <span className="block truncate">
                              {expediente.tituloCaso}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <TipoExpedienteBadge
                              tipo={expediente.tipoExpediente}
                            />
                          </td>

                          <td className="max-w-48 px-5 py-4">
                            <span className="block truncate text-muted-foreground">
                              {mostrarValor(expediente.estadoLegal)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                            {formatearFecha(expediente.fechaInicio)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <ExpedienteStatus activo={expediente.activo} />
                          </td>

                          <td className="px-3 py-4">
                            <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data.totalItems === 1
                ? "1 expediente"
                : `${data.totalItems} expedientes`}

              {data.totalPages > 0 &&
                ` · Página ${data.page} de ${data.totalPages}`}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasPreviousPage || isFetching}
                onClick={() =>
                  setPage((currentPage) => Math.max(1, currentPage - 1))
                }
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

      <NuevoExpedienteDialog
        open={nuevoExpedienteOpen}
        onOpenChange={setNuevoExpedienteOpen}
        onExpedienteCreado={() => {
          setBusqueda("");
          setCasoId("");
          setSoloActivos(true);
          setPage(1);
        }}
      />
    </div>
  );
}
