"use client";
import { useQuery } from "@tanstack/react-query";
import { obtenerOpcionesAgenda } from "../api/agendaApi";
export function useOpcionesAgenda() {
  return useQuery({ queryKey: ["agenda", "opciones"], queryFn: ({ signal }) => obtenerOpcionesAgenda(signal) });
}
