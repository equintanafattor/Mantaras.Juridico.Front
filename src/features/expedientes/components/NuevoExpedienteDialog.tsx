"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  FolderOpen,
  Loader2,
  Star,
  UsersRound,
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

import CasoFormFields, {
  crearRequestDesdeForm as crearCasoRequestDesdeForm,
  FORM_CASO_INICIAL,
  type CasoFormState,
} from "@/features/casos/components/CasoFormFields";

import { useCrearCasoConExpedientePrincipal } from "../hooks/useCrearCasoConExpedientePrincipal";
import { useCrearExpediente } from "../hooks/useCrearExpediente";
import type { CrearExpedientePrincipalRequest } from "../types/types";

import ExpedienteDatosFormFields from "./ExpedienteDatosFormFields";
import ExpedienteFormFields, {
  crearRequestDesdeForm,
  FORM_EXPEDIENTE_INICIAL,
  type ExpedienteFormState,
} from "./ExpedienteFormFields";

type NuevoExpedienteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  casoIdInicial?: number | null;
  bloquearCaso?: boolean;
  onExpedienteCreado?: () => void;
};

type ModoCaso = "existente" | "nuevo";
type PasoNuevoCaso = 1 | 2 | 3;

const PASOS_NUEVO_CASO = [
  {
    numero: 1 as const,
    label: "Caso",
    descripcion: "Datos y participantes",
    icon: BriefcaseBusiness,
  },
  {
    numero: 2 as const,
    label: "Expediente",
    descripcion: "Datos procesales",
    icon: FileText,
  },
  {
    numero: 3 as const,
    label: "Confirmar",
    descripcion: "Revisión final",
    icon: Check,
  },
];

function crearFormInicial(casoIdInicial?: number | null): ExpedienteFormState {
  return {
    ...FORM_EXPEDIENTE_INICIAL,
    casoId: casoIdInicial ?? null,
  };
}

function crearCasoFormInicial(): CasoFormState {
  return {
    ...FORM_CASO_INICIAL,
    faseInterna: "Juicio",
    clientes: [],
  };
}

function normalizarOpcional(value: string) {
  const normalizedValue = value.trim();

  return normalizedValue || null;
}

function mostrarResumen(value: string) {
  return value.trim() || "No informado";
}

function formatearFecha(value: string) {
  if (!value) {
    return "No informada";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function crearExpedientePrincipalRequestDesdeForm(
  form: ExpedienteFormState,
): CrearExpedientePrincipalRequest {
  return {
    numeroExpediente: normalizarOpcional(form.numeroExpediente),
    caratula: form.caratula.trim(),
    juzgado: normalizarOpcional(form.juzgado),
    fechaInicio: normalizarOpcional(form.fechaInicio),
    estadoLegal: normalizarOpcional(form.estadoLegal),
    observaciones: normalizarOpcional(form.observaciones),
  };
}

function IndicadorPasos({
  pasoActual,
  disabled,
  onSelect,
}: {
  pasoActual: PasoNuevoCaso;
  disabled: boolean;
  onSelect: (paso: PasoNuevoCaso) => void;
}) {
  return (
    <nav aria-label="Pasos para crear el caso y expediente">
      <ol className="grid grid-cols-3">
        {PASOS_NUEVO_CASO.map((paso, index) => {
          const Icon = paso.icon;
          const completado = paso.numero < pasoActual;
          const activo = paso.numero === pasoActual;
          const disponible = paso.numero <= pasoActual;

          return (
            <li key={paso.numero} className="relative">
              {index < PASOS_NUEVO_CASO.length - 1 && (
                <span
                  aria-hidden="true"
                  className={
                    completado
                      ? "absolute left-1/2 top-5 h-px w-full bg-primary/50"
                      : "absolute left-1/2 top-5 h-px w-full bg-border"
                  }
                />
              )}

              <button
                type="button"
                disabled={disabled || !disponible}
                onClick={() => onSelect(paso.numero)}
                className="relative z-10 flex w-full flex-col items-center px-2 text-center disabled:cursor-default"
              >
                <span
                  className={
                    activo
                      ? "flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                      : completado
                        ? "flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                        : "flex size-10 items-center justify-center rounded-full border bg-card text-muted-foreground"
                  }
                >
                  {completado ? (
                    <Check className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>

                <span
                  className={
                    activo
                      ? "mt-2 text-xs font-semibold text-foreground"
                      : "mt-2 text-xs font-medium text-muted-foreground"
                  }
                >
                  {paso.label}
                </span>

                <span className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                  {paso.descripcion}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ResumenCreacion({
  caso,
  expediente,
}: {
  caso: CasoFormState;
  expediente: ExpedienteFormState;
}) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border bg-card">
        <header className="flex items-center gap-3 border-b bg-muted/30 px-4 py-4 sm:px-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <BriefcaseBusiness className="size-4" />
          </span>

          <div>
            <h3 className="text-sm font-semibold">Nuevo caso</h3>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Información interna y participantes.
            </p>
          </div>
        </header>

        <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2 sm:p-5">
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Título</dt>
            <dd className="mt-1 font-medium">{mostrarResumen(caso.titulo)}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Fase interna</dt>
            <dd className="mt-1">{caso.faseInterna}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Tipo de trámite</dt>
            <dd className="mt-1">{mostrarResumen(caso.tipoTramite)}</dd>
          </div>

          {caso.observaciones.trim() && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Observaciones</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-6">
                {caso.observaciones.trim()}
              </dd>
            </div>
          )}
        </dl>

        <div className="border-t px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-muted-foreground" />

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Participantes
            </p>
          </div>

          <div className="mt-3 divide-y rounded-md border">
            {caso.clientes.map((cliente) => (
              <div
                key={cliente.clienteId}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {cliente.nombreCompleto}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {cliente.tipoParticipacion}
                  </p>
                </div>

                {cliente.esPrincipal && (
                  <Badge
                    variant="outline"
                    className="rounded-sm bg-accent text-accent-foreground"
                  >
                    <Star className="size-3" />
                    Principal
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border bg-card">
        <header className="flex items-center gap-3 border-b bg-muted/30 px-4 py-4 sm:px-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="size-4" />
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">Expediente principal</h3>

              <Badge
                variant="outline"
                className="rounded-sm bg-primary/10 text-primary"
              >
                Principal
              </Badge>
            </div>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Se creará junto con el caso.
            </p>
          </div>
        </header>

        <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2 sm:p-5">
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Carátula</dt>
            <dd className="mt-1 font-medium">
              {mostrarResumen(expediente.caratula)}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">
              Número de expediente
            </dt>
            <dd className="mt-1">
              {mostrarResumen(expediente.numeroExpediente)}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Fecha de inicio</dt>
            <dd className="mt-1">{formatearFecha(expediente.fechaInicio)}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Juzgado</dt>
            <dd className="mt-1">{mostrarResumen(expediente.juzgado)}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Estado legal</dt>
            <dd className="mt-1">{mostrarResumen(expediente.estadoLegal)}</dd>
          </div>

          {expediente.observaciones.trim() && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Observaciones</dt>

              <dd className="mt-1 whitespace-pre-wrap leading-6">
                {expediente.observaciones.trim()}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <div className="flex gap-3 rounded-lg border border-sidebar-primary/30 bg-accent/40 p-4 text-sm">
        <Check className="mt-0.5 size-4 shrink-0 text-accent-foreground" />

        <p className="leading-6 text-muted-foreground">
          El caso y su expediente principal se guardarán en una única operación.
          Si ocurre un error, no quedará un caso incompleto.
        </p>
      </div>
    </div>
  );
}

export default function NuevoExpedienteDialog({
  open,
  onOpenChange,
  casoIdInicial,
  bloquearCaso = false,
  onExpedienteCreado,
}: NuevoExpedienteDialogProps) {
  const [modoCaso, setModoCaso] = useState<ModoCaso>("existente");
  const [pasoNuevoCaso, setPasoNuevoCaso] = useState<PasoNuevoCaso>(1);

  const [expedienteExistenteForm, setExpedienteExistenteForm] =
    useState<ExpedienteFormState>(() => crearFormInicial(casoIdInicial));

  const [casoNuevoForm, setCasoNuevoForm] =
    useState<CasoFormState>(crearCasoFormInicial);

  const [expedienteNuevoForm, setExpedienteNuevoForm] =
    useState<ExpedienteFormState>(() => crearFormInicial());

  const crearExpedienteMutation = useCrearExpediente();
  const crearCasoConExpedienteMutation = useCrearCasoConExpedientePrincipal();

  const permiteCrearCasoNuevo = !bloquearCaso && casoIdInicial == null;

  const operacionPendiente =
    crearExpedienteMutation.isPending ||
    crearCasoConExpedienteMutation.isPending;

  useEffect(() => {
    if (open) {
      setModoCaso("existente");
      setPasoNuevoCaso(1);
      setExpedienteExistenteForm(crearFormInicial(casoIdInicial));
      setCasoNuevoForm(crearCasoFormInicial());
      setExpedienteNuevoForm(crearFormInicial());

      crearExpedienteMutation.reset();
      crearCasoConExpedienteMutation.reset();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, casoIdInicial]);

  const requierePadre = expedienteExistenteForm.tipoExpediente !== "Principal";

  const formularioExistenteValido =
    expedienteExistenteForm.casoId !== null &&
    expedienteExistenteForm.caratula.trim().length > 0 &&
    (!requierePadre || expedienteExistenteForm.expedientePadreId !== null);

  const pasoCasoValido =
    casoNuevoForm.titulo.trim().length > 0 &&
    casoNuevoForm.clientes.length > 0 &&
    casoNuevoForm.clientes.filter((cliente) => cliente.esPrincipal).length ===
      1;

  const pasoExpedienteValido = expedienteNuevoForm.caratula.trim().length > 0;

  const formularioNuevoValido = pasoCasoValido && pasoExpedienteValido;

  const formularioValido =
    modoCaso === "nuevo" ? formularioNuevoValido : formularioExistenteValido;

  const resetearMutaciones = () => {
    if (crearExpedienteMutation.isError || crearExpedienteMutation.isSuccess) {
      crearExpedienteMutation.reset();
    }

    if (
      crearCasoConExpedienteMutation.isError ||
      crearCasoConExpedienteMutation.isSuccess
    ) {
      crearCasoConExpedienteMutation.reset();
    }
  };

  const actualizarExpedienteExistente = (nextForm: ExpedienteFormState) => {
    setExpedienteExistenteForm(nextForm);
    resetearMutaciones();
  };

  const actualizarCasoNuevo = (nextForm: CasoFormState) => {
    setCasoNuevoForm(nextForm);
    resetearMutaciones();
  };

  const actualizarExpedienteNuevo = (nextForm: ExpedienteFormState) => {
    setExpedienteNuevoForm(nextForm);
    resetearMutaciones();
  };

  const cambiarModo = (nextModo: ModoCaso) => {
    if (operacionPendiente) {
      return;
    }

    setModoCaso(nextModo);
    setPasoNuevoCaso(1);
    resetearMutaciones();
  };

  const limpiarFormulario = () => {
    setModoCaso("existente");
    setPasoNuevoCaso(1);
    setExpedienteExistenteForm(crearFormInicial(casoIdInicial));
    setCasoNuevoForm(crearCasoFormInicial());
    setExpedienteNuevoForm(crearFormInicial());

    crearExpedienteMutation.reset();
    crearCasoConExpedienteMutation.reset();
  };

  const cambiarApertura = (nextOpen: boolean) => {
    if (!nextOpen && operacionPendiente) {
      return;
    }

    onOpenChange(nextOpen);

    if (!nextOpen) {
      limpiarFormulario();
    }
  };

  const avanzarPaso = () => {
    if (pasoNuevoCaso === 1 && pasoCasoValido) {
      setPasoNuevoCaso(2);
      return;
    }

    if (pasoNuevoCaso === 2 && pasoExpedienteValido) {
      setPasoNuevoCaso(3);
    }
  };

  const retrocederPaso = () => {
    setPasoNuevoCaso((currentPaso) => (currentPaso === 3 ? 2 : 1));
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (modoCaso === "nuevo" && pasoNuevoCaso < 3) {
      avanzarPaso();
      return;
    }

    if (!formularioValido) {
      return;
    }

    try {
      if (modoCaso === "nuevo") {
        await crearCasoConExpedienteMutation.mutateAsync({
          caso: crearCasoRequestDesdeForm(casoNuevoForm),
          expediente:
            crearExpedientePrincipalRequestDesdeForm(expedienteNuevoForm),
        });
      } else {
        await crearExpedienteMutation.mutateAsync(
          crearRequestDesdeForm(expedienteExistenteForm),
        );
      }

      onExpedienteCreado?.();
      onOpenChange(false);
      limpiarFormulario();
    } catch {
      // El error se muestra mediante la mutation correspondiente.
    }
  };

  const mutationConError =
    modoCaso === "nuevo"
      ? crearCasoConExpedienteMutation
      : crearExpedienteMutation;

  const botonPrincipalDeshabilitado =
    operacionPendiente ||
    (modoCaso === "existente"
      ? !formularioExistenteValido
      : pasoNuevoCaso === 1
        ? !pasoCasoValido
        : pasoNuevoCaso === 2
          ? !pasoExpedienteValido
          : !formularioNuevoValido);

  const etiquetaBotonPrincipal = operacionPendiente
    ? "Guardando..."
    : modoCaso === "existente"
      ? "Guardar expediente"
      : pasoNuevoCaso < 3
        ? "Continuar"
        : "Crear caso y expediente";

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b bg-card px-5 py-4 pr-12 text-left sm:px-6 sm:py-5">
          <DialogTitle>Nuevo expediente</DialogTitle>

          <DialogDescription className="mt-1">
            {modoCaso === "nuevo"
              ? "Creá el caso y su expediente principal en una sola operación."
              : "Registrá los datos procesales y vinculá el expediente con un caso existente."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={guardar}>
          {permiteCrearCasoNuevo && (
            <section className="shrink-0 border-b bg-muted/20 px-5 py-3 sm:px-6">
              <div className="grid gap-1 rounded-lg bg-muted p-1 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={operacionPendiente}
                  onClick={() => cambiarModo("existente")}
                  className={
                    modoCaso === "existente"
                      ? "flex items-center justify-center gap-2 rounded-md bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-sm"
                      : "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  <FolderOpen className="size-4" />
                  Usar un caso existente
                </button>

                <button
                  type="button"
                  disabled={operacionPendiente}
                  onClick={() => cambiarModo("nuevo")}
                  className={
                    modoCaso === "nuevo"
                      ? "flex items-center justify-center gap-2 rounded-md bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-sm"
                      : "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  <FilePlus2 className="size-4" />
                  Crear un caso nuevo
                </button>
              </div>
            </section>
          )}

          {modoCaso === "nuevo" && permiteCrearCasoNuevo && (
            <section className="shrink-0 border-b bg-card px-5 py-4 sm:px-6">
              <IndicadorPasos
                pasoActual={pasoNuevoCaso}
                disabled={operacionPendiente}
                onSelect={setPasoNuevoCaso}
              />
            </section>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            {modoCaso === "nuevo" && permiteCrearCasoNuevo ? (
              <>
                {pasoNuevoCaso === 1 && (
                  <section>
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
                        Paso 1 de 3
                      </p>

                      <h2 className="mt-2 text-lg font-semibold">
                        Datos del caso y participantes
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Completá la información interna y elegí exactamente un
                        cliente principal.
                      </p>
                    </div>

                    <CasoFormFields
                      form={casoNuevoForm}
                      disabled={operacionPendiente}
                      onChange={actualizarCasoNuevo}
                    />
                  </section>
                )}

                {pasoNuevoCaso === 2 && (
                  <section>
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
                        Paso 2 de 3
                      </p>

                      <h2 className="mt-2 text-lg font-semibold">
                        Expediente principal
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Se registrará como expediente principal y no tendrá un
                        expediente padre.
                      </p>
                    </div>

                    <ExpedienteDatosFormFields
                      form={expedienteNuevoForm}
                      idPrefix="expediente-principal"
                      disabled={operacionPendiente}
                      onChange={actualizarExpedienteNuevo}
                    />
                  </section>
                )}

                {pasoNuevoCaso === 3 && (
                  <section>
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
                        Paso 3 de 3
                      </p>

                      <h2 className="mt-2 text-lg font-semibold">
                        Revisar y confirmar
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Verificá la información antes de crear ambos registros.
                      </p>
                    </div>

                    <ResumenCreacion
                      caso={casoNuevoForm}
                      expediente={expedienteNuevoForm}
                    />
                  </section>
                )}
              </>
            ) : (
              <ExpedienteFormFields
                form={expedienteExistenteForm}
                bloquearCaso={bloquearCaso}
                disabled={operacionPendiente}
                onChange={actualizarExpedienteExistente}
              />
            )}

            {mutationConError.isError && (
              <div
                role="alert"
                className="mt-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

                <div>
                  <p className="font-medium text-destructive">
                    {modoCaso === "nuevo"
                      ? "No pudimos crear el caso y el expediente"
                      : "No pudimos crear el expediente"}
                  </p>

                  <p className="mt-1 text-muted-foreground">
                    {mutationConError.error instanceof Error
                      ? mutationConError.error.message
                      : "Revisá los datos ingresados e intentá nuevamente."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              {modoCaso === "nuevo" && pasoNuevoCaso > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={operacionPendiente}
                  onClick={retrocederPaso}
                >
                  <ChevronLeft />
                  Volver
                </Button>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={operacionPendiente}
                onClick={() => cambiarApertura(false)}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={botonPrincipalDeshabilitado}>
                {operacionPendiente && <Loader2 className="animate-spin" />}

                {etiquetaBotonPrincipal}

                {!operacionPendiente &&
                  modoCaso === "nuevo" &&
                  pasoNuevoCaso < 3 && <ChevronRight />}
              </Button>
            </div>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
