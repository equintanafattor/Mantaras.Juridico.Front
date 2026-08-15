"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCrearCliente } from "../hooks/useCrearCliente";

import ClienteFormFields, {
  crearRequestDesdeForm,
  FORM_CLIENTE_INICIAL,
  type ClienteFormState,
} from "./ClienteFormFields";

type NuevoClienteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteCreado?: () => void;
};

export default function NuevoClienteDialog({
  open,
  onOpenChange,
  onClienteCreado,
}: NuevoClienteDialogProps) {
  const [form, setForm] = useState<ClienteFormState>(FORM_CLIENTE_INICIAL);

  const crearClienteMutation = useCrearCliente();

  const formularioValido =
    form.nombre.trim().length > 0 && form.apellido.trim().length > 0;

  const actualizarCampo = (campo: keyof ClienteFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [campo]: value,
    }));

    if (crearClienteMutation.isError || crearClienteMutation.isSuccess) {
      crearClienteMutation.reset();
    }
  };

  const limpiarFormulario = () => {
    setForm(FORM_CLIENTE_INICIAL);
    crearClienteMutation.reset();
  };

  const cambiarApertura = (nextOpen: boolean) => {
    if (!nextOpen && crearClienteMutation.isPending) {
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
      await crearClienteMutation.mutateAsync(crearRequestDesdeForm(form));

      onClienteCreado?.();
      onOpenChange(false);
      limpiarFormulario();
    } catch {
      // El error se muestra mediante el estado de la mutation.
    }
  };

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b bg-card px-5 py-4 pr-12 text-left sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="hidden size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground sm:flex">
              <UserPlus className="size-4" />
            </span>

            <div>
              <DialogTitle>Nuevo cliente</DialogTitle>

              <DialogDescription className="mt-1">
                Registrá sus datos personales y de contacto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={guardar}>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            <ClienteFormFields
              form={form}
              modo="crear"
              disabled={crearClienteMutation.isPending}
              onChange={actualizarCampo}
            />

            {crearClienteMutation.isError && (
              <div
                role="alert"
                className="mt-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

                <div>
                  <p className="font-medium text-destructive">
                    No pudimos crear el cliente
                  </p>

                  <p className="mt-1 text-muted-foreground">
                    {crearClienteMutation.error instanceof Error
                      ? crearClienteMutation.error.message
                      : "Revisá los datos ingresados e intentá nuevamente."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t bg-card px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={crearClienteMutation.isPending}
              onClick={() => cambiarApertura(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={crearClienteMutation.isPending || !formularioValido}
            >
              {crearClienteMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}

              {crearClienteMutation.isPending
                ? "Guardando..."
                : "Guardar cliente"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
