"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  FileText,
  Loader2,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { useActualizarCliente } from "../hooks/useActualizarCliente";
import { useCambiarEstadoCliente } from "../hooks/useCambiarEstadoCliente";
import { useCliente } from "../hooks/useCliente";

import ClienteFormFields, {
  crearFormDesdeCliente,
  crearRequestDesdeForm,
  FORM_CLIENTE_INICIAL,
  type ClienteFormState,
} from "./ClienteFormFields";

type ClienteDetalleDialogProps = {
  clienteId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AccionEstado = "darDeBaja" | "reactivar";

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

export default function ClienteDetalleDialog({
  clienteId,
  open,
  onOpenChange,
}: ClienteDetalleDialogProps) {
  const [form, setForm] = useState<ClienteFormState>(FORM_CLIENTE_INICIAL);
  const [accionEstado, setAccionEstado] = useState<AccionEstado | null>(null);

  const clienteQuery = useCliente(clienteId, open);
  const actualizarMutation = useActualizarCliente();
  const cambiarEstadoMutation = useCambiarEstadoCliente();

  const operacionPendiente =
    actualizarMutation.isPending || cambiarEstadoMutation.isPending;

  const formularioValido =
    form.nombre.trim().length > 0 && form.apellido.trim().length > 0;

  useEffect(() => {
    if (clienteQuery.data) {
      setForm(crearFormDesdeCliente(clienteQuery.data));
    }
  }, [clienteQuery.data]);

  const actualizarCampo = (campo: keyof ClienteFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [campo]: value,
    }));

    if (actualizarMutation.isError || actualizarMutation.isSuccess) {
      actualizarMutation.reset();
    }

    if (cambiarEstadoMutation.isError || cambiarEstadoMutation.isSuccess) {
      cambiarEstadoMutation.reset();
    }
  };

  const cambiarApertura = (nextOpen: boolean) => {
    if (!nextOpen && operacionPendiente) {
      return;
    }

    onOpenChange(nextOpen);

    if (!nextOpen) {
      setForm(FORM_CLIENTE_INICIAL);
      setAccionEstado(null);

      actualizarMutation.reset();
      cambiarEstadoMutation.reset();
    }
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (clienteId === null || !formularioValido) {
      return;
    }

    cambiarEstadoMutation.reset();

    try {
      const clienteActualizado = await actualizarMutation.mutateAsync({
        clienteId,
        request: crearRequestDesdeForm(form),
      });

      setForm(crearFormDesdeCliente(clienteActualizado));
    } catch {
      // El error se muestra mediante el estado de la mutation.
    }
  };

  const iniciarCambioEstado = (accion: AccionEstado) => {
    actualizarMutation.reset();
    cambiarEstadoMutation.reset();
    setAccionEstado(accion);
  };

  const confirmarCambioEstado = async () => {
    if (clienteId === null || accionEstado === null) {
      return;
    }

    try {
      await cambiarEstadoMutation.mutateAsync({
        clienteId,
        activar: accionEstado === "reactivar",
      });

      setAccionEstado(null);
    } catch {
      // El error se muestra mediante el estado de la mutation.
    }
  };

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b bg-card px-5 py-4 pr-12 text-left sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="hidden size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground sm:flex">
                <UserRound className="size-4" />
              </span>

              <div className="min-w-0">
                <DialogTitle className="truncate text-lg">
                  {clienteQuery.data?.nombreCompleto ?? "Cliente"}
                </DialogTitle>

                <DialogDescription className="mt-1">
                  Consultá o modificá los datos registrados.
                </DialogDescription>
              </div>
            </div>

            {clienteQuery.data && (
              <EstadoBadge activo={clienteQuery.data.activo} />
            )}
          </div>
        </DialogHeader>

        {clienteQuery.isLoading ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            <Skeleton className="mt-6 h-32 w-full" />
          </div>
        ) : clienteQuery.isError ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 py-10 sm:px-6">
            <div
              role="alert"
              className="flex w-full max-w-lg flex-col items-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
            >
              <AlertCircle className="size-6 text-destructive" />

              <p className="mt-4 font-medium">No pudimos cargar el cliente</p>

              <p className="mt-2 text-sm text-muted-foreground">
                {clienteQuery.error instanceof Error
                  ? clienteQuery.error.message
                  : "Ocurrió un error al consultar la información."}
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => clienteQuery.refetch()}
              >
                Reintentar
              </Button>
            </div>
          </div>
        ) : clienteQuery.data ? (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={guardar}>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
              <div className="space-y-7">
                <ClienteFormFields
                  form={form}
                  modo="editar"
                  disabled={operacionPendiente}
                  onChange={actualizarCampo}
                />

                <section className="overflow-hidden rounded-lg border bg-card">
                  <header className="flex items-center gap-3 border-b bg-muted/30 px-4 py-4 sm:px-5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                      <BriefcaseBusiness className="size-4" />
                    </span>

                    <div>
                      <h3 className="text-sm font-semibold">Casos asociados</h3>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {clienteQuery.data.casos.length === 1
                          ? "1 caso registrado"
                          : `${clienteQuery.data.casos.length} casos registrados`}
                      </p>
                    </div>
                  </header>

                  {clienteQuery.data.casos.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <BriefcaseBusiness className="size-4" />
                      </span>

                      <p className="mt-3 text-sm font-medium">
                        Sin casos asociados
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Este cliente todavía no participa en ningún caso.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {clienteQuery.data.casos.map((caso) => (
                        <article
                          key={caso.casoId}
                          className="flex items-start gap-3 px-4 py-4 sm:px-5"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <BriefcaseBusiness className="size-4" />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="line-clamp-2 text-sm font-medium leading-5">
                                {caso.titulo}
                              </p>

                              <EstadoBadge activo={caso.activo} />
                            </div>

                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <FileText className="size-3.5" />

                              {caso.expedientes.length === 1
                                ? "1 expediente asociado"
                                : `${caso.expedientes.length} expedientes asociados`}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                {accionEstado && (
                  <section className="rounded-lg border border-sidebar-primary/30 bg-accent/45 p-4">
                    <h3 className="font-medium">
                      {accionEstado === "darDeBaja"
                        ? "¿Dar de baja al cliente?"
                        : "¿Reactivar al cliente?"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {accionEstado === "darDeBaja"
                        ? "El cliente dejará de aparecer en el listado de activos, pero conservará todos sus datos, casos y expedientes."
                        : "El cliente volverá a aparecer normalmente en el listado de clientes activos."}
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
                          accionEstado === "darDeBaja"
                            ? "destructive"
                            : "default"
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
                          : "Revisá los datos ingresados e intentá nuevamente."}
                      </p>
                    </div>
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

                    <div>

                      <p className="font-medium text-destructive">
                        No pudimos cambiar el estado del cliente
                      </p>

                      <p className="mt-1 text-muted-foreground">
                        {cambiarEstadoMutation.error instanceof Error
                          ? cambiarEstadoMutation.error.message
                          : "Ocurrió un error al procesar la operación."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="flex shrink-0 flex-col gap-3 border-t bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <Button
                type="button"
                variant={clienteQuery.data.activo ? "destructive" : "outline"}
                disabled={operacionPendiente || accionEstado !== null}
                onClick={() =>
                  iniciarCambioEstado(
                    clienteQuery.data.activo ? "darDeBaja" : "reactivar",
                  )
                }
              >
                {clienteQuery.data.activo ? "Dar de baja" : "Reactivar cliente"}
              </Button>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={operacionPendiente}
                  onClick={() => cambiarApertura(false)}
                >
                  Cerrar
                </Button>

                <Button
                  type="submit"
                  disabled={
                    operacionPendiente ||
                    accionEstado !== null ||
                    !formularioValido
                  }
                >
                  {actualizarMutation.isPending && (
                    <Loader2 className="animate-spin" />
                  )}

                  {actualizarMutation.isPending
                    ? "Guardando..."
                    : "Guardar cambios"}
                </Button>
              </div>
            </footer>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
