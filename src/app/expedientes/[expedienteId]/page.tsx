import { notFound } from "next/navigation";

import ExpedienteDetalleScreen from "@/features/expedientes/components/ExpedienteDetalleScreen";

type ExpedienteDetallePageProps = {
  params: Promise<{
    expedienteId: string;
  }>;
};

export default async function ExpedienteDetallePage({
  params,
}: ExpedienteDetallePageProps) {
  const { expedienteId: expedienteIdParam } = await params;
  const expedienteId = Number(expedienteIdParam);

  if (!Number.isSafeInteger(expedienteId) || expedienteId <= 0) {
    notFound();
  }

  return <ExpedienteDetalleScreen expedienteId={expedienteId} />;
}
