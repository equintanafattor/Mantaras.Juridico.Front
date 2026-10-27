import type { ResumenEntradaAgenda } from "@/features/agenda/types/types";

import type {
  CasoExpedienteResponse,
  EnvioCobroResponse,
  TipoDocumentoCobro,
} from "../types/types";

export const TIPO_DOCUMENTO_COBRO_LABELS: Record<TipoDocumentoCobro, string> = {
  Cedula: "Cédula",
  Oficio: "Oficio",
};

export const TIPOS_DOCUMENTO_COBRO: TipoDocumentoCobro[] = ["Cedula", "Oficio"];

export function formatearFechaCobro(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
}

// Fecha de hoy en Argentina (yyyy-MM-dd), el mismo criterio que valida backend.
export function fechaHoyArgentina() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

export function seguimientoCerrado(envio: EnvioCobroResponse) {
  return (
    envio.estadoSeguimiento === "Completada" ||
    envio.estadoSeguimiento === "Cancelada"
  );
}

// Los días los calcula backend; acá solo se redactan.
export function describirPlazoSeguimiento(envio: EnvioCobroResponse) {
  if (seguimientoCerrado(envio)) {
    return null;
  }

  const dias = envio.diasParaSeguimiento;

  if (envio.seguimientoVencido) {
    const vencidoHace = Math.abs(dias);

    return vencidoHace === 1 ? "Venció hace 1 día" : `Venció hace ${vencidoHace} días`;
  }

  if (dias === 0) {
    return "Vence hoy";
  }

  return dias === 1 ? "Falta 1 día" : `Faltan ${dias} días`;
}

export function resumenAlertaCobro(
  envio: EnvioCobroResponse,
  expediente: {
    expedienteId: number;
    caratula: string;
    numeroExpediente: string | null;
    casos: CasoExpedienteResponse[];
  },
): ResumenEntradaAgenda {
  return {
    entradaAgendaId: envio.entradaAgendaId,
    recurrenciaAgendaId: null,
    titulo: "Seguimiento de cobro",
    tipoEntradaNombre: "Seguimiento de cobro",
    clientes: [],
    casos: expediente.casos.map((caso) => ({
      id: caso.casoId,
      nombre: caso.titulo,
      referencia: caso.numeroExpedienteAnses,
    })),
    expedientes: [
      {
        id: expediente.expedienteId,
        nombre: expediente.caratula,
        referencia: expediente.numeroExpediente,
      },
    ],
    responsables: [],
  };
}
