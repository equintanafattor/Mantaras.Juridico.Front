import { apiRequest } from "@/lib/api/apiClient";

import type {
  ActualizarClienteRequest,
  BuscarClientesParams,
  ClienteDetalleResponse,
  ClienteResponse,
  CrearClienteRequest,
  PagedResponse,
} from "../types/types";

export async function buscarClientes(
  params: BuscarClientesParams,
  signal?: AbortSignal,
): Promise<PagedResponse<ClienteResponse>> {
  const query = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
    soloActivos: params.soloActivos.toString(),
  });

  const busqueda = params.busqueda?.trim();

  if (busqueda) {
    query.set("busqueda", busqueda);
  }

  return apiRequest<PagedResponse<ClienteResponse>>(
    `/api/clientes?${query.toString()}`,
    {
      method: "GET",
      signal,
    },
  );
}

export async function obtenerClientePorId(
  clienteId: number,
  signal?: AbortSignal,
): Promise<ClienteDetalleResponse> {
  return apiRequest<ClienteDetalleResponse>(`/api/clientes/${clienteId}`, {
    method: "GET",
    signal,
  });
}

export async function crearCliente(
  request: CrearClienteRequest,
): Promise<ClienteResponse> {
  return apiRequest<ClienteResponse>("/api/clientes", {
    method: "POST",
    body: request,
  });
}

export async function actualizarCliente(
  clienteId: number,
  request: ActualizarClienteRequest,
): Promise<ClienteDetalleResponse> {
  return apiRequest<ClienteDetalleResponse>(`/api/clientes/${clienteId}`, {
    method: "PUT",
    body: request,
  });
}

export async function darDeBajaCliente(clienteId: number): Promise<void> {
  await apiRequest<void>(`/api/clientes/${clienteId}`, {
    method: "DELETE",
  });
}

export async function reactivarCliente(clienteId: number): Promise<void> {
  await apiRequest<void>(`/api/clientes/${clienteId}/reactivar`, {
    method: "PATCH",
  });
}
