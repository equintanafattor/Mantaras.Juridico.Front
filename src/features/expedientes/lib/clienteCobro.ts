import type {
  ClienteExpedienteCobroResponse,
  ExpedienteCobroResponse,
} from "../types/types";

/**
 * A qué cliente lleva una fila del listado de cobro.
 * - "cliente": hay uno inequívoco; la fila navega a su ficha.
 * - "varios": hay varios sin principal inequívoco; se ofrecen enlaces individuales.
 * - "sin-cliente": el judicial no tiene clientes asociados.
 */
export type DestinoClienteCobro =
  | {
      tipo: "cliente";
      cliente: ClienteExpedienteCobroResponse;
      otros: ClienteExpedienteCobroResponse[];
    }
  | { tipo: "varios"; clientes: ClienteExpedienteCobroResponse[] }
  | { tipo: "sin-cliente" };

export function destinoClienteCobro(
  expediente: Pick<ExpedienteCobroResponse, "clientes" | "clientePrincipalId">,
): DestinoClienteCobro {
  const clientes = expediente.clientes ?? [];

  if (clientes.length === 0) {
    return { tipo: "sin-cliente" };
  }

  // El criterio de "principal" lo decide backend; acá no se elige uno arbitrario.
  const principal =
    expediente.clientePrincipalId === null
      ? undefined
      : clientes.find((cliente) => cliente.clienteId === expediente.clientePrincipalId);

  if (principal) {
    return {
      tipo: "cliente",
      cliente: principal,
      otros: clientes.filter((cliente) => cliente.clienteId !== principal.clienteId),
    };
  }

  if (clientes.length === 1) {
    return { tipo: "cliente", cliente: clientes[0], otros: [] };
  }

  return { tipo: "varios", clientes };
}

export function documentoCliente(cliente: Pick<ClienteExpedienteCobroResponse, "dni" | "cuil">) {
  if (cliente.dni) return `DNI ${cliente.dni}`;
  if (cliente.cuil) return `CUIL ${cliente.cuil}`;
  return null;
}

export function rutaCliente(clienteId: number) {
  return `/clientes/${clienteId}`;
}

export function rutaExpediente(expedienteId: number) {
  return `/expedientes/${expedienteId}`;
}

/** Clics sobre enlaces o botones de la fila no deben activar también la navegación de la fila. */
export function esClicEnControl(target: EventTarget | null, contenedor: Element) {
  if (!(target instanceof Element)) return false;
  const control = target.closest("a, button, input, select, textarea, [role=button], [role=dialog]");
  return control !== null && contenedor.contains(control) && control !== contenedor;
}
