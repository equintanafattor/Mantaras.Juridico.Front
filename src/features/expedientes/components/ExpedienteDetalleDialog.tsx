"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  FileText,
  FolderTree,
  GitBranch,
  Loader2,
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
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b bg-card px-5 py-4 pr-12 text-left sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="hidden size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground sm:flex">
                <FileText className="size-4" />
              </span>

              <div className="min-w-0">
                <DialogTitle className="truncate text-lg">
                  {expedienteQuery.data?.numeroExpediente ||
                    expedienteQuery.data?.caratula ||
                    "Detalle del expediente"}
                </DialogTitle>

                <DialogDescription className="mt-1 line-clamp-1">
                  {expedienteQuery.data
                    ? `Caso: ${expedienteQuery.data.tituloCaso}`
                    : "Modificá los datos procesales y consultá sus relaciones."}
                </DialogDescription>
              </div>
            </div>

            {expedienteQuery.data && (
              <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row">
                <TipoBadge tipo={expedienteQuery.data.tipoExpediente} />
                <EstadoBadge activo={expedienteQuery.data.activo} />
              </div>
            )}
          </div>
        </DialogHeader>

        {expedienteQuery.isLoading ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            <Skeleton className="mt-6 h-40 w-full" />
          </div>
        ) : expedienteQuery.isError ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 py-10 sm:px-6">
            <div
              role="alert"
              className="flex w-full max-w-lg flex-col items-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
            >
              <AlertCircle className="size-6 text-destructive" />

              <p className="mt-4 font-medium">
                No pudimos cargar el expediente
              </p>

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
          </div>
        ) : expedienteQuery.data ? (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={guardar}>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
              <div className="space-y-7">
                <ExpedienteFormFields
                  form={form}
                  modo="editar"
                  expedienteActualId={expedienteId ?? undefined}
                  disabled={operacionPendiente}
                  onChange={actualizarForm}
                />

                <section className="overflow-hidden rounded-lg border bg-card">
                  <header className="flex items-center gap-3 border-b bg-muted/30 px-4 py-4 sm:px-5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                      <GitBranch className="size-4" />
                    </span>

                    <div>
                      <h3 className="text-sm font-semibold">
                        Jerarquía procesal
                      </h3>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Expediente padre y derivados directos.
                      </p>
                    </div>
                  </header>

                  {expedienteQuery.data.expedientePadre ? (
                    <div className="border-b bg-secondary/15 px-4 py-4 sm:px-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Expediente padre
                      </p>

                      <div className="mt-3 flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                          <FolderTree className="size-4" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="line-clamp-2 text-sm font-medium leading-5">
                              {expedienteQuery.data.expedientePadre.caratula}
                            </p>

                            <TipoBadge
                              tipo={
                                expedienteQuery.data.expedientePadre
                                  .tipoExpediente
                              }
                            />

                            <EstadoBadge
                              activo={
                                expedienteQuery.data.expedientePadre.activo
                              }
                            />
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {expedienteQuery.data.expedientePadre
                              .numeroExpediente || "Sin número"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-b bg-secondary/15 px-4 py-3 text-sm text-muted-foreground sm:px-5">
                      Este expediente no depende de otro expediente.
                    </div>
                  )}

                  <div className="px-4 pt-4 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Derivados directos
                      </p>

                      <Badge
                        variant="outline"
                        className="rounded-sm bg-background text-muted-foreground"
                      >
                        {expedienteQuery.data.expedientesDerivados.length}
                      </Badge>
                    </div>
                  </div>

                  {expedienteQuery.data.expedientesDerivados.length === 0 ? (
                    <div className="px-5 py-9 text-center">
                      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <FileText className="size-4" />
                      </span>

                      <p className="mt-3 text-sm font-medium">
                        Sin expedientes derivados
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        No hay expedientes que dependan directamente de este.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 divide-y border-t">
                      {expedienteQuery.data.expedientesDerivados.map(
                        (derivado) => (
                          <article
                            key={derivado.expedienteId}
                            className="flex items-start gap-3 px-4 py-4 sm:px-5"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <FileText className="size-4" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="line-clamp-2 text-sm font-medium leading-5">
                                  {derivado.caratula}
                                </p>

                                <TipoBadge tipo={derivado.tipoExpediente} />
                                <EstadoBadge activo={derivado.activo} />
                              </div>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {derivado.numeroExpediente || "Sin número"}
                              </p>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </section>

                {accionEstado && (
                  <section className="rounded-lg border border-sidebar-primary/30 bg-accent/45 p-4">
                    <h3 className="font-medium">
                      {accionEstado === "darDeBaja"
                        ? "¿Dar de baja el expediente?"
                        : "¿Restaurar el expediente?"}
                    </h3>

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
              </div>
            </div>

            <footer className="flex shrink-0 flex-col gap-3 border-t bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
