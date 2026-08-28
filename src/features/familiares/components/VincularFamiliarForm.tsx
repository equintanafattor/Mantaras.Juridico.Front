"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useClientes } from "@/features/clientes/hooks/useClientes";
import type { ClienteResponse } from "@/features/clientes/types/types";

import { useVincularFamiliar } from "../hooks/useFamiliares";
import { esParentesco, PARENTESCOS } from "../types/types";

type Props = {
  clienteId: number;
  nombreCliente: string;
  vinculados: number[];
  disabled: boolean;
  onCancelar: () => void;
  onGuardado: () => void;
};

function BuscarFamiliar({
  clienteId,
  vinculados,
  disabled,
  onSeleccionar,
}: {
  clienteId: number;
  vinculados: number[];
  disabled: boolean;
  onSeleccionar: (cliente: ClienteResponse) => void;
}) {
  const [texto, setTexto] = useState("");
  const [consulta, setConsulta] = useState({
    busqueda: "",
    page: 1,
  });

  const query = useClientes({
    ...consulta,
    pageSize: 10,
    soloActivos: true,
  });

  const sinBuscar = texto.trim() !== consulta.busqueda;
  const cargando = query.isFetching || query.isPlaceholderData;

  const opciones = (query.data?.items ?? []).filter(
    (cliente) =>
      cliente.activo &&
      cliente.clienteId !== clienteId &&
      !vinculados.includes(cliente.clienteId),
  );

  const buscar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled) return;

    const busqueda = texto.trim();

    if (busqueda === consulta.busqueda && consulta.page === 1) {
      void query.refetch();
    } else {
      setConsulta({ busqueda, page: 1 });
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={buscar}>
        <label
          htmlFor={`buscar-familiar-${clienteId}`}
          className="text-sm font-medium"
        >
          Buscar cliente por nombre, apellido, DNI o CUIL
        </label>

        <div className="mt-2 flex gap-2">
          <Input
            id={`buscar-familiar-${clienteId}`}
            value={texto}
            disabled={disabled}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Escribí y presioná Buscar"
          />

          <Button
            type="submit"
            variant="outline"
            disabled={disabled || cargando}
          >
            <Search className="size-4" />
            Buscar
          </Button>
        </div>
      </form>

      {sinBuscar ? (
        <p role="status" className="text-sm text-muted-foreground">
          Presioná Buscar para actualizar los resultados.
        </p>
      ) : query.isError ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>No pudimos buscar clientes.</p>

          <Button
            type="button"
            variant="outline"
            disabled={disabled || cargando}
            onClick={() => void query.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : query.isPending || cargando ? (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" />
          Buscando clientes...
        </p>
      ) : (
        <>
          {opciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay clientes disponibles en esta página. Se excluyen este
              cliente y los familiares ya vinculados.
            </p>
          ) : (
            <ul className="divide-y rounded-md border bg-background">
              {opciones.map((cliente) => (
                <li key={cliente.clienteId}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSeleccionar(cliente)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-medium">
                        {cliente.nombreCompleto}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        DNI: {cliente.dni || "No informado"} · CUIL:{" "}
                        {cliente.cuil || "No informado"} · #{cliente.clienteId}
                      </span>
                    </span>

                    <span className="text-xs text-primary">Seleccionar</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Página {consulta.page} · {query.data?.totalItems ?? 0} clientes
              encontrados
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || !query.data?.hasPreviousPage}
                onClick={() =>
                  setConsulta((actual) => ({
                    ...actual,
                    page: Math.max(1, actual.page - 1),
                  }))
                }
              >
                Anterior
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || !query.data?.hasNextPage}
                onClick={() =>
                  setConsulta((actual) => ({
                    ...actual,
                    page: actual.page + 1,
                  }))
                }
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function VincularFamiliarForm({
  clienteId,
  nombreCliente,
  vinculados,
  disabled,
  onCancelar,
  onGuardado,
}: Props) {
  const [seleccionado, setSeleccionado] = useState<ClienteResponse | null>(
    null,
  );
  const [parentesco, setParentesco] = useState("");

  const mutation = useVincularFamiliar(clienteId);
  const bloqueado = disabled || mutation.isPending;

  const yaVinculado =
    seleccionado !== null && vinculados.includes(seleccionado.clienteId);

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      bloqueado ||
      !seleccionado ||
      yaVinculado ||
      !esParentesco(parentesco)
    ) {
      return;
    }

    try {
      await mutation.mutateAsync({
        familiarId: seleccionado.clienteId,
        parentesco,
      });

      onGuardado();
    } catch {
      // Conserva la selección y muestra el error de la API.
    }
  };

  return (
    <div className="space-y-4 border-b bg-muted/15 p-5">
      <h3 className="text-sm font-semibold">Vincular un familiar</h3>

      <p className="text-xs text-muted-foreground">
        Seleccioná un cliente existente. No se crean personas ni expedientes
        desde este formulario.
      </p>

      {!seleccionado ? (
        <>
          <BuscarFamiliar
            clienteId={clienteId}
            vinculados={vinculados}
            disabled={bloqueado}
            onSeleccionar={setSeleccionado}
          />

          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={onCancelar}
          >
            Cancelar
          </Button>
        </>
      ) : (
        <form onSubmit={guardar} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium">
                {seleccionado.nombreCompleto}
              </p>

              <p className="text-xs text-muted-foreground">
                DNI: {seleccionado.dni || "No informado"} · #
                {seleccionado.clienteId}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={bloqueado}
              onClick={() => {
                setSeleccionado(null);
                setParentesco("");
                mutation.reset();
              }}
            >
              Cambiar cliente
            </Button>
          </div>

          <div>
            <label
              htmlFor={`parentesco-${clienteId}`}
              className="text-sm font-medium"
            >
              ¿Qué parentesco tiene {seleccionado.nombreCompleto} con{" "}
              {nombreCliente}?
            </label>

            <select
              id={`parentesco-${clienteId}`}
              value={parentesco}
              required
              disabled={bloqueado || yaVinculado}
              className="mt-2 block w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => {
                setParentesco(event.target.value);
                mutation.reset();
              }}
            >
              <option value="">Seleccionar parentesco</option>

              {Object.entries(PARENTESCOS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {esParentesco(parentesco) && (
              <p className="mt-2 text-sm text-muted-foreground">
                {seleccionado.nombreCompleto} quedará registrado como{" "}
                <strong>{PARENTESCOS[parentesco].toLowerCase()}</strong> de{" "}
                {nombreCliente}.
              </p>
            )}
          </div>

          {yaVinculado && (
            <p role="status" className="text-sm">
              Este cliente ya aparece entre los familiares vinculados. Cerrá el
              formulario para revisar la relación.
            </p>
          )}

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={onCancelar}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={bloqueado || yaVinculado || !esParentesco(parentesco)}
            >
              {mutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {mutation.isPending ? "Vinculando..." : "Confirmar vínculo"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
