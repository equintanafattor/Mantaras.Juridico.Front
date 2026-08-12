import { useQuery } from "@tanstack/react-query";

import { obtenerCasoPorId } from "../api/casosApi";

export function useCaso(casoId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["casos", "detalle", casoId],
    queryFn: ({ signal }) => obtenerCasoPorId(casoId!, signal),
    enabled: enabled && casoId !== null,
  });
}
