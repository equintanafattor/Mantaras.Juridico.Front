"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  GitBranch,
  Loader2,
  Pencil,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useActualizarExpediente } from "../hooks/useActualizarExpediente";
import { useCambiarEstadoExpediente } from "../hooks/useCambiarEstadoExpediente";
import { useExpediente } from "../hooks/useExpediente";
import type {
  ExpedienteRelacionadoResponse,
  TipoExpediente,
} from "../types/types";

import ExpedienteFormFields, {
  crearActualizarRequestDesdeForm,
  crearFormDesdeExpediente,
  FORM_EXPEDIENTE_INICIAL,
  type ExpedienteFormState,
} from "./ExpedienteFormFields";

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
    form.casoId !== null &&
    form.caratula.trim().length > 0 &&
    (!requierePadre || form.expedientePadreId !== null);

  useEffect(() => {
    if (expedienteQuery.data && !modoEdicion) {
      setForm(crearFormDesdeExpediente(expedienteQuery.data));
    }
  }, [expedienteQuery.data, modoEdicion]);

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
          Volver a expedientes
        </Link>

        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <AlertCircle className="size-6 text-destructive" />

          <h1 className="mt-4 font-semibold">
            No pudimos cargar el expediente
          </h1>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {expedienteQuery.error instanceof Error
              ? expedienteQuery.error.message
              : "El expediente solicitado no existe o no está disponible."}
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
        Volver a expedientes
      </Link>

      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground sm:flex">
            <FileText className="size-5" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              Expediente
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {expediente.caratula}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {expediente.numeroExpediente || "Sin número de expediente"}
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
              Editar expediente
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

      {modoEdicion ? (
        <form className="space-y-6" onSubmit={guardar}>
          <section className="rounded-lg border bg-card p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="font-semibold">Editar expediente</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Modificá los datos procesales y las observaciones internas.
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
                  No pudimos actualizar el expediente
                </p>

                <p className="mt-1 text-muted-foreground">
                  {actualizarMutation.error instanceof Error
                    ? actualizarMutation.error.message
                    : "Revisá los datos e intentá nuevamente."}
                </p>
              </div>
            </div>
          )}

          <footer className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
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
                  ? "¿Dar de baja el expediente?"
                  : "¿Restaurar el expediente?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {accionEstado === "darDeBaja"
                  ? "No podrá darse de baja mientras tenga expedientes derivados activos."
                  : "Solo podrá restaurarse si el caso y su expediente padre se encuentran activos."}
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
              El estado del expediente se actualizó correctamente.
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

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Datos identificatorios y estado del trámite.
                    </p>
                  </div>
                </header>

                <dl className="grid gap-5 p-5 sm:grid-cols-2">
                  <Dato
                    label="Número de expediente"
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

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="border-b bg-muted/30 px-5 py-4">
                  <h2 className="text-sm font-semibold">Observaciones</h2>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Información interna relevante sobre el expediente.
                  </p>
                </header>

                <div className="p-5">
                  {expediente.observaciones?.trim() ? (
                    <p className="whitespace-pre-wrap text-sm leading-7">
                      {expediente.observaciones}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay observaciones registradas.
                    </p>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                  <GitBranch className="size-4 text-primary" />

                  <div>
                    <h2 className="text-sm font-semibold">
                      Jerarquía procesal
                    </h2>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Expediente padre y derivados directos.
                    </p>
                  </div>
                </header>

                <div className="space-y-5 p-5">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Expediente padre
                    </h3>

                    <div className="mt-3">
                      {expediente.expedientePadre ? (
                        <ExpedienteRelacionado
                          expediente={expediente.expedientePadre}
                        />
                      ) : (
                        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                          Este expediente no depende de otro expediente.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Expedientes derivados
                      </h3>

                      <Badge variant="outline">
                        {expediente.expedientesDerivados.length}
                      </Badge>
                    </div>

                    {expediente.expedientesDerivados.length === 0 ? (
                      <div className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        No hay expedientes derivados directos.
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

                  <h2 className="text-sm font-semibold">Caso relacionado</h2>
                </header>

                <div className="p-5">
                  <p className="font-medium leading-6">
                    {expediente.tituloCaso}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Caso #{expediente.casoId}
                  </p>
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

                  <Dato
                    label="Identificador interno"
                    value={`#${expediente.expedienteId}`}
                  />
                </dl>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
