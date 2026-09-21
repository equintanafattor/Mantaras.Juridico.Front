import type { DatosAdministrativos } from "../types/types";

export function NombreCatalogo({ nombre, activo }: { nombre: string | null; activo: boolean | null }) {
  return <>{nombre || "Sin asignar"}{activo === false && <span className="ml-2 inline-block rounded border px-1.5 py-0.5 text-xs text-muted-foreground">Inactivo</span>}</>;
}

export default function DatosAdministrativosResumen({ datos }: { datos: DatosAdministrativos }) {
  return (
    <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Número de expediente ANSES</dt><dd className="mt-1 break-words">{datos.numeroExpedienteAnses || "No informado"}</dd></div>
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Número de beneficio</dt><dd className="mt-1 break-words">{datos.numeroBeneficio || "No informado"}</dd></div>
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Tipo de beneficio</dt><dd className="mt-1 break-words"><NombreCatalogo nombre={datos.tipoBeneficioNombre} activo={datos.tipoBeneficioActivo} /></dd></div>
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Tipo de expediente administrativo</dt><dd className="mt-1 break-words"><NombreCatalogo nombre={datos.tipoExpedienteAdministrativoNombre} activo={datos.tipoExpedienteAdministrativoActivo} /></dd></div>
    </dl>
  );
}
