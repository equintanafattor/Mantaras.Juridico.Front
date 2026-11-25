"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { Check, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useOpcionesCatalogo } from "../hooks/useCatalogos";
import { normalizarBusqueda } from "../lib/juzgado";
import type { ReferenciaCatalogo } from "../types/types";

type Props = {
  value: ReferenciaCatalogo | null;
  /** Juzgado guardado en el expediente: se ofrece aunque esté inactivo. */
  original: ReferenciaCatalogo | null;
  disabled?: boolean;
  onChange: (juzgado: ReferenciaCatalogo | null) => void;
};

type Opcion = ReferenciaCatalogo & { historico: boolean };

const MAX_RESULTADOS = 50;

function etiqueta(juzgado: ReferenciaCatalogo | null) {
  if (!juzgado) return "";
  return juzgado.activo ? juzgado.nombre : `${juzgado.nombre} (inactivo)`;
}

export default function JuzgadoSelect({ value, original, disabled = false, onChange }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useOpcionesCatalogo("juzgados");
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [indice, setIndice] = useState(0);

  const activos = useMemo(() => query.data ?? [], [query.data]);
  const historico = useMemo(
    () => (original && !activos.some((item) => item.id === original.id) ? { ...original, activo: false } : null),
    [activos, original],
  );
  // Elegido en esta edición pero dado de baja después (por ejemplo, desde otra pestaña).
  const noDisponible = query.isSuccess && value !== null && value.id !== historico?.id
    && !activos.some((item) => item.id === value.id);

  const opciones = useMemo<Opcion[]>(() => {
    const termino = normalizarBusqueda(texto);
    const todas: Opcion[] = [
      ...(historico ? [{ ...historico, historico: true }] : []),
      ...activos.map((item) => ({ id: item.id, nombre: item.nombre, activo: true, historico: false })),
    ];
    return termino ? todas.filter((item) => normalizarBusqueda(item.nombre).includes(termino)) : todas;
  }, [activos, historico, texto]);
  const visibles = opciones.slice(0, MAX_RESULTADOS);

  const bloqueado = disabled || query.isPending || query.isError;
  const listaId = `${id}-lista`;
  const ayudaId = `${id}-ayuda`;
  const opcionActiva = abierto ? visibles[indice] : undefined;

  function abrir() {
    if (bloqueado) return;
    setAbierto(true);
    const actual = visibles.findIndex((item) => item.id === value?.id);
    setIndice(actual >= 0 ? actual : 0);
  }

  function cerrar() {
    setAbierto(false);
    setTexto("");
  }

  function elegir(opcion: Opcion) {
    onChange({ id: opcion.id, nombre: opcion.nombre, activo: opcion.activo });
    cerrar();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!abierto) { abrir(); return; }
      if (visibles.length === 0) return;
      const paso = event.key === "ArrowDown" ? 1 : -1;
      setIndice((actual) => (actual + paso + visibles.length) % visibles.length);
    } else if (event.key === "Enter" && abierto) {
      // Elegir la opción sin enviar el formulario.
      event.preventDefault();
      if (opcionActiva) elegir(opcionActiva);
    } else if (event.key === "Escape" && abierto) {
      event.preventDefault();
      event.stopPropagation();
      cerrar();
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>Juzgado</Label>
        {/* rel="opener": la sesión vive en sessionStorage y solo se copia a la pestaña nueva si conserva el opener. */}
        <Link href="/catalogos" target="_blank" rel="opener" className="text-xs text-primary underline">
          Administrar juzgados (otra pestaña)
        </Link>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={listaId}
          aria-activedescendant={opcionActiva ? `${id}-op-${opcionActiva.id}` : undefined}
          aria-describedby={ayudaId}
          disabled={bloqueado}
          value={abierto ? texto : etiqueta(value)}
          placeholder={abierto ? "Escribí para buscar…" : query.isPending ? "Cargando juzgados…" : "Sin juzgado"}
          className="h-10 w-full min-w-0 rounded-md border border-input bg-background pl-3 pr-16 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => (abierto ? undefined : abrir())}
          onChange={(event) => {
            setTexto(event.target.value);
            setIndice(0);
            setAbierto(true);
          }}
          onKeyDown={onKeyDown}
          onBlur={cerrar}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {value && !bloqueado && (
            <button
              type="button"
              aria-label="Quitar juzgado"
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(null); cerrar(); }}
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={bloqueado}
            className="rounded p-1.5 text-muted-foreground disabled:opacity-50"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (abierto) { cerrar(); return; }
              inputRef.current?.focus();
              abrir();
            }}
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>

      {/* La lista ocupa lugar en el flujo: así no queda recortada dentro de diálogos con scroll ni en celular. */}
      {abierto && (
        <div className="rounded-md border bg-popover shadow-sm">
          <ul id={listaId} role="listbox" aria-label="Juzgados" className="max-h-60 overflow-y-auto py-1">
            {visibles.map((opcion, posicion) => {
              const elegido = opcion.id === value?.id;
              return (
                <li
                  key={opcion.id}
                  id={`${id}-op-${opcion.id}`}
                  role="option"
                  aria-selected={elegido}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 px-3 py-2 text-sm",
                    posicion === indice && "bg-muted",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setIndice(posicion)}
                  onClick={() => elegir(opcion)}
                >
                  <Check className={cn("mt-0.5 size-4 shrink-0", elegido ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 break-words">
                    {opcion.nombre}
                    {opcion.historico && (
                      <span className="block text-xs text-muted-foreground">Inactivo · valor guardado en este expediente</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          {visibles.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {texto.trim()
                ? `Ningún juzgado activo coincide con “${texto.trim()}”.`
                : "No hay juzgados activos. Podés cargarlos en Catálogos."}
            </p>
          )}
          {opciones.length > visibles.length && (
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              Se muestran {visibles.length} de {opciones.length}. Escribí para afinar la búsqueda.
            </p>
          )}
        </div>
      )}

      <div id={ayudaId} className="text-xs text-muted-foreground" aria-live="polite">
        {query.isPending ? "Cargando juzgados…" : query.isError ? (
          <div role="alert" className="space-y-2 text-destructive">
            <p>No pudimos cargar los juzgados. El valor del formulario se conserva.</p>
            <Button type="button" variant="outline" size="sm" disabled={disabled || query.isFetching} onClick={() => void query.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : noDisponible ? (
          <span className="text-destructive">El juzgado elegido fue dado de baja. Elegí otro o quitalo.</span>
        ) : historico && value?.id === historico.id ? (
          "Este juzgado está inactivo. Podés conservarlo o cambiarlo por uno activo."
        ) : activos.length === 0 ? (
          "No hay juzgados activos. El campo es opcional."
        ) : (
          "Opcional. Solo se ofrecen juzgados activos."
        )}
      </div>
    </div>
  );
}
