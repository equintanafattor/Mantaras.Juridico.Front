"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { crearUsuario } from "../api/usuariosApi";
import type { CrearUsuarioRequest } from "../types/types";

export function useCrearUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CrearUsuarioRequest) => crearUsuario(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["usuarios"],
      });
    },
  });
}
