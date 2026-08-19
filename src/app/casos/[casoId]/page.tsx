import { notFound } from "next/navigation";

import CasoDetalleScreen from "@/features/casos/components/CasoDetalleScreen";

type CasoDetallePageProps = {
  params: Promise<{
    casoId: string;
  }>;
};

export default async function CasoDetallePage({
  params,
}: CasoDetallePageProps) {
  const { casoId: casoIdParam } = await params;
  const casoId = Number(casoIdParam);

  if (!Number.isSafeInteger(casoId) || casoId <= 0) {
    notFound();
  }

  return <CasoDetalleScreen casoId={casoId} />;
}
