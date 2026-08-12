import { useQuery } from "@tanstack/react-query";

import { obtenerExpedientePorId } from "../api/expedientesApi";

export function useExpediente(expedienteId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["expedientes", "detalle", expedienteId],
    queryFn: ({ signal }) => obtenerExpedientePorId(expedienteId!, signal),
    enabled: enabled && expedienteId !== null,
  });
}
