"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import AgendaDetalleDialog from "@/features/agenda/components/AgendaDetalleDialog";
import AgendaFormDialog, {
  type EditorAgenda,
} from "@/features/agenda/components/AgendaFormDialog";
import type { ResumenEntradaAgenda } from "@/features/agenda/types/types";

// Abre la entrada de agenda del seguimiento, que incluye su alerta interna.
export default function AlertaSeguimientoCobroDialog({
  entrada,
  onClose,
}: {
  entrada: ResumenEntradaAgenda;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<EditorAgenda>();

  // Estado y fecha del seguimiento salen de la entrada de agenda.
  const refrescarExpedientes = () =>
    void queryClient.invalidateQueries({ queryKey: ["expedientes"] });

  if (editor) {
    return (
      <AgendaFormDialog
        editor={editor}
        onClose={onClose}
        onSaved={() => {
          refrescarExpedientes();
          onClose();
        }}
      />
    );
  }

  return (
    <AgendaDetalleDialog
      key={entrada.entradaAgendaId}
      entrada={entrada}
      onClose={onClose}
      onStateChanged={refrescarExpedientes}
      onEdit={(actual) => setEditor({ modo: "editar", entrada: actual })}
    />
  );
}
