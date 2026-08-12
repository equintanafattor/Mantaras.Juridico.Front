"use client";

import { useEffect } from "react";
import { FileText, FolderTree } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import { useCasos } from "@/features/casos/hooks/useCasos";

import { useExpedientes } from "../hooks/useExpedientes";
import type {
  ActualizarExpedienteRequest,
  CrearExpedienteRequest,
  ExpedienteDetalleResponse,
  TipoExpediente,
} from "../types/types";

export type ExpedienteFormState = {
  casoId: number | null;
  expedientePadreId: number | null;
  tipoExpediente: TipoExpediente;
  numeroExpediente: string;
  caratula: string;
  juzgado: string;
  fechaInicio: string;
  estadoLegal: string;
};

export const FORM_EXPEDIENTE_INICIAL: ExpedienteFormState = {
  casoId: null,
  expedientePadreId: null,
  tipoExpediente: "Principal",
  numeroExpediente: "",
  caratula: "",
  juzgado: "",
  fechaInicio: "",
  estadoLegal: "",
};

export function crearFormDesdeExpediente(
  expediente: ExpedienteDetalleResponse,
): ExpedienteFormState {
  return {
    casoId: expediente.casoId,
    expedientePadreId: expediente.expedientePadreId,
    tipoExpediente: expediente.tipoExpediente,
    numeroExpediente: expediente.numeroExpediente ?? "",
    caratula: expediente.caratula,
    juzgado: expediente.juzgado ?? "",
    fechaInicio: expediente.fechaInicio ?? "",
    estadoLegal: expediente.estadoLegal ?? "",
  };
}

type ExpedienteFormFieldsProps = {
  form: ExpedienteFormState;
  modo?: "crear" | "editar";
  expedienteActualId?: number;
  bloquearCaso?: boolean;
  disabled?: boolean;
  onChange: (form: ExpedienteFormState) => void;
};

const TIPOS_EXPEDIENTE: Array<{
  value: TipoExpediente;
  label: string;
}> = [
  {
    value: "Principal",
    label: "Principal",
  },
  {
    value: "Incidente",
    label: "Incidente",
  },
  {
    value: "Apelacion",
    label: "Apelación",
  },
  {
    value: "Ejecucion",
    label: "Ejecución",
  },
];

function normalizarOpcional(value: string) {
  const normalizedValue = value.trim();

  return normalizedValue || null;
}

export function crearRequestDesdeForm(
  form: ExpedienteFormState,
): CrearExpedienteRequest {
  if (form.casoId === null) {
    throw new Error("Debe seleccionarse un caso para crear el expediente.");
  }

  return {
    casoId: form.casoId,
    expedientePadreId: form.expedientePadreId,
    tipoExpediente: form.tipoExpediente,
    numeroExpediente: normalizarOpcional(form.numeroExpediente),
    caratula: form.caratula.trim(),
    juzgado: normalizarOpcional(form.juzgado),
    fechaInicio: normalizarOpcional(form.fechaInicio),
    estadoLegal: normalizarOpcional(form.estadoLegal),
  };
}

export function crearActualizarRequestDesdeForm(
  form: ExpedienteFormState,
): ActualizarExpedienteRequest {
  return {
    expedientePadreId: form.expedientePadreId,
    tipoExpediente: form.tipoExpediente,
    numeroExpediente: normalizarOpcional(form.numeroExpediente),
    caratula: form.caratula.trim(),
    juzgado: normalizarOpcional(form.juzgado),
    fechaInicio: normalizarOpcional(form.fechaInicio),
    estadoLegal: normalizarOpcional(form.estadoLegal),
  };
}

export default function ExpedienteFormFields({
  form,
  modo = "crear",
  expedienteActualId,
  bloquearCaso = false,
  disabled = false,
  onChange,
}: ExpedienteFormFieldsProps) {
  const casosQuery = useCasos({
    page: 1,
    pageSize: 100,
    soloActivos: true,
  });

  const expedientesQuery = useExpedientes(
    {
      page: 1,
      pageSize: 100,
      casoId: form.casoId ?? undefined,
      soloActivos: modo === "crear",
    },
    form.casoId !== null,
    false,
  );

  const expedientesDelCaso = (expedientesQuery.data?.items ?? []).filter(
    (expediente) => expediente.expedienteId !== expedienteActualId,
  );

  const expedientePrincipal =
    expedientesDelCaso.find(
      (expediente) => expediente.tipoExpediente === "Principal",
    ) ?? null;

  useEffect(() => {
    if (
      modo === "crear" &&
      form.casoId !== null &&
      expedientePrincipal &&
      form.tipoExpediente === "Principal"
    ) {
      onChange({
        ...form,
        tipoExpediente: "Incidente",
        expedientePadreId: expedientePrincipal.expedienteId,
      });
    }
  }, [expedientePrincipal, form, modo, onChange]);

  const actualizarCampo = <K extends keyof ExpedienteFormState>(
    campo: K,
    value: ExpedienteFormState[K],
  ) => {
    onChange({
      ...form,
      [campo]: value,
    });
  };

  const cambiarCaso = (value: string) => {
    onChange({
      ...form,
      casoId: value ? Number(value) : null,
      expedientePadreId: null,
      tipoExpediente: "Principal",
    });
  };

  const cambiarTipo = (tipo: TipoExpediente) => {
    onChange({
      ...form,
      tipoExpediente: tipo,
      expedientePadreId:
        tipo === "Principal"
          ? null
          : (expedientePrincipal?.expedienteId ?? null),
    });
  };

  const esPrincipal = form.tipoExpediente === "Principal";

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="expediente-caso">
            Caso <span className="text-destructive">*</span>
          </Label>

          {casosQuery.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : casosQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              No pudimos cargar los casos activos.
            </div>
          ) : (
            <select
              id="expediente-caso"
              value={form.casoId ?? ""}
              disabled={disabled || modo === "editar" || bloquearCaso}
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) => cambiarCaso(event.target.value)}
            >
              <option value="">Seleccioná un caso...</option>

              {casosQuery.data?.items.map((caso) => (
                <option key={caso.casoId} value={caso.casoId}>
                  {caso.titulo}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expediente-tipo">
            Tipo de expediente <span className="text-destructive">*</span>
          </Label>

          <select
            id="expediente-tipo"
            value={form.tipoExpediente}
            disabled={
              disabled || form.casoId === null || expedientesQuery.isLoading
            }
            required
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(event) =>
              cambiarTipo(event.target.value as TipoExpediente)
            }
          >
            {TIPOS_EXPEDIENTE.map((tipo) => (
              <option
                key={tipo.value}
                value={tipo.value}
                disabled={
                  tipo.value === "Principal" && expedientePrincipal !== null
                }
              >
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expediente-padre">
            Expediente padre
            {!esPrincipal && <span className="text-destructive"> *</span>}
          </Label>

          <select
            id="expediente-padre"
            value={form.expedientePadreId ?? ""}
            disabled={
              disabled ||
              form.casoId === null ||
              esPrincipal ||
              expedientesQuery.isLoading
            }
            required={!esPrincipal}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(event) =>
              actualizarCampo(
                "expedientePadreId",
                event.target.value ? Number(event.target.value) : null,
              )
            }
          >
            <option value="">
              {esPrincipal ? "No corresponde" : "Seleccioná un expediente..."}
            </option>

            {!esPrincipal &&
              expedientesDelCaso.map((expediente) => (
                <option
                  key={expediente.expedienteId}
                  value={expediente.expedienteId}
                  disabled={!expediente.activo}
                >
                  {expediente.numeroExpediente || expediente.caratula}
                  {!expediente.activo ? " (inactivo)" : ""}
                </option>
              ))}
          </select>
        </div>

        {form.casoId !== null && expedientesQuery.isLoading && (
          <div className="sm:col-span-2">
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {form.casoId !== null && expedientesQuery.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:col-span-2">
            No pudimos consultar los expedientes del caso.
          </div>
        )}

        {form.casoId !== null &&
          !expedientesQuery.isLoading &&
          !expedientesQuery.isError && (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:col-span-2">
              {expedientePrincipal ? (
                <FolderTree className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
              )}

              <p className="text-muted-foreground">
                {expedientePrincipal
                  ? "Este caso ya tiene un expediente principal. El nuevo expediente deberá relacionarse como incidente, apelación o ejecución."
                  : "Este caso todavía no tiene expediente principal. Debés crear el principal antes de registrar expedientes derivados."}
              </p>
            </div>
          )}

        <div className="space-y-2">
          <Label htmlFor="expediente-numero">Número de expediente</Label>

          <Input
            id="expediente-numero"
            value={form.numeroExpediente}
            disabled={disabled}
            maxLength={100}
            placeholder="Ej.: FRO 012345/2026"
            onChange={(event) =>
              actualizarCampo("numeroExpediente", event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expediente-fecha-inicio">Fecha de inicio</Label>

          <Input
            id="expediente-fecha-inicio"
            type="date"
            value={form.fechaInicio}
            disabled={disabled}
            onChange={(event) =>
              actualizarCampo("fechaInicio", event.target.value)
            }
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="expediente-caratula">
            Carátula <span className="text-destructive">*</span>
          </Label>

          <Input
            id="expediente-caratula"
            value={form.caratula}
            disabled={disabled}
            maxLength={1000}
            required
            placeholder="Carátula completa del expediente"
            onChange={(event) =>
              actualizarCampo("caratula", event.target.value)
            }
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="expediente-juzgado">Juzgado</Label>

          <Input
            id="expediente-juzgado"
            value={form.juzgado}
            disabled={disabled}
            maxLength={500}
            placeholder="Juzgado o tribunal interviniente"
            onChange={(event) => actualizarCampo("juzgado", event.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="expediente-estado-legal">Estado legal</Label>

          <Input
            id="expediente-estado-legal"
            value={form.estadoLegal}
            disabled={disabled}
            maxLength={200}
            placeholder="Ej.: Iniciado, en trámite, elevado a Cámara..."
            onChange={(event) =>
              actualizarCampo("estadoLegal", event.target.value)
            }
          />
        </div>
      </section>
    </div>
  );
}
