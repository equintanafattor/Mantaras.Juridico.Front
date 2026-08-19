"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ExpedienteFormState } from "./ExpedienteFormFields";

type ExpedienteDatosFormFieldsProps = {
  form: ExpedienteFormState;
  idPrefix?: string;
  disabled?: boolean;
  onChange: (form: ExpedienteFormState) => void;
};

export default function ExpedienteDatosFormFields({
  form,
  idPrefix = "expediente",
  disabled = false,
  onChange,
}: ExpedienteDatosFormFieldsProps) {
  const actualizarCampo = <K extends keyof ExpedienteFormState>(
    campo: K,
    value: ExpedienteFormState[K],
  ) => {
    onChange({
      ...form,
      [campo]: value,
    });
  };

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-numero`}>Número de expediente</Label>

        <Input
          id={`${idPrefix}-numero`}
          value={form.numeroExpediente}
          disabled={disabled}
          maxLength={100}
          placeholder="Ej.: FRO 012345/2026"
          onChange={(event) =>
            actualizarCampo("numeroExpediente", event.target.value)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-fecha-inicio`}>Fecha de inicio</Label>

        <Input
          id={`${idPrefix}-fecha-inicio`}
          type="date"
          value={form.fechaInicio}
          disabled={disabled}
          onChange={(event) =>
            actualizarCampo("fechaInicio", event.target.value)
          }
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-caratula`}>
          Carátula <span className="text-destructive">*</span>
        </Label>

        <Input
          id={`${idPrefix}-caratula`}
          value={form.caratula}
          disabled={disabled}
          maxLength={1000}
          required
          placeholder="Carátula completa del expediente"
          onChange={(event) => actualizarCampo("caratula", event.target.value)}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-juzgado`}>Juzgado</Label>

        <Input
          id={`${idPrefix}-juzgado`}
          value={form.juzgado}
          disabled={disabled}
          maxLength={500}
          placeholder="Juzgado o tribunal interviniente"
          onChange={(event) => actualizarCampo("juzgado", event.target.value)}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-estado-legal`}>Estado legal</Label>

        <Input
          id={`${idPrefix}-estado-legal`}
          value={form.estadoLegal}
          disabled={disabled}
          maxLength={200}
          placeholder="Ej.: Iniciado, en trámite, elevado a Cámara..."
          onChange={(event) =>
            actualizarCampo("estadoLegal", event.target.value)
          }
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-observaciones`}>Observaciones</Label>

        <Textarea
          id={`${idPrefix}-observaciones`}
          value={form.observaciones}
          disabled={disabled}
          maxLength={2000}
          rows={4}
          placeholder="Notas internas relevantes sobre el expediente..."
          className="resize-y"
          onChange={(event) =>
            actualizarCampo("observaciones", event.target.value)
          }
        />
      </div>
    </section>
  );
}
