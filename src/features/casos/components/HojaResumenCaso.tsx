"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  FilePlus2,
  FileText,
  Loader2,
  Pencil,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/apiClient";

import { useGuardarHojaResumen, useHojaResumen } from "../hooks/useHojaResumen";

import {
  crearHojaForm,
  crearHojaRequest,
  mostrarCampoHoja,
  SECCIONES_HOJA,
  type HojaForm,
} from "../lib/hojaResumenForm";

import type { HojaResumenResponse } from "../types/hojaResumen";

function EditorHoja({
  inicial,
  onCancelar,
  onGuardado,
}: {
  inicial: HojaResumenResponse;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [form, setForm] = useState(() => crearHojaForm(inicial));
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const guardarMutation = useGuardarHojaResumen(inicial.casoId);

  const conflicto =
    guardarMutation.error instanceof ApiError &&
    guardarMutation.error.status === 409;

  const error = errorLocal || guardarMutation.error?.message;
  const prefijo = `hoja-${inicial.casoId}`;

  function cambiar(campo: keyof HojaForm, valor: string) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setErrorLocal(null);
  }

  function cancelar() {
    if (guardarMutation.isPending) return;

    const cambio =
      JSON.stringify(form) !== JSON.stringify(crearHojaForm(inicial));

    if (
      cambio &&
      !window.confirm("¿Descartar los cambios sin guardar de esta hoja?")
    ) {
      return;
    }

    onCancelar();
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (guardarMutation.isPending || conflicto) return;

    setErrorLocal(null);

    let datos;

    try {
      datos = crearHojaRequest(form);
    } catch (error) {
      setErrorLocal(
        error instanceof Error ? error.message : "Revisá los datos.",
      );
      return;
    }

    try {
      await guardarMutation.mutateAsync(datos);
      onGuardado();
    } catch {
      // Conservamos el borrador y mostramos el error de la API.
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Importes en pesos, con coma o punto decimal y sin separadores de miles.
        Dejá vacío lo que todavía no esté informado. Vaciar un campo elimina su
        valor guardado.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-background p-3 text-sm text-destructive"
        >
          {error}

          {conflicto && (
            <p className="mt-2">
              Cancelá la edición para consultar la hoja que se guardó. Tu
              borrador no se envió nuevamente.
            </p>
          )}
        </div>
      )}

      <fieldset
        disabled={guardarMutation.isPending}
        className="min-w-0 space-y-6"
      >
        <legend className="sr-only">
          Editar hoja del expediente administrativo {inicial.casoId}
        </legend>

        <div className="max-w-sm space-y-2">
          <label htmlFor={`${prefijo}-calculo`} className="text-sm font-medium">
            ¿Tiene cálculo previo?
          </label>

          <select
            id={`${prefijo}-calculo`}
            value={form.tieneCalculoPrevio}
            onChange={(event) =>
              cambiar("tieneCalculoPrevio", event.target.value)
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Sin informar</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {SECCIONES_HOJA.map((seccion) => (
            <section key={seccion.titulo} className="min-w-0 space-y-4">
              <h4 className="border-b border-amber-900/15 pb-2 font-semibold dark:border-amber-100/15">
                {seccion.titulo}
              </h4>

              {seccion.campos.map((campo) => {
                const id = `${prefijo}-${campo.key}`;

                return (
                  <div key={campo.key} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">
                      {campo.label}
                    </label>

                    {campo.tipo === "texto" ? (
                      <Textarea
                        id={id}
                        value={form[campo.key]}
                        maxLength={2000}
                        rows={3}
                        className="bg-background"
                        onChange={(event) =>
                          cambiar(campo.key, event.target.value)
                        }
                      />
                    ) : (
                      <Input
                        id={id}
                        value={form[campo.key]}
                        className="h-10 bg-background"
                        type={
                          campo.tipo === "fecha"
                            ? "date"
                            : campo.tipo === "periodo"
                              ? "month"
                              : "text"
                        }
                        inputMode={
                          campo.tipo === "importe" ? "decimal" : undefined
                        }
                        min={
                          campo.tipo === "fecha"
                            ? "0001-01-01"
                            : campo.tipo === "periodo"
                              ? "0001-01"
                              : undefined
                        }
                        max={
                          campo.tipo === "fecha"
                            ? "9999-12-31"
                            : campo.tipo === "periodo"
                              ? "9999-12"
                              : undefined
                        }
                        placeholder={
                          campo.tipo === "importe" ? "Sin informar" : undefined
                        }
                        onChange={(event) =>
                          cambiar(campo.key, event.target.value)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </fieldset>

      <footer className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={guardarMutation.isPending}
          onClick={cancelar}
        >
          Cancelar
        </Button>

        <Button type="submit" disabled={guardarMutation.isPending || conflicto}>
          {guardarMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save />
          )}

          {guardarMutation.isPending ? "Guardando..." : "Guardar hoja"}
        </Button>
      </footer>
    </form>
  );
}

function ContenidoHoja({ casoId }: { casoId: number }) {
  const query = useHojaResumen(casoId);

  const [edicion, setEdicion] = useState<HojaResumenResponse | null>(null);

  const [guardada, setGuardada] = useState(false);
  const hoja = query.data;

  if (!edicion && query.isPending) {
    return (
      <div role="status" className="space-y-3 p-5">
        <span className="sr-only">Cargando hoja de resumen</span>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!edicion && (query.isError || !hoja)) {
    return (
      <div role="alert" className="space-y-3 p-5">
        <p className="flex items-center gap-2 text-sm">
          <AlertCircle className="size-4 text-destructive" />
          No pudimos cargar la hoja de resumen.
        </p>

        <p className="text-sm text-muted-foreground">{query.error?.message}</p>

        <Button
          type="button"
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const actual = edicion ?? hoja!;
  const vista = crearHojaForm(actual);

  if (!actual.registrada && !edicion) {
    return (
      <section className="flex flex-col gap-4 rounded-lg border border-dashed bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4" />
            Hoja de resumen
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Este expediente administrativo no tiene una hoja de resumen.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={query.isFetching}
          onClick={() => {
            setGuardada(false);
            setEdicion(actual);
          }}
        >
          <FilePlus2 />
          Crear hoja de resumen
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={`titulo-hoja-${casoId}`}
      className="@container rounded-lg border border-amber-900/15 border-l-4 border-l-amber-400 bg-amber-50/60 p-4 shadow-sm sm:p-6 dark:border-amber-100/15 dark:border-l-amber-600 dark:bg-amber-950/15"
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-amber-900/15 pb-4 dark:border-amber-100/15">
        <div>
          <h3
            id={`titulo-hoja-${casoId}`}
            className="flex items-center gap-2 font-semibold"
          >
            <FileText className="size-4" />
            Hoja de resumen
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Expediente administrativo #{casoId} ·{" "}
            {actual.registrada ? "Registrada" : "Todavía sin completar"}
          </p>
        </div>

        {!edicion && (
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => {
              setGuardada(false);
              setEdicion(actual);
            }}
          >
            <Pencil />
            {actual.registrada ? "Editar hoja" : "Completar hoja"}
          </Button>
        )}
      </header>

      {edicion ? (
        <EditorHoja
          inicial={edicion}
          onCancelar={() => {
            setEdicion(null);
            void query.refetch();
          }}
          onGuardado={() => {
            setEdicion(null);
            setGuardada(true);
          }}
        />
      ) : (
        <>
          {guardada && (
            <p
              role="status"
              className="mb-4 text-sm text-emerald-800 dark:text-emerald-300"
            >
              La hoja se guardó correctamente.
            </p>
          )}

          <p className="mb-6 text-sm">
            ¿Tiene cálculo previo?{" "}
            <strong>
              {actual.tieneCalculoPrevio === null
                ? "Sin informar"
                : actual.tieneCalculoPrevio
                  ? "Sí"
                  : "No"}
            </strong>
          </p>

          <div className="grid gap-6 @xl:grid-cols-3">
            {SECCIONES_HOJA.map((seccion) => (
              <section key={seccion.titulo} className="min-w-0">
                <h4 className="border-b border-amber-900/15 pb-2 font-serif text-lg font-semibold dark:border-amber-100/15">
                  {seccion.titulo}
                </h4>

                <dl className="mt-4 space-y-4">
                  {seccion.campos.map((campo) => (
                    <div key={campo.key}>
                      <dt className="text-xs font-medium text-muted-foreground">
                        {campo.label}
                      </dt>

                      <dd
                        className={`mt-1 whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere] ${
                          campo.tipo === "importe"
                            ? "font-semibold tabular-nums"
                            : ""
                        }`}
                      >
                        {mostrarCampoHoja(vista[campo.key], campo.tipo)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function HojaResumenCaso({ casoId }: { casoId: number }) {
  return <ContenidoHoja key={casoId} casoId={casoId} />;
}
