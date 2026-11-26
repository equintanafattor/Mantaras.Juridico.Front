"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, Check, ChevronDown, Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

import { useOpcionesCatalogo } from "../hooks/useCatalogos";
import { normalizarBusqueda } from "../lib/juzgado";
import type { ReferenciaCatalogo } from "../types/types";

type Props = {
  value: ReferenciaCatalogo | null;
  onChange: (juzgado: ReferenciaCatalogo | null) => void;
  className?: string;
};

// null representa "Todos los juzgados".
type Opcion = { clave: string; juzgado: ReferenciaCatalogo | null; nombre: string };

const TODOS: Opcion = { clave: "todos", juzgado: null, nombre: "Todos los juzgados" };
const MAX_RESULTADOS = 50;

function etiqueta(juzgado: ReferenciaCatalogo | null) {
  if (!juzgado) return TODOS.nombre;
  return juzgado.activo ? juzgado.nombre : `${juzgado.nombre} (inactivo)`;
}

/** Filtro de listados por juzgado: catálogo completo, incluidos los inactivos. */
export default function JuzgadoFiltro({ value, onChange, className }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useOpcionesCatalogo("juzgados", true);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [indice, setIndice] = useState(0);

  const opciones = useMemo<Opcion[]>(() => {
    const juzgados = (query.data ?? []).map((item) => ({
      clave: String(item.id),
      juzgado: { id: item.id, nombre: item.nombre, activo: item.activo },
      nombre: item.nombre,
    }));
    const termino = normalizarBusqueda(texto);
    if (!termino) return [TODOS, ...juzgados];
    return juzgados.filter((item) => normalizarBusqueda(item.nombre).includes(termino));
  }, [query.data, texto]);
  const visibles = opciones.slice(0, MAX_RESULTADOS);
  const ocultos = opciones.length - visibles.length;

  const listaId = `${id}-lista`;
  const opcionActiva = abierto ? visibles[indice] : undefined;
  const bloqueado = query.isPending || query.isError;

  function abrir() {
    if (bloqueado) return;
    setAbierto(true);
    const actual = visibles.findIndex((item) => (item.juzgado?.id ?? null) === (value?.id ?? null));
    setIndice(Math.max(0, actual));
  }

  function cerrar() {
    setAbierto(false);
    setTexto("");
  }

  function elegir(opcion: Opcion) {
    if ((opcion.juzgado?.id ?? null) !== (value?.id ?? null)) onChange(opcion.juzgado);
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
      event.preventDefault();
      if (opcionActiva) elegir(opcionActiva);
    } else if (event.key === "Escape" && abierto) {
      event.preventDefault();
      cerrar();
    }
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <Landmark className="pointer-events-none absolute left-3 top-5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-label="Filtrar por juzgado"
        aria-autocomplete="list"
        aria-expanded={abierto}
        aria-controls={listaId}
        aria-activedescendant={opcionActiva ? `${id}-op-${opcionActiva.clave}` : undefined}
        disabled={bloqueado}
        value={abierto ? texto : query.isPending ? "Cargando juzgados…" : etiqueta(value)}
        placeholder="Buscar juzgado…"
        title={abierto ? undefined : etiqueta(value)}
        className={cn(
          "h-10 w-full min-w-0 truncate rounded-md border border-input bg-background pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          value && !abierto && "border-primary/40 bg-primary/5",
        )}
        onClick={() => (abierto ? undefined : abrir())}
        onChange={(event) => {
          setTexto(event.target.value);
          setIndice(0);
          setAbierto(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={cerrar}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={bloqueado}
        className="absolute right-1 top-1 rounded p-1.5 text-muted-foreground disabled:opacity-50"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (abierto) { cerrar(); return; }
          inputRef.current?.focus();
          abrir();
        }}
      >
        <ChevronDown className="size-4" />
      </button>

      {abierto && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 min-w-64 rounded-md border bg-popover text-popover-foreground shadow-lg">
          <ul id={listaId} role="listbox" aria-label="Juzgados" className="max-h-72 overflow-y-auto py-1">
            {visibles.map((opcion, posicion) => {
              const elegido = (opcion.juzgado?.id ?? null) === (value?.id ?? null);
              return (
                <li
                  key={opcion.clave}
                  id={`${id}-op-${opcion.clave}`}
                  role="option"
                  aria-selected={elegido}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 px-3 py-2 text-sm pointer-coarse:min-h-11",
                    posicion === indice && "bg-muted",
                    opcion.juzgado === null && "border-b font-medium",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setIndice(posicion)}
                  onClick={() => elegir(opcion)}
                >
                  <Check className={cn("mt-0.5 size-4 shrink-0", elegido ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 break-words">{opcion.nombre}</span>
                  {opcion.juzgado && !opcion.juzgado.activo && (
                    <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Inactivo</span>
                  )}
                </li>
              );
            })}
          </ul>
          {visibles.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {texto.trim() ? `Ningún juzgado coincide con “${texto.trim()}”.` : "No hay juzgados cargados."}
            </p>
          )}
          {ocultos > 0 && (
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              Se muestran {visibles.length} de {opciones.length}. Escribí para afinar la búsqueda.
            </p>
          )}
        </div>
      )}

      {query.isError && (
        <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          No pudimos cargar los juzgados para el filtro.
          <button type="button" className="underline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
