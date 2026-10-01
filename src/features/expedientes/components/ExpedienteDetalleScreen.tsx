"use client";

import AgendaContexto from "@/features/agenda/components/AgendaContexto";
import { FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  FileText,
  GitBranch,
  Loader2,
  Pencil,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCaso } from "@/features/casos/hooks/useCaso";

import { useActualizarExpediente } from "../hooks/useActualizarExpediente";
import { useCambiarEstadoExpediente } from "../hooks/useCambiarEstadoExpediente";
import { useExpediente } from "../hooks/useExpediente";
import type {
  CasoExpedienteResponse,
  ExpedienteRelacionadoResponse,
  TipoExpediente,
} from "../types/types";

import ExpedienteFormFields, {
  crearActualizarRequestDesdeForm,
  crearFormDesdeExpediente,
  FORM_EXPEDIENTE_INICIAL,
  type ExpedienteFormState,
} from "./ExpedienteFormFields";

import HistorialObservaciones from "@/features/observaciones/components/HistorialObservaciones";

type ExpedienteDetalleScreenProps = {
  expedienteId: number;
};

type AccionEstado = "darDeBaja" | "restaurar";

const TIPO_EXPEDIENTE_LABELS: Record<TipoExpediente, string> = {
  Principal: "Principal",
  Incidente: "Incidente",
  Apelacion: "Apelación",
  Ejecucion: "Ejecución",
};

function mostrarValor(value: string | null) {
  return value?.trim() || "No informado";
}

function formatearFecha(value: string | null) {
  if (!value) {
    return "No informada";
  }

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatearFechaHora(value: string | null) {
  if (!value) {
    return "No registrada";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function EstadoBadge({ activo }: { activo: boolean }) {
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

function TipoBadge({ tipo }: { tipo: TipoExpediente }) {
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

function Dato({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm leading-6">{value}</dd>
    </div>
  );
}

function ExpedienteRelacionado({
  expediente,
  etiqueta,
}: {
  expediente: ExpedienteRelacionadoResponse;
  etiqueta?: string;
}) {
  return (
    <Link
      href={`/expedientes/${expediente.expedienteId}`}
      className="group flex items-start gap-3 rounded-md border bg-background p-4 transition-colors hover:border-primary/25 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <FileText className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        {etiqueta && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {etiqueta}
          </p>
        )}

        <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 group-hover:text-primary">
          {expediente.caratula}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {expediente.numeroExpediente || "Sin número"}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <TipoBadge tipo={expediente.tipoExpediente} />
          <EstadoBadge activo={expediente.activo} />
        </div>
      </div>
    </Link>
  );
}

function ClientesCasoRelacionado({ casoId }: { casoId: number }) {
  const casoQuery = useCaso(casoId);

  if (casoQuery.isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (casoQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          No pudimos cargar los clientes relacionados.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => casoQuery.refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!casoQuery.data?.clientes.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No hay clientes relacionados.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {[...casoQuery.data.clientes]
        .sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal))
        .map((cliente) => (
          <Link
            key={cliente.clienteId}
            href={`/clientes/${cliente.clienteId}`}
            className="group/cliente flex items-center gap-3 p-4 transition-colors hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <UserRound className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium group-hover/cliente:text-primary">
                  {cliente.nombreCompleto}
                </p>
                {cliente.esPrincipal && (
                  <Badge variant="secondary">Principal</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {cliente.dni
                  ? `DNI ${cliente.dni}`
                  : cliente.cuil
                    ? `CUIL ${cliente.cuil}`
                    : "Sin documento informado"}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover/cliente:translate-x-0.5 group-hover/cliente:text-primary" />
          </Link>
        ))}
    </div>
  );
}

function CasoRelacionadoCard({ caso }: { caso: CasoExpedienteResponse }) {
  return (
    <Link
      href={`/casos/${caso.casoId}`}
      className="group block border-b p-4 transition-colors last:border-b-0 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium leading-6 group-hover:text-primary">
            {caso.titulo}
          </p>
          <dl className="mt-3 grid gap-2 text-xs text-muted-foreground">
            <div>
              <dt className="inline font-medium">Tipo de beneficio: </dt>
              <dd className="inline">
                {caso.tipoBeneficioNombre?.trim() || "No informado"}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Número de beneficio: </dt>
              <dd className="inline">
                {caso.numeroBeneficio?.trim() || "No informado"}
              </dd>
            </div>
          </dl>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

function DetalleSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-9 w-40" />

      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ExpedienteDetalleScreen({
  expedienteId,
}: ExpedienteDetalleScreenProps) {
  const [form, setForm] = useState<ExpedienteFormState>(
    FORM_EXPEDIENTE_INICIAL,
  );
  const [modoEdicion, setModoEdicion] = useState(false);
  const [accionEstado, setAccionEstado] = useState<AccionEstado | null>(null);

  const expedienteQuery = useExpediente(expedienteId);
  const actualizarMutation = useActualizarExpediente();
  const cambiarEstadoMutation = useCambiarEstadoExpediente();

  const operacionPendiente =
    actualizarMutation.isPending || cambiarEstadoMutation.isPending;

  const requierePadre = form.tipoExpediente !== "Principal";

  const formularioValido =
    form.casoIds.length > 0 &&
    form.caratula.trim().length > 0 &&
    (!requierePadre || form.expedientePadreId !== null);

  const resetearMensajes = () => {
    if (actualizarMutation.isError || actualizarMutation.isSuccess) {
      actualizarMutation.reset();
    }

    if (cambiarEstadoMutation.isError || cambiarEstadoMutation.isSuccess) {
      cambiarEstadoMutation.reset();
    }
  };

  const actualizarForm = (nextForm: ExpedienteFormState) => {
    setForm(nextForm);
    resetearMensajes();
  };

  const iniciarEdicion = () => {
    if (!expedienteQuery.data) {
      return;
    }

    setForm(crearFormDesdeExpediente(expedienteQuery.data));
    setAccionEstado(null);
    resetearMensajes();
    setModoEdicion(true);
  };

  const cancelarEdicion = () => {
    if (operacionPendiente) {
      return;
    }

    if (expedienteQuery.data) {
      setForm(crearFormDesdeExpediente(expedienteQuery.data));
    }

    actualizarMutation.reset();
    setModoEdicion(false);
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formularioValido) {
      return;
    }

    cambiarEstadoMutation.reset();

    try {
      await actualizarMutation.mutateAsync({
        expedienteId,
        request: crearActualizarRequestDesdeForm(form),
      });

      setModoEdicion(false);
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  const iniciarCambioEstado = (accion: AccionEstado) => {
    setModoEdicion(false);
    actualizarMutation.reset();
    cambiarEstadoMutation.reset();
    setAccionEstado(accion);
  };

  const confirmarCambioEstado = async () => {
    if (accionEstado === null) {
      return;
    }

    try {
      await cambiarEstadoMutation.mutateAsync({
        expedienteId,
        activar: accionEstado === "restaurar",
      });

      setAccionEstado(null);
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  if (expedienteQuery.isLoading) {
    return <DetalleSkeleton />;
  }

  if (expedienteQuery.isError || !expedienteQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/expedientes"
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          Volver a expedientes judiciales
        </Link>

        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <AlertCircle className="size-6 text-destructive" />

          <h1 className="mt-4 font-semibold">
            No pudimos cargar el expediente judicial
          </h1>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {expedienteQuery.error instanceof Error
              ? expedienteQuery.error.message
              : "El expediente judicial solicitado no existe o no está disponible."}
          </p>

          <Button
            variant="outline"
            className="mt-5"
            onClick={() => expedienteQuery.refetch()}
          >
            Reintentar
          </Button>
        </section>
      </div>
    );
  }

  const expediente = expedienteQuery.data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/expedientes"
        className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Volver a expedientes judiciales
      </Link>

      <header className="flex flex-col gap-5 rounded-lg border border-sky-800/15 border-l-4 border-l-sky-700 bg-sky-50/45 p-5 lg:flex-row lg:items-start lg:justify-between dark:bg-sky-950/10">
        <div className="flex min-w-0 items-start gap-4">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground sm:flex">
            <FileText className="size-5" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              Expediente judicial
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {expediente.caratula}
            </h1>

            <p className="mt-2 flex flex-wrap gap-x-2 text-sm text-muted-foreground sm:text-base">
              <span>
                {expediente.numeroExpediente ||
                  "Sin número de expediente judicial"}
              </span>
              <span aria-hidden="true">·</span>
              <span>{expediente.juzgado?.trim() || "Juzgado no informado"}</span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <TipoBadge tipo={expediente.tipoExpediente} />
              <EstadoBadge activo={expediente.activo} />
            </div>
          </div>
        </div>

        {!modoEdicion && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={operacionPendiente || accionEstado !== null}
              onClick={iniciarEdicion}
            >
              <Pencil />
              Editar expediente judicial
            </Button>

            <Button
              type="button"
              variant={expediente.activo ? "destructive" : "default"}
              disabled={operacionPendiente || accionEstado !== null}
              onClick={() =>
                iniciarCambioEstado(
                  expediente.activo ? "darDeBaja" : "restaurar",
                )
              }
            >
              {expediente.activo ? "Dar de baja" : "Restaurar"}
            </Button>
          </div>
        )}
      </header>

      {!modoEdicion ? <AgendaContexto key={`expediente-${expediente.expedienteId}`} contexto={{ tipo: "expediente", id: expediente.expedienteId, nombre: expediente.caratula }} activo={expediente.activo} /> : null}

      {modoEdicion ? (
        <form className="space-y-6" onSubmit={guardar}>
          <section className="rounded-lg border bg-card p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="font-semibold">Editar expediente judicial</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Modificá los datos procesales y sus relaciones.|
              </p>
            </div>

            <ExpedienteFormFields
              form={form}
              modo="editar"
              expedienteActualId={expedienteId}
              disabled={operacionPendiente}
              onChange={actualizarForm}
            />
          </section>

          {actualizarMutation.isError && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <div>
                <p className="font-medium text-destructive">
                  No pudimos actualizar el expediente judicial
                </p>

                <p className="mt-1 text-muted-foreground">
                  {actualizarMutation.error instanceof Error
                    ? actualizarMutation.error.message
                    : "Revisá los datos e intentá nuevamente."}
                </p>
              </div>
            </div>
          )}

          <footer className="sticky bottom-4 z-10 flex flex-col-reverse gap-2 rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={operacionPendiente}
              onClick={cancelarEdicion}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={operacionPendiente || !formularioValido}
            >
              {actualizarMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}

              {actualizarMutation.isPending
                ? "Guardando..."
                : "Guardar cambios"}
            </Button>
          </footer>
        </form>
      ) : (
        <>
          {accionEstado && (
            <section className="rounded-lg border border-sidebar-primary/30 bg-accent/45 p-5">
              <h2 className="font-medium">
                {accionEstado === "darDeBaja"
                  ? "¿Dar de baja el expediente judicial?"
                  : "¿Restaurar el expediente judicial?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {accionEstado === "darDeBaja"
                  ? "No podrá darse de baja mientras tenga expedientes judiciales relacionados activos."
                  : "Solo podrá restaurarse si todos sus expedientes administrativos y su expediente judicial de origen se encuentran activos."}
              </p>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={cambiarEstadoMutation.isPending}
                  onClick={() => setAccionEstado(null)}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  variant={
                    accionEstado === "darDeBaja" ? "destructive" : "default"
                  }
                  disabled={cambiarEstadoMutation.isPending}
                  onClick={confirmarCambioEstado}
                >
                  {cambiarEstadoMutation.isPending && (
                    <Loader2 className="animate-spin" />
                  )}

                  {cambiarEstadoMutation.isPending
                    ? "Procesando..."
                    : accionEstado === "darDeBaja"
                      ? "Confirmar baja"
                      : "Confirmar restauración"}
                </Button>
              </div>
            </section>
          )}

          {actualizarMutation.isSuccess && (
            <div
              role="status"
              className="rounded-lg border border-emerald-700/20 bg-emerald-600/5 p-4 text-sm text-emerald-800 dark:text-emerald-300"
            >
              Los cambios se guardaron correctamente.
            </div>
          )}

          {cambiarEstadoMutation.isSuccess && (
            <div
              role="status"
              className="rounded-lg border border-emerald-700/20 bg-emerald-600/5 p-4 text-sm text-emerald-800 dark:text-emerald-300"
            >
              El estado del expediente judicial se actualizó correctamente.
            </div>
          )}

          {cambiarEstadoMutation.isError && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <p className="text-muted-foreground">
                {cambiarEstadoMutation.error instanceof Error
                  ? cambiarEstadoMutation.error.message
                  : "No pudimos cambiar el estado del expediente."}
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                  <CalendarDays className="size-4 text-primary" />

                  <div>
                    <h2 className="text-sm font-semibold">
                      Información procesal
                    </h2>
                  </div>
                </header>

                <dl className="grid gap-5 p-5 sm:grid-cols-2">
                  <Dato
                    label="Número de expediente judicial"
                    value={mostrarValor(expediente.numeroExpediente)}
                  />

                  <Dato
                    label="Fecha de inicio"
                    value={formatearFecha(expediente.fechaInicio)}
                  />

                  <Dato
                    label="Juzgado o tribunal"
                    value={mostrarValor(expediente.juzgado)}
                  />

                  <Dato
                    label="Estado legal"
                    value={mostrarValor(expediente.estadoLegal)}
                  />

                  <Dato
                    label="Carátula"
                    value={expediente.caratula}
                    className="sm:col-span-2"
                  />
                </dl>
              </section>

              <HistorialObservaciones
                entidad="expedientes"
                propietarioId={expedienteId}
              />

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                  <GitBranch className="size-4 text-primary" />

                  <div>
                    <h2 className="text-sm font-semibold">
                      Jerarquía de expedientes
                    </h2>
                  </div>
                </header>

                <div className="space-y-5 p-5">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Expediente judicial de origen
                    </h3>

                    <div className="mt-3">
                      {expediente.expedientePadre ? (
                        <ExpedienteRelacionado
                          expediente={expediente.expedientePadre}
                        />
                      ) : (
                        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                          Este expediente judicial no depende de otro expediente.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Expedientes judiciales relacionados
                      </h3>

                      <Badge variant="outline">
                        {expediente.expedientesDerivados.length}
                      </Badge>
                    </div>

                    {expediente.expedientesDerivados.length === 0 ? (
                      <div className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        No hay expedientes judiciales relacionados directos.
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {expediente.expedientesDerivados.map((derivado) => (
                          <ExpedienteRelacionado
                            key={derivado.expedienteId}
                            expediente={derivado}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                  <BriefcaseBusiness className="size-4 text-primary" />

                  <h2 className="flex-1 text-sm font-semibold">
                    {expediente.casos.length === 1
                      ? "Expediente administrativo relacionado"
                      : "Expedientes administrativos relacionados"}
                  </h2>
                </header>
                <div>
                  {expediente.casos.map((caso) => (
                    <CasoRelacionadoCard key={caso.casoId} caso={caso} />
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                  <UserRound className="size-4 text-primary" />

                  <h2 className="text-sm font-semibold">
                    Clientes relacionados
                  </h2>
                </header>
                <div className="divide-y">
                  {expediente.casos.map((caso) => (
                    <div key={caso.casoId}>
                      {expediente.casos.length > 1 && (
                        <p className="border-b bg-muted/10 px-4 py-2 text-xs font-medium text-muted-foreground">
                          {caso.titulo}
                        </p>
                      )}
                      <ClientesCasoRelacionado casoId={caso.casoId} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="border-b bg-muted/30 px-5 py-4">
                  <h2 className="text-sm font-semibold">Registro</h2>
                </header>

                <dl className="space-y-5 p-5">
                  <Dato
                    label="Fecha de creación"
                    value={formatearFechaHora(expediente.fechaCreacion)}
                  />

                  <Dato
                    label="Última modificación"
                    value={formatearFechaHora(expediente.fechaModificacion)}
                  />

{/*                   <Dato
                    label="Identificador interno"
                    value={`#${expediente.expedienteId}`}
                  /> */}
                </dl>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
