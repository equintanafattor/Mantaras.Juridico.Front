"use client";

import { useQuery } from "@tanstack/react-query";

import { obtenerResumenPanel } from "../api/panelApi";

export function usePanelResumen() {
  return useQuery({
    queryKey: ["panel", "resumen"],
    queryFn: ({ signal }) => obtenerResumenPanel(signal),
  });
}
