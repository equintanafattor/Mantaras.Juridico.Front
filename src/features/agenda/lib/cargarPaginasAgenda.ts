import type { PagedResponse } from "@/features/casos/types/types";
import type { EntradaAgendaListadoResponse } from "../types/types";

export async function cargarPaginasAgenda(
  obtenerPagina: (page: number) => Promise<PagedResponse<EntradaAgendaListadoResponse>>,
): Promise<EntradaAgendaListadoResponse[]> {
  const primera = await obtenerPagina(1);
  if (primera.page !== 1) throw new Error("La API devolvió una página de Agenda inesperada.");
  const entradas = new Map(primera.items.map((entrada) => [entrada.entradaAgendaId, entrada]));
  for (let page = 2; page <= primera.totalPages; page++) {
    const respuesta = await obtenerPagina(page);
    if (respuesta.page !== page) throw new Error("La API devolvió una página de Agenda inesperada.");
    for (const entrada of respuesta.items) entradas.set(entrada.entradaAgendaId, entrada);
  }
  return Array.from(entradas.values());
}
