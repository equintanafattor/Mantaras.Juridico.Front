"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

import NuevoExpedienteDialog from "@/features/expedientes/components/NuevoExpedienteDialog";

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

function EstadoCaso({ activo }: { activo: boolean }) {
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

export default function CasoDetalleDialog({
  casoId,
  open,
  onOpenChange,
}: CasoDetalleDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<CasoFormState>(FORM_CASO_INICIAL);
  const [accionEstado, setAccionEstado] = useState<AccionEstado | null>(null);

  const [nuevoExpedienteOpen, setNuevoExpedienteOpen] = useState(false);

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
      setNuevoExpedienteOpen(false);

      actualizarMutation.reset();
      cambiarEstadoMutation.reset();
    }
  };

  const abrirExpediente = (expedienteId: number) => {
    cambiarApertura(false);
    router.push(`/expedientes/${expedienteId}`);
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
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b bg-card px-5 py-4 pr-12 text-left sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">
                {casoQuery.data?.titulo ?? "Detalle del caso"}
              </DialogTitle>

              <DialogDescription className="mt-1">
                Modificá sus datos y consultá los expedientes asociados.
              </DialogDescription>
            </div>

            {casoQuery.data && <EstadoCaso activo={casoQuery.data.activo} />}
          </div>
        </DialogHeader>

        {casoQuery.isLoading ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            <div className="space-y-6">
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
          </div>
        ) : casoQuery.isError ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 py-10 sm:px-6">
            <div
              role="alert"
              className="flex w-full max-w-lg flex-col items-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
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
          </div>
        ) : casoQuery.data ? (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={guardar}>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
              <div className="space-y-7">
                <CasoFormFields
                  form={form}
                  disabled={operacionPendiente}
                  onChange={actualizarForm}
                />

                <section className="overflow-hidden rounded-lg border bg-card">
                  <header className="flex flex-col justify-between gap-3 border-b bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <BriefcaseBusiness className="size-4" />
                      </span>

                      <div>
                        <h3 className="text-sm font-semibold">Expedientes</h3>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {casoQuery.data.expedientes.length === 1
                            ? "1 expediente asociado"
                            : `${casoQuery.data.expedientes.length} expedientes asociados`}
                        </p>
                      </div>
                    </div>

                    {casoQuery.data.activo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={operacionPendiente}
                        onClick={() => setNuevoExpedienteOpen(true)}
                      >
                        <Plus />
                        Nuevo expediente
                      </Button>
                    )}
                  </header>

                  {casoQuery.data.expedientes.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <FileText className="size-4" />
                      </span>

                      <p className="mt-3 text-sm font-medium">
                        Sin expedientes asociados
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Este caso todavía no tiene expedientes registrados.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {casoQuery.data.expedientes.map((expediente) => (
                        <button
                          key={expediente.expedienteId}
                          type="button"
                          disabled={operacionPendiente}
                          onClick={() =>
                            abrirExpediente(expediente.expedienteId)
                          }
                          className="group flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground">
                            <FileText className="size-4" />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="line-clamp-2 text-sm font-medium leading-5 group-hover:text-primary">
                                {expediente.caratula}
                              </p>

                              <Badge
                                variant="outline"
                                className="rounded-sm bg-background text-[10px] text-muted-foreground"
                              >
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

                          <div className="flex shrink-0 items-center gap-3">
                            <Badge
                              variant="outline"
                              className={
                                expediente.activo
                                  ? "hidden rounded-sm border-emerald-700/15 bg-emerald-600/10 text-emerald-800 sm:inline-flex dark:text-emerald-300"
                                  : "hidden rounded-sm bg-muted text-muted-foreground sm:inline-flex"
                              }
                            >
                              {expediente.activo ? "Activo" : "Inactivo"}
                            </Badge>

                            <ChevronRight className="mt-2 size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {accionEstado && (
                  <section className="rounded-lg border border-sidebar-primary/30 bg-accent/45 p-4">
                    <h3 className="font-medium">
                      {accionEstado === "darDeBaja"
                        ? "¿Dar de baja el caso?"
                        : "¿Restaurar el caso?"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {accionEstado === "darDeBaja"
                        ? "El caso dejará de aparecer en el listado de activos. No podrá darse de baja mientras tenga expedientes activos."
                        : "El caso volverá a aparecer en el listado de activos. Sus expedientes deberán restaurarse individualmente."}
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
              </div>
            </div>

            <footer className="flex shrink-0 flex-col gap-3 border-t bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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

        <NuevoExpedienteDialog
          open={nuevoExpedienteOpen}
          onOpenChange={setNuevoExpedienteOpen}
          casoIdInicial={casoId}
          bloquearCaso
          onExpedienteCreado={() => {
            casoQuery.refetch();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
