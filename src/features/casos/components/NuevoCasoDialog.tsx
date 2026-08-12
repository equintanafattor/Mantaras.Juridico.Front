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

import { useCrearCaso } from "../hooks/useCrearCaso";

import CasoFormFields, {
  crearRequestDesdeForm,
  FORM_CASO_INICIAL,
  type CasoFormState,
} from "./CasoFormFields";

type NuevoCasoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCasoCreado?: () => void;
};

export default function NuevoCasoDialog({
  open,
  onOpenChange,
  onCasoCreado,
}: NuevoCasoDialogProps) {
  const [form, setForm] = useState<CasoFormState>(FORM_CASO_INICIAL);

  const crearCasoMutation = useCrearCaso();

  const formularioValido =
    form.titulo.trim().length > 0 &&
    form.clientes.length > 0 &&
    form.clientes.filter((cliente) => cliente.esPrincipal).length === 1;

  const actualizarForm = (nextForm: CasoFormState) => {
    setForm(nextForm);

    if (crearCasoMutation.isError || crearCasoMutation.isSuccess) {
      crearCasoMutation.reset();
    }
  };

  const limpiarFormulario = () => {
    setForm(FORM_CASO_INICIAL);
    crearCasoMutation.reset();
  };

  const cambiarApertura = (nextOpen: boolean) => {
    if (!nextOpen && crearCasoMutation.isPending) {
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
      await crearCasoMutation.mutateAsync(crearRequestDesdeForm(form));

      onCasoCreado?.();
      onOpenChange(false);
      limpiarFormulario();
    } catch {
      // El error se muestra mediante el estado de la mutation.
    }
  };

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuevo caso</DialogTitle>

          <DialogDescription>
            Registrá el asunto jurídico y asociá sus participantes.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={guardar}>
          <CasoFormFields
            form={form}
            disabled={crearCasoMutation.isPending}
            onChange={actualizarForm}
          />

          {crearCasoMutation.isError && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <div>
                <p className="font-medium text-destructive">
                  No pudimos crear el caso
                </p>

                <p className="mt-1 text-muted-foreground">
                  {crearCasoMutation.error instanceof Error
                    ? crearCasoMutation.error.message
                    : "Revisá los datos ingresados e intentá nuevamente."}
                </p>
              </div>
            </div>
          )}

          <footer className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={crearCasoMutation.isPending}
              onClick={() => cambiarApertura(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={crearCasoMutation.isPending || !formularioValido}
            >
              {crearCasoMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}

              {crearCasoMutation.isPending ? "Guardando..." : "Guardar caso"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
