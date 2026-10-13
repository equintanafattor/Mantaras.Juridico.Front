"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  Circle,
  Eye,
  EyeOff,
  Info,
  Loader2,
  ShieldCheck,
  UserPen,
  UserPlus,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarSesion } from "@/features/autenticacion/lib/authSession";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

import { useCrearUsuario } from "../hooks/useCrearUsuario";
import { useEditarUsuario } from "../hooks/useEditarUsuario";
import type { RolUsuario, UsuarioResponse } from "../types/types";

type UsuarioFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Si se informa, el diálogo edita ese usuario; si no, crea uno nuevo.
  usuario?: UsuarioResponse | null;
};

type UsuarioFormState = {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
};

const FORM_INICIAL: UsuarioFormState = {
  nombre: "",
  email: "",
  password: "",
  rol: "Usuario",
};

function obtenerFormInicial(
  usuario: UsuarioResponse | null | undefined,
): UsuarioFormState {
  if (!usuario) {
    return FORM_INICIAL;
  }

  return {
    nombre: usuario.nombre,
    email: usuario.email,
    password: "",
    rol: usuario.roles[0] ?? "Usuario",
  };
}

function passwordValida(password: string) {
  return (
    password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function RequisitoPassword({
  cumple,
  children,
}: {
  cumple: boolean;
  children: string;
}) {
  const Icon = cumple ? Check : Circle;

  return (
    <li
      className={cn(
        "flex items-center gap-2 text-xs transition-colors",
        cumple ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {children}
    </li>
  );
}

export default function UsuarioFormDialog({
  open,
  onOpenChange,
  usuario = null,
}: UsuarioFormDialogProps) {
  const { session, cerrarSesion } = useAuth();

  const [form, setForm] = useState<UsuarioFormState>(() =>
    obtenerFormInicial(usuario),
  );
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const crearUsuarioMutation = useCrearUsuario();
  const editarUsuarioMutation = useEditarUsuario();

  const esEdicion = usuario !== null;
  const mutation = esEdicion ? editarUsuarioMutation : crearUsuarioMutation;

  const esUsuarioActual =
    usuario !== null && usuario.usuarioId === session?.usuario.usuarioId;

  // En edición la contraseña es opcional: vacía conserva la actual.
  const passwordRequerida = !esEdicion || form.password.length > 0;

  // Cambiar email, rol o contraseña invalida el token del usuario editado.
  const invalidaSesion =
    usuario !== null &&
    (form.email.trim() !== usuario.email ||
      form.rol !== (usuario.roles[0] ?? "Usuario") ||
      form.password.length > 0);

  const formularioValido =
    form.nombre.trim().length > 0 &&
    emailValido(form.email) &&
    (!passwordRequerida || passwordValida(form.password));

  const requisitosPassword = {
    longitud: form.password.length >= 10,
    minuscula: /[a-z]/.test(form.password),
    mayuscula: /[A-Z]/.test(form.password),
    numero: /\d/.test(form.password),
    simbolo: /[^a-zA-Z0-9]/.test(form.password),
  };

  const actualizarCampo = <K extends keyof UsuarioFormState>(
    campo: K,
    value: UsuarioFormState[K],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [campo]: value,
    }));

    if (mutation.isError || mutation.isSuccess) {
      mutation.reset();
    }
  };

  const limpiarFormulario = () => {
    setForm(obtenerFormInicial(usuario));
    setMostrarPassword(false);
    mutation.reset();
  };

  const cambiarApertura = (nextOpen: boolean) => {
    if (!nextOpen && mutation.isPending) {
      return;
    }

    onOpenChange(nextOpen);

    if (!nextOpen) {
      limpiarFormulario();
    }
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formularioValido) {
      return;
    }

    try {
      if (usuario) {
        const usuarioActualizado = await editarUsuarioMutation.mutateAsync({
          usuarioId: usuario.usuarioId,
          request: {
            nombre: form.nombre.trim(),
            email: form.email.trim(),
            rol: form.rol,
            password: form.password || null,
          },
        });

        if (esUsuarioActual && session) {
          if (invalidaSesion) {
            // El token actual dejó de ser válido: hay que volver al login.
            cerrarSesion();
            return;
          }

          guardarSesion({
            ...session,
            usuario: {
              ...session.usuario,
              nombre: usuarioActualizado.nombre,
            },
          });
        }
      } else {
        await crearUsuarioMutation.mutateAsync({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          rol: form.rol,
        });
      }

      onOpenChange(false);
      limpiarFormulario();
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  const HeaderIcon = esEdicion ? UserPen : UserPlus;

  return (
    <Dialog open={open} onOpenChange={cambiarApertura} disablePointerDismissal>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b bg-card px-5 py-4 pr-12 text-left sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
              <HeaderIcon className="size-4" />
            </span>

            <div>
              <DialogTitle>
                {esEdicion ? "Editar usuario" : "Nuevo usuario"}
              </DialogTitle>

              <DialogDescription className="mt-1">
                {esEdicion
                  ? "Modificá los datos de la cuenta y sus permisos."
                  : "Creá una cuenta y definí sus permisos iniciales."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={guardar}>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario-nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="usuario-nombre"
                  value={form.nombre}
                  disabled={mutation.isPending}
                  maxLength={150}
                  autoComplete="name"
                  placeholder="Nombre y apellido"
                  required
                  onChange={(event) =>
                    actualizarCampo("nombre", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usuario-email">
                  Correo electrónico <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="usuario-email"
                  type="email"
                  value={form.email}
                  disabled={mutation.isPending}
                  maxLength={256}
                  autoComplete="email"
                  placeholder="usuario@ejemplo.com"
                  required
                  onChange={(event) =>
                    actualizarCampo("email", event.target.value)
                  }
                />
              </div>
            </section>

            <section className="space-y-3 border-t pt-5">
              <div>
                <Label htmlFor="usuario-password">
                  {esEdicion ? "Nueva contraseña" : "Contraseña"}{" "}
                  {!esEdicion && <span className="text-destructive">*</span>}
                </Label>

                <p className="mt-1 text-xs text-muted-foreground">
                  {esEdicion
                    ? "Opcional. Dejala en blanco para no cambiarla."
                    : "Definí una contraseña segura para el primer acceso."}
                </p>
              </div>

              <div className="relative">
                <Input
                  id="usuario-password"
                  type={mostrarPassword ? "text" : "password"}
                  value={form.password}
                  disabled={mutation.isPending}
                  maxLength={200}
                  autoComplete="new-password"
                  className="pr-11"
                  required={!esEdicion}
                  onChange={(event) =>
                    actualizarCampo("password", event.target.value)
                  }
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  disabled={mutation.isPending}
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

              {passwordRequerida && (
                <ul
                  aria-label="Requisitos de la contraseña"
                  className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2"
                >
                  <RequisitoPassword cumple={requisitosPassword.longitud}>
                    Al menos 10 caracteres
                  </RequisitoPassword>

                  <RequisitoPassword cumple={requisitosPassword.mayuscula}>
                    Una letra mayúscula
                  </RequisitoPassword>

                  <RequisitoPassword cumple={requisitosPassword.minuscula}>
                    Una letra minúscula
                  </RequisitoPassword>

                  <RequisitoPassword cumple={requisitosPassword.numero}>
                    Un número
                  </RequisitoPassword>

                  <RequisitoPassword cumple={requisitosPassword.simbolo}>
                    Un símbolo
                  </RequisitoPassword>
                </ul>
              )}
            </section>

            <section className="space-y-3 border-t pt-5">
              <div>
                <Label>
                  Rol <span className="text-destructive">*</span>
                </Label>

                <p className="mt-1 text-xs text-muted-foreground">
                  Determina las funciones administrativas disponibles.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={form.rol === "Usuario" ? "secondary" : "outline"}
                  className="h-auto justify-start px-4 py-3 text-left"
                  disabled={mutation.isPending}
                  aria-pressed={form.rol === "Usuario"}
                  onClick={() => actualizarCampo("rol", "Usuario")}
                >
                  <UserRound className="size-4 shrink-0" />

                  <span>
                    <span className="block font-medium">Usuario</span>

                    <span className="mt-1 block whitespace-normal text-xs font-normal text-muted-foreground">
                      Acceso a la gestión habitual del estudio.
                    </span>
                  </span>
                </Button>

                <Button
                  type="button"
                  variant={
                    form.rol === "Administrador" ? "secondary" : "outline"
                  }
                  className="h-auto justify-start px-4 py-3 text-left"
                  disabled={mutation.isPending}
                  aria-pressed={form.rol === "Administrador"}
                  onClick={() => actualizarCampo("rol", "Administrador")}
                >
                  <ShieldCheck className="size-4 shrink-0" />

                  <span>
                    <span className="block font-medium">Administrador</span>

                    <span className="mt-1 block whitespace-normal text-xs font-normal text-muted-foreground">
                      Puede crear y administrar otras cuentas.
                    </span>
                  </span>
                </Button>
              </div>
            </section>

            {invalidaSesion && (
              <div className="flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <p className="text-muted-foreground">
                  {esUsuarioActual
                    ? "Al guardar estos cambios se cerrará tu sesión y vas a tener que volver a ingresar."
                    : "Al guardar estos cambios se cerrará la sesión actual de este usuario."}
                </p>
              </div>
            )}

            {mutation.isError && (
              <div
                role="alert"
                className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

                <div>
                  <p className="font-medium text-destructive">
                    {esEdicion
                      ? "No pudimos guardar los cambios"
                      : "No pudimos crear el usuario"}
                  </p>

                  <p className="mt-1 text-muted-foreground">
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : "Revisá los datos e intentá nuevamente."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t bg-card px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => cambiarApertura(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={mutation.isPending || !formularioValido}
            >
              {mutation.isPending && <Loader2 className="animate-spin" />}

              {esEdicion
                ? mutation.isPending
                  ? "Guardando..."
                  : "Guardar cambios"
                : mutation.isPending
                  ? "Creando..."
                  : "Crear usuario"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
