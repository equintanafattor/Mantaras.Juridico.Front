"use client";

import { useQuery } from "@tanstack/react-query";

import { obtenerUsuarios } from "../api/usuariosApi";

export function useUsuarios(enabled = true) {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: ({ signal }) => obtenerUsuarios(signal),
    enabled,
  });
}
