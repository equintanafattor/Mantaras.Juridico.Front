"use client";

import { AlertCircle, FileText, FolderTree } from "lucide-react";

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

import { useExpediente } from "../hooks/useExpediente";
import type {
  ExpedienteRelacionadoResponse,
  TipoExpediente,
} from "../types/types";

type ExpedienteDetalleDialogProps = {
  expedienteId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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

function ExpedienteRelacionado({
  expediente,
  titulo,
}: {
  expediente: ExpedienteRelacionadoResponse;
  titulo: string;
}) {
  return (
    <article className="rounded-lg border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="size-4" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{expediente.caratula}</p>

              <Badge variant="outline">
                {TIPO_EXPEDIENTE_LABELS[expediente.tipoExpediente]}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {mostrarValor(expediente.numeroExpediente)}
            </p>
          </div>
        </div>

        <Badge variant={expediente.activo ? "secondary" : "outline"}>
          {expediente.activo ? "Activo" : "Inactivo"}
        </Badge>
      </div>
    </article>
  );
}

export default function ExpedienteDetalleDialog({
  expedienteId,
  open,
  onOpenChange,
}: ExpedienteDetalleDialogProps) {
  const expedienteQuery = useExpediente(expedienteId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div>
              <DialogTitle>
                {expedienteQuery.data?.numeroExpediente ||
                  expedienteQuery.data?.caratula ||
                  "Detalle del expediente"}
              </DialogTitle>

              <DialogDescription className="mt-1">
                Información procesal y relaciones del expediente.
              </DialogDescription>
            </div>

            {expedienteQuery.data && (
              <Badge
                variant={expedienteQuery.data.activo ? "secondary" : "outline"}
              >
                {expedienteQuery.data.activo ? "Activo" : "Inactivo"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {expedienteQuery.isLoading ? (
          <div className="space-y-6 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            <Skeleton className="h-28 w-full" />
          </div>
        ) : expedienteQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
          >
            <AlertCircle className="size-6 text-destructive" />

            <p className="mt-4 font-medium">No pudimos cargar el expediente</p>

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
        ) : expedienteQuery.data ? (
          <div className="space-y-6">
            <section className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {TIPO_EXPEDIENTE_LABELS[expedienteQuery.data.tipoExpediente]}
                </Badge>

                <span className="text-sm text-muted-foreground">
                  {expedienteQuery.data.tituloCaso}
                </span>
              </div>

              <h3 className="mt-4 font-medium leading-6">
                {expedienteQuery.data.caratula}
              </h3>
            </section>

            <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Número
                </p>

                <p className="mt-2 text-sm">
                  {mostrarValor(expedienteQuery.data.numeroExpediente)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fecha de inicio
                </p>

                <p className="mt-2 text-sm">
                  {formatearFecha(expedienteQuery.data.fechaInicio)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Juzgado
                </p>

                <p className="mt-2 text-sm">
                  {mostrarValor(expedienteQuery.data.juzgado)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Estado legal
                </p>

                <p className="mt-2 text-sm">
                  {mostrarValor(expedienteQuery.data.estadoLegal)}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderTree className="size-4 text-primary" />

                <div>
                  <h3 className="text-sm font-medium">Jerarquía</h3>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Expediente padre y derivados directos.
                  </p>
                </div>
              </div>

              {expedienteQuery.data.expedientePadre ? (
                <ExpedienteRelacionado
                  expediente={expedienteQuery.data.expedientePadre}
                  titulo="Expediente padre"
                />
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Este expediente no tiene un expediente padre.
                </div>
              )}

              {expedienteQuery.data.expedientesDerivados.length > 0 ? (
                <div className="space-y-2">
                  {expedienteQuery.data.expedientesDerivados.map(
                    (expediente) => (
                      <ExpedienteRelacionado
                        key={expediente.expedienteId}
                        expediente={expediente}
                        titulo="Expediente derivado"
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Este expediente no tiene derivados directos.
                </div>
              )}
            </section>

            <footer className="flex justify-end border-t pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
            </footer>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
