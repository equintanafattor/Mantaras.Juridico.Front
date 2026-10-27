"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Info, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRegistrarEnvioCobro } from "../hooks/useRegistrarEnvioCobro";
import {
  fechaHoyArgentina,
  TIPO_DOCUMENTO_COBRO_LABELS,
  TIPOS_DOCUMENTO_COBRO,
} from "../lib/cobro";
import type {
  ExpedienteDetalleResponse,
  TipoDocumentoCobro,
} from "../types/types";

type RegistrarEnvioCobroDialogProps = {
  expediente: ExpedienteDetalleResponse;
  onClose: () => void;
};

export default function RegistrarEnvioCobroDialog({
  expediente,
  onClose,
}: RegistrarEnvioCobroDialogProps) {
  const hoy = fechaHoyArgentina();

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoCobro>("Cedula");
  const [fechaEnvio, setFechaEnvio] = useState(hoy);

  const registrarMutation = useRegistrarEnvioCobro();

  const fechaValida = fechaEnvio !== "" && fechaEnvio <= hoy;

  const resetearError = () => {
    if (registrarMutation.isError) {
      registrarMutation.reset();
    }
  };

  const cambiarApertura = (open: boolean) => {
    if (!open && !registrarMutation.isPending) {
      onClose();
    }
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // isPending evita un segundo envío mientras se guarda.
    if (!fechaValida || registrarMutation.isPending) {
      return;
    }

    try {
      await registrarMutation.mutateAsync({
        expediente,
        envioCobro: { tipoDocumento, fechaEnvio },
      });

      onClose();
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  return (
    <Dialog open onOpenChange={cambiarApertura} disablePointerDismissal>
      <DialogContent
        showCloseButton={!registrarMutation.isPending}
        className="max-h-[92dvh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader className="text-left">
          <DialogTitle>Registrar envío de cobro</DialogTitle>

          <DialogDescription className="break-words">
            {expediente.caratula}
            {expediente.numeroExpediente
              ? ` · ${expediente.numeroExpediente}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={guardar}>
          <fieldset className="space-y-2" disabled={registrarMutation.isPending}>
            <legend className="text-sm font-medium">
              Documento enviado <span className="text-destructive">*</span>
            </legend>

            <div className="grid grid-cols-2 gap-2">
              {TIPOS_DOCUMENTO_COBRO.map((tipo) => (
                <Button
                  key={tipo}
                  type="button"
                  variant={tipoDocumento === tipo ? "secondary" : "outline"}
                  aria-pressed={tipoDocumento === tipo}
                  onClick={() => {
                    setTipoDocumento(tipo);
                    resetearError();
                  }}
                >
                  {TIPO_DOCUMENTO_COBRO_LABELS[tipo]}
                </Button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="envio-cobro-fecha">
              Fecha de envío <span className="text-destructive">*</span>
            </Label>

            <Input
              id="envio-cobro-fecha"
              type="date"
              value={fechaEnvio}
              max={hoy}
              required
              disabled={registrarMutation.isPending}
              onChange={(event) => {
                setFechaEnvio(event.target.value);
                resetearError();
              }}
            />

            {fechaEnvio > hoy && (
              <p className="text-xs text-destructive">
                La fecha de envío no puede ser posterior a hoy.
              </p>
            )}
          </div>

          <div className="flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

            <div className="space-y-2 text-muted-foreground">
              <p>
                Se agregará el expediente al listado de cobro y se generará una
                alerta interna a los 120 días hábiles desde la fecha de envío.
                Si la fecha es antigua y ese plazo ya pasó, el seguimiento
                quedará vencido desde el registro.
              </p>

              <p>
                Por ahora el envío no se puede corregir ni anular una vez
                registrado.
              </p>
            </div>
          </div>

          {registrarMutation.isError && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <div>
                <p className="font-medium text-destructive">
                  No pudimos registrar el envío
                </p>

                <p className="mt-1 text-muted-foreground">
                  {registrarMutation.error instanceof Error
                    ? registrarMutation.error.message
                    : "Revisá los datos e intentá nuevamente."}
                </p>
              </div>
            </div>
          )}

          <footer className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={registrarMutation.isPending}
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={registrarMutation.isPending || !fechaValida}
            >
              {registrarMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}

              {registrarMutation.isPending ? "Registrando..." : "Registrar envío"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
