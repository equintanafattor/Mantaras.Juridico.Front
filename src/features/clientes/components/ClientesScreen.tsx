"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
    <Badge variant={activo ? "secondary" : "outline"}>
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  );
}

function ClientesSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-background p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-36" />
          </div>

          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
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
      className="w-full rounded-xl border bg-background p-4 text-left shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserRound className="size-4" />
          </span>

          <div className="min-w-0">
            <h2 className="truncate font-medium">{cliente.nombreCompleto}</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              DNI {formatearDni(cliente.dni)}
            </p>
          </div>
        </div>

        <ClienteStatus activo={cliente.activo} />
      </div>

      <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">CUIL</dt>
          <dd className="mt-1">{formatearCuil(cliente.cuil)}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Teléfono</dt>
          <dd className="mt-1">{mostrarValor(cliente.telefono)}</dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="mt-1 break-all">{mostrarValor(cliente.email)}</dd>
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

  const cambiarBusqueda = (value: string) => {
    setBusqueda(value);
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
            Clientes
          </h1>

          <p className="mt-3 text-muted-foreground">
            Buscá y consultá las personas registradas en el estudio.
          </p>
        </div>

        <Button onClick={() => setNuevoClienteOpen(true)}>Nuevo cliente</Button>
      </section>

      <section className="rounded-xl border bg-background p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              onChange={(event) => cambiarBusqueda(event.target.value)}
              placeholder="Buscar por nombre, apellido, DNI o CUIL..."
              className="h-10 pl-9"
              aria-label="Buscar clientes"
            />
          </div>

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
        <section className="flex flex-col items-center rounded-xl border bg-background px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UsersRound className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No se encontraron clientes</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {busquedaDebounced
              ? "Probá con otro nombre, apellido, DNI o CUIL."
              : soloActivos
                ? "Todavía no hay clientes activos registrados."
                : "Todavía no hay clientes registrados."}
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
              {data.items.map((cliente) => (
                <ClienteMobileCard
                  key={cliente.clienteId}
                  cliente={cliente}
                  onSelect={() => setClienteSeleccionadoId(cliente.clienteId)}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border bg-background shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">DNI</th>
                      <th className="px-4 py-3 font-medium">CUIL</th>
                      <th className="px-4 py-3 font-medium">Contacto</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Estado
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
                        className="cursor-pointer transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium">
                            {cliente.nombreCompleto}
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            {mostrarValor(cliente.localidad)}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {formatearDni(cliente.dni)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {formatearCuil(cliente.cuil)}
                        </td>

                        <td className="px-4 py-4">
                          <div>{mostrarValor(cliente.telefono)}</div>

                          <div className="mt-1 max-w-64 truncate text-xs text-muted-foreground">
                            {mostrarValor(cliente.email)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <ClienteStatus activo={cliente.activo} />
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
