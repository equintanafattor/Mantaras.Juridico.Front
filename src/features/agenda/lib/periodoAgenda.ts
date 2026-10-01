export function mesActualArgentina(fecha = new Date()): string {
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(fecha);
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}`;
}

export function rangoMes(mes: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw new Error("El período debe tener formato yyyy-MM.");
  }
  const [anio, numeroMes] = mes.split("-").map(Number);
  if (anio < 1) throw new Error("El año debe ser mayor a cero.");
  const fecha = new Date(0);
  fecha.setUTCFullYear(anio, numeroMes, 0);
  const ultimoDia = String(fecha.getUTCDate()).padStart(2, "0");
  return { desde: `${mes}-01`, hasta: `${mes}-${ultimoDia}` };
}

export function desplazarMes(mes: string, desplazamiento: number): string {
  rangoMes(mes);
  const [anio, numeroMes] = mes.split("-").map(Number);
  const fecha = new Date(0);
  fecha.setUTCFullYear(anio, numeroMes - 1 + desplazamiento, 1);
  return `${String(fecha.getUTCFullYear()).padStart(4, "0")}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function mostrarFechaAgenda(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function nombreMes(mes: string): string {
  rangoMes(mes);
  const [anio, numeroMes] = mes.split("-").map(Number);
  const fecha = new Date(0);
  fecha.setUTCFullYear(anio, numeroMes - 1, 1);
  return new Intl.DateTimeFormat("es-AR", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(fecha);
}
