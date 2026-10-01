"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buscarClientes } from "@/features/clientes/api/clientesApi";
import { buscarCasos } from "@/features/casos/api/casosApi";
import { buscarExpedientes } from "@/features/expedientes/api/expedientesApi";
import type { SeleccionAgenda } from "../lib/filtrosAgenda";

type TipoRelacion = "cliente" | "caso" | "expediente";
async function buscar(tipo: TipoRelacion, busqueda: string, page: number, soloActivos: boolean, signal: AbortSignal) {
  const params = { busqueda, page, pageSize: 8, soloActivos };
  if (tipo === "cliente") {
    const result = await buscarClientes(params, signal);
    return { ...result, items: result.items.map((x) => ({ id: x.clienteId, nombre: `${x.nombreCompleto}${x.dni ? ` · DNI ${x.dni}` : ""}${!x.activo ? " (inactivo)" : ""}` })) };
  }
  if (tipo === "caso") {
    const result = await buscarCasos(params, signal);
    return { ...result, items: result.items.map((x) => ({ id: x.casoId, nombre: `${x.titulo}${x.numeroExpedienteAnses ? ` · ${x.numeroExpedienteAnses}` : ""}${!x.activo ? " (inactivo)" : ""}` })) };
  }
  const result = await buscarExpedientes(params, signal);
  return { ...result, items: result.items.map((x) => ({ id: x.expedienteId, nombre: `${x.caratula}${x.numeroExpediente ? ` · ${x.numeroExpediente}` : ""}${!x.activo ? " (inactivo)" : ""}` })) };
}

export default function AgendaRelacionFiltro({ tipo, label, value, onChange, soloActivos = false }: {
  soloActivos?: boolean; tipo: TipoRelacion; label: string; value: SeleccionAgenda | null; onChange: (value: SeleccionAgenda | null) => void;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["agenda", "relaciones", tipo, busqueda, page, soloActivos],
    queryFn: ({ signal }) => buscar(tipo, busqueda, page, soloActivos, signal), enabled: abierto,
  });
  function buscarTexto() { setBusqueda(texto.trim()); setPage(1); if (busqueda === texto.trim() && page === 1) void query.refetch(); }
  return (
    <div className="min-w-0 space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">{label}</p>
      <p className="break-words text-sm text-muted-foreground">{value?.nombre ?? "Todos"}</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" aria-expanded={abierto} aria-controls={`${id}-resultados`} onClick={() => setAbierto(!abierto)}>{abierto ? "Cerrar búsqueda" : value ? "Cambiar" : "Seleccionar"}</Button>
        {value ? <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>Quitar</Button> : null}
      </div>
      {abierto ? <div id={`${id}-resultados`} className="space-y-2">
        <Label htmlFor={id}>Buscar {label.toLowerCase()}</Label>
        <div className="flex gap-2">
          <Input id={id} maxLength={150} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarTexto(); } }} />
          <Button type="button" variant="outline" onClick={buscarTexto}>Buscar</Button>
        </div>
        {query.isPending ? <p role="status" className="text-xs">Cargando opciones…</p> : query.isError ? <div role="alert" className="text-xs"><p>{query.error.message}</p><Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>Reintentar</Button></div> : <>
          {query.data.items.length === 0 ? <p role="status" className="text-xs text-muted-foreground">No hay coincidencias.</p> : <ul className="space-y-1">{query.data.items.map((item) => <li key={item.id}><button type="button" className="w-full rounded-md border px-2 py-2 text-left text-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { onChange(item); setAbierto(false); }}>{item.nombre}<span className="ml-1 text-muted-foreground">#{item.id}</span></button></li>)}</ul>}
          {query.data.totalPages > 1 ? <div className="flex items-center justify-between gap-1 text-xs">
            <Button type="button" variant="ghost" size="sm" disabled={!query.data.hasPreviousPage || query.isFetching} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span>{query.data.page}/{query.data.totalPages}</span>
            <Button type="button" variant="ghost" size="sm" disabled={!query.data.hasNextPage || query.isFetching} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </div> : null}
        </>}
      </div> : null}
    </div>
  );
}
