"use client";

import { useState } from "react";
import { Plus, Search, Star, UserRound, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { useClientes } from "@/features/clientes/hooks/useClientes";
import type { ClienteResponse } from "@/features/clientes/types/types";

import type {
  CasoDetalleResponse,
  CrearCasoRequest,
  FaseCaso,
  TipoParticipacionCliente,
} from "../types/types";

export type CasoParticipanteForm = {
  clienteId: number;
  nombreCompleto: string;
  dni: string | null;
  cuil: string | null;
  tipoParticipacion: TipoParticipacionCliente;
  esPrincipal: boolean;
};

export type CasoFormState = {
  titulo: string;
  faseInterna: FaseCaso;
  tipoTramite: string;
  observaciones: string;
  clientes: CasoParticipanteForm[];
};

export const FORM_CASO_INICIAL: CasoFormState = {
  titulo: "",
  faseInterna: "Preadministrativa",
  tipoTramite: "",
  observaciones: "",
  clientes: [],
};

export function crearFormDesdeCaso(caso: CasoDetalleResponse): CasoFormState {
  return {
    titulo: caso.titulo,
    faseInterna: caso.faseInterna,
    tipoTramite: caso.tipoTramite ?? "",
    observaciones: caso.observaciones ?? "",
    clientes: caso.clientes.map((cliente) => ({
      clienteId: cliente.clienteId,
      nombreCompleto: cliente.nombreCompleto,
      dni: cliente.dni,
      cuil: cliente.cuil,
      tipoParticipacion: cliente.tipoParticipacion,
      esPrincipal: cliente.esPrincipal,
    })),
  };
}

type CasoFormFieldsProps = {
  form: CasoFormState;
  disabled?: boolean;
  onChange: (form: CasoFormState) => void;
};

const PARTICIPACIONES: Array<{
  value: TipoParticipacionCliente;
  label: string;
}> = [
  { value: "Titular", label: "Titular" },
  { value: "Conyuge", label: "Cónyuge" },
  { value: "Continuador", label: "Continuador" },
  { value: "Heredero", label: "Heredero" },
  { value: "Otro", label: "Otro" },
];

function normalizarOpcional(value: string) {
  const normalizedValue = value.trim();

  return normalizedValue || null;
}

export function crearRequestDesdeForm(form: CasoFormState): CrearCasoRequest {
  return {
    titulo: form.titulo.trim(),
    faseInterna: form.faseInterna,
    tipoTramite: normalizarOpcional(form.tipoTramite),
    observaciones: normalizarOpcional(form.observaciones),
    clientes: form.clientes.map((cliente) => ({
      clienteId: cliente.clienteId,
      tipoParticipacion: cliente.tipoParticipacion,
      esPrincipal: cliente.esPrincipal,
    })),
  };
}

function ClienteResultado({
  cliente,
  disabled,
  onAgregar,
}: {
  cliente: ClienteResponse;
  disabled: boolean;
  onAgregar: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <UserRound className="size-4" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {cliente.nombreCompleto}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {cliente.dni
              ? `DNI ${cliente.dni}`
              : cliente.cuil
                ? `CUIL ${cliente.cuil}`
                : "Sin documento informado"}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onAgregar}
      >
        <Plus />
        Agregar
      </Button>
    </div>
  );
}

export default function CasoFormFields({
  form,
  disabled = false,
  onChange,
}: CasoFormFieldsProps) {
  const [busquedaCliente, setBusquedaCliente] = useState("");

  const busquedaDebounced = useDebouncedValue(busquedaCliente.trim(), 350);

  const clientesQuery = useClientes({
    page: 1,
    pageSize: 10,
    busqueda: busquedaDebounced || undefined,
    soloActivos: true,
  });

  const clientesSeleccionadosIds = new Set(
    form.clientes.map((cliente) => cliente.clienteId),
  );

  const clientesDisponibles =
    clientesQuery.data?.items.filter(
      (cliente) => !clientesSeleccionadosIds.has(cliente.clienteId),
    ) ?? [];

  const actualizarCampo = <K extends keyof CasoFormState>(
    campo: K,
    value: CasoFormState[K],
  ) => {
    onChange({
      ...form,
      [campo]: value,
    });
  };

  const agregarCliente = (cliente: ClienteResponse) => {
    if (clientesSeleccionadosIds.has(cliente.clienteId)) {
      return;
    }

    const esPrimerCliente = form.clientes.length === 0;

    actualizarCampo("clientes", [
      ...form.clientes,
      {
        clienteId: cliente.clienteId,
        nombreCompleto: cliente.nombreCompleto,
        dni: cliente.dni,
        cuil: cliente.cuil,
        tipoParticipacion: esPrimerCliente ? "Titular" : "Otro",
        esPrincipal: esPrimerCliente,
      },
    ]);

    setBusquedaCliente("");
  };

  const quitarCliente = (clienteId: number) => {
    actualizarCampo(
      "clientes",
      form.clientes.filter((cliente) => cliente.clienteId !== clienteId),
    );
  };

  const cambiarParticipacion = (
    clienteId: number,
    tipoParticipacion: TipoParticipacionCliente,
  ) => {
    actualizarCampo(
      "clientes",
      form.clientes.map((cliente) =>
        cliente.clienteId === clienteId
          ? {
              ...cliente,
              tipoParticipacion,
            }
          : cliente,
      ),
    );
  };

  const marcarPrincipal = (clienteId: number) => {
    actualizarCampo(
      "clientes",
      form.clientes.map((cliente) => ({
        ...cliente,
        esPrincipal: cliente.clienteId === clienteId,
      })),
    );
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="caso-titulo">
            Título <span className="text-destructive">*</span>
          </Label>

          <Input
            id="caso-titulo"
            value={form.titulo}
            disabled={disabled}
            maxLength={300}
            required
            placeholder="Ej.: Reajuste de haberes - Apellido"
            onChange={(event) => actualizarCampo("titulo", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caso-fase">
            Fase interna <span className="text-destructive">*</span>
          </Label>

          <select
            id="caso-fase"
            value={form.faseInterna}
            disabled={disabled}
            required
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(event) =>
              actualizarCampo("faseInterna", event.target.value as FaseCaso)
            }
          >
            <option value="Preadministrativa">Preadministrativa</option>
            <option value="Juicio">Juicio</option>
            <option value="Postjuicio">Postjuicio</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="caso-tipo-tramite">Tipo de trámite</Label>

          <Input
            id="caso-tipo-tramite"
            value={form.tipoTramite}
            disabled={disabled}
            maxLength={200}
            placeholder="Ej.: Reajuste previsional"
            onChange={(event) =>
              actualizarCampo("tipoTramite", event.target.value)
            }
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="caso-observaciones">Observaciones</Label>

          <Textarea
            id="caso-observaciones"
            value={form.observaciones}
            disabled={disabled}
            maxLength={2000}
            rows={4}
            placeholder="Información interna relevante para el caso..."
            onChange={(event) =>
              actualizarCampo("observaciones", event.target.value)
            }
          />
        </div>
      </section>

      <section className="space-y-4 border-t pt-5">
        <div>
          <h3 className="text-sm font-medium">
            Participantes <span className="text-destructive">*</span>
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Agregá al menos un cliente y elegí exactamente un principal.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buscar-cliente">Buscar cliente activo</Label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="buscar-cliente"
              value={busquedaCliente}
              disabled={disabled}
              placeholder="Nombre, apellido, DNI o CUIL..."
              className="pl-9"
              onChange={(event) => setBusquedaCliente(event.target.value)}
            />
          </div>
        </div>

        {clientesQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : clientesQuery.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            No pudimos consultar los clientes activos.
          </div>
        ) : clientesDisponibles.length > 0 ? (
          <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border p-2">
            {clientesDisponibles.map((cliente) => (
              <ClienteResultado
                key={cliente.clienteId}
                cliente={cliente}
                disabled={disabled}
                onAgregar={() => agregarCliente(cliente)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {busquedaDebounced
              ? "No se encontraron clientes activos para esa búsqueda."
              : "No hay más clientes activos disponibles para agregar."}
          </div>
        )}

        {form.clientes.length > 0 && (
          <div className="space-y-3 pt-2">
            {form.clientes.map((cliente) => (
              <article
                key={cliente.clienteId}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{cliente.nombreCompleto}</p>

                      {cliente.esPrincipal && (
                        <Badge variant="secondary">
                          <Star className="size-3" />
                          Principal
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {cliente.dni
                        ? `DNI ${cliente.dni}`
                        : cliente.cuil
                          ? `CUIL ${cliente.cuil}`
                          : "Sin documento informado"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    aria-label={`Quitar a ${cliente.nombreCompleto}`}
                    onClick={() => quitarCliente(cliente.clienteId)}
                  >
                    <X />
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor={`participacion-${cliente.clienteId}`}>
                      Participación
                    </Label>

                    <select
                      id={`participacion-${cliente.clienteId}`}
                      value={cliente.tipoParticipacion}
                      disabled={disabled}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(event) =>
                        cambiarParticipacion(
                          cliente.clienteId,
                          event.target.value as TipoParticipacionCliente,
                        )
                      }
                    >
                      {PARTICIPACIONES.map((participacion) => (
                        <option
                          key={participacion.value}
                          value={participacion.value}
                        >
                          {participacion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant={cliente.esPrincipal ? "secondary" : "outline"}
                    disabled={disabled || cliente.esPrincipal}
                    onClick={() => marcarPrincipal(cliente.clienteId)}
                  >
                    <Star />
                    {cliente.esPrincipal ? "Es principal" : "Marcar principal"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
