"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Files,
  FolderTree,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { useCasos } from "@/features/casos/hooks/useCasos";

import { useExpedientes } from "../hooks/useExpedientes";
import type { ExpedienteResponse, TipoExpediente } from "../types/types";

import ExpedienteDetalleDialog from "./ExpedienteDetalleDialog";
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
    <Badge variant={activo ? "secondary" : "outline"}>
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  );
}

function ExpedientesSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-background p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-44" />
          </div>

          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
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
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-xl border bg-background p-4 text-left shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </span>

          <div className="min-w-0">
            <h2 className="font-medium">{expediente.caratula}</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {mostrarValor(expediente.numeroExpediente)}
            </p>
          </div>
        </div>

        <ExpedienteStatus activo={expediente.activo} />
      </div>

      <dl className="mt-4 grid gap-3 border-t pt-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Caso</dt>
          <dd className="mt-1">{expediente.tituloCaso}</dd>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-muted-foreground">Tipo</dt>
            <dd className="mt-1">
              {TIPO_EXPEDIENTE_LABELS[expediente.tipoExpediente]}
            </dd>
          </div>

          <div>
            <dt className="text-muted-foreground">Inicio</dt>
            <dd className="mt-1">{formatearFecha(expediente.fechaInicio)}</dd>
          </div>
        </div>
      </dl>
    </button>
  );
}

export default function ExpedientesScreen() {
  const [busqueda, setBusqueda] = useState("");
  const [casoId, setCasoId] = useState<number | "">("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [page, setPage] = useState(1);
  const [expedienteSeleccionadoId, setExpedienteSeleccionadoId] = useState<
    number | null
  >(null);
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Gestión</p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Expedientes
          </h1>

          <p className="mt-3 text-muted-foreground">
            Consultá expedientes judiciales, sus relaciones y datos procesales.
          </p>
        </div>

        <Button onClick={() => setNuevoExpedienteOpen(true)}>
          Nuevo expediente
        </Button>
      </section>

      <section className="rounded-xl border bg-background p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              onChange={(event) => cambiarBusqueda(event.target.value)}
              placeholder="Buscar por número, carátula, juzgado, estado, caso o cliente..."
              className="h-10 pl-9"
              aria-label="Buscar expedientes"
            />
          </div>

          <select
            value={casoId}
            disabled={casosQuery.isLoading}
            onChange={(event) => cambiarCaso(event.target.value)}
            className="h-10 min-w-56 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!soloActivos}
              onChange={(event) => cambiarFiltroActivos(event.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            Incluir inactivos
          </label>
        </div>

        {casosQuery.isError && (
          <p className="mt-3 text-sm text-destructive">
            No pudimos cargar los casos para el filtro.
          </p>
        )}
      </section>

      {isError ? (
        <section className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
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
        <section className="flex flex-col items-center rounded-xl border bg-background px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Files className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No se encontraron expedientes</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {busquedaDebounced || casoId !== ""
              ? "Probá modificando la búsqueda o el caso seleccionado."
              : soloActivos
                ? "Todavía no hay expedientes activos registrados."
                : "Todavía no hay expedientes registrados."}
          </p>
        </section>
      ) : data ? (
        <>
          <section
            className={
              isFetching
                ? "opacity-70 transition-opacity"
                : "transition-opacity"
            }
          >
            <div className="grid gap-3 md:hidden">
              {data.items.map((expediente) => (
                <ExpedienteMobileCard
                  key={expediente.expedienteId}
                  expediente={expediente}
                  onSelect={() =>
                    setExpedienteSeleccionadoId(expediente.expedienteId)
                  }
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border bg-background shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Expediente</th>
                      <th className="px-4 py-3 font-medium">Caso</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Estado legal</th>
                      <th className="px-4 py-3 font-medium">Inicio</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Estado
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {data.items.map((expediente) => (
                      <tr
                        key={expediente.expedienteId}
                        tabIndex={0}
                        role="button"
                        onClick={() =>
                          setExpedienteSeleccionadoId(expediente.expedienteId)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setExpedienteSeleccionadoId(
                              expediente.expedienteId,
                            );
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              {expediente.expedientePadreId ? (
                                <FolderTree className="size-4" />
                              ) : (
                                <FileText className="size-4" />
                              )}
                            </span>

                            <div className="min-w-0">
                              <div className="max-w-80 font-medium">
                                {expediente.caratula}
                              </div>

                              <div className="mt-1 text-xs text-muted-foreground">
                                {mostrarValor(expediente.numeroExpediente)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-56 px-4 py-4">
                          <span className="block truncate">
                            {expediente.tituloCaso}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <Badge variant="outline">
                            {TIPO_EXPEDIENTE_LABELS[expediente.tipoExpediente]}
                          </Badge>
                        </td>

                        <td className="max-w-48 px-4 py-4">
                          <span className="block truncate">
                            {mostrarValor(expediente.estadoLegal)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {formatearFecha(expediente.fechaInicio)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <ExpedienteStatus activo={expediente.activo} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <ExpedienteDetalleDialog
        expedienteId={expedienteSeleccionadoId}
        open={expedienteSeleccionadoId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setExpedienteSeleccionadoId(null);
          }
        }}
      />
    </div>
  );
}
