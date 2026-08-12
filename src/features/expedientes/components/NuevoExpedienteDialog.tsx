"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCrearExpediente } from "../hooks/useCrearExpediente";

import ExpedienteFormFields, {
  crearRequestDesdeForm,
  FORM_EXPEDIENTE_INICIAL,
  type ExpedienteFormState,
} from "./ExpedienteFormFields";

type NuevoExpedienteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpedienteCreado?: () => void;
};

export default function NuevoExpedienteDialog({
  open,
  onOpenChange,
  onExpedienteCreado,
}: NuevoExpedienteDialogProps) {
  const [form, setForm] = useState<ExpedienteFormState>(
    FORM_EXPEDIENTE_INICIAL,
  );

  const crearExpedienteMutation = useCrearExpediente();

  const requierePadre = form.tipoExpediente !== "Principal";

  const formularioValido =
    form.casoId !== null &&
    form.caratula.trim().length > 0 &&
    (!requierePadre || form.expedientePadreId !== null);

  const actualizarForm = (nextForm: ExpedienteFormState) => {
    setForm(nextForm);

    if (crearExpedienteMutation.isError || crearExpedienteMutation.isSuccess) {
      crearExpedienteMutation.reset();
    }
  };

  const limpiarFormulario = () => {
    setForm(FORM_EXPEDIENTE_INICIAL);
    crearExpedienteMutation.reset();
  };

  const cambiarApertura = (nextOpen: boolean) => {
    if (!nextOpen && crearExpedienteMutation.isPending) {
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
      await crearExpedienteMutation.mutateAsync(crearRequestDesdeForm(form));

      onExpedienteCreado?.();
      onOpenChange(false);
      limpiarFormulario();
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuevo expediente</DialogTitle>

          <DialogDescription>
            Registrá sus datos procesales y, si corresponde, relacioná un
            expediente padre.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={guardar}>
          <ExpedienteFormFields
            form={form}
            disabled={crearExpedienteMutation.isPending}
            onChange={actualizarForm}
          />

          {crearExpedienteMutation.isError && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <div>
                <p className="font-medium text-destructive">
                  No pudimos crear el expediente
                </p>

                <p className="mt-1 text-muted-foreground">
                  {crearExpedienteMutation.error instanceof Error
                    ? crearExpedienteMutation.error.message
                    : "Revisá los datos ingresados e intentá nuevamente."}
                </p>
              </div>
            </div>
          )}

          <footer className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={crearExpedienteMutation.isPending}
              onClick={() => cambiarApertura(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={crearExpedienteMutation.isPending || !formularioValido}
            >
              {crearExpedienteMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}

              {crearExpedienteMutation.isPending
                ? "Guardando..."
                : "Guardar expediente"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
