"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BellRing,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  RotateCcw,
  Scale,
  Search,
  UserRound,
  UsersRound,
  UserX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TACTIL } from "@/lib/tactil";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ApiError } from "@/lib/api/apiClient";

import { useExpedientesCobro } from "../hooks/useExpedientesCobro";
import {
  formatearFechaCobro,
  resumenAlertaCobro,
  TIPO_DOCUMENTO_COBRO_LABELS,
} from "../lib/cobro";
import {
  destinoClienteCobro,
  documentoCliente,
  esClicEnControl,
  rutaCliente,
  rutaExpediente,
  type DestinoClienteCobro,
} from "../lib/clienteCobro";
import type {
  ClienteExpedienteCobroResponse,
  ExpedienteCobroResponse,
} from "../types/types";

import AlertaSeguimientoCobroDialog from "./AlertaSeguimientoCobroDialog";
import SeguimientoCobroEstado from "./SeguimientoCobroEstado";

const PAGE_SIZE = 20;

type FiltroSeguimiento = "todos" | "pendientes" | "vencidos";

const FILTROS_SEGUIMIENTO: Record<FiltroSeguimiento, boolean | undefined> = {
  todos: undefined,
  pendientes: false,
  vencidos: true,
};

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

const ENLACE =
  "rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ClienteInactivoBadge() {
  return (
    <Badge variant="outline" className="rounded-sm bg-muted text-muted-foreground">
      Cliente inactivo
    </Badge>
  );
}

function EnlaceCliente({
  cliente,
  className,
}: {
  cliente: ClienteExpedienteCobroResponse;
  className?: string;
}) {
  return (
    <Link href={rutaCliente(cliente.clienteId)} className={cn(ENLACE, className)}>
      {cliente.nombreCompleto}
    </Link>
  );
}

/** Información principal de la fila: el cliente, o lo que corresponda si no hay uno inequívoco. */
function ClienteCobro({ destino }: { destino: DestinoClienteCobro }) {
  if (destino.tipo === "sin-cliente") {
    return (
      <div className="flex items-start gap-2">
        <UserX className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-500" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-400">
            Sin cliente asociado
          </p>
          <p className="text-xs text-muted-foreground">
            Se asocia desde el expediente administrativo.
          </p>
        </div>
      </div>
    );
  }

  if (destino.tipo === "varios") {
    return (
      <div className="flex items-start gap-2">
        <UsersRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {destino.clientes.length} clientes, sin principal único. Elegí uno:
          </p>
          <ul className="mt-1 space-y-1">
            {destino.clientes.map((cliente) => (
              <li key={cliente.clienteId} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <EnlaceCliente
                  cliente={cliente}
                  className="font-medium pointer-coarse:inline-flex pointer-coarse:min-h-10 pointer-coarse:items-center"
                />
                {documentoCliente(cliente) && (
                  <span className="text-xs text-muted-foreground">{documentoCliente(cliente)}</span>
                )}
                {!cliente.activo && <ClienteInactivoBadge />}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const { cliente, otros } = destino;
  const documento = documentoCliente(cliente);

  return (
    <div className="flex items-start gap-2">
      <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
      <div className="min-w-0">
        <EnlaceCliente cliente={cliente} className="font-medium leading-5 group-hover:text-primary" />
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {documento && <span>{documento}</span>}
          {otros.length > 0 && (
            <span title={otros.map((otro) => otro.nombreCompleto).join(" · ")}>
              {otros.length === 1 ? "y 1 cliente más" : `y ${otros.length} clientes más`}
            </span>
          )}
          {!cliente.activo && <ClienteInactivoBadge />}
        </div>
      </div>
    </div>
  );
}

/** Información secundaria: el judicial, con enlace explícito a su detalle. */
function JudicialCobro({
  expediente,
  className,
}: {
  expediente: ExpedienteCobroResponse;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 text-sm", className)}>
      <Link
        href={rutaExpediente(expediente.expedienteId)}
        className={cn(ENLACE, "inline-flex items-start gap-1.5 text-muted-foreground pointer-coarse:min-h-10")}
        aria-label={`Abrir expediente judicial ${expediente.caratula}`}
      >
        <Scale className="mt-0.5 size-3.5 shrink-0" />
        <span className="line-clamp-2">{expediente.caratula}</span>
      </Link>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-5 text-xs text-muted-foreground">
        <span>{expediente.numeroExpediente || "Sin número"}</span>
        {!expediente.activo && <ExpedienteInactivoBadge />}
      </div>
    </div>
  );
}

function BotonAlerta({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={(event) => {
        // No abrir la ficha del cliente al hacer clic en el seguimiento.
        event.stopPropagation();
        onClick();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <BellRing />
      Ver seguimiento
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

  // La fila (o tarjeta) abre la ficha del cliente solo si hay uno inequívoco.
  // Los enlaces y botones internos conservan su propia acción.
  const abrirCliente = (
    event: MouseEvent<HTMLElement>,
    destino: DestinoClienteCobro,
  ) => {
    if (destino.tipo !== "cliente") return;
    if (esClicEnControl(event.target, event.currentTarget)) return;
    if (window.getSelection()?.toString()) return;
    router.push(rutaCliente(destino.cliente.clienteId));
  };

  return (
    <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6", TACTIL)}>
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
              placeholder="Buscar por cliente, DNI, CUIL, carátula o número…"
              className="h-10 bg-background pl-9"
              aria-label="Buscar expedientes de cobro"
              aria-describedby="ayuda-busqueda-cobro"
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
            <option value="pendientes">Sin vencer o cerrados</option>
            <option value="vencidos">Plazo vencido</option>
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

        <p id="ayuda-busqueda-cobro" className="mt-2 text-xs text-muted-foreground">
          Busca por nombre, apellido, DNI o CUIL del cliente; carátula, número, juzgado,
          estado legal y observaciones del judicial, y título del expediente administrativo.
        </p>
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
              {data.items.map((expediente) => {
                const destino = destinoClienteCobro(expediente);
                const navegable = destino.tipo === "cliente";

                return (
                  <article
                    key={expediente.expedienteId}
                    data-expediente-id={expediente.expedienteId}
                    onClick={(event) => abrirCliente(event, destino)}
                    className={cn(
                      "group rounded-lg border bg-card p-4",
                      navegable && "cursor-pointer transition-colors hover:border-primary/40 hover:bg-secondary/15",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <ClienteCobro destino={destino} />
                      </div>
                      {navegable && (
                        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                      )}
                    </div>

                    <JudicialCobro expediente={expediente} className="mt-3 border-t pt-3" />

                    <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
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

                    <div className="mt-4 flex justify-end border-t pt-3">
                      <BotonAlerta onClick={() => setAlerta(expediente)} />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Cliente</th>
                      <th className="px-5 py-3 font-medium">Expediente judicial</th>
                      <th className="px-5 py-3 font-medium">Documento</th>
                      <th className="px-5 py-3 font-medium">Envío</th>
                      <th className="px-5 py-3 font-medium">Seguimiento</th>
                      <th className="px-5 py-3 text-right font-medium">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {data.items.map((expediente) => {
                      const destino = destinoClienteCobro(expediente);
                      const navegable = destino.tipo === "cliente";

                      return (
                        <tr
                          key={expediente.expedienteId}
                          data-expediente-id={expediente.expedienteId}
                          onClick={(event) => abrirCliente(event, destino)}
                          className={cn(
                            "group align-top",
                            navegable && "cursor-pointer transition-colors hover:bg-secondary/25",
                          )}
                        >
                          <td className="w-[28%] px-5 py-4">
                            <ClienteCobro destino={destino} />
                          </td>

                          <td className="px-5 py-4">
                            <JudicialCobro expediente={expediente} className="max-w-80" />
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
