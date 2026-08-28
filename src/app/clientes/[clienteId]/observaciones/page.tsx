import Link from "next/link";
import { notFound } from "next/navigation";

import HistorialObservaciones from "@/features/observaciones/components/HistorialObservaciones";

type PageProps = {
  params: Promise<{ clienteId: string }>;
};

export default async function ObservacionesClientePage({ params }: PageProps) {
  const { clienteId } = await params;
  const id = Number(clienteId);

  if (!/^\d+$/.test(clienteId) || !Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/clientes/${id}`}
        className="text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Volver a la ficha del cliente
      </Link>

      <h1 className="text-2xl font-semibold">
        Observaciones del cliente #{id}
      </h1>

      <HistorialObservaciones
        key={id}
        entidad="clientes"
        propietarioId={id}
        mostrarTodos
      />
    </div>
  );
}
