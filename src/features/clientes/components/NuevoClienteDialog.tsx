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

  const actualizarCampo = (campo: keyof ClienteFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [campo]: value,
    }));
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

    if (!form.nombre.trim() || !form.apellido.trim()) {
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Registrá los datos personales y de contacto del cliente.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={guardar}>
          <ClienteFormFields
            form={form}
            modo="crear"
            disabled={crearClienteMutation.isPending}
            onChange={actualizarCampo}
          />

          {crearClienteMutation.isError && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
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

          <footer className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={crearClienteMutation.isPending}
              onClick={() => cambiarApertura(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={crearClienteMutation.isPending}>
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
