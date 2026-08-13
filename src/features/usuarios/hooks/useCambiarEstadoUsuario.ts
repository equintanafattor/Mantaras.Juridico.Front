"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { darDeBajaUsuario, restaurarUsuario } from "../api/usuariosApi";

type CambiarEstadoUsuarioVariables = {
  usuarioId: number;
  activar: boolean;
};

export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ usuarioId, activar }: CambiarEstadoUsuarioVariables) =>
      activar ? restaurarUsuario(usuarioId) : darDeBajaUsuario(usuarioId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["usuarios"],
      });
    },
  });
}
