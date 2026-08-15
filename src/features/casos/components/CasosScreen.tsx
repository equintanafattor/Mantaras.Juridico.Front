"use client";

import { useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Search,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { useCasos } from "../hooks/useCasos";
import type { CasoResponse, FaseCaso } from "../types/types";

import CasoDetalleDialog from "./CasoDetalleDialog";
import NuevoCasoDialog from "./NuevoCasoDialog";

const PAGE_SIZE = 10;

const FASE_LABELS: Record<FaseCaso, string> = {
  Preadministrativa: "Preadministrativa",
  Juicio: "Juicio",
  Postjuicio: "Postjuicio",
};

function mostrarValor(value: string | null) {
  return value?.trim() || "—";
}

function obtenerClientePrincipal(caso: CasoResponse) {
  return caso.clientes.find((cliente) => cliente.esPrincipal);
}

function CasoStatus({ activo }: { activo: boolean }) {
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

function FaseStatus({ fase }: { fase: FaseCaso }) {
  const className =
    fase === "Juicio"
      ? "border-transparent bg-accent text-accent-foreground"
      : fase === "Postjuicio"
        ? "border-transparent bg-primary/10 text-primary"
        : "border-transparent bg-secondary text-secondary-foreground";

  return (
    <Badge variant="outline" className={`rounded-sm ${className}`}>
      {FASE_LABELS[fase]}
    </Badge>
  );
}

function CasosSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/40 px-5 py-3">
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="divide-y px-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-40" />
            </div>

            <Skeleton className="hidden h-6 w-24 sm:block" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CasoMobileCard({
  caso,
  onSelect,
}: {
  caso: CasoResponse;
  onSelect: () => void;
}) {
  const clientePrincipal = obtenerClientePrincipal(caso);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/25 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <BriefcaseBusiness className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-medium leading-5 group-hover:text-primary">
            {caso.titulo}
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {caso.clientes.length === 1
              ? "1 participante"
              : `${caso.clientes.length} participantes`}
          </p>
        </div>

        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
        <FaseStatus fase={caso.faseInterna} />
        <CasoStatus activo={caso.activo} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Cliente principal</dt>
          <dd className="mt-1 font-medium">
            {clientePrincipal?.nombreCompleto ?? "—"}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-muted-foreground">Tipo de trámite</dt>
          <dd className="mt-1">{mostrarValor(caso.tipoTramite)}</dd>
        </div>
      </dl>
    </button>
  );
}

export default function CasosScreen() {
  const [busqueda, setBusqueda] = useState("");
  const [faseInterna, setFaseInterna] = useState<FaseCaso | "">("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [page, setPage] = useState(1);

  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState<number | null>(
    null,
  );

  const [nuevoCasoOpen, setNuevoCasoOpen] = useState(false);

  const busquedaDebounced = useDebouncedValue(busqueda.trim(), 400);

  const { data, isLoading, isFetching, isError, error, refetch } = useCasos({
    page,
    pageSize: PAGE_SIZE,
    busqueda: busquedaDebounced || undefined,
    faseInterna: faseInterna || undefined,
    soloActivos,
  });

  const hayFiltros =
    busqueda.trim().length > 0 || faseInterna !== "" || !soloActivos;

  const cambiarBusqueda = (value: string) => {
    setBusqueda(value);
    setPage(1);
  };

  const cambiarFase = (value: string) => {
    setFaseInterna(value as FaseCaso | "");
    setPage(1);
  };

  const cambiarFiltroActivos = (incluirInactivos: boolean) => {
    setSoloActivos(!incluirInactivos);
    setPage(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFaseInterna("");
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
            Casos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Seguimiento de los asuntos jurídicos gestionados por el estudio.
          </p>
        </div>

        <Button onClick={() => setNuevoCasoOpen(true)}>
          <Plus />
          Nuevo caso
        </Button>
      </section>

      <section
        aria-label="Filtros de casos"
        className="rounded-lg border bg-card p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              onChange={(event) => cambiarBusqueda(event.target.value)}
              placeholder="Buscar por caso, trámite, cliente, DNI o CUIL..."
              className="h-10 bg-background pl-9"
              aria-label="Buscar casos"
            />
          </div>

          <select
            value={faseInterna}
            onChange={(event) => cambiarFase(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-48"
            aria-label="Filtrar por fase"
          >
            <option value="">Todas las fases</option>
            <option value="Preadministrativa">Preadministrativa</option>
            <option value="Juicio">Juicio</option>
            <option value="Postjuicio">Postjuicio</option>
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
      </section>

      {isError ? (
        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No pudimos cargar los casos</h2>

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
        <CasosSkeleton />
      ) : data && data.items.length === 0 ? (
        <section className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <BriefcaseBusiness className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No se encontraron casos</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {hayFiltros
              ? "Probá modificando o limpiando los filtros aplicados."
              : "Todavía no hay casos activos registrados."}
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
            aria-label="Resultados de casos"
            className={
              isFetching
                ? "opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
            <div className="grid gap-3 lg:hidden">
              {data.items.map((caso) => (
                <CasoMobileCard
                  key={caso.casoId}
                  caso={caso}
                  onSelect={() => setCasoSeleccionadoId(caso.casoId)}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Caso</th>
                      <th className="px-5 py-3 font-medium">
                        Cliente principal
                      </th>
                      <th className="px-5 py-3 font-medium">Fase</th>
                      <th className="px-5 py-3 font-medium">Trámite</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Estado
                      </th>
                      <th className="w-10 px-3 py-3">
                        <span className="sr-only">Abrir</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {data.items.map((caso) => {
                      const clientePrincipal = obtenerClientePrincipal(caso);

                      return (
                        <tr
                          key={caso.casoId}
                          tabIndex={0}
                          role="button"
                          onClick={() => setCasoSeleccionadoId(caso.casoId)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setCasoSeleccionadoId(caso.casoId);
                            }
                          }}
                          className="group cursor-pointer transition-colors hover:bg-secondary/25 focus-visible:bg-secondary/25 focus-visible:outline-none"
                        >
                          <td className="px-5 py-4">
                            <div className="max-w-72 font-medium leading-5 group-hover:text-primary">
                              {caso.titulo}
                            </div>

                            <div className="mt-1 text-xs text-muted-foreground">
                              {caso.clientes.length === 1
                                ? "1 participante"
                                : `${caso.clientes.length} participantes`}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <UserRound className="size-4 shrink-0 text-muted-foreground" />

                              <span className="max-w-52 truncate">
                                {clientePrincipal?.nombreCompleto ?? "—"}
                              </span>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <FaseStatus fase={caso.faseInterna} />
                          </td>

                          <td className="max-w-56 px-5 py-4">
                            <span className="block truncate text-muted-foreground">
                              {mostrarValor(caso.tipoTramite)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <CasoStatus activo={caso.activo} />
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
              {data.totalItems === 1 ? "1 caso" : `${data.totalItems} casos`}

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

      <NuevoCasoDialog
        open={nuevoCasoOpen}
        onOpenChange={setNuevoCasoOpen}
        onCasoCreado={() => {
          setBusqueda("");
          setFaseInterna("");
          setSoloActivos(true);
          setPage(1);
        }}
      />

      <CasoDetalleDialog
        casoId={casoSeleccionadoId}
        open={casoSeleccionadoId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCasoSeleccionadoId(null);
          }
        }}
      />
    </div>
  );
}
