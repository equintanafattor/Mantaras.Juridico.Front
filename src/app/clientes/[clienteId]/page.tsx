import { notFound } from "next/navigation";

import ClienteDetalleScreen from "@/features/clientes/components/ClienteDetalleScreen";

type ClienteDetallePageProps = {
  params: Promise<{
    clienteId: string;
  }>;
};

export default async function ClienteDetallePage({
  params,
}: ClienteDetallePageProps) {
  const { clienteId: clienteIdParam } = await params;
  const clienteId = Number(clienteIdParam);

  if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
    notFound();
  }

  return <ClienteDetalleScreen clienteId={clienteId} />;
}