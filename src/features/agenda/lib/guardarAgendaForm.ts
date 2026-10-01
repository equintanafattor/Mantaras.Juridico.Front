import type { CrearRecordatorioAgendaRequest } from "../types/types";

export type ProgresoGuardadoAgenda = { entradaId?: number; pendientes: CrearRecordatorioAgendaRequest[] };

export function esRecordatorioDuplicado(error: unknown) {
  return error instanceof Error && "errors" in error && Array.isArray(error.errors)
    && error.errors.some(item => item?.code === "Agenda.RecordatorioDuplicado");
}

// Se informa cada paso confirmado para que un reintento continúe desde allí.
export async function guardarAgendaConRecordatorios(
  inicial: ProgresoGuardadoAgenda,
  guardarEntrada: () => Promise<{ entradaAgendaId: number }>,
  crearRecordatorio: (id: number, request: CrearRecordatorioAgendaRequest) => Promise<unknown>,
  onProgreso: (progreso: ProgresoGuardadoAgenda) => void,
) {
  let progreso = inicial;
  if (progreso.entradaId === undefined) {
    const entrada = await guardarEntrada();
    progreso = { ...progreso, entradaId: entrada.entradaAgendaId };
    onProgreso(progreso);
  }
  while (progreso.pendientes.length > 0) {
    try { await crearRecordatorio(progreso.entradaId!, progreso.pendientes[0]); }
    catch (error) { if (!esRecordatorioDuplicado(error)) throw error; }
    progreso = { ...progreso, pendientes: progreso.pendientes.slice(1) };
    onProgreso(progreso);
  }
  return progreso;
}
