"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { iniciarSesion as solicitarInicioSesion } from "@/features/autenticacion/api/authApi";
import {
  AUTH_UNAUTHORIZED_EVENT,
  eliminarSesion,
  guardarSesion,
  obtenerSesion,
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

  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(obtenerSesion());
    setIsReady(true);
  }, []);

  useEffect(() => {
    const manejarSesionNoAutorizada = () => {
      eliminarSesion();
      setSession(null);
      queryClient.clear();
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, manejarSesionNoAutorizada);

    return () => {
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        manejarSesionNoAutorizada,
      );
    };
  }, [queryClient]);

  const iniciarSesion = async (request: IniciarSesionRequest) => {
    const response = await solicitarInicioSesion(request);

    guardarSesion(response);
    setSession(response);
    queryClient.clear();
  };

  const cerrarSesion = () => {
    eliminarSesion();
    setSession(null);
    queryClient.clear();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady,
      iniciarSesion,
      cerrarSesion,
    }),
    [session, isReady],
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
