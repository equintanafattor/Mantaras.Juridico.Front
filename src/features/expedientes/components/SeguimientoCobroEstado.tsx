import { Badge } from "@/components/ui/badge";
import { NOMBRES_ESTADO_AGENDA } from "@/features/agenda/lib/estadosAgenda";

import {
  describirPlazoSeguimiento,
  formatearFechaCobro,
  seguimientoCerrado,
} from "../lib/cobro";
import type { EnvioCobroResponse } from "../types/types";

export default function SeguimientoCobroEstado({
  envio,
  compacto = false,
}: {
  envio: EnvioCobroResponse;
  compacto?: boolean;
}) {
  const plazo = describirPlazoSeguimiento(envio);
  const vencido = envio.seguimientoVencido && !seguimientoCerrado(envio);

  return (
    <div className="min-w-0">
      <p className={compacto ? "text-sm" : "text-sm font-medium"}>
        {formatearFechaCobro(envio.fechaSeguimiento)}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="rounded-sm">
          {NOMBRES_ESTADO_AGENDA[envio.estadoSeguimiento] ??
            envio.estadoSeguimiento}
        </Badge>

        {vencido && (
          <Badge variant="destructive" className="rounded-sm">
            Vencido
          </Badge>
        )}

        {plazo && (
          <span
            className={
              vencido
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {plazo}
          </span>
        )}
      </div>
    </div>
  );
}
