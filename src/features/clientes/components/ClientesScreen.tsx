"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { useClientes } from "../hooks/useClientes";
import type { ClienteResponse } from "../types/types";

import ClienteDetalleDialog from "./ClienteDetalleDialog";
import NuevoClienteDialog from "./NuevoClienteDialog";

const PAGE_SIZE = 10;

function mostrarValor(value: string | null) {
  return value?.trim() || "—";
}

function formatearDni(dni: string | null) {
  if (!dni) {
    return "—";
  }

  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatearCuil(cuil: string | null) {
  if (!cuil) {
    return "—";
  }

  const numeros = cuil.replace(/\D/g, "");

  if (numeros.length !== 11) {
    return cuil;
  }

  return `${numeros.slice(0, 2)}-${numeros.slice(2, 10)}-${numeros.slice(10)}`;
}

function ClienteStatus({ activo }: { activo: boolean }) {
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

function ClientesSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/40 px-5 py-3">
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="divide-y px-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>

            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ClienteMobileCard({
  cliente,
  onSelect,
}: {
  cliente: ClienteResponse;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/25 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <UserRound className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium group-hover:text-primary">
            {cliente.nombreCompleto}
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {cliente.localidad?.trim() || "Localidad no informada"}
          </p>
        </div>

        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-4 border-t pt-3">
        <ClienteStatus activo={cliente.activo} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">DNI</dt>
          <dd className="mt-1">{formatearDni(cliente.dni)}</dd>
        </div>

        <div>
          <dt className="text-xs text-muted-foreground">CUIL</dt>
          <dd className="mt-1">{formatearCuil(cliente.cuil)}</dd>
        </div>

        <div>
          <dt className="text-xs text-muted-foreground">Teléfono</dt>
          <dd className="mt-1">{mostrarValor(cliente.telefono)}</dd>
        </div>

        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Email</dt>
          <dd className="mt-1 truncate">{mostrarValor(cliente.email)}</dd>
        </div>
      </dl>
    </button>
  );
}

export default function ClientesScreen() {
  const [busqueda, setBusqueda] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [page, setPage] = useState(1);
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);

  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<
    number | null
  >(null);

  const busquedaDebounced = useDebouncedValue(busqueda.trim(), 400);

  const { data, isLoading, isFetching, isError, error, refetch } = useClientes({
    page,
    pageSize: PAGE_SIZE,
    busqueda: busquedaDebounced || undefined,
    soloActivos,
  });

  const hayFiltros = busqueda.trim().length > 0 || !soloActivos;

  const cambiarBusqueda = (value: string) => {
    setBusqueda(value);
    setPage(1);
  };

  const cambiarFiltroActivos = (incluirInactivos: boolean) => {
    setSoloActivos(!incluirInactivos);
    setPage(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
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
            Clientes
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Buscá y consultá las personas registradas en el estudio.
          </p>
        </div>

        <Button onClick={() => setNuevoClienteOpen(true)}>
          <Plus />
          Nuevo cliente
        </Button>
      </section>

      <section
        aria-label="Filtros de clientes"
        className="rounded-lg border bg-card p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              onChange={(event) => cambiarBusqueda(event.target.value)}
              placeholder="Nombre, apellido, DNI o CUIL..."
              className="h-10 bg-background pl-9"
              aria-label="Buscar clientes"
            />
          </div>

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

          <h2 className="mt-4 font-semibold">No pudimos cargar los clientes</h2>

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
        <ClientesSkeleton />
      ) : data && data.items.length === 0 ? (
        <section className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UsersRound className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No se encontraron clientes</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {hayFiltros
              ? "Probá modificando o limpiando los filtros aplicados."
              : "Todavía no hay clientes activos registrados."}
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
            aria-label="Resultados de clientes"
            className={
              isFetching
                ? "opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
            <div className="grid gap-3 md:hidden">
              {data.items.map((cliente) => (
                <ClienteMobileCard
                  key={cliente.clienteId}
                  cliente={cliente}
                  onSelect={() => setClienteSeleccionadoId(cliente.clienteId)}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Cliente</th>
                      <th className="px-5 py-3 font-medium">DNI</th>
                      <th className="px-5 py-3 font-medium">CUIL</th>
                      <th className="px-5 py-3 font-medium">Contacto</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Estado
                      </th>
                      <th className="w-10 px-3 py-3">
                        <span className="sr-only">Abrir</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {data.items.map((cliente) => (
                      <tr
                        key={cliente.clienteId}
                        tabIndex={0}
                        role="button"
                        onClick={() =>
                          setClienteSeleccionadoId(cliente.clienteId)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setClienteSeleccionadoId(cliente.clienteId);
                          }
                        }}
                        className="group cursor-pointer transition-colors hover:bg-secondary/25 focus-visible:bg-secondary/25 focus-visible:outline-none"
                      >
                        <td className="px-5 py-4">
                          <div className="max-w-64 font-medium group-hover:text-primary">
                            {cliente.nombreCompleto}
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            {cliente.localidad?.trim() ||
                              "Localidad no informada"}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {formatearDni(cliente.dni)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {formatearCuil(cliente.cuil)}
                        </td>

                        <td className="px-5 py-4">
                          <div>{mostrarValor(cliente.telefono)}</div>

                          <div className="mt-1 max-w-64 truncate text-xs text-muted-foreground">
                            {mostrarValor(cliente.email)}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <ClienteStatus activo={cliente.activo} />
                        </td>

                        <td className="px-3 py-4">
                          <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
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
                ? "1 cliente"
                : `${data.totalItems} clientes`}

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

      <NuevoClienteDialog
        open={nuevoClienteOpen}
        onOpenChange={setNuevoClienteOpen}
        onClienteCreado={() => {
          setBusqueda("");
          setSoloActivos(true);
          setPage(1);
        }}
      />

      <ClienteDetalleDialog
        clienteId={clienteSeleccionadoId}
        open={clienteSeleccionadoId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setClienteSeleccionadoId(null);
          }
        }}
      />
    </div>
  );
}
