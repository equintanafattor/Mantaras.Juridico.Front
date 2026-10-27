"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useInvalidarAgenda } from "@/features/agenda/hooks/useInvalidarAgenda";

import { actualizarExpediente } from "../api/expedientesApi";
import {
  crearActualizarRequestDesdeForm,
  crearFormDesdeExpediente,
} from "../components/ExpedienteFormFields";
import type {
  ExpedienteDetalleResponse,
  RegistrarEnvioCobroRequest,
} from "../types/types";

type RegistrarEnvioCobroVariables = {
  expediente: ExpedienteDetalleResponse;
  envioCobro: RegistrarEnvioCobroRequest;
};

// El envío se registra con el PUT del judicial: se reenvían sus datos actuales
// sin cambios y se agrega envioCobro. El backend genera el seguimiento.
export function useRegistrarEnvioCobro() {
  const queryClient = useQueryClient();
  const invalidarAgenda = useInvalidarAgenda();

  return useMutation({
    mutationFn: async ({ expediente, envioCobro }: RegistrarEnvioCobroVariables) => {
      const response = await actualizarExpediente(expediente.expedienteId, {
        ...crearActualizarRequestDesdeForm(crearFormDesdeExpediente(expediente)),
        envioCobro,
      });

      // Un backend sin la funcionalidad ignora el campo y responde 200.
      if (!response.envioCobro) {
        throw new Error(
          "El servidor todavía no registra envíos de cobro. La integración con backend está pendiente.",
        );
      }

      return response;
    },

    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expedientes"] }),
        invalidarAgenda(),
      ]);
    },
  });
}
