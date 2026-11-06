"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumenEntradaAgenda } from "../types/types";

type Mensaje = { texto: string; entrada?: ResumenEntradaAgenda };

export default function MensajeGuardado({ mensaje, onVer, onClose }: { mensaje: Mensaje; onVer: (entrada: ResumenEntradaAgenda) => void; onClose: () => void }) {
  return <div role="status" className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-600/30 bg-emerald-50/60 px-3 py-2 text-sm dark:bg-emerald-950/20">
    <span className="min-w-0 flex-1 break-words">{mensaje.texto}</span>
    {mensaje.entrada ? <Button type="button" variant="outline" size="sm" onClick={() => onVer(mensaje.entrada!)}>Ver detalle</Button> : null}
    <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar mensaje" onClick={onClose}><X /></Button>
  </div>;
}
