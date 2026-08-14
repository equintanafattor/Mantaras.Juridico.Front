"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

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

function crearExpedientePrincipalRequestDesdeForm(
  form: ExpedienteFormState,
): CrearExpedientePrincipalRequest {
  return {
    numeroExpediente: normalizarOpcional(form.numeroExpediente),
    caratula: form.caratula.trim(),
    juzgado: normalizarOpcional(form.juzgado),
    fechaInicio: normalizarOpcional(form.fechaInicio),
    estadoLegal: normalizarOpcional(form.estadoLegal),
  };
}

export default function NuevoExpedienteDialog({
  open,
  onOpenChange,
  casoIdInicial,
  bloquearCaso = false,
  onExpedienteCreado,
}: NuevoExpedienteDialogProps) {
  const [modoCaso, setModoCaso] = useState<ModoCaso>("existente");

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

  const formularioNuevoValido =
    casoNuevoForm.titulo.trim().length > 0 &&
    casoNuevoForm.clientes.length > 0 &&
    casoNuevoForm.clientes.filter((cliente) => cliente.esPrincipal).length ===
      1 &&
    expedienteNuevoForm.caratula.trim().length > 0;

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
    resetearMutaciones();
  };

  const limpiarFormulario = () => {
    setModoCaso("existente");
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

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuevo expediente</DialogTitle>

          <DialogDescription>
            {modoCaso === "nuevo"
              ? "Creá el caso y su expediente principal en una sola operación."
              : "Registrá sus datos procesales y relacioná el expediente con un caso existente."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={guardar}>
          {permiteCrearCasoNuevo && (
            <section className="space-y-3">
              <p className="text-sm font-medium">
                ¿Dónde se registrará el expediente?
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={modoCaso === "existente" ? "secondary" : "outline"}
                  disabled={operacionPendiente}
                  onClick={() => cambiarModo("existente")}
                >
                  Caso existente
                </Button>

                <Button
                  type="button"
                  variant={modoCaso === "nuevo" ? "secondary" : "outline"}
                  disabled={operacionPendiente}
                  onClick={() => cambiarModo("nuevo")}
                >
                  Crear caso nuevo
                </Button>
              </div>
            </section>
          )}

          {modoCaso === "nuevo" && permiteCrearCasoNuevo ? (
            <>
              <section className="space-y-2 border-t pt-5">
                <h2 className="font-medium">Datos del caso</h2>

                <p className="text-sm text-muted-foreground">
                  Asociá los participantes y completá la información interna del
                  nuevo caso.
                </p>
              </section>

              <CasoFormFields
                form={casoNuevoForm}
                disabled={operacionPendiente}
                onChange={actualizarCasoNuevo}
              />

              <section className="space-y-2 border-t pt-5">
                <h2 className="font-medium">Expediente principal</h2>

                <p className="text-sm text-muted-foreground">
                  El expediente se creará como principal y no tendrá expediente
                  padre.
                </p>
              </section>

              <ExpedienteDatosFormFields
                form={expedienteNuevoForm}
                idPrefix="expediente-principal"
                disabled={operacionPendiente}
                onChange={actualizarExpedienteNuevo}
              />
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
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
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

          <footer className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={operacionPendiente}
              onClick={() => cambiarApertura(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={operacionPendiente || !formularioValido}
            >
              {operacionPendiente && <Loader2 className="animate-spin" />}

              {operacionPendiente
                ? "Guardando..."
                : modoCaso === "nuevo"
                  ? "Crear caso y expediente"
                  : "Guardar expediente"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
