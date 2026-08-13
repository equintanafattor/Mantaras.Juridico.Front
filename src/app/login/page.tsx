"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
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
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <section className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
          <header className="text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Landmark className="size-6" />
            </span>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight">
              Mántaras Jurídico
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Ingresá con tu cuenta para acceder al sistema.
            </p>
          </header>

          <form className="mt-8 space-y-5" onSubmit={enviar}>
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
                  placeholder="nombre@correo.com"
                  className="pl-9"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  disabled={isPending}
                  required
                  autoComplete="current-password"
                  placeholder="Ingresá tu contraseña"
                  className="pl-9"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

                <p className="text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !email.trim() || !password}
            >
              {isPending && <Loader2 className="animate-spin" />}

              {isPending ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>
        </section>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Sistema de gestión del Estudio Jurídico Mántaras
        </p>
      </div>
    </main>
  );
}
