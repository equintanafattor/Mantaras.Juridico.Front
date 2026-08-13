"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

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

import { useCrearUsuario } from "../hooks/useCrearUsuario";
import type { RolUsuario } from "../types/types";

type NuevoUsuarioDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function passwordValida(password: string) {
  return (
    password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

export default function NuevoUsuarioDialog({
  open,
  onOpenChange,
}: NuevoUsuarioDialogProps) {
  const [form, setForm] = useState<UsuarioFormState>(FORM_INICIAL);

  const [mostrarPassword, setMostrarPassword] = useState(false);

  const crearUsuarioMutation = useCrearUsuario();

  const formularioValido =
    form.nombre.trim().length > 0 &&
    form.email.trim().length > 0 &&
    passwordValida(form.password);

  const actualizarCampo = <K extends keyof UsuarioFormState>(
    campo: K,
    value: UsuarioFormState[K],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [campo]: value,
    }));

    if (crearUsuarioMutation.isError || crearUsuarioMutation.isSuccess) {
      crearUsuarioMutation.reset();
    }
  };

  const limpiarFormulario = () => {
    setForm(FORM_INICIAL);
    setMostrarPassword(false);
    crearUsuarioMutation.reset();
  };

  const cambiarApertura = (nextOpen: boolean) => {
    if (!nextOpen && crearUsuarioMutation.isPending) {
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
      await crearUsuarioMutation.mutateAsync({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: form.rol,
      });

      onOpenChange(false);
      limpiarFormulario();
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>

          <DialogDescription>
            Creá una cuenta y definí los permisos iniciales.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={guardar}>
          <div className="space-y-2">
            <Label htmlFor="usuario-nombre">
              Nombre <span className="text-destructive">*</span>
            </Label>

            <Input
              id="usuario-nombre"
              value={form.nombre}
              disabled={crearUsuarioMutation.isPending}
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
              disabled={crearUsuarioMutation.isPending}
              autoComplete="email"
              placeholder="usuario@ejemplo.com"
              required
              onChange={(event) => actualizarCampo("email", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usuario-password">
              Contraseña <span className="text-destructive">*</span>
            </Label>

            <div className="relative">
              <Input
                id="usuario-password"
                type={mostrarPassword ? "text" : "password"}
                value={form.password}
                disabled={crearUsuarioMutation.isPending}
                autoComplete="new-password"
                className="pr-10"
                required
                onChange={(event) =>
                  actualizarCampo("password", event.target.value)
                }
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                disabled={crearUsuarioMutation.isPending}
                aria-label={
                  mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setMostrarPassword((current) => !current)}
              >
                {mostrarPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Debe tener al menos 10 caracteres, una mayúscula, una minúscula,
              un número y un símbolo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usuario-rol">
              Rol <span className="text-destructive">*</span>
            </Label>

            <select
              id="usuario-rol"
              value={form.rol}
              disabled={crearUsuarioMutation.isPending}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) =>
                actualizarCampo("rol", event.target.value as RolUsuario)
              }
            >
              <option value="Usuario">Usuario</option>
              <option value="Administrador">Administrador</option>
            </select>

            <p className="text-xs text-muted-foreground">
              Los administradores pueden gestionar otras cuentas de usuario.
            </p>
          </div>

          {crearUsuarioMutation.isError && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <div>
                <p className="font-medium text-destructive">
                  No pudimos crear el usuario
                </p>

                <p className="mt-1 text-muted-foreground">
                  {crearUsuarioMutation.error instanceof Error
                    ? crearUsuarioMutation.error.message
                    : "Revisá los datos e intentá nuevamente."}
                </p>
              </div>
            </div>
          )}

          <footer className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={crearUsuarioMutation.isPending}
              onClick={() => cambiarApertura(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={crearUsuarioMutation.isPending || !formularioValido}
            >
              {crearUsuarioMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}

              {crearUsuarioMutation.isPending ? "Creando..." : "Crear usuario"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
