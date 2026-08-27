"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buscarCatalogo, cambiarEstadoCatalogo, guardarCatalogo, obtenerOpcionesCatalogo } from "../api/catalogosApi";
import type { TipoCatalogo } from "../types/types";

export function useOpcionesCatalogo(tipo: TipoCatalogo) {
  return useQuery({
    queryKey: ["catalogos", tipo, "opciones"],
    queryFn: ({ signal }) => obtenerOpcionesCatalogo(tipo, signal),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useCatalogo(tipo: TipoCatalogo, page: number, busqueda: string, soloActivos: boolean) {
  return useQuery({
    queryKey: ["catalogos", tipo, "listado", page, busqueda, soloActivos],
    queryFn: ({ signal }) => buscarCatalogo(tipo, page, busqueda, soloActivos, signal),
  });
}

type Operacion = { accion: "guardar"; nombre: string; id?: number } | { accion: "estado"; id: number; activar: boolean };

export function useModificarCatalogo(tipo: TipoCatalogo) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (op: Operacion): Promise<void> => {
      if (op.accion === "guardar") await guardarCatalogo(tipo, op.nombre, op.id);
      else await cambiarEstadoCatalogo(tipo, op.id, op.activar);
    },
    onSuccess: async () => {
      await Promise.all(["catalogos", "casos", "cliente", "clientes"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });
}
