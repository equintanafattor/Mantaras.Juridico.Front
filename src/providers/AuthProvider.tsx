"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { iniciarSesion as solicitarInicioSesion } from "@/features/autenticacion/api/authApi";
import {
  AUTH_UNAUTHORIZED_EVENT,
  eliminarSesion,
  guardarSesion,
  obtenerSnapshotSesion,
  obtenerSnapshotSesionServidor,
  suscribirSesion,
} from "@/features/autenticacion/lib/authSession";
import type {
  AuthSession,
  IniciarSesionRequest,
} from "@/features/autenticacion/types/types";

type AuthContextValue = {
  session: AuthSession | null;
  isReady: boolean;
  iniciarSesion: (request: IniciarSesionRequest) => Promise<void>;
  cerrarSesion: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const serializedSession = useSyncExternalStore(
    suscribirSesion,
    obtenerSnapshotSesion,
    obtenerSnapshotSesionServidor,
  );
  const isReady = serializedSession !== undefined;
  const session = useMemo<AuthSession | null>(
    () => serializedSession ? JSON.parse(serializedSession) as AuthSession : null,
    [serializedSession],
  );

  const cerrarSesion = useCallback(() => {
    queryClient.clear();
    eliminarSesion();
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, cerrarSesion);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, cerrarSesion);
    };
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (request: IniciarSesionRequest) => {
    const response = await solicitarInicioSesion(request);
    queryClient.clear();
    guardarSesion(response);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isReady, iniciarSesion, cerrarSesion }),
    [session, isReady, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }
  return context;
}
