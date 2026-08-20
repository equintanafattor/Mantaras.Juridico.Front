"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  Clock3,
  Loader2,
  MessageSquareText,
  Send,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { useCrearObservacion } from "../hooks/useCrearObservacion";
import { useObservaciones } from "../hooks/useObservaciones";
import type { EntidadObservacion } from "../types/types";

type HistorialObservacionesProps = {
  entidad: EntidadObservacion;
  propietarioId: number;
};

function formatearFechaHora(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function HistorialObservaciones({
  entidad,
  propietarioId,
}: HistorialObservacionesProps) {
  const [texto, setTexto] = useState("");

  const observacionesQuery = useObservaciones(entidad, propietarioId);

  const crearObservacionMutation = useCrearObservacion(entidad, propietarioId);

  const textoNormalizado = texto.trim();

  const puedeGuardar =
    textoNormalizado.length > 0 &&
    textoNormalizado.length <= 2000 &&
    !crearObservacionMutation.isPending;

  const cambiarTexto = (value: string) => {
    setTexto(value);

    if (
      crearObservacionMutation.isError ||
      crearObservacionMutation.isSuccess
    ) {
      crearObservacionMutation.reset();
    }
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!puedeGuardar) {
      return;
    }

    try {
      await crearObservacionMutation.mutateAsync(textoNormalizado);

      setTexto("");
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  const observaciones = observacionesQuery.data ?? [];

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="flex items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <MessageSquareText className="size-4 text-primary" />

          <div>
            <h2 className="text-sm font-semibold">
              Historial de observaciones
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Notas internas registradas en orden cronológico.
            </p>
          </div>
        </div>

        {!observacionesQuery.isLoading && (
          <Badge variant="outline">{observaciones.length}</Badge>
        )}
      </header>

      <form className="border-b bg-muted/10 p-5" onSubmit={guardar}>
        <label
          htmlFor={`observacion-${entidad}-${propietarioId}`}
          className="text-sm font-medium"
        >
          Nueva observación
        </label>

        <Textarea
          id={`observacion-${entidad}-${propietarioId}`}
          value={texto}
          disabled={crearObservacionMutation.isPending}
          maxLength={2000}
          rows={3}
          className="mt-2 resize-y bg-background"
          placeholder="Escribí una nota interna relevante..."
          aria-describedby={`observacion-ayuda-${entidad}-${propietarioId}`}
          onChange={(event) => cambiarTexto(event.target.value)}
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            id={`observacion-ayuda-${entidad}-${propietarioId}`}
            className="text-xs text-muted-foreground"
          >
            La observación quedará registrada con tu usuario y no podrá
            modificarse.
          </p>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs tabular-nums text-muted-foreground">
              {texto.length}/2000
            </span>

            <Button type="submit" size="sm" disabled={!puedeGuardar}>
              {crearObservacionMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}

              {crearObservacionMutation.isPending
                ? "Agregando..."
                : "Agregar observación"}
            </Button>
          </div>
        </div>

        {crearObservacionMutation.isSuccess && (
          <div
            role="status"
            className="mt-4 rounded-md border border-emerald-700/20 bg-emerald-600/5 p-3 text-sm text-emerald-800 dark:text-emerald-300"
          >
            La observación se agregó correctamente.
          </div>
        )}

        {crearObservacionMutation.isError && (
          <div
            role="alert"
            className="mt-4 flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

            <p className="text-muted-foreground">
              {crearObservacionMutation.error instanceof Error
                ? crearObservacionMutation.error.message
                : "No pudimos agregar la observación."}
            </p>
          </div>
        )}
      </form>

      {observacionesQuery.isLoading ? (
        <div className="space-y-5 p-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : observacionesQuery.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center px-5 py-9 text-center"
        >
          <AlertCircle className="size-5 text-destructive" />

          <p className="mt-3 text-sm font-medium">
            No pudimos cargar las observaciones
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => observacionesQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : observaciones.length === 0 ? (
        <div className="px-5 py-9 text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquareText className="size-4" />
          </span>

          <p className="mt-3 text-sm font-medium">Sin observaciones</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Todavía no se registraron notas en este historial.
          </p>
        </div>
      ) : (
        <ol className="divide-y">
          {observaciones.map((observacion) => (
            <li
              key={observacion.observacionId}
              className="flex items-start gap-3 p-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <UserRound className="size-4" />
              </span>

              <article className="min-w-0 flex-1">
                <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="truncate text-sm font-medium">
                    {observacion.usuarioCreacion}
                  </p>

                  <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    {formatearFechaHora(observacion.fechaCreacion)}
                  </p>
                </header>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                  {observacion.texto}
                </p>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
