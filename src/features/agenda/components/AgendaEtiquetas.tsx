import { AlertTriangle, CalendarClock, CheckCircle2, CircleSlash, Clock, Flag, PauseCircle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOMBRES_ESTADO_AGENDA } from "../lib/estadosAgenda";
import type { SituacionAgenda } from "../lib/situacionAgenda";
import type { EstadoEntradaAgenda, PrioridadAgenda } from "../types/types";

const BASE = "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0";

// Condición del plazo: siempre con ícono y texto.
export function SituacionEtiqueta({ situacion, className }: { situacion: SituacionAgenda; className?: string }) {
  const { condicion, texto } = situacion;
  if (condicion === "vencida" || condicion === "atrasada") {
    return <span className={cn(BASE, "border-destructive/40 bg-destructive/10 text-destructive", className)}><AlertTriangle aria-hidden="true" />{texto}</span>;
  }
  if (condicion === "hoy" || condicion === "pronto") {
    return <span className={cn(BASE, "border-amber-600/40 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200", className)}><Clock aria-hidden="true" />{texto}</span>;
  }
  return <span className={cn(BASE, "text-muted-foreground", className)}><CalendarClock aria-hidden="true" />{texto}</span>;
}

const ICONOS_ESTADO: Record<EstadoEntradaAgenda, typeof Clock> = {
  Pendiente: Clock, EnCurso: PlayCircle, Pospuesta: PauseCircle, Completada: CheckCircle2, Cancelada: CircleSlash,
};

// Estado de trabajo. Pendiente es lo habitual: sólo se muestra si se pide.
export function EstadoEtiqueta({ estado, mostrarPendiente = false }: { estado: EstadoEntradaAgenda; mostrarPendiente?: boolean }) {
  if (estado === "Pendiente" && !mostrarPendiente) return null;
  const Icono = ICONOS_ESTADO[estado];
  return <span className={cn(BASE, estado === "Completada" ? "border-emerald-600/40 text-emerald-800 dark:text-emerald-300" : "text-foreground")}><Icono aria-hidden="true" />{NOMBRES_ESTADO_AGENDA[estado]}</span>;
}

// Prioridad: sólo se destaca cuando es alta o urgente.
export function PrioridadEtiqueta({ prioridad, siempre = false }: { prioridad: PrioridadAgenda; siempre?: boolean }) {
  if (!siempre && prioridad !== "Alta" && prioridad !== "Urgente") return null;
  return <span className={cn(BASE, prioridad === "Urgente" ? "border-destructive/40 text-destructive" : "text-foreground")}><Flag aria-hidden="true" />Prioridad {prioridad.toLowerCase()}</span>;
}
