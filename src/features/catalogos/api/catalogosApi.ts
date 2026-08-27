import { leerOpciones } from "../lib/leerOpciones";
import { apiRequest } from "@/lib/api/apiClient";
import type { PagedResponse } from "@/features/casos/types/types";
import { CATALOGOS, type CatalogoItem, type TipoCatalogo } from "../types/types";

type CatalogoResponse = Omit<CatalogoItem, "id"> & {
  tipoBeneficioId?: number;
  tipoExpedienteAdministrativoId?: number;
};

function mapear(tipo: TipoCatalogo, item: CatalogoResponse): CatalogoItem {
  const id = item[CATALOGOS[tipo].campoId];
  if (!Number.isSafeInteger(id) || id === undefined || id <= 0) {
    throw new Error("El catálogo devolvió un identificador inválido.");
  }
  return { id, nombre: item.nombre, activo: item.activo, fechaCreacion: item.fechaCreacion, fechaModificacion: item.fechaModificacion };
}

export async function buscarCatalogo(tipo: TipoCatalogo, page: number, busqueda: string, soloActivos: boolean, signal?: AbortSignal): Promise<PagedResponse<CatalogoItem>> {
  const query = new URLSearchParams({ page: String(page), pageSize: "100", soloActivos: String(soloActivos) });
  if (busqueda.trim()) query.set("busqueda", busqueda.trim());
  const data = await apiRequest<PagedResponse<CatalogoResponse>>(`${CATALOGOS[tipo].ruta}?${query}`, { signal });
  return { ...data, items: data.items.map((item) => mapear(tipo, item)) };
}

export async function obtenerOpcionesCatalogo(tipo: TipoCatalogo, signal?: AbortSignal): Promise<CatalogoItem[]> {
  return leerOpciones((page) => buscarCatalogo(tipo, page, "", true, signal));
}

export async function guardarCatalogo(tipo: TipoCatalogo, nombre: string, id?: number): Promise<CatalogoItem> {
  const data = await apiRequest<CatalogoResponse>(`${CATALOGOS[tipo].ruta}${id === undefined ? "" : `/${id}`}`, {
    method: id === undefined ? "POST" : "PUT", body: { nombre: nombre.trim() },
  });
  return mapear(tipo, data);
}

export async function cambiarEstadoCatalogo(tipo: TipoCatalogo, id: number, activar: boolean): Promise<void> {
  await apiRequest<void>(`${CATALOGOS[tipo].ruta}/${id}${activar ? "/reactivar" : ""}`, { method: activar ? "PATCH" : "DELETE" });
}
