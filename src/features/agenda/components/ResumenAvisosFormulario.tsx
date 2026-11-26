"use client";

import { BellRing } from "lucide-react";
import { useRecordatoriosPredeterminados } from "../hooks/useRecordatoriosAgenda";
import { fechaHoraAviso, resumenAvisosFormulario } from "../lib/avisosAgenda";
import type { AgendaForm } from "../lib/agendaForm";
import type { CrearRecordatorioAgendaRequest } from "../types/types";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Resumen sencillo, antes de guardar, de qué avisos se crearán y cuándo aparecerán. */
export default function ResumenAvisosFormulario({ form, adicionales, categoria }: { form: AgendaForm; adicionales: CrearRecordatorioAgendaRequest[]; categoria?: string }) {
  const predeterminados = useRecordatoriosPredeterminados("tipos-entrada", form.tipoEntradaAgendaId ?? undefined);
  if (!form.tipoEntradaAgendaId || !FECHA.test(form.fechaInicio)) return null;
  const fechas = {
    fechaInicio: form.fechaInicio,
    horaInicio: form.horaInicio || null,
    fechaVencimiento: FECHA.test(form.fechaVencimiento) ? form.fechaVencimiento : null,
    horaVencimiento: FECHA.test(form.fechaVencimiento) ? form.horaVencimiento || null : null,
  };
  const items = resumenAvisosFormulario(fechas, predeterminados.data ?? [], adicionales);
  const sinHora = items.some(item => item.fecha) && (!fechas.horaInicio || (fechas.fechaVencimiento && !fechas.horaVencimiento));

  return <section aria-labelledby="agenda-form-resumen-avisos" className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
    <h3 id="agenda-form-resumen-avisos" className="flex items-center gap-2 font-medium"><BellRing className="size-4" aria-hidden="true" />Cuándo aparecerán los avisos</h3>
    {predeterminados.isPending ? <p className="text-muted-foreground">Calculando avisos de la categoría…</p>
      : predeterminados.isError ? <p className="text-muted-foreground">No pudimos leer los avisos automáticos de la categoría. Se crearán igual al guardar.</p>
        : items.length === 0 ? <p className="text-muted-foreground">Sin avisos: {categoria ? `la categoría «${categoria}»` : "esta categoría"} no tiene avisos automáticos. Podés sumar avisos en Más opciones › Avisos.</p>
          : <ul className="space-y-1">{items.map(item => <li key={item.clave} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{item.fecha ? fechaHoraAviso(item.fecha) : "—"}</span>
            <span className="text-muted-foreground">{item.descripcion} · {item.automatico ? "automático de la categoría" : "agregado por vos"}</span>
            {item.motivoSinFecha ? <span className="text-xs text-muted-foreground">{item.motivoSinFecha}</span> : null}
          </li>)}</ul>}
    <p className="text-xs text-muted-foreground">Aparecen dentro del sistema (Agenda › Pendientes y panel de inicio), no por correo ni WhatsApp. Horarios de Argentina.{sinHora ? " Como la fecha no tiene hora, los avisos se calculan desde las 9:00." : ""}{form.recurrenciaFrecuencia ? " Las fechas son las de la primera repetición: los automáticos se crean en cada repetición y los agregados por vos sólo en la primera." : ""}</p>
  </section>;
}
