import type { AuthSession } from "../types/types";

const AUTH_SESSION_KEY = "mantaras.auth.session";

export const AUTH_UNAUTHORIZED_EVENT = "mantaras.auth.unauthorized";

export function obtenerSesion(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const serializedSession = window.sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!serializedSession) {
    return null;
  }

  try {
    const session = JSON.parse(serializedSession) as AuthSession;
    const expirationTime = Date.parse(session.expiraEnUtc);

    if (
      !session.accessToken ||
      !Number.isFinite(expirationTime) ||
      expirationTime <= Date.now()
    ) {
      eliminarSesion();
      return null;
    }

    return session;
  } catch {
    eliminarSesion();
    return null;
  }
}

export function guardarSesion(session: AuthSession) {
  window.sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function eliminarSesion() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function obtenerAccessToken() {
  return obtenerSesion()?.accessToken ?? null;
}

export function notificarSesionNoAutorizada() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}