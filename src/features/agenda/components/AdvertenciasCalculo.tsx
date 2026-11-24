import { AlertTriangle } from "lucide-react";
import type { AdvertenciaCalculo } from "../types/diasInhabiles";

// Avisos del backend sobre un cálculo por días hábiles, p. ej. un año sin feriados importados.
export default function AdvertenciasCalculo({ advertencias }: { advertencias?: AdvertenciaCalculo[] | null }) {
  if (!advertencias?.length) return null;
  return <div role="alert" className="space-y-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
    {advertencias.map((item, i) => <p key={`${item.codigo}-${item.anio ?? i}`} className="flex gap-2"><AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-600" /><span className="min-w-0 break-words">{item.mensaje}{item.codigo === "DiasInhabiles.AnioSinCalendario" ? " Podés importar el año desde Agenda › Configuración › Días inhábiles; la fecha ya calculada no cambia." : ""}</span></p>)}
  </div>;
}
