"use client";

import { useQuery } from "@tanstack/react-query";

import { obtenerResumenPanel } from "../api/panelApi";

export function usePanelResumen() {
  return useQuery({
    queryKey: ["panel", "resumen"],
    refetchInterval: 60_000,
    queryFn: ({ signal }) => obtenerResumenPanel(signal),
  });
}
