"use client";

import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useOpcionesCatalogo } from "../hooks/useCatalogos";
import type { TipoCatalogo } from "../types/types";

type Props = {
  tipo: TipoCatalogo;
  label: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function CatalogoNombreSelect({
  tipo,
  label,
  value,
  required = false,
  disabled = false,
  onChange,
}: Props) {
  const id = useId();
  const query = useOpcionesCatalogo(tipo);
  const opciones = query.data ?? [];
  const valorHistorico =
    value.trim() && !opciones.some((item) => item.nombre === value)
      ? value
      : null;

  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <select
        id={id}
        value={value}
        required={required}
        disabled={disabled || query.isPending || query.isError}
        className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{required ? "Seleccionar..." : "Sin asignar"}</option>
        {valorHistorico && (
          <option value={valorHistorico}>
            {valorHistorico} (valor guardado)
          </option>
        )}
        {opciones.map((item) => (
          <option key={item.id} value={item.nombre}>
            {item.nombre}
          </option>
        ))}
      </select>
      {query.isError && (
        <div role="alert" className="space-y-2 text-xs text-destructive">
          <p>No pudimos cargar las opciones. El valor actual se conserva.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || query.isFetching}
            onClick={() => void query.refetch()}
          >
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
