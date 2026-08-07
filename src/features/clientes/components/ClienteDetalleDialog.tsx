"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

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

    if (clienteId === null || !form.nombre.trim() || !form.apellido.trim()) {
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div>
              <DialogTitle>
                {clienteQuery.data?.nombreCompleto ?? "Cliente"}
              </DialogTitle>

              <DialogDescription className="mt-1">
                Consultá o modificá los datos registrados.
              </DialogDescription>
            </div>

            {clienteQuery.data && (
              <Badge
                variant={clienteQuery.data.activo ? "secondary" : "outline"}
              >
                {clienteQuery.data.activo ? "Activo" : "Inactivo"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {clienteQuery.isLoading ? (
          <div className="space-y-6 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : clienteQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
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
        ) : clienteQuery.data ? (
          <form className="space-y-6" onSubmit={guardar}>
            <ClienteFormFields
              form={form}
              modo="editar"
              disabled={operacionPendiente}
              onChange={actualizarCampo}
            />

            <section className="space-y-3 border-t pt-5">
              <div>
                <h3 className="text-sm font-medium">Casos asociados</h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {clienteQuery.data.casos.length === 1
                    ? "1 caso registrado"
                    : `${clienteQuery.data.casos.length} casos registrados`}
                </p>
              </div>

              {clienteQuery.data.casos.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Este cliente todavía no tiene casos asociados.
                </div>
              ) : (
                <div className="space-y-2">
                  {clienteQuery.data.casos.map((caso) => (
                    <article
                      key={caso.casoId}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{caso.titulo}</p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {caso.expedientes.length === 1
                              ? "1 expediente"
                              : `${caso.expedientes.length} expedientes`}
                          </p>
                        </div>

                        <Badge variant={caso.activo ? "secondary" : "outline"}>
                          {caso.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {accionEstado && (
              <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <h3 className="font-medium">
                  {accionEstado === "darDeBaja"
                    ? "¿Dar de baja al cliente?"
                    : "¿Reactivar al cliente?"}
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
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
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700"
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
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700"
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

            <footer className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
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
                  disabled={operacionPendiente || accionEstado !== null}
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
