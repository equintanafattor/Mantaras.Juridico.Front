"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCatalogo, useModificarCatalogo } from "../hooks/useCatalogos";
import { CATALOGOS, type CatalogoItem, type TipoCatalogo } from "../types/types";

function CatalogoPanel({ tipo }: { tipo: TipoCatalogo }) {
  const id = useId();
  const nombreInput = useRef<HTMLInputElement>(null);
  const config = CATALOGOS[tipo];
  const [busqueda, setBusqueda] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [page, setPage] = useState(1);
  const [edicion, setEdicion] = useState<CatalogoItem | null>(null);
  const [nombre, setNombre] = useState("");
  const [confirmacion, setConfirmacion] = useState<CatalogoItem | null>(null);
  const [mensaje, setMensaje] = useState("");
  const termino = useDebouncedValue(busqueda.trim(), 350);
  const query = useCatalogo(tipo, page, termino, soloActivos);
  const mutation = useModificarCatalogo(tipo);
  const pendiente = mutation.isPending;
  const valido = nombre.trim().length > 0 && nombre.trim().length <= config.limite;

  function cancelar() {
    setEdicion(null);
    setNombre("");
    setConfirmacion(null);
    mutation.reset();
  }

  function editar(item: CatalogoItem) {
    setEdicion(item);
    setNombre(item.nombre);
    mutation.reset();
    setMensaje("");
    nombreInput.current?.focus();
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valido || pendiente) return;
    setMensaje("");
    try {
      await mutation.mutateAsync({ accion: "guardar", nombre, id: edicion?.id });
      setEdicion(null);
      setNombre("");
      setPage(1);
      setMensaje("Nombre guardado. Los expedientes administrativos mostrarán el nombre actualizado.");
    } catch {
      // Mostrar el error de la API debajo, conservando el borrador.
    }
  }

  async function confirmarEstado() {
    if (!confirmacion || pendiente) return;
    setMensaje("");
    try {
      await mutation.mutateAsync({
        accion: "estado", id: confirmacion.id, activar: !confirmacion.activo,
      });
      setConfirmacion(null);
      setPage(1);
      setMensaje("Estado actualizado. Las asignaciones históricas se conservan.");
    } catch {
      // Conservar la confirmación para reintentar.
    }
  }

  return (
    <section className="min-w-0 rounded-lg border bg-card" aria-labelledby={`${id}-titulo`}>
      <header className="border-b p-5">
        <h2 id={`${id}-titulo`} className="font-semibold">{config.titulo}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Los nombres de registros inactivos también quedan reservados.
        </p>
      </header>

      <div className="space-y-5 p-5">
        <form onSubmit={guardar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor={`${id}-nombre`}>
              {edicion ? `Editar: ${edicion.nombre}` : "Nuevo nombre"}
            </Label>
            <Input
              ref={nombreInput}
              id={`${id}-nombre`}
              value={nombre}
              maxLength={config.limite}
              required
              disabled={pendiente || confirmacion !== null}
              onChange={(event) => {
                setNombre(event.target.value);
                mutation.reset();
                setMensaje("");
              }}
            />
          </div>
          <Button type="submit" disabled={!valido || pendiente || confirmacion !== null}>
            {pendiente && !confirmacion ? <Loader2 className="animate-spin" /> : edicion ? <Pencil /> : <Plus />}
            {edicion ? "Guardar cambios" : "Agregar"}
          </Button>
          {edicion && (
            <Button type="button" variant="outline" disabled={pendiente} onClick={cancelar}>
              Cancelar edición
            </Button>
          )}
        </form>

        {mutation.isError && (
          <p role="alert" className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">
            {mutation.error.message}
          </p>
        )}
        {mensaje && <p role="status" className="rounded-md bg-secondary p-3 text-sm">{mensaje}</p>}

        {confirmacion && (
          <div role="group" aria-label="Confirmar cambio de estado" className="space-y-3 rounded-md border bg-muted/40 p-4">
            <p className="text-sm">
              ¿{confirmacion.activo ? "Desactivar" : "Reactivar"} <strong>{confirmacion.nombre}</strong>?{" "}
              {confirmacion.activo && "Seguirá visible en los expedientes administrativos que ya lo usan, pero no se ofrecerá para nuevas asignaciones."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={confirmacion.activo ? "destructive" : "default"}
                disabled={pendiente}
                onClick={() => void confirmarEstado()}
              >
                {pendiente && <Loader2 className="animate-spin" />}Confirmar
              </Button>
              <Button type="button" variant="outline" disabled={pendiente} onClick={() => {
                setConfirmacion(null);
                mutation.reset();
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            aria-label={`Buscar en ${config.titulo}`}
            placeholder="Buscar por nombre…"
            value={busqueda}
            disabled={pendiente}
            onChange={(event) => { setBusqueda(event.target.value); setPage(1); }}
          />
          <label className="flex shrink-0 items-center gap-2 text-sm">
            <input type="checkbox" checked={!soloActivos} disabled={pendiente}
              onChange={(event) => { setSoloActivos(!event.target.checked); setPage(1); }} />
            Incluir inactivos
          </label>
        </div>

        {query.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">Cargando catálogo…</p>
        ) : query.isError ? (
          <div role="alert" className="space-y-3 text-sm">
            <p>{query.error.message}</p>
            <Button type="button" variant="outline" onClick={() => void query.refetch()}>Reintentar</Button>
          </div>
        ) : (
          <>
            <div className="max-h-[30rem] overflow-y-auto rounded-md border">
              {query.data.items.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  No hay registros para estos filtros. Podés agregar un nombre arriba.
                </p>
              ) : (
                <ul className="divide-y">
                  {query.data.items.map((item) => (
                    <li key={item.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium">{item.nombre}</p>
                        <span className="text-xs text-muted-foreground">{item.activo ? "Activo" : "Inactivo"}</span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" size="sm" variant="outline"
                          disabled={pendiente || confirmacion !== null}
                          aria-label={`Editar ${item.nombre}`} onClick={() => editar(item)}>
                          <Pencil />Editar
                        </Button>
                        <Button type="button" size="sm" variant="outline"
                          disabled={pendiente || edicion !== null || confirmacion !== null}
                          aria-label={`${item.activo ? "Desactivar" : "Reactivar"} ${item.nombre}`}
                          onClick={() => { setConfirmacion(item); mutation.reset(); setMensaje(""); }}>
                          {item.activo ? <Trash2 /> : <RotateCcw />}
                          {item.activo ? "Desactivar" : "Reactivar"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {query.data.totalItems} registros · Página {query.data.page} de {Math.max(1, query.data.totalPages)}
              </span>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline"
                  disabled={!query.data.hasPreviousPage || query.isFetching || pendiente}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeft />Anterior
                </Button>
                <Button type="button" size="sm" variant="outline"
                  disabled={!query.data.hasNextPage || query.isFetching || pendiente}
                  onClick={() => setPage((current) => current + 1)}>
                  Siguiente<ChevronRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function CatalogosScreen() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Configuración</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Catálogos administrativos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Opciones para clasificar los expedientes administrativos del estudio.
        </p>
      </header>
      <CatalogoPanel tipo="beneficios" />
      <CatalogoPanel tipo="administrativos" />
    </div>
  );
}
