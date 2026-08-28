import { apiRequest } from "@/lib/api/apiClient";

type ClaveSeguridadSocialResponse = {
  claveSeguridadSocial: string | null;
};

export async function obtenerClaveSeguridadSocial(
  clienteId: number,
  signal: AbortSignal,
): Promise<string | null> {
  const response = await apiRequest<ClaveSeguridadSocialResponse>(
    `/api/clientes/${clienteId}/clave-seguridad-social`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  if (
    !response ||
    (response.claveSeguridadSocial !== null &&
      typeof response.claveSeguridadSocial !== "string")
  ) {
    throw new Error("Respuesta de clave no válida.");
  }

  return response.claveSeguridadSocial;
}
