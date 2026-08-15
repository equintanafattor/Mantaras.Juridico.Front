"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Files,
  Landmark,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthProvider";

const funcionalidades = [
  {
    titulo: "Clientes y casos",
    descripcion: "Información jurídica centralizada y organizada.",
    icon: BriefcaseBusiness,
  },
  {
    titulo: "Expedientes",
    descripcion: "Seguimiento de actuaciones y relaciones procesales.",
    icon: Files,
  },
  {
    titulo: "Acceso protegido",
    descripcion: "Gestión segura para los integrantes del estudio.",
    icon: ShieldCheck,
  },
];

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
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.75fr)]">
      <section className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-primary-foreground/20"
        />

        <header className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Landmark className="size-5" />
          </span>

          <div>
            <p className="font-semibold tracking-tight">Mántaras Jurídico</p>

            <p className="mt-0.5 text-xs text-primary-foreground/65">
              Gestión del estudio
            </p>
          </div>
        </header>

        <div className="relative max-w-xl">
          <p className="text-sm font-medium text-primary-foreground/65">
            Sistema de gestión jurídica
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            La información del estudio, clara y en un solo lugar.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/70">
            Administrá clientes, casos y expedientes desde una herramienta
            diseñada para acompañar el trabajo cotidiano del estudio.
          </p>

          <div className="mt-10 grid gap-5">
            {funcionalidades.map((funcionalidad) => {
              const Icon = funcionalidad.icon;

              return (
                <div
                  key={funcionalidad.titulo}
                  className="flex items-start gap-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary-foreground/15 bg-primary-foreground/5">
                    <Icon className="size-4" />
                  </span>

                  <div>
                    <p className="text-sm font-medium">
                      {funcionalidad.titulo}
                    </p>

                    <p className="mt-1 text-sm text-primary-foreground/60">
                      {funcionalidad.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="relative text-xs text-primary-foreground/50">
          Uso exclusivo del Estudio Jurídico Mántaras
        </footer>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8 lg:max-w-sm lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <header>
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <Landmark className="size-5" />
            </span>

            <p className="mt-5 text-sm font-medium text-primary lg:mt-0">
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
            Sistema de gestión del Estudio Jurídico Mántaras
          </p>
        </div>
      </section>
    </main>
  );
}
