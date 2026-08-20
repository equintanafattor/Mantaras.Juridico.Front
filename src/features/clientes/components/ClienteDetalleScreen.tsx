"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useActualizarCliente } from "../hooks/useActualizarCliente";
import { useCambiarEstadoCliente } from "../hooks/useCambiarEstadoCliente";
import { useCliente } from "../hooks/useCliente";
import type {
  CasoClienteDetalleResponse,
  ExpedienteClienteDetalleResponse,
} from "../types/types";

import ClienteFormFields, {
  crearFormDesdeCliente,
  crearRequestDesdeForm,
  FORM_CLIENTE_INICIAL,
  type ClienteFormState,
} from "./ClienteFormFields";

import HistorialObservaciones from "@/features/observaciones/components/HistorialObservaciones";

type ClienteDetalleScreenProps = {
  clienteId: number;
};

type AccionEstado = "darDeBaja" | "reactivar";

function mostrarValor(value: string | number | null) {
  if (typeof value === "number") {
    return value.toString();
  }

  return value?.trim() || "No informado";
}

function formatearDni(dni: string | null) {
  if (!dni) {
    return "No informado";
  }

  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatearCuil(cuil: string | null) {
  if (!cuil) {
    return "No informado";
  }

  const numeros = cuil.replace(/\D/g, "");

  if (numeros.length !== 11) {
    return cuil;
  }

  return `${numeros.slice(0, 2)}-${numeros.slice(2, 10)}-${numeros.slice(10)}`;
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

function Dato({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 text-sm leading-6">{value}</dd>
    </div>
  );
}

function ExpedienteRelacionado({
  expediente,
}: {
  expediente: ExpedienteClienteDetalleResponse;
}) {
  return (
    <Link
      href={`/expedientes/${expediente.expedienteId}`}
      className="group flex items-start gap-3 rounded-md border bg-background p-3 transition-colors hover:border-primary/25 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileText className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-5 group-hover:text-primary">
          {mostrarValor(expediente.caratula)}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {mostrarValor(expediente.numeroExpediente)}
        </p>

        <div className="mt-2">
          <EstadoBadge activo={expediente.activo} />
        </div>
      </div>

      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/50" />
    </Link>
  );
}

function CasoRelacionado({ caso }: { caso: CasoClienteDetalleResponse }) {
  return (
    <article className="overflow-hidden rounded-md border bg-background">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <BriefcaseBusiness className="size-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/casos/${caso.casoId}`}
                className="line-clamp-2 font-medium leading-5 hover:text-primary hover:underline"
              >
                {caso.titulo}
              </Link>

              <EstadoBadge activo={caso.activo} />

              {caso.esPrincipal && (
                <Badge
                  variant="outline"
                  className="rounded-sm bg-accent text-accent-foreground"
                >
                  Cliente principal
                </Badge>
              )}
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <Dato
                label="Participación"
                value={mostrarValor(caso.tipoParticipacion)}
              />

              <Dato
                label="Fase interna"
                value={mostrarValor(caso.faseInterna)}
              />

              <Dato
                label="Tipo de trámite"
                value={mostrarValor(caso.tipoTramite)}
              />
            </dl>
          </div>
        </div>
      </div>

      <div className="border-t bg-muted/15 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Expedientes
          </p>

          <Badge variant="outline">{caso.expedientes.length}</Badge>
        </div>

        {caso.expedientes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Este caso no tiene expedientes registrados.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {caso.expedientes.map((expediente) => (
              <ExpedienteRelacionado
                key={expediente.expedienteId}
                expediente={expediente}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function DetalleSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-9 w-40" />

      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ClienteDetalleScreen({
  clienteId,
}: ClienteDetalleScreenProps) {
  const [form, setForm] = useState<ClienteFormState>(FORM_CLIENTE_INICIAL);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [accionEstado, setAccionEstado] = useState<AccionEstado | null>(null);

  const clienteQuery = useCliente(clienteId);
  const actualizarMutation = useActualizarCliente();
  const cambiarEstadoMutation = useCambiarEstadoCliente();

  const operacionPendiente =
    actualizarMutation.isPending || cambiarEstadoMutation.isPending;

  const formularioValido =
    form.nombre.trim().length > 0 && form.apellido.trim().length > 0;

  useEffect(() => {
    if (clienteQuery.data && !modoEdicion) {
      setForm(crearFormDesdeCliente(clienteQuery.data));
    }
  }, [clienteQuery.data, modoEdicion]);

  const resetearMensajes = () => {
    if (actualizarMutation.isError || actualizarMutation.isSuccess) {
      actualizarMutation.reset();
    }

    if (cambiarEstadoMutation.isError || cambiarEstadoMutation.isSuccess) {
      cambiarEstadoMutation.reset();
    }
  };

  const actualizarCampo = (campo: keyof ClienteFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [campo]: value,
    }));

    resetearMensajes();
  };

  const iniciarEdicion = () => {
    if (!clienteQuery.data) {
      return;
    }

    setForm(crearFormDesdeCliente(clienteQuery.data));
    setAccionEstado(null);
    resetearMensajes();
    setModoEdicion(true);
  };

  const cancelarEdicion = () => {
    if (operacionPendiente) {
      return;
    }

    if (clienteQuery.data) {
      setForm(crearFormDesdeCliente(clienteQuery.data));
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
        clienteId,
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
        clienteId,
        activar: accionEstado === "reactivar",
      });

      setAccionEstado(null);
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  if (clienteQuery.isLoading) {
    return <DetalleSkeleton />;
  }

  if (clienteQuery.isError || !clienteQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/clientes"
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          Volver a clientes
        </Link>

        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <AlertCircle className="size-6 text-destructive" />

          <h1 className="mt-4 font-semibold">No pudimos cargar el cliente</h1>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {clienteQuery.error instanceof Error
              ? clienteQuery.error.message
              : "El cliente solicitado no existe o no está disponible."}
          </p>

          <Button
            variant="outline"
            className="mt-5"
            onClick={() => clienteQuery.refetch()}
          >
            Reintentar
          </Button>
        </section>
      </div>
    );
  }

  const cliente = clienteQuery.data;
  const totalExpedientes = cliente.casos.reduce(
    (total, caso) => total + caso.expedientes.length,
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/clientes"
        className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Volver a clientes
      </Link>

      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground sm:flex">
            <UserRound className="size-5" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              Cliente
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {cliente.nombreCompleto}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {cliente.localidad?.trim() || "Localidad no informada"}
            </p>

            <div className="mt-4">
              <EstadoBadge activo={cliente.activo} />
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
              Editar cliente
            </Button>

            <Button
              type="button"
              variant={cliente.activo ? "destructive" : "default"}
              disabled={operacionPendiente || accionEstado !== null}
              onClick={() =>
                iniciarCambioEstado(cliente.activo ? "darDeBaja" : "reactivar")
              }
            >
              {cliente.activo ? "Dar de baja" : "Reactivar"}
            </Button>
          </div>
        )}
      </header>

      {modoEdicion ? (
        <form className="space-y-6" onSubmit={guardar}>
          <section className="rounded-lg border bg-card p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="font-semibold">Editar cliente</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Modificá sus datos personales y de contacto.
              </p>
            </div>

            <ClienteFormFields
              form={form}
              modo="editar"
              disabled={operacionPendiente}
              onChange={actualizarCampo}
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
                  No pudimos actualizar el cliente
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
                  ? "¿Dar de baja al cliente?"
                  : "¿Reactivar al cliente?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {accionEstado === "darDeBaja"
                  ? "El cliente dejará de aparecer entre los activos, pero conservará sus datos, casos y expedientes."
                  : "El cliente volverá a aparecer normalmente en el listado de activos."}
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
                      : "Confirmar reactivación"}
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
              El estado del cliente se actualizó correctamente.
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
                  : "No pudimos cambiar el estado del cliente."}
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                  <CalendarDays className="size-4 text-primary" />

                  <div>
                    <h2 className="text-sm font-semibold">Datos personales</h2>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Identificación y fecha de nacimiento.
                    </p>
                  </div>
                </header>

                <dl className="grid gap-5 p-5 sm:grid-cols-3">
                  <Dato label="DNI" value={formatearDni(cliente.dni)} />

                  <Dato label="CUIL" value={formatearCuil(cliente.cuil)} />

                  <Dato
                    label="Fecha de nacimiento"
                    value={formatearFecha(cliente.fechaNacimiento)}
                  />
                </dl>
              </section>

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                  <Phone className="size-4 text-primary" />

                  <div>
                    <h2 className="text-sm font-semibold">
                      Contacto y domicilio
                    </h2>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Canales de contacto y ubicación registrada.
                    </p>
                  </div>
                </header>

                <dl className="grid gap-5 p-5 sm:grid-cols-2">
                  <Dato
                    label="Teléfono"
                    value={
                      cliente.telefono?.trim() ? (
                        <a
                          href={`tel:${cliente.telefono}`}
                          className="hover:text-primary hover:underline"
                        >
                          {cliente.telefono}
                        </a>
                      ) : (
                        "No informado"
                      )
                    }
                  />

                  <Dato
                    label="Email"
                    value={
                      cliente.email?.trim() ? (
                        <a
                          href={`mailto:${cliente.email}`}
                          className="break-words hover:text-primary hover:underline"
                        >
                          {cliente.email}
                        </a>
                      ) : (
                        "No informado"
                      )
                    }
                  />

                  <Dato
                    label="Domicilio"
                    value={mostrarValor(cliente.domicilio)}
                    className="sm:col-span-2"
                  />

                  <Dato
                    label="Localidad"
                    value={mostrarValor(cliente.localidad)}
                  />

                  <Dato
                    label="Provincia"
                    value={mostrarValor(cliente.provincia)}
                  />
                </dl>
              </section>

              <HistorialObservaciones
                entidad="clientes"
                propietarioId={clienteId}
              />

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="flex items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <BriefcaseBusiness className="size-4 text-primary" />

                    <div>
                      <h2 className="text-sm font-semibold">
                        Casos relacionados
                      </h2>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Participación y expedientes asociados.
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline">{cliente.casos.length}</Badge>
                </header>

                {cliente.casos.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium">
                      Sin casos relacionados
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Este cliente todavía no participa en ningún caso.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-5">
                    {cliente.casos.map((caso) => (
                      <CasoRelacionado key={caso.casoId} caso={caso} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="hidden overflow-hidden rounded-lg border bg-card lg:block">
                <header className="border-b bg-muted/30 px-5 py-4">
                  <h2 className="text-sm font-semibold">Resumen</h2>
                </header>

                <dl className="space-y-5 p-5">
                  <Dato
                    label="Casos relacionados"
                    value={cliente.casos.length}
                  />

                  <Dato
                    label="Expedientes relacionados"
                    value={totalExpedientes}
                  />

                  <Dato
                    label="Estado"
                    value={cliente.activo ? "Activo" : "Inactivo"}
                  />
                </dl>
              </section>

              <section className="overflow-hidden rounded-lg border bg-card">
                <header className="border-b bg-muted/30 px-5 py-4">
                  <h2 className="text-sm font-semibold">Registro</h2>
                </header>

                <dl className="space-y-5 p-5">
                  <Dato
                    label="Fecha de creación"
                    value={formatearFechaHora(cliente.fechaCreacion)}
                  />

                  <Dato
                    label="Última modificación"
                    value={formatearFechaHora(cliente.fechaModificacion)}
                  />

                  <Dato
                    label="Identificador interno"
                    value={`#${cliente.clienteId}`}
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
