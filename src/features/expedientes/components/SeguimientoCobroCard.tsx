"use client";

import { useState } from "react";
import { BellRing, HandCoins, Send } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  formatearFechaCobro,
  resumenAlertaCobro,
  TIPO_DOCUMENTO_COBRO_LABELS,
} from "../lib/cobro";
import type { ExpedienteDetalleResponse } from "../types/types";

import AlertaSeguimientoCobroDialog from "./AlertaSeguimientoCobroDialog";
import RegistrarEnvioCobroDialog from "./RegistrarEnvioCobroDialog";
import SeguimientoCobroEstado from "./SeguimientoCobroEstado";

function formatearFechaHora(value: string) {
  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fecha);
}

export default function SeguimientoCobroCard({
  expediente,
  disabled = false,
}: {
  expediente: ExpedienteDetalleResponse;
  disabled?: boolean;
}) {
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [alertaOpen, setAlertaOpen] = useState(false);

  const envio = expediente.envioCobro ?? null;

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <HandCoins className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Seguimiento de cobro</h2>
        </div>

        {envio && (
          <Link
            href="/cobro"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Ver listado de cobro
          </Link>
        )}
      </header>

      {envio ? (
        <div className="space-y-5 p-5">
          <dl className="grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Documento enviado
              </dt>
              <dd className="mt-1 text-sm leading-6">
                {TIPO_DOCUMENTO_COBRO_LABELS[envio.tipoDocumento] ??
                  envio.tipoDocumento}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Fecha de envío
              </dt>
              <dd className="mt-1 text-sm leading-6">
                {formatearFechaCobro(envio.fechaEnvio)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Seguimiento (120 días hábiles)
              </dt>
              <dd className="mt-1">
                <SeguimientoCobroEstado envio={envio} />
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Registrado el {formatearFechaHora(envio.fechaRegistro)}
              {envio.usuarioRegistro ? ` por ${envio.usuarioRegistro}` : ""}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAlertaOpen(true)}
            >
              <BellRing />
              Ver alerta
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {expediente.activo
              ? "Todavía no se registró el envío de una cédula u oficio de cobro."
              : "Sin envío de cobro registrado. No se puede registrar en un expediente dado de baja."}
          </p>

          {expediente.activo && (
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              disabled={disabled}
              onClick={() => setRegistrarOpen(true)}
            >
              <Send />
              Registrar envío
            </Button>
          )}
        </div>
      )}

      {registrarOpen && (
        <RegistrarEnvioCobroDialog
          expediente={expediente}
          onClose={() => setRegistrarOpen(false)}
        />
      )}

      {alertaOpen && envio && (
        <AlertaSeguimientoCobroDialog
          entrada={resumenAlertaCobro(envio, expediente)}
          onClose={() => setAlertaOpen(false)}
        />
      )}
    </section>
  );
}
