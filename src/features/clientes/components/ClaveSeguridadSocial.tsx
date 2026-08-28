"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/apiClient";

import { obtenerClaveSeguridadSocial } from "../api/claveSeguridadSocialApi";

type Props = {
  clienteId: number;
  disabled?: boolean;
};

type Accion = "mostrar" | "copiar";

type Aviso = {
  texto: string;
  error: boolean;
};

class ClaveNoInformadaError extends Error {}

function mensajeError(error: unknown): string {
  if (error instanceof ClaveNoInformadaError) {
    return "No hay una clave registrada para este cliente.";
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Tu sesión venció. Iniciá sesión nuevamente.";
    }

    if (error.status === 403) {
      return "No tenés permiso para consultar esta clave.";
    }

    if (error.status === 404) {
      return "El cliente ya no está disponible.";
    }

    return "No pudimos consultar la clave. Intentá nuevamente.";
  }

  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "El navegador no permitió copiar. Podés mostrar la clave y copiarla manualmente.";
  }

  return "No pudimos completar la operación. Intentá nuevamente.";
}

export default function ClaveSeguridadSocial(props: Props) {
  return <CampoClave key={props.clienteId} {...props} />;
}

function CampoClave({ clienteId, disabled = false }: Props) {
  const [clave, setClave] = useState<string | null>(null);
  const [sinClave, setSinClave] = useState(false);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const solicitud = useRef<AbortController | null>(null);

  const ocultar = useCallback(() => {
    solicitud.current?.abort();
    solicitud.current = null;

    setClave(null);
    setAccion(null);
    setAviso(null);
  }, []);

  useEffect(() => {
    const alCambiarVisibilidad = () => {
      if (document.hidden) ocultar();
    };

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("pagehide", ocultar);

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("pagehide", ocultar);

      solicitud.current?.abort();
      solicitud.current = null;
    };
  }, [ocultar]);

  useEffect(() => {
    if (clave === null) return;

    const timer = window.setTimeout(ocultar, 30_000);

    return () => window.clearTimeout(timer);
  }, [clave, ocultar]);

  const ejecutar = async (tipo: Accion) => {
    if (disabled || solicitud.current) return;

    if (tipo === "mostrar" && clave !== null) {
      ocultar();
      return;
    }

    setClave(null);
    setAviso(null);
    setSinClave(false);

    if (
      tipo === "copiar" &&
      (!window.isSecureContext || !navigator.clipboard)
    ) {
      setAviso({
        texto:
          "La copia requiere HTTPS o localhost. Podés mostrar la clave y copiarla manualmente.",
        error: true,
      });
      return;
    }

    const controller = new AbortController();
    solicitud.current = controller;
    setAccion(tipo);

    try {
      const texto = obtenerClaveSeguridadSocial(
        clienteId,
        controller.signal,
      ).then((value) => {
        if (controller.signal.aborted) {
          throw new DOMException("Cancelado", "AbortError");
        }

        if (value === null || value.length === 0) {
          throw new ClaveNoInformadaError();
        }

        return value;
      });

      if (tipo === "mostrar") {
        const value = await texto;

        if (solicitud.current === controller) {
          setClave(value);
        }
      } else {
        const escribir = async () => {
          if (
            typeof ClipboardItem !== "undefined" &&
            navigator.clipboard.write
          ) {
            // Inicia la escritura durante el clic.
            // El contenido se completa cuando responde la API.
            const contenido = texto.then(
              (value) => new Blob([value], { type: "text/plain" }),
            );

            // El navegador puede rechazar la escritura antes
            // de que termine la consulta.
            void contenido.catch(() => {});

            await navigator.clipboard.write([
              new ClipboardItem({ "text/plain": contenido }),
            ]);
          } else {
            await navigator.clipboard.writeText(await texto);
          }
        };

        await Promise.all([texto, escribir()]);

        if (solicitud.current === controller) {
          setAviso({
            texto: "Clave copiada al portapapeles.",
            error: false,
          });
        }
      }
    } catch (error) {
      if (solicitud.current === controller && !controller.signal.aborted) {
        setSinClave(error instanceof ClaveNoInformadaError);
        setAviso({
          texto: mensajeError(error),
          error: true,
        });
      }
    } finally {
      controller.abort();

      if (solicitud.current === controller) {
        solicitud.current = null;
        setAccion(null);
      }
    }
  };

  return (
    <div className="space-y-2 print:hidden">
      <label
        htmlFor={`clave-css-${clienteId}`}
        className="text-xs font-medium text-muted-foreground"
      >
        Clave de Seguridad Social
      </label>

      <div className="flex max-w-md items-center gap-2">
        <Input
          id={`clave-css-${clienteId}`}
          readOnly
          autoComplete="off"
          spellCheck={false}
          value={clave ?? (sinClave ? "No informada" : "••••••••")}
          aria-describedby={`clave-ayuda-${clienteId}`}
          className="font-mono"
        />

        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled || accion !== null}
          aria-label={clave === null ? "Mostrar clave" : "Ocultar clave"}
          title={clave === null ? "Mostrar clave" : "Ocultar clave"}
          aria-pressed={clave !== null}
          onClick={() => void ejecutar("mostrar")}
        >
          {accion === "mostrar" ? (
            <Loader2 className="animate-spin" />
          ) : clave === null ? (
            <Eye />
          ) : (
            <EyeOff />
          )}
        </Button>

        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled || accion !== null}
          aria-label="Copiar clave sin mostrarla"
          title="Copiar clave sin mostrarla"
          onClick={() => void ejecutar("copiar")}
        >
          {accion === "copiar" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Copy />
          )}
        </Button>
      </div>

      <p
        id={`clave-ayuda-${clienteId}`}
        className="text-xs text-muted-foreground"
      >
        Se consulta al mostrar o copiar. Si la mostrás, se ocultará a los 30
        segundos o al cambiar de pestaña.
      </p>

      {aviso && (
        <p
          role={aviso.error ? "alert" : "status"}
          className={`text-xs ${
            aviso.error ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
