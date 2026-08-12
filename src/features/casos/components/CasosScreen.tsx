"use client";

import { useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
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
    <Badge variant={activo ? "secondary" : "outline"}>
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  );
}

function CasosSkeleton() {
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
      className="w-full rounded-xl border bg-background p-4 text-left shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BriefcaseBusiness className="size-4" />
          </span>

          <div className="min-w-0">
            <h2 className="font-medium">{caso.titulo}</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {FASE_LABELS[caso.faseInterna]}
            </p>
          </div>
        </div>

        <CasoStatus activo={caso.activo} />
      </div>

      <dl className="mt-4 grid gap-3 border-t pt-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Cliente principal</dt>
          <dd className="mt-1">{clientePrincipal?.nombreCompleto ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Tipo de trámite</dt>
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Gestión</p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Casos</h1>

          <p className="mt-3 text-muted-foreground">
            Seguimiento de los asuntos jurídicos gestionados por el estudio.
          </p>
        </div>

        <Button onClick={() => setNuevoCasoOpen(true)}>Nuevo caso</Button>
      </section>

      <section className="rounded-xl border bg-background p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              onChange={(event) => cambiarBusqueda(event.target.value)}
              placeholder="Buscar por caso, trámite, cliente, DNI o CUIL..."
              className="h-10 pl-9"
              aria-label="Buscar casos"
            />
          </div>

          <select
            value={faseInterna}
            onChange={(event) => cambiarFase(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filtrar por fase"
          >
            <option value="">Todas las fases</option>
            <option value="Preadministrativa">Preadministrativa</option>
            <option value="Juicio">Juicio</option>
            <option value="Postjuicio">Postjuicio</option>
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
      </section>

      {isError ? (
        <section className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
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
        <section className="flex flex-col items-center rounded-xl border bg-background px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BriefcaseBusiness className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No se encontraron casos</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {busquedaDebounced || faseInterna
              ? "Probá modificando la búsqueda o los filtros."
              : soloActivos
                ? "Todavía no hay casos activos registrados."
                : "Todavía no hay casos registrados."}
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
              {data.items.map((caso) => (
                <CasoMobileCard
                  key={caso.casoId}
                  caso={caso}
                  onSelect={() => setCasoSeleccionadoId(caso.casoId)}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border bg-background shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Caso</th>
                      <th className="px-4 py-3 font-medium">
                        Cliente principal
                      </th>
                      <th className="px-4 py-3 font-medium">Fase</th>
                      <th className="px-4 py-3 font-medium">Trámite</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Estado
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
                          className="cursor-pointer transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none"
                        >
                          <td className="px-4 py-4">
                            <div className="font-medium">{caso.titulo}</div>

                            <div className="mt-1 text-xs text-muted-foreground">
                              {caso.clientes.length === 1
                                ? "1 participante"
                                : `${caso.clientes.length} participantes`}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <UserRound className="size-4 text-muted-foreground" />

                              <span>
                                {clientePrincipal?.nombreCompleto ?? "—"}
                              </span>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <Badge variant="outline">
                              {FASE_LABELS[caso.faseInterna]}
                            </Badge>
                          </td>

                          <td className="max-w-64 px-4 py-4">
                            <span className="block truncate">
                              {mostrarValor(caso.tipoTramite)}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <CasoStatus activo={caso.activo} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
