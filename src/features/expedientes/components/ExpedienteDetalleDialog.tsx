"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, FileText, Loader2 } from "lucide-react";

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

import { useActualizarExpediente } from "../hooks/useActualizarExpediente";
import { useCambiarEstadoExpediente } from "../hooks/useCambiarEstadoExpediente";
import { useExpediente } from "../hooks/useExpediente";
import type { TipoExpediente } from "../types/types";

import ExpedienteFormFields, {
  crearActualizarRequestDesdeForm,
  crearFormDesdeExpediente,
  FORM_EXPEDIENTE_INICIAL,
  type ExpedienteFormState,
} from "./ExpedienteFormFields";

type ExpedienteDetalleDialogProps = {
  expedienteId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AccionEstado = "darDeBaja" | "restaurar";

const TIPO_EXPEDIENTE_LABELS: Record<TipoExpediente, string> = {
  Principal: "Principal",
  Incidente: "Incidente",
  Apelacion: "Apelación",
  Ejecucion: "Ejecución",
};

export default function ExpedienteDetalleDialog({
  expedienteId,
  open,
  onOpenChange,
}: ExpedienteDetalleDialogProps) {
  const [form, setForm] = useState<ExpedienteFormState>(
    FORM_EXPEDIENTE_INICIAL,
  );

  const [accionEstado, setAccionEstado] = useState<AccionEstado | null>(null);

  const expedienteQuery = useExpediente(expedienteId, open);

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
    if (expedienteQuery.data) {
      setForm(crearFormDesdeExpediente(expedienteQuery.data));
    }
  }, [expedienteQuery.data]);

  const actualizarForm = (nextForm: ExpedienteFormState) => {
    setForm(nextForm);

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
      setForm(FORM_EXPEDIENTE_INICIAL);
      setAccionEstado(null);
      actualizarMutation.reset();
      cambiarEstadoMutation.reset();
    }
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (expedienteId === null || !formularioValido) {
      return;
    }

    cambiarEstadoMutation.reset();

    try {
      await actualizarMutation.mutateAsync({
        expedienteId,
        request: crearActualizarRequestDesdeForm(form),
      });
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  const iniciarCambioEstado = (accion: AccionEstado) => {
    actualizarMutation.reset();
    cambiarEstadoMutation.reset();
    setAccionEstado(accion);
  };

  const confirmarCambioEstado = async () => {
    if (expedienteId === null || accionEstado === null) {
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

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div>
              <DialogTitle>
                {expedienteQuery.data?.numeroExpediente ||
                  expedienteQuery.data?.caratula ||
                  "Detalle del expediente"}
              </DialogTitle>

              <DialogDescription className="mt-1">
                Modificá los datos procesales y consultá sus relaciones.
              </DialogDescription>
            </div>

            {expedienteQuery.data && (
              <Badge
                variant={expedienteQuery.data.activo ? "secondary" : "outline"}
              >
                {expedienteQuery.data.activo ? "Activo" : "Inactivo"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {expedienteQuery.isLoading ? (
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
        ) : expedienteQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
          >
            <AlertCircle className="size-6 text-destructive" />

            <p className="mt-4 font-medium">No pudimos cargar el expediente</p>

            <p className="mt-2 text-sm text-muted-foreground">
              {expedienteQuery.error instanceof Error
                ? expedienteQuery.error.message
                : "Ocurrió un error al consultar la información."}
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={() => expedienteQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : expedienteQuery.data ? (
          <form className="space-y-6" onSubmit={guardar}>
            <ExpedienteFormFields
              form={form}
              modo="editar"
              expedienteActualId={expedienteId ?? undefined}
              disabled={operacionPendiente}
              onChange={actualizarForm}
            />

            <section className="space-y-3 border-t pt-5">
              <div>
                <h3 className="text-sm font-medium">Expedientes derivados</h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {expedienteQuery.data.expedientesDerivados.length === 1
                    ? "1 derivado directo"
                    : `${expedienteQuery.data.expedientesDerivados.length} derivados directos`}
                </p>
              </div>

              {expedienteQuery.data.expedientesDerivados.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Este expediente no tiene derivados directos.
                </div>
              ) : (
                <div className="space-y-2">
                  {expedienteQuery.data.expedientesDerivados.map((derivado) => (
                    <article
                      key={derivado.expedienteId}
                      className="flex items-start justify-between gap-3 rounded-lg border p-4"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <FileText className="size-4" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{derivado.caratula}</p>

                            <Badge variant="outline">
                              {TIPO_EXPEDIENTE_LABELS[derivado.tipoExpediente]}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {derivado.numeroExpediente || "Sin número"}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={derivado.activo ? "secondary" : "outline"}
                      >
                        {derivado.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {accionEstado && (
              <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <h3 className="font-medium">
                  {accionEstado === "darDeBaja"
                    ? "¿Dar de baja el expediente?"
                    : "¿Restaurar el expediente?"}
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
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

            {cambiarEstadoMutation.isSuccess && (
              <div
                role="status"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700"
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

                <div>
                  <p className="font-medium text-destructive">
                    No pudimos cambiar el estado del expediente
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
                variant={
                  expedienteQuery.data.activo ? "destructive" : "outline"
                }
                disabled={operacionPendiente || accionEstado !== null}
                onClick={() =>
                  iniciarCambioEstado(
                    expedienteQuery.data.activo ? "darDeBaja" : "restaurar",
                  )
                }
              >
                {expedienteQuery.data.activo
                  ? "Dar de baja"
                  : "Restaurar expediente"}
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
