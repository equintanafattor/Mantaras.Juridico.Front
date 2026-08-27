import Link from "next/link";
import { notFound } from "next/navigation";

import HistorialObservaciones from "@/features/observaciones/components/HistorialObservaciones";

type PageProps = {
  params: Promise<{ casoId: string }>;
};

export default async function MovimientosPage({ params }: PageProps) {
  const { casoId } = await params;
  const id = Number(casoId);

  if (!/^\d+$/.test(casoId) || !Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/casos/${id}`}
        className="text-sm font-medium text-primary underline underline-offset-4"
      >
        Volver al expediente administrativo
      </Link>

      <h1 className="text-2xl font-semibold">
        Movimientos del expediente administrativo #{id}
      </h1>

      <HistorialObservaciones
        key={id}
        entidad="casos"
        propietarioId={id}
        mostrarTodos
      />
    </div>
  );
}
