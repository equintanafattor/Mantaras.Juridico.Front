import Link from "next/link";
import { notFound } from "next/navigation";

import HistorialObservaciones from "@/features/observaciones/components/HistorialObservaciones";

type PageProps = {
  params: Promise<{ expedienteId: string }>;
};

export default async function MovimientosPage({ params }: PageProps) {
  const { expedienteId } = await params;
  const id = Number(expedienteId);

  if (!/^\d+$/.test(expedienteId) || !Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/expedientes/${id}`}
        className="text-sm font-medium text-primary underline underline-offset-4"
      >
        Volver al expediente judicial
      </Link>

      <h1 className="text-2xl font-semibold">
        Movimientos del expediente judicial #{id}
      </h1>

      <HistorialObservaciones
        key={id}
        entidad="expedientes"
        propietarioId={id}
        mostrarTodos
      />
    </div>
  );
}
