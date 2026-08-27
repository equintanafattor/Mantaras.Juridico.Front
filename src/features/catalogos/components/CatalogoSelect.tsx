"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOpcionesCatalogo } from "../hooks/useCatalogos";
import type { ReferenciaCatalogo, TipoCatalogo } from "../types/types";

export default function CatalogoSelect({ tipo, label, value, original, seleccionado, disabled, onChange }: {
  tipo: TipoCatalogo;
  label: string;
  value: number | null;
  original: ReferenciaCatalogo | null;
  seleccionado: ReferenciaCatalogo | null;
  disabled?: boolean;
  onChange: (item: ReferenciaCatalogo | null) => void;
}) {
  const id = useId();
  const query = useOpcionesCatalogo(tipo);
  const activos = query.data?.filter((item) => item.activo) ?? [];
  const historico = original && !activos.some((item) => item.id === original.id) ? original : null;
  const fueraDeLista = value !== null && value !== historico?.id && !activos.some((item) => item.id === value);
  const bloqueado = disabled || query.isPending || query.isError;

  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value ?? ""} disabled={bloqueado} aria-describedby={`${id}-ayuda`}
        className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        onChange={(event) => {
          const idElegido = event.target.value === "" ? null : Number(event.target.value);
          if (idElegido === null) { onChange(null); return; }
          const item = activos.find((opcion) => opcion.id === idElegido) ?? (original?.id === idElegido ? original : null);
          if (item) onChange(item);
        }}>
        <option value="">Sin asignar</option>
        {historico && <option value={historico.id}>{historico.nombre}{query.isSuccess ? " (inactivo · valor guardado)" : " (valor guardado)"}</option>}
        {fueraDeLista && <option value={value!} disabled>{seleccionado?.nombre || `ID ${value}`} (no disponible)</option>}
        {activos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
      </select>
      <div id={`${id}-ayuda`} className="text-xs text-muted-foreground" aria-live="polite">
        {query.isPending ? "Cargando opciones…" : query.isError ? (
          <div role="alert" className="space-y-2 text-destructive">
            <p>No pudimos cargar las opciones. El valor del formulario se conserva.</p>
            <Button type="button" variant="outline" size="sm" disabled={disabled || query.isFetching} onClick={() => void query.refetch()}>Reintentar</Button>
          </div>
        ) : fueraDeLista ? "La opción seleccionada ya no está activa. Elegí otra o dejá el campo sin asignar." : historico && value === historico.id ? "Podés conservar este valor histórico o cambiarlo por una opción activa." : activos.length === 0 ? "No hay opciones activas. El campo es opcional." : "Solo se ofrecen opciones activas y el valor histórico de este expediente."}
      </div>
    </div>
  );
}
