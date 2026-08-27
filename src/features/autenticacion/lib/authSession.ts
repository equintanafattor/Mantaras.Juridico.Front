import type { AuthSession } from "../types/types";

const AUTH_SESSION_KEY = "mantaras.auth.session";
const AUTH_SESSION_CHANGED_EVENT = "mantaras.auth.session-changed";

export const AUTH_UNAUTHORIZED_EVENT = "mantaras.auth.unauthorized";

function deserializarSesion(serializedSession: string | null): AuthSession | null {
  if (!serializedSession) return null;

  try {
    const session = JSON.parse(serializedSession) as AuthSession;
    const expirationTime = Date.parse(session.expiraEnUtc);

    if (
      !session.accessToken ||
      !Number.isFinite(expirationTime) ||
      expirationTime <= Date.now()
    ) return null;

    return session;
  } catch {
    return null;
  }
}

export function obtenerSesion(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const serializedSession = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  const session = deserializarSesion(serializedSession);
  if (serializedSession && !session) eliminarSesion();
  return session;
}

// El snapshot es un string estable, no un JSON.parse nuevo en cada lectura.
// No modifica storage ni emite eventos durante el render de React.
export function obtenerSnapshotSesion(): string | null {
  if (typeof window === "undefined") return null;

  const serializedSession = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  return deserializarSesion(serializedSession) ? serializedSession : null;
}

// undefined distingue "todavía hidratando" de "sin sesión" (null).
export function obtenerSnapshotSesionServidor(): undefined {
  return undefined;
}

export function suscribirSesion(onChange: () => void): () => void {
  const manejarStorage = (event: StorageEvent) => {
    if (
      event.storageArea === window.sessionStorage &&
      (event.key === AUTH_SESSION_KEY || event.key === null)
    ) onChange();
  };

  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onChange);
  window.addEventListener("storage", manejarStorage);
  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", manejarStorage);
  };
}

export function guardarSesion(session: AuthSession) {
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function eliminarSesion() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function obtenerAccessToken() {
  return obtenerSesion()?.accessToken ?? null;
}

export function notificarSesionNoAutorizada() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}
