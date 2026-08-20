import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type {
  ActualizarClienteRequest,
  ClienteDetalleResponse,
} from "../types/types";

export type ClienteFormState = {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  claveSeguridadSocial: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
  domicilio: string;
  localidad: string;
  provincia: string;
};

export const FORM_CLIENTE_INICIAL: ClienteFormState = {
  nombre: "",
  apellido: "",
  dni: "",
  cuil: "",
  claveSeguridadSocial: "",
  fechaNacimiento: "",
  telefono: "",
  email: "",
  domicilio: "",
  localidad: "",
  provincia: "",
};

function nullable(value: string): string | null {
  const resultado = value.trim();
  return resultado || null;
}

export function crearFormDesdeCliente(
  cliente: ClienteDetalleResponse,
): ClienteFormState {
  return {
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    dni: cliente.dni ?? "",
    cuil: cliente.cuil ?? "",
    claveSeguridadSocial: "",
    fechaNacimiento: cliente.fechaNacimiento?.slice(0, 10) ?? "",
    telefono: cliente.telefono ?? "",
    email: cliente.email ?? "",
    domicilio: cliente.domicilio ?? "",
    localidad: cliente.localidad ?? "",
    provincia: cliente.provincia ?? "",
  };
}

export function crearRequestDesdeForm(
  form: ClienteFormState,
): ActualizarClienteRequest {
  return {
    nombre: form.nombre.trim(),
    apellido: form.apellido.trim(),
    dni: nullable(form.dni),
    cuil: nullable(form.cuil),
    claveSeguridadSocial: nullable(form.claveSeguridadSocial),
    fechaNacimiento: nullable(form.fechaNacimiento),
    telefono: nullable(form.telefono),
    email: nullable(form.email),
    domicilio: nullable(form.domicilio),
    localidad: nullable(form.localidad),
    provincia: nullable(form.provincia),
  };
}

type ClienteFormFieldsProps = {
  form: ClienteFormState;
  disabled?: boolean;
  modo: "crear" | "editar";
  onChange: (campo: keyof ClienteFormState, value: string) => void;
};

export default function ClienteFormFields({
  form,
  disabled = false,
  modo,
  onChange,
}: ClienteFormFieldsProps) {
  const prefijo = modo === "crear" ? "nuevo-cliente" : "editar-cliente";

  return (
    <>
      <section className="space-y-4">
        <h3 className="text-sm font-medium">Datos personales</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-nombre`}>Nombre *</Label>
            <Input
              id={`${prefijo}-nombre`}
              value={form.nombre}
              onChange={(event) => onChange("nombre", event.target.value)}
              maxLength={100}
              required
              disabled={disabled}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-apellido`}>Apellido *</Label>
            <Input
              id={`${prefijo}-apellido`}
              value={form.apellido}
              onChange={(event) => onChange("apellido", event.target.value)}
              maxLength={100}
              required
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-dni`}>DNI</Label>
            <Input
              id={`${prefijo}-dni`}
              value={form.dni}
              onChange={(event) => onChange("dni", event.target.value)}
              maxLength={20}
              inputMode="numeric"
              placeholder="Ej. 40168266"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-cuil`}>CUIL</Label>
            <Input
              id={`${prefijo}-cuil`}
              value={form.cuil}
              onChange={(event) => onChange("cuil", event.target.value)}
              maxLength={20}
              inputMode="numeric"
              placeholder="Ej. 20-40168266-0"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-fecha-nacimiento`}>
              Fecha de nacimiento
            </Label>
            <Input
              id={`${prefijo}-fecha-nacimiento`}
              type="date"
              value={form.fechaNacimiento}
              onChange={(event) =>
                onChange("fechaNacimiento", event.target.value)
              }
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-clave`}>
              Clave de Seguridad Social
            </Label>
            <Input
              id={`${prefijo}-clave`}
              type="password"
              value={form.claveSeguridadSocial}
              onChange={(event) =>
                onChange("claveSeguridadSocial", event.target.value)
              }
              maxLength={500}
              autoComplete="new-password"
              disabled={disabled}
              placeholder={
                modo === "editar" ? "Dejar vacío para conservarla" : undefined
              }
            />

            {modo === "editar" && (
              <p className="text-xs text-muted-foreground">
                Solo completá este campo si querés reemplazar la clave actual.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-5">
        <h3 className="text-sm font-medium">Contacto</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-telefono`}>Teléfono</Label>
            <Input
              id={`${prefijo}-telefono`}
              type="tel"
              value={form.telefono}
              onChange={(event) => onChange("telefono", event.target.value)}
              maxLength={50}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-email`}>Email</Label>
            <Input
              id={`${prefijo}-email`}
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              maxLength={200}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${prefijo}-domicilio`}>Domicilio</Label>
            <Input
              id={`${prefijo}-domicilio`}
              value={form.domicilio}
              onChange={(event) => onChange("domicilio", event.target.value)}
              maxLength={300}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-localidad`}>Localidad</Label>
            <Input
              id={`${prefijo}-localidad`}
              value={form.localidad}
              onChange={(event) => onChange("localidad", event.target.value)}
              maxLength={150}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefijo}-provincia`}>Provincia</Label>
            <Input
              id={`${prefijo}-provincia`}
              value={form.provincia}
              onChange={(event) => onChange("provincia", event.target.value)}
              maxLength={150}
              disabled={disabled}
            />
          </div>
        </div>
      </section>
    </>
  );
}
