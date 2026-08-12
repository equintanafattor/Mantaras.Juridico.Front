"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  FileText,
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

import { useActualizarCaso } from "../hooks/useActualizarCaso";
import { useCambiarEstadoCaso } from "../hooks/useCambiarEstadoCaso";
import { useCaso } from "../hooks/useCaso";
import type { TipoExpediente } from "../types/types";

import CasoFormFields, {
  crearFormDesdeCaso,
  crearRequestDesdeForm,
  FORM_CASO_INICIAL,
  type CasoFormState,
} from "./CasoFormFields";

type CasoDetalleDialogProps = {
  casoId: number | null;
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

function mostrarValor(value: string | null) {
  return value?.trim() || "—";
}

function formatearFecha(value: string | null) {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export default function CasoDetalleDialog({
  casoId,
  open,
  onOpenChange,
}: CasoDetalleDialogProps) {
  const [form, setForm] = useState<CasoFormState>(FORM_CASO_INICIAL);
  const [accionEstado, setAccionEstado] = useState<AccionEstado | null>(null);

  const casoQuery = useCaso(casoId, open);
  const actualizarMutation = useActualizarCaso();
  const cambiarEstadoMutation = useCambiarEstadoCaso();

  const operacionPendiente =
    actualizarMutation.isPending || cambiarEstadoMutation.isPending;

  const formularioValido =
    form.titulo.trim().length > 0 &&
    form.clientes.length > 0 &&
    form.clientes.filter((cliente) => cliente.esPrincipal).length === 1;

  useEffect(() => {
    if (casoQuery.data) {
      setForm(crearFormDesdeCaso(casoQuery.data));
    }
  }, [casoQuery.data]);

  const actualizarForm = (nextForm: CasoFormState) => {
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
      setForm(FORM_CASO_INICIAL);
      setAccionEstado(null);
      actualizarMutation.reset();
      cambiarEstadoMutation.reset();
    }
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (casoId === null || !formularioValido) {
      return;
    }

    cambiarEstadoMutation.reset();

    try {
      await actualizarMutation.mutateAsync({
        casoId,
        request: crearRequestDesdeForm(form),
      });
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
    if (casoId === null || accionEstado === null) {
      return;
    }

    try {
      await cambiarEstadoMutation.mutateAsync({
        casoId,
        activar: accionEstado === "restaurar",
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
                {casoQuery.data?.titulo ?? "Detalle del caso"}
              </DialogTitle>

              <DialogDescription className="mt-1">
                Modificá el caso y consultá sus expedientes asociados.
              </DialogDescription>
            </div>

            {casoQuery.data && (
              <Badge variant={casoQuery.data.activo ? "secondary" : "outline"}>
                {casoQuery.data.activo ? "Activo" : "Inactivo"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {casoQuery.isLoading ? (
          <div className="space-y-6 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : casoQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
          >
            <AlertCircle className="size-6 text-destructive" />

            <p className="mt-4 font-medium">No pudimos cargar el caso</p>

            <p className="mt-2 text-sm text-muted-foreground">
              {casoQuery.error instanceof Error
                ? casoQuery.error.message
                : "Ocurrió un error al consultar la información."}
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={() => casoQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : casoQuery.data ? (
          <form className="space-y-6" onSubmit={guardar}>
            <CasoFormFields
              form={form}
              disabled={operacionPendiente}
              onChange={actualizarForm}
            />

            <section className="space-y-3 border-t pt-5">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="size-4 text-primary" />

                <div>
                  <h3 className="text-sm font-medium">Expedientes</h3>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {casoQuery.data.expedientes.length === 1
                      ? "1 expediente asociado"
                      : `${casoQuery.data.expedientes.length} expedientes asociados`}
                  </p>
                </div>
              </div>

              {casoQuery.data.expedientes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  Este caso todavía no tiene expedientes asociados.
                </div>
              ) : (
                <div className="space-y-2">
                  {casoQuery.data.expedientes.map((expediente) => (
                    <article
                      key={expediente.expedienteId}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <FileText className="size-4" />
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">
                                {expediente.caratula}
                              </p>

                              <Badge variant="outline">
                                {
                                  TIPO_EXPEDIENTE_LABELS[
                                    expediente.tipoExpediente
                                  ]
                                }
                              </Badge>
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
                        </div>

                        <Badge
                          variant={expediente.activo ? "secondary" : "outline"}
                        >
                          {expediente.activo ? "Activo" : "Inactivo"}
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
                    ? "¿Dar de baja el caso?"
                    : "¿Restaurar el caso?"}
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  {accionEstado === "darDeBaja"
                    ? "El caso dejará de aparecer en el listado de activos. No podrá darse de baja mientras tenga expedientes activos."
                    : "El caso volverá a aparecer normalmente en el listado de casos activos. Sus expedientes deberán restaurarse individualmente."}
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

            {cambiarEstadoMutation.isSuccess && (
              <div
                role="status"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700"
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

                <div>
                  <p className="font-medium text-destructive">
                    No pudimos cambiar el estado del caso
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
                variant={casoQuery.data.activo ? "destructive" : "outline"}
                disabled={operacionPendiente || accionEstado !== null}
                onClick={() =>
                  iniciarCambioEstado(
                    casoQuery.data.activo ? "darDeBaja" : "restaurar",
                  )
                }
              >
                {casoQuery.data.activo ? "Dar de baja" : "Restaurar caso"}
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
