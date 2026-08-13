import { apiRequest } from "@/lib/api/apiClient";

import type { PanelResumenResponse } from "../types/types";

export async function obtenerResumenPanel(
  signal?: AbortSignal,
): Promise<PanelResumenResponse> {
  return apiRequest<PanelResumenResponse>("/api/panel/resumen", {
    method: "GET",
    signal,
  });
}
