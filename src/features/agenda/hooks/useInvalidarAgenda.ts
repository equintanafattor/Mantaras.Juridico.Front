"use client";

import { useQueryClient } from "@tanstack/react-query";
import { agendaKeys } from "./agendaKeys";

export function useInvalidarAgenda() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: agendaKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["panel"] }),
      // El seguimiento de cobro es una entrada de agenda: su estado se ve en el judicial y en el listado de cobro.
      queryClient.invalidateQueries({ queryKey: ["expedientes"] }),
    ]);
  };
}
