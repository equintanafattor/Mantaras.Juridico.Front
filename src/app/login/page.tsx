"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Landmark,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { iniciarSesion } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formularioValido = email.trim().length > 0 && password.length > 0;

  const actualizarEmail = (value: string) => {
    setEmail(value);

    if (error) {
      setError(null);
    }
  };

  const actualizarPassword = (value: string) => {
    setPassword(value);

    if (error) {
      setError(null);
    }
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formularioValido) {
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      await iniciarSesion({
        email: email.trim(),
        password,
      });

      router.replace("/");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "No pudimos iniciar sesión.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-16">
        <header className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Landmark className="size-5" />
          </span>

          <div>
            <p className="font-semibold tracking-tight">Mántaras Quintana</p>

            <p className="mt-0.5 text-xs text-primary-foreground/60">
              Estudio jurídico
            </p>
          </div>
        </header>

        <div className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/55">
            Sistema de gestión
          </p>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            La gestión del estudio, en un solo lugar.
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-primary-foreground/65">
            Clientes, casos y expedientes organizados para acompañar el trabajo
            cotidiano.
          </p>
        </div>

        <footer className="text-xs text-primary-foreground/45">
          Uso exclusivo del Estudio Mántaras Quintana
        </footer>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8 lg:max-w-sm lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <header>
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Landmark className="size-5" />
              </span>

              <div>
                <p className="font-semibold tracking-tight">
                  Mántaras Quintana
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Estudio jurídico
                </p>
              </div>
            </div>

            <p className="mt-8 text-sm font-medium text-primary lg:mt-0">
              Acceso al sistema
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Iniciar sesión
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ingresá tus credenciales para acceder a la gestión del estudio.
            </p>
          </header>

          <form className="mt-7 space-y-5" onSubmit={enviar}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  disabled={isPending}
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="nombre@correo.com"
                  className="h-11 pl-9"
                  onChange={(event) => actualizarEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="login-password"
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  disabled={isPending}
                  required
                  autoComplete="current-password"
                  placeholder="Ingresá tu contraseña"
                  className="h-11 px-9"
                  onChange={(event) => actualizarPassword(event.target.value)}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                  disabled={isPending}
                  aria-label={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  title={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  onClick={() =>
                    setMostrarPassword((currentValue) => !currentValue)
                  }
                >
                  {mostrarPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

                <div>
                  <p className="font-medium text-destructive">
                    No pudimos iniciar sesión
                  </p>

                  <p className="mt-1 text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isPending || !formularioValido}
            >
              {isPending && <Loader2 className="animate-spin" />}

              {isPending ? "Ingresando..." : "Ingresar al sistema"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
            Uso exclusivo del Estudio Mántaras Quintana
          </p>
        </div>
      </section>
    </main>
  );
}
