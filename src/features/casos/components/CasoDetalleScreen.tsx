"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import NuevoExpedienteDialog from "@/features/expedientes/components/NuevoExpedienteDialog";
import HistorialObservaciones from "@/features/observaciones/components/HistorialObservaciones";

import { useActualizarCaso } from "../hooks/useActualizarCaso";
import { useCambiarEstadoCaso } from "../hooks/useCambiarEstadoCaso";
import { useCaso } from "../hooks/useCaso";
import type {
  CasoClienteResponse,
  ExpedienteCasoDetalleResponse,
  FaseCaso,
  TipoExpediente,
} from "../types/types";

import CasoFormFields, {
  crearFormDesdeCaso,
  crearRequestDesdeForm,
  FORM_CASO_INICIAL,
  type CasoFormState,
} from "./CasoFormFields";

type CasoDetalleScreenProps = {
  casoId: number;
};

type AccionEstado = "darDeBaja" | "restaurar";

const FASE_LABELS: Record<FaseCaso, string> = {
  Preadministrativa: "Preadministrativa",
  Juicio: "Juicio",
  Postjuicio: "Postjuicio",
};

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

function FaseBadge({ fase }: { fase: FaseCaso }) {
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

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm leading-6">{value}</dd>
    </div>
  );
}

function ParticipanteCard({
  participante,
}: {
  participante: CasoClienteResponse;
}) {
  return (
    <Link
      href={`/clientes/${participante.clienteId}`}
      className="group rounded-md border bg-background p-4 transition-colors hover:border-primary/25 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <UserRound className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium group-hover:text-primary">
              {participante.nombreCompleto}
            </p>

            {participante.esPrincipal && (
              <Badge
                variant="outline"
                className="rounded-sm bg-accent text-accent-foreground"
              >
                <Star className="size-3" />
                Principal
              </Badge>
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {participante.tipoParticipacion}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-4">
            <Dato label="DNI" value={mostrarValor(participante.dni)} />
            <Dato label="CUIL" value={mostrarValor(participante.cuil)} />
          </dl>
        </div>
      </div>
    </Link>
  );
}

function ExpedienteCard({
  expediente,
}: {
  expediente: ExpedienteCasoDetalleResponse;
}) {
  return (
    <Link
      href={`/expedientes/${expediente.expedienteId}`}
      className="group flex items-start gap-3 border-b px-4 py-4 transition-colors last:border-b-0 hover:bg-secondary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground">
        <FileText className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="line-clamp-2 text-sm font-medium leading-5 group-hover:text-primary">
            {expediente.caratula}
          </p>

          <TipoExpedienteBadge tipo={expediente.tipoExpediente} />
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {mostrarValor(expediente.numeroExpediente)}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {mostrarValor(expediente.juzgado)}

          {expediente.fechaInicio
            ? ` · ${formatearFecha(expediente.fechaInicio)}`
            : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden sm:inline-flex">
          <EstadoBadge activo={expediente.activo} />
        </span>

        <ChevronRight className="mt-2 size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

function DetalleSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-9 w-36" />

      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function CasoDetalleScreen({ casoId }: CasoDetalleScreenProps) {
  const [form, setForm] = useState<CasoFormState>(FORM_CASO_INICIAL);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [accionEstado, setAccionEstado] = useState<AccionEstado | null>(null);
  const [nuevoExpedienteOpen, setNuevoExpedienteOpen] = useState(false);

  const casoQuery = useCaso(casoId);
  const actualizarMutation = useActualizarCaso();
  const cambiarEstadoMutation = useCambiarEstadoCaso();

  const operacionPendiente =
    actualizarMutation.isPending || cambiarEstadoMutation.isPending;

  const formularioValido =
    form.titulo.trim().length > 0 &&
    form.clientes.length > 0 &&
    form.clientes.filter((cliente) => cliente.esPrincipal).length === 1;

  useEffect(() => {
    if (casoQuery.data && !modoEdicion) {
      setForm(crearFormDesdeCaso(casoQuery.data));
    }
  }, [casoQuery.data, modoEdicion]);

  const resetearMensajes = () => {
    if (actualizarMutation.isError || actualizarMutation.isSuccess) {
      actualizarMutation.reset();
    }

    if (cambiarEstadoMutation.isError || cambiarEstadoMutation.isSuccess) {
      cambiarEstadoMutation.reset();
    }
  };

  const actualizarForm = (nextForm: CasoFormState) => {
    setForm(nextForm);
    resetearMensajes();
  };

  const iniciarEdicion = () => {
    if (!casoQuery.data) {
      return;
    }

    setForm(crearFormDesdeCaso(casoQuery.data));
    setAccionEstado(null);
    resetearMensajes();
    setModoEdicion(true);
  };

  const cancelarEdicion = () => {
    if (operacionPendiente) {
      return;
    }

    if (casoQuery.data) {
      setForm(crearFormDesdeCaso(casoQuery.data));
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
        casoId,
        request: crearRequestDesdeForm(form),
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
        casoId,
        activar: accionEstado === "restaurar",
      });

      setAccionEstado(null);
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  if (casoQuery.isLoading) {
    return <DetalleSkeleton />;
  }

  if (casoQuery.isError || !casoQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/casos"
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          Volver a casos
        </Link>

        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <AlertCircle className="size-6 text-destructive" />

          <h1 className="mt-4 font-semibold">No pudimos cargar el caso</h1>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {casoQuery.error instanceof Error
              ? casoQuery.error.message
              : "El caso solicitado no existe o no está disponible."}
          </p>

          <Button
            variant="outline"
            className="mt-5"
            onClick={() => casoQuery.refetch()}
          >
            Reintentar
          </Button>
        </section>
      </div>
    );
  }

  const caso = casoQuery.data;
  const clientePrincipal =
    caso.clientes.find((cliente) => cliente.esPrincipal) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/casos"
        className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Volver a casos
      </Link>

      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground sm:flex">
            <BriefcaseBusiness className="size-5" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              Caso
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {caso.titulo}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {mostrarValor(caso.tipoTramite)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <FaseBadge fase={caso.faseInterna} />
              <EstadoBadge activo={caso.activo} />
            </div>
          </div>
        </div>

        {!modoEdicion && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            {caso.activo && (
              <Button
                type="button"
                variant="outline"
                disabled={operacionPendiente || accionEstado !== null}
                onClick={() => setNuevoExpedienteOpen(true)}
              >
                <Plus />
                Nuevo expediente
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              disabled={operacionPendiente || accionEstado !== null}
              onClick={iniciarEdicion}
            >
              <Pencil />
              Editar caso
            </Button>

            <Button
              type="button"
              variant={caso.activo ? "destructive" : "default"}
              disabled={operacionPendiente || accionEstado !== null}
              onClick={() =>
                iniciarCambioEstado(caso.activo ? "darDeBaja" : "restaurar")
              }
            >
              {caso.activo ? "Dar de baja" : "Restaurar"}
            </Button>
          </div>
        )}
      </header>

      {modoEdicion ? (
        <form className="space-y-6" onSubmit={guardar}>
          <section className="rounded-lg border bg-card p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="font-semibold">Editar caso</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Modificá los datos internos y sus participantes.
              </p>
            </div>

            <CasoFormFields
              form={form}
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
                  No pudimos actualizar el caso
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
                  ? "¿Dar de baja el caso?"
                  : "¿Restaurar el caso?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {accionEstado === "darDeBaja"
                  ? "No podrá darse de baja mientras tenga expedientes activos."
                  : "El caso volverá a aparecer entre los activos. Sus expedientes deberán restaurarse individualmente."}
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
              El estado del caso se actualizó correctamente.
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
                  : "No pudimos cambiar el estado del caso."}
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
                      Información del caso
                    </h2>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Clasificación y seguimiento interno.
                    </p>
                  </div>
                </header>

                <dl className="grid gap-5 p-5 sm:grid-cols-2">
                  <Dato
                    label="Fase interna"
                    value={FASE_LABELS[caso.faseInterna]}
                  />

                  <Dato
                    label="Tipo de trámite"
                    value={mostrarValor(caso.tipoTramite)}
                  />
                </dl>
              </section>

              <HistorialObservaciones entidad="casos" propietarioId={casoId} />

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <UserRound className="size-4 text-primary" />

                    <div>
                      <h2 className="text-sm font-semibold">Participantes</h2>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Clientes relacionados con el caso.
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline">{caso.clientes.length}</Badge>
                </header>

                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  {caso.clientes.map((participante) => (
                    <ParticipanteCard
                      key={participante.clienteId}
                      participante={participante}
                    />
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-primary" />

                    <div>
                      <h2 className="text-sm font-semibold">Expedientes</h2>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Piezas judiciales relacionadas con el caso.
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline">{caso.expedientes.length}</Badge>
                </header>

                {caso.expedientes.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium">
                      Sin expedientes asociados
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Este caso todavía no tiene expedientes registrados.
                    </p>
                  </div>
                ) : (
                  <div>
                    {caso.expedientes.map((expediente) => (
                      <ExpedienteCard
                        key={expediente.expedienteId}
                        expediente={expediente}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="hidden overflow-hidden rounded-lg border bg-card lg:block">
                <header className="border-b bg-muted/30 px-5 py-4">
                  <h2 className="text-sm font-semibold">Cliente principal</h2>
                </header>

                <div className="p-5">
                  {clientePrincipal ? (
                    <>
                      <Link
                        href={`/clientes/${clientePrincipal.clienteId}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {clientePrincipal.nombreCompleto}
                      </Link>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {clientePrincipal.tipoParticipacion}
                      </p>

                      <dl className="mt-5 space-y-4">
                        <Dato
                          label="DNI"
                          value={mostrarValor(clientePrincipal.dni)}
                        />

                        <Dato
                          label="CUIL"
                          value={mostrarValor(clientePrincipal.cuil)}
                        />
                      </dl>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay un cliente principal definido.
                    </p>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="border-b bg-muted/30 px-5 py-4">
                  <h2 className="text-sm font-semibold">Registro</h2>
                </header>

                <dl className="space-y-5 p-5">
                  <Dato
                    label="Fecha de creación"
                    value={formatearFechaHora(caso.fechaCreacion)}
                  />

                  <Dato
                    label="Última modificación"
                    value={formatearFechaHora(caso.fechaModificacion)}
                  />

                  <Dato
                    label="Identificador interno"
                    value={`#${caso.casoId}`}
                  />
                </dl>
              </section>
            </aside>
          </div>
        </>
      )}

      <NuevoExpedienteDialog
        open={nuevoExpedienteOpen}
        onOpenChange={setNuevoExpedienteOpen}
        casoIdInicial={casoId}
        bloquearCaso
        onExpedienteCreado={() => {
          casoQuery.refetch();
        }}
      />
    </div>
  );
}
