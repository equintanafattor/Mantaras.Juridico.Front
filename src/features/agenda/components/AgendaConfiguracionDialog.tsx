"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type EventosConfiguracionAgenda = { onClose: () => void; onDirty: (value: boolean) => void; onPending: (value: boolean) => void };
const EventosContext = createContext<EventosConfiguracionAgenda | null>(null);
export function useEventosConfiguracionAgenda() {
  const events = useContext(EventosContext);
  if (!events) throw new Error("El formulario debe estar dentro del diálogo de configuración.");
  return events;
}
export default function AgendaConfiguracionDialog({ titulo, descripcion, onClose, children, avisoCierre }: { titulo: string; descripcion: string; onClose: () => void; children: ReactNode; avisoCierre?: string }) {
  const [pending, setPending] = useState(false), [dirty, setDirty] = useState(false), [confirmar, setConfirmar] = useState(false);
  const estado = useRef({ pending: false, dirty: false });
  function cerrar() { if (estado.current.pending) return; if (estado.current.dirty) setConfirmar(true); else onClose(); }
  useEffect(() => {
    if (!dirty && !pending) return;
    const proteger = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", proteger);
    return () => window.removeEventListener("beforeunload", proteger);
  }, [dirty, pending]);
  return <Dialog open onOpenChange={(open, details) => { if (!open) { if (estado.current.pending || estado.current.dirty) details.cancel(); cerrar(); } }}>
    <DialogContent showCloseButton={!pending} className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{titulo}</DialogTitle><DialogDescription>{descripcion}</DialogDescription></DialogHeader>
      <EventosContext.Provider value={{ onClose: cerrar, onDirty: value => { estado.current.dirty = value; setDirty(value); }, onPending: value => { estado.current.pending = value; setPending(value); } }}>{children}</EventosContext.Provider>
      <Dialog open={confirmar} onOpenChange={setConfirmar}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>¿Descartar los cambios?</DialogTitle><DialogDescription>{avisoCierre ?? "Los cambios sin guardar se perderán."}</DialogDescription></DialogHeader><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => setConfirmar(false)}>Seguir editando</Button><Button variant="destructive" onClick={onClose}>Descartar cambios</Button></div></DialogContent></Dialog>
    </DialogContent>
  </Dialog>;
}
