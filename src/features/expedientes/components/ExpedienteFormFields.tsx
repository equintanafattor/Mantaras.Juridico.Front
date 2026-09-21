"use client";

import { useEffect } from "react";
import { FileText, FolderTree } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

import ExpedienteDatosFormFields from "./ExpedienteDatosFormFields";

export type ExpedienteFormState = {
  casoIds: number[];
  expedientePadreId: number | null;
  tipoExpediente: TipoExpediente;
  numeroExpediente: string;
  caratula: string;
  juzgado: string;
  fechaInicio: string;
  estadoLegal: string;
};

export const FORM_EXPEDIENTE_INICIAL: ExpedienteFormState = {
  casoIds: [],
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
    casoIds: expediente.casos.map((caso) => caso.casoId),
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
  { value: "Principal", label: "Principal" },
  { value: "Incidente", label: "Incidente" },
  { value: "Apelacion", label: "Apelación" },
  { value: "Ejecucion", label: "Ejecución" },
];

function normalizarOpcional(value: string) {
  const normalizedValue = value.trim();

  return normalizedValue || null;
}

export function crearRequestDesdeForm(
  form: ExpedienteFormState,
): CrearExpedienteRequest {
  if (form.casoIds.length === 0) {
    throw new Error(
      "Debe seleccionarse al menos un expediente administrativo.",
    );
  }

  return {
    casoIds: form.casoIds,
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
  return crearRequestDesdeForm(form);
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

  const tieneCasos = form.casoIds.length > 0;
  const expedientesQuery = useExpedientes(
    {
      page: 1,
      pageSize: 100,
      soloActivos: modo === "crear",
    },
    tieneCasos,
    false,
  );

  const expedientesDelCaso = (expedientesQuery.data?.items ?? []).filter(
    (expediente) =>
      expediente.expedienteId !== expedienteActualId &&
      expediente.casos.some((caso) => form.casoIds.includes(caso.casoId)),
  );
  const expedientePrincipal =
    expedientesDelCaso.find(
      (expediente) => expediente.tipoExpediente === "Principal",
    ) ?? null;

  useEffect(() => {
    if (
      modo === "crear" &&
      tieneCasos &&
      expedientePrincipal &&
      form.tipoExpediente === "Principal"
    ) {
      onChange({
        ...form,
        tipoExpediente: "Incidente",
        expedientePadreId: expedientePrincipal.expedienteId,
      });
    }
  }, [expedientePrincipal, form, modo, onChange, tieneCasos]);

  const actualizarCampo = <K extends keyof ExpedienteFormState>(
    campo: K,
    value: ExpedienteFormState[K],
  ) => {
    onChange({ ...form, [campo]: value });
  };

  const alternarCaso = (casoId: number) => {
    if (bloquearCaso) return;

    const seleccionado = form.casoIds.includes(casoId);
    const casoIds = seleccionado
      ? form.casoIds.filter((id) => id !== casoId)
      : [...form.casoIds, casoId];

    onChange({
      ...form,
      casoIds,
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
  const expedienteActualEsPrincipal =
    modo === "editar" &&
    form.tipoExpediente === "Principal" &&
    expedientePrincipal === null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>
              Expedientes administrativos relacionados{" "}
              <span className="text-destructive">*</span>
            </Label>

            <Badge variant="outline">{form.casoIds.length}</Badge>
          </div>

          {casosQuery.isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : casosQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              No pudimos cargar los expedientes administrativos activos.
            </div>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-2">
              {casosQuery.data?.items.map((caso) => {
                const seleccionado = form.casoIds.includes(caso.casoId);

                return (
                  <label
                    key={caso.casoId}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-3 transition-colors hover:bg-muted/50 has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      disabled={disabled || bloquearCaso}
                      className="mt-1 size-4 rounded border-input accent-primary"
                      onChange={() => alternarCaso(caso.casoId)}
                    />

                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {caso.titulo}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {caso.numeroExpedienteAnses
                          ? `ANSES ${caso.numeroExpedienteAnses}`
                          : `Expediente administrativo #${caso.casoId}`}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {form.casoIds.length === 0 && (
            <p className="text-xs text-destructive">
              Seleccioná al menos un expediente administrativo.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expediente-tipo">
            Tipo de expediente judicial{" "}
            <span className="text-destructive">*</span>
          </Label>

          <select
            id="expediente-tipo"
            value={form.tipoExpediente}
            disabled={disabled || form.casoIds.length === 0 || expedientesQuery.isLoading}
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
                disabled={tipo.value === "Principal" && expedientePrincipal !== null}
              >
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expediente-padre">
            Expediente judicial de origen
            {!esPrincipal && <span className="text-destructive"> *</span>}
          </Label>

          <select
            id="expediente-padre"
            value={form.expedientePadreId ?? ""}
            disabled={
              disabled ||
              form.casoIds.length === 0 ||
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

        {tieneCasos && expedientesQuery.isLoading && (
          <div className="sm:col-span-2">
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {tieneCasos && expedientesQuery.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:col-span-2">
            No pudimos consultar los expedientes judiciales relacionados.
          </div>
        )}

        {tieneCasos &&
          !expedientesQuery.isLoading &&
          !expedientesQuery.isError && (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:col-span-2">
              {expedientePrincipal || expedienteActualEsPrincipal ? (
                <FolderTree className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
              )}

              <p className="text-muted-foreground">
                {expedienteActualEsPrincipal
                  ? "Este expediente judicial es principal y no requiere un expediente judicial de origen."
                  : expedientePrincipal
                    ? "El primer expediente administrativo seleccionado ya tiene un judicial principal. Este deberá registrarse como incidente, apelación o ejecución."
                    : "El primer expediente administrativo seleccionado todavía no tiene expediente judicial principal."}
              </p>
            </div>
          )}
      </section>

      <ExpedienteDatosFormFields
        form={form}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}
