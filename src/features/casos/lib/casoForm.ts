import type { CasoDetalleResponse, CrearCasoRequest, FaseCaso, TipoParticipacionCliente } from "../types/types";
import type { ReferenciaCatalogo, DatosAdministrativos } from "../../catalogos/types/types";

export type CasoParticipanteForm = {
  clienteId: number;
  nombreCompleto: string;
  dni: string | null;
  cuil: string | null;
  tipoParticipacion: TipoParticipacionCliente;
  esPrincipal: boolean;
};

export type ClienteInicialCaso = Pick<
  CasoParticipanteForm,
  "clienteId" | "nombreCompleto" | "dni" | "cuil"
>;

export type CasoFormState = {
  titulo: string;
  faseInterna: FaseCaso;
  tipoTramite: string;
  numeroExpedienteAnses: string;
  numeroBeneficio: string;
  tipoBeneficio: ReferenciaCatalogo | null;
  tipoAdministrativo: ReferenciaCatalogo | null;
  tipoBeneficioOriginal: ReferenciaCatalogo | null;
  tipoAdministrativoOriginal: ReferenciaCatalogo | null;
  clientes: CasoParticipanteForm[];
};

export const FORM_CASO_INICIAL: CasoFormState = {
  titulo: "",
  faseInterna: "Preadministrativa",
  tipoTramite: "",
  numeroExpedienteAnses: "",
  numeroBeneficio: "",
  tipoBeneficio: null,
  tipoAdministrativo: null,
  tipoBeneficioOriginal: null,
  tipoAdministrativoOriginal: null,
  clientes: [],
};

export function crearFormCasoInicial(
  clienteInicial?: ClienteInicialCaso,
): CasoFormState {
  return {
    ...FORM_CASO_INICIAL,
    clientes: clienteInicial
      ? [
          {
            ...clienteInicial,
            tipoParticipacion: "Titular",
            esPrincipal: true,
          },
        ]
      : [],
  };
}

export function crearFormDesdeCaso(caso: CasoDetalleResponse): CasoFormState {
  const beneficio = caso.tipoBeneficioId == null ? null : {
    id: caso.tipoBeneficioId, nombre: caso.tipoBeneficioNombre || `Beneficio #${caso.tipoBeneficioId}`, activo: caso.tipoBeneficioActivo === true,
  };
  const tipo = caso.tipoExpedienteAdministrativoId == null ? null : {
    id: caso.tipoExpedienteAdministrativoId, nombre: caso.tipoExpedienteAdministrativoNombre || `Tipo #${caso.tipoExpedienteAdministrativoId}`, activo: caso.tipoExpedienteAdministrativoActivo === true,
  };
  return {
    numeroExpedienteAnses: caso.numeroExpedienteAnses ?? "",
    numeroBeneficio: caso.numeroBeneficio ?? "",
    tipoBeneficio: beneficio,
    tipoAdministrativo: tipo,
    tipoBeneficioOriginal: beneficio,
    tipoAdministrativoOriginal: tipo,
    titulo: caso.titulo,
    faseInterna: caso.faseInterna,
    tipoTramite: caso.tipoTramite ?? "",
    clientes: caso.clientes.map((cliente) => ({
      clienteId: cliente.clienteId,
      nombreCompleto: cliente.nombreCompleto,
      dni: cliente.dni,
      cuil: cliente.cuil,
      tipoParticipacion: cliente.tipoParticipacion,
      esPrincipal: cliente.esPrincipal,
    })),
  };
}

function normalizarOpcional(value: string) {
  const normalizedValue = value.trim();

  return normalizedValue || null;
}

export function crearRequestDesdeForm(form: CasoFormState): CrearCasoRequest {
  return {
    numeroExpedienteAnses: normalizarOpcional(form.numeroExpedienteAnses),
    numeroBeneficio: normalizarOpcional(form.numeroBeneficio),
    tipoBeneficioId: form.tipoBeneficio?.id ?? null,
    tipoExpedienteAdministrativoId: form.tipoAdministrativo?.id ?? null,
    titulo: form.titulo.trim(),
    faseInterna: form.faseInterna,
    tipoTramite: normalizarOpcional(form.tipoTramite),
    clientes: form.clientes.map((cliente) => ({
      clienteId: cliente.clienteId,
      tipoParticipacion: cliente.tipoParticipacion,
      esPrincipal: cliente.esPrincipal,
    })),
  };
}

export function esCasoFormValido(form: CasoFormState): boolean {
  const asignable = (item: ReferenciaCatalogo | null, original: ReferenciaCatalogo | null) =>
    item === null || (Number.isSafeInteger(item.id) && item.id > 0 && (item.activo || item.id === original?.id));
  return form.titulo.trim().length > 0 && form.titulo.trim().length <= 300 &&
    form.faseInterna.trim().length > 0 && form.faseInterna.trim().length <= 200 &&
    form.tipoTramite.trim().length <= 200 && form.numeroExpedienteAnses.length <= 100 && form.numeroBeneficio.length <= 100 &&
    form.clientes.length > 0 && form.clientes.filter((cliente) => cliente.esPrincipal).length === 1 &&
    asignable(form.tipoBeneficio, form.tipoBeneficioOriginal) && asignable(form.tipoAdministrativo, form.tipoAdministrativoOriginal);
}

export function datosAdministrativosDesdeForm(form: CasoFormState): DatosAdministrativos {
  return {
    numeroExpedienteAnses: normalizarOpcional(form.numeroExpedienteAnses),
    numeroBeneficio: normalizarOpcional(form.numeroBeneficio),
    tipoBeneficioId: form.tipoBeneficio?.id ?? null,
    tipoBeneficioNombre: form.tipoBeneficio?.nombre ?? null,
    tipoBeneficioActivo: form.tipoBeneficio?.activo ?? null,
    tipoExpedienteAdministrativoId: form.tipoAdministrativo?.id ?? null,
    tipoExpedienteAdministrativoNombre: form.tipoAdministrativo?.nombre ?? null,
    tipoExpedienteAdministrativoActivo: form.tipoAdministrativo?.activo ?? null,
  };
}
