"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Unlink, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useDesvincularFamiliar, useFamiliares } from "../hooks/useFamiliares";

import { PARENTESCOS, type FamiliarResponse } from "../types/types";
import VincularFamiliarForm from "./VincularFamiliarForm";

type Props = {
  clienteId: number;
  nombreCliente: string;
  activo: boolean;
  disabled?: boolean;
};

export default function FamiliaresCliente(props: Props) {
  // Cambiar de ficha o de estado descarta formularios y confirmaciones.
  return (
    <ContenidoFamiliares
      key={`${props.clienteId}-${props.activo}`}
      {...props}
    />
  );
}

function ContenidoFamiliares({
  clienteId,
  nombreCliente,
  activo,
  disabled = false,
}: Props) {
  const query = useFamiliares(clienteId);
  const mutation = useDesvincularFamiliar(clienteId);

  const [agregando, setAgregando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<FamiliarResponse | null>(
    null,
  );
  const [mensaje, setMensaje] = useState("");

  const familiares = query.data ?? [];
  const bloqueado = disabled || mutation.isPending;

  const desvincular = async () => {
    if (!confirmacion || bloqueado) return;

    try {
      await mutation.mutateAsync(confirmacion.familiarId);

      setConfirmacion(null);
      setMensaje(
        "La relación se desvinculó. Los datos de ambos clientes se conservaron.",
      );
    } catch {
      // Conserva la confirmación y muestra el error de la API.
    }
  };

  return (
    <section
      className="overflow-hidden rounded-lg border bg-card"
      aria-labelledby={`familiares-${clienteId}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <UsersRound className="size-4 text-primary" />

          <div>
            <h2
              id={`familiares-${clienteId}`}
              className="text-sm font-semibold"
            >
              Familiares relacionados
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Parentesco y acceso a la ficha de cada familiar.
            </p>
          </div>

          {query.isSuccess && (
            <Badge variant="outline">{familiares.length}</Badge>
          )}
        </div>

        {!agregando && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              !activo || bloqueado || confirmacion !== null || !query.isSuccess
            }
            onClick={() => {
              setMensaje("");
              mutation.reset();
              setAgregando(true);
            }}
          >
            <Plus />
            Vincular familiar
          </Button>
        )}
      </header>

      {!activo && (
        <p className="border-b px-5 py-3 text-sm text-muted-foreground">
          El cliente está inactivo. Podés consultar o desvincular familiares;
          para agregar vínculos, reactivalo.
        </p>
      )}

      {mensaje && (
        <p
          role="status"
          className="border-b bg-emerald-600/5 px-5 py-3 text-sm text-emerald-800 dark:text-emerald-300"
        >
          {mensaje}
        </p>
      )}

      {agregando && activo && (
        <VincularFamiliarForm
          clienteId={clienteId}
          nombreCliente={nombreCliente}
          vinculados={familiares.map((familiar) => familiar.familiarId)}
          disabled={bloqueado || !query.isSuccess}
          onCancelar={() => setAgregando(false)}
          onGuardado={() => {
            setAgregando(false);
            setMensaje("El familiar se vinculó correctamente.");
          }}
        />
      )}

      {confirmacion && (
        <div className="space-y-3 border-b bg-muted/20 p-5">
          <h3 className="text-sm font-semibold">
            ¿Desvincular a {confirmacion.nombreCompleto}?
          </h3>

          <p className="text-sm text-muted-foreground">
            Se quitará la relación de ambas fichas. No se eliminará ningún
            cliente ni sus expedientes.
          </p>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={bloqueado}
              onClick={() => {
                setConfirmacion(null);
                mutation.reset();
              }}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={bloqueado}
              onClick={desvincular}
            >
              {mutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {mutation.isPending
                ? "Desvinculando..."
                : "Confirmar desvinculación"}
            </Button>
          </div>
        </div>
      )}

      {query.isPending ? (
        <div role="status" className="space-y-3 p-5">
          <span className="sr-only">Cargando familiares...</span>

          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : query.isError ? (
        <div role="alert" className="space-y-3 p-5">
          <p className="text-sm text-destructive">
            No pudimos cargar los familiares. {query.error.message}
          </p>

          <Button
            type="button"
            variant="outline"
            disabled={bloqueado || query.isFetching}
            onClick={() => void query.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : familiares.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          Todavía no hay familiares vinculados a este cliente.
        </p>
      ) : (
        <ul className="grid gap-3 p-5 md:grid-cols-2">
          {familiares.map((familiar) => (
            <li
              key={familiar.relacionFamiliarId}
              className="space-y-3 rounded-md border bg-background p-4"
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {PARENTESCOS[familiar.parentesco] ??
                    "Parentesco no reconocido"}
                </Badge>

                {!familiar.activo && (
                  <Badge variant="outline">Cliente inactivo</Badge>
                )}
              </div>

              <Link
                href={`/clientes/${familiar.familiarId}`}
                className="block break-words text-sm font-medium hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {familiar.nombreCompleto}
              </Link>

              <p className="text-xs text-muted-foreground">
                DNI: {familiar.dni || "No informado"} · CUIL:{" "}
                {familiar.cuil || "No informado"}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/clientes/${familiar.familiarId}`}
                  className="text-xs text-primary underline underline-offset-4"
                  aria-label={`Abrir ficha de ${familiar.nombreCompleto}`}
                >
                  Abrir ficha
                </Link>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={bloqueado || agregando || confirmacion !== null}
                  aria-label={`Desvincular a ${familiar.nombreCompleto}`}
                  onClick={() => {
                    setMensaje("");
                    mutation.reset();
                    setConfirmacion(familiar);
                  }}
                >
                  <Unlink />
                  Desvincular
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
