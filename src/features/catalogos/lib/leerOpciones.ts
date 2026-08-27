import type { CatalogoItem } from "../types/types";

type Pagina = {
  page: number;
  hasNextPage: boolean;
  items: CatalogoItem[];
};

/** Complete active options, never expose a partially loaded catalog. */
export async function leerOpciones(
  leerPagina: (page: number) => Promise<Pagina>,
): Promise<CatalogoItem[]> {
  const items: CatalogoItem[] = [];
  const ids = new Set<number>();
  for (let page = 1; ; page++) {
    const data = await leerPagina(page);
    const nuevos = data.items.filter((item) => !ids.has(item.id));
    if (data.page !== page || (data.hasNextPage && nuevos.length === 0)) {
      throw new Error("No se pudo completar la lectura del catálogo. Reintentá.");
    }
    for (const item of nuevos) {
      if (!ids.has(item.id)) {
        ids.add(item.id);
        if (item.activo) items.push(item);
      }
    }
    if (!data.hasNextPage) return items;
  }
}
