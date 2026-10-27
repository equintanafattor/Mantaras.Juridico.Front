import type { DatosHojaResumen } from "../types/hojaResumen";

export type HojaForm = {
  [K in Exclude<
    keyof DatosHojaResumen,
    "movilidadActualizacionMes" | "movilidadActualizacionAnio"
  >]: string;
} & {
  movilidadPeriodo: string;
};

type Campo = {
  key: keyof HojaForm;
  label: string;
  tipo: "texto" | "importe" | "fecha" | "periodo";
};

export const SECCIONES_HOJA: {
  titulo: string;
  campos: Campo[];
}[] = [
  {
    titulo: "Haber inicial",
    campos: [
      {
        key: "haberInicialReajustadoCaracteristicas",
        label: "Reajustado",
        tipo: "texto",
      },
      {
        key: "haberInicialMonto",
        label: "Monto",
        tipo: "importe",
      },
    ],
  },
  {
    titulo: "Movilidad",
    campos: [
      {
        key: "movilidadPeriodo",
        label: "Mes y año de actualización",
        tipo: "periodo",
      },
      {
        key: "movilidadMonto",
        label: "Monto",
        tipo: "importe",
      },
    ],
  },
  {
    titulo: "Retroactivo",
    campos: [
      {
        key: "retroactivoFechaInicio",
        label: "Desde",
        tipo: "fecha",
      },
      {
        key: "retroactivoFechaActualizacion",
        label: "Hasta",
        tipo: "fecha",
      },
      {
        key: "retroactivoMonto",
        label: "Monto",
        tipo: "importe",
      },
    ],
  },
];

export const CAMPOS_GENERALES_HOJA: Campo[] = [
  { key: "fechaAdquisicionDerecho", label: "Fecha de adquisición del derecho", tipo: "fecha" },
  { key: "leyAplicada", label: "Ley aplicada", tipo: "texto" },
];

// Margen conservador para conservar centavos al intercambiar números JSON.
const MAX_IMPORTE_UI = 999_999_999_999.99;

export function leerImporte(texto: string, label: string): number | null {
  const limpio = texto.trim().replace(",", ".");

  if (!limpio) return null;

  if (!/^-?\d+(?:\.\d{1,2})?$/.test(limpio)) {
    throw new Error(
      `${label}: usá hasta dos decimales, sin separadores de miles.`,
    );
  }

  const valor = Number(limpio);

  if (!Number.isFinite(valor) || Math.abs(valor) > MAX_IMPORTE_UI) {
    throw new Error(
      `${label}: el importe supera el rango de edición segura del navegador.`,
    );
  }

  return valor;
}

function leerFecha(texto: string, label: string) {
  if (!texto) return null;

  const fecha = new Date(`${texto}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(texto) ||
    texto.startsWith("0000") ||
    !Number.isFinite(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== texto
  ) {
    throw new Error(`${label}: ingresá una fecha válida.`);
  }

  return texto;
}

function leerTexto(texto: string, label: string, maximo = 2000) {
  const limpio = texto.trim();

  if (limpio.length > maximo) {
    throw new Error(`${label}: máximo ${maximo} caracteres.`);
  }

  return limpio || null;
}

export function crearHojaForm(hoja: DatosHojaResumen): HojaForm {
  return {
    fechaAdquisicionDerecho: hoja.fechaAdquisicionDerecho ?? "",
    leyAplicada: hoja.leyAplicada ?? "",
    observacionesGenerales: hoja.observacionesGenerales ?? "",
    tieneCalculoPrevio:
      hoja.tieneCalculoPrevio === null
        ? ""
        : hoja.tieneCalculoPrevio
          ? "si"
          : "no",

    haberInicialReajustadoCaracteristicas:
      hoja.haberInicialReajustadoCaracteristicas ?? "",
    haberInicialPbu: hoja.haberInicialPbu?.toString() ?? "",
    haberInicialObservacion: hoja.haberInicialObservacion ?? "",
    haberInicialMonto: hoja.haberInicialMonto?.toString() ?? "",

    movilidadPeriodo:
      hoja.movilidadActualizacionAnio != null &&
      hoja.movilidadActualizacionMes != null
        ? `${String(hoja.movilidadActualizacionAnio).padStart(4, "0")}-${String(hoja.movilidadActualizacionMes).padStart(2, "0")}`
        : "",

    movilidadObservaciones: hoja.movilidadObservaciones ?? "",
    movilidadMonto: hoja.movilidadMonto?.toString() ?? "",

    retroactivoFechaInicio: hoja.retroactivoFechaInicio ?? "",
    retroactivoFechaActualizacion: hoja.retroactivoFechaActualizacion ?? "",
    retroactivoObservacion: hoja.retroactivoObservacion ?? "",
    retroactivoMonto: hoja.retroactivoMonto?.toString() ?? "",
  };
}

export function crearHojaRequest(form: HojaForm): DatosHojaResumen {
  let mes: number | null = null;
  let anio: number | null = null;

  if (form.movilidadPeriodo) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.movilidadPeriodo)) {
      throw new Error("Movilidad: completá un mes y año válidos.");
    }

    [anio, mes] = form.movilidadPeriodo.split("-").map(Number);

    if (anio < 1) {
      throw new Error("Movilidad: el año debe ser mayor que cero.");
    }
  }

  if (!["", "si", "no"].includes(form.tieneCalculoPrevio)) {
    throw new Error("Seleccioná si tiene cálculo previo.");
  }

  const desde = leerFecha(form.retroactivoFechaInicio, "Inicio del retroactivo");
  const hasta = leerFecha(form.retroactivoFechaActualizacion, "Fin del retroactivo");
  if (desde && hasta && desde > hasta) {
    throw new Error("El inicio del período retroactivo no puede ser posterior a su fin.");
  }

  return {
    fechaAdquisicionDerecho: leerFecha(form.fechaAdquisicionDerecho, "Fecha de adquisición del derecho"),
    leyAplicada: leerTexto(form.leyAplicada, "Ley aplicada", 200),
    observacionesGenerales: leerTexto(form.observacionesGenerales, "Observaciones", 6500),
    tieneCalculoPrevio:
      form.tieneCalculoPrevio === "" ? null : form.tieneCalculoPrevio === "si",

    haberInicialReajustadoCaracteristicas: leerTexto(
      form.haberInicialReajustadoCaracteristicas,
      "Características",
    ),
    haberInicialPbu: leerImporte(form.haberInicialPbu, "PBU"),
    haberInicialObservacion: leerTexto(
      form.haberInicialObservacion,
      "Observación del haber inicial",
    ),
    haberInicialMonto: leerImporte(
      form.haberInicialMonto,
      "Monto del haber inicial",
    ),

    movilidadActualizacionMes: mes,
    movilidadActualizacionAnio: anio,
    movilidadObservaciones: leerTexto(
      form.movilidadObservaciones,
      "Observaciones de movilidad",
    ),
    movilidadMonto: leerImporte(form.movilidadMonto, "Monto de movilidad"),

    retroactivoFechaInicio: leerFecha(
      form.retroactivoFechaInicio,
      "Inicio del retroactivo",
    ),
    retroactivoFechaActualizacion: leerFecha(
      form.retroactivoFechaActualizacion,
      "Fin del retroactivo",
    ),
    retroactivoObservacion: leerTexto(
      form.retroactivoObservacion,
      "Observación del retroactivo",
    ),
    retroactivoMonto: leerImporte(
      form.retroactivoMonto,
      "Monto del retroactivo",
    ),
  };
}

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export function mostrarCampoHoja(valor: string, tipo: Campo["tipo"]) {
  if (!valor) return "Sin informar";

  if (tipo === "importe") {
    try {
      return pesos.format(leerImporte(valor, "Monto")!);
    } catch {
      return "Importe fuera del rango seguro de visualización";
    }
  }

  if (tipo === "fecha") {
    return valor.split("-").reverse().join("/");
  }

  if (tipo === "periodo") {
    const [anio, mes] = valor.split("-");
    return `${mes}/${anio}`;
  }

  return valor;
}
