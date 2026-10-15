"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { editarUsuario } from "../api/usuariosApi";
import type { EditarUsuarioRequest } from "../types/types";

type EditarUsuarioVariables = {
  usuarioId: number;
  request: EditarUsuarioRequest;
};

export function useEditarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ usuarioId, request }: EditarUsuarioVariables) =>
      editarUsuario(usuarioId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["usuarios"],
      });
    },
  });
}
