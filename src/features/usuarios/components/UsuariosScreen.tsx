"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Search,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/AuthProvider";

import { useCambiarEstadoUsuario } from "../hooks/useCambiarEstadoUsuario";
import { useUsuarios } from "../hooks/useUsuarios";
import type { UsuarioResponse } from "../types/types";

import NuevoUsuarioDialog from "./NuevoUsuarioDialog";

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function UsuariosSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-background p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>

          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function UsuariosScreen() {
  const { session } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [nuevoUsuarioOpen, setNuevoUsuarioOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<UsuarioResponse | null>(null);

  const usuariosQuery = useUsuarios();
  const cambiarEstadoMutation = useCambiarEstadoUsuario();

  const usuarioActualId = session?.usuario.usuarioId ?? null;

  const usuariosVisibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();

    return (usuariosQuery.data ?? []).filter((usuario) => {
      if (!incluirInactivos && !usuario.activo) {
        return false;
      }

      if (!termino) {
        return true;
      }

      return (
        usuario.nombre.toLocaleLowerCase().includes(termino) ||
        usuario.email.toLocaleLowerCase().includes(termino) ||
        usuario.roles.some((rol) => rol.toLocaleLowerCase().includes(termino))
      );
    });
  }, [busqueda, incluirInactivos, usuariosQuery.data]);

  const seleccionarUsuario = (usuario: UsuarioResponse) => {
    cambiarEstadoMutation.reset();
    setUsuarioSeleccionado(usuario);
  };

  const cambiarAperturaConfirmacion = (open: boolean) => {
    if (!open && cambiarEstadoMutation.isPending) {
      return;
    }

    if (!open) {
      setUsuarioSeleccionado(null);
      cambiarEstadoMutation.reset();
    }
  };

  const confirmarCambioEstado = async () => {
    if (!usuarioSeleccionado) {
      return;
    }

    try {
      await cambiarEstadoMutation.mutateAsync({
        usuarioId: usuarioSeleccionado.usuarioId,
        activar: !usuarioSeleccionado.activo,
      });

      setUsuarioSeleccionado(null);
    } catch {
      // El error se muestra mediante la mutation.
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Administración</p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Usuarios
          </h1>

          <p className="mt-3 text-muted-foreground">
            Gestioná las cuentas y los permisos de acceso al sistema.
          </p>
        </div>

        <Button onClick={() => setNuevoUsuarioOpen(true)}>
          <UserPlus />
          Nuevo usuario
        </Button>
      </section>

      <section className="rounded-xl border bg-background p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              className="pl-9"
              placeholder="Buscar por nombre, correo o rol..."
              aria-label="Buscar usuarios"
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={incluirInactivos}
              className="size-4 rounded border-input accent-primary"
              onChange={(event) => setIncluirInactivos(event.target.checked)}
            />
            Incluir inactivos
          </label>
        </div>
      </section>

      {usuariosQuery.isError ? (
        <section className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
          <AlertCircle className="size-6 text-destructive" />

          <h2 className="mt-4 font-semibold">No pudimos cargar los usuarios</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {usuariosQuery.error instanceof Error
              ? usuariosQuery.error.message
              : "Ocurrió un error al consultar la información."}
          </p>

          <Button
            variant="outline"
            className="mt-5"
            onClick={() => usuariosQuery.refetch()}
          >
            Reintentar
          </Button>
        </section>
      ) : usuariosQuery.isLoading ? (
        <UsuariosSkeleton />
      ) : usuariosVisibles.length === 0 ? (
        <section className="flex flex-col items-center rounded-xl border bg-background px-6 py-14 text-center">
          <UserRound className="size-7 text-muted-foreground" />

          <h2 className="mt-4 font-semibold">No se encontraron usuarios</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Probá modificando la búsqueda o incluyendo cuentas inactivas.
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {usuariosVisibles.map((usuario) => {
              const esUsuarioActual = usuario.usuarioId === usuarioActualId;

              return (
                <article
                  key={usuario.usuarioId}
                  className="rounded-xl border bg-background p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {usuario.roles.includes("Administrador") ? (
                          <ShieldCheck className="size-4" />
                        ) : (
                          <UserRound className="size-4" />
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className="font-medium">{usuario.nombre}</p>

                        <p className="mt-1 break-all text-sm text-muted-foreground">
                          {usuario.email}
                        </p>
                      </div>
                    </div>

                    <Badge variant={usuario.activo ? "secondary" : "outline"}>
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div className="flex flex-wrap gap-2">
                      {usuario.roles.map((rol) => (
                        <Badge key={rol} variant="outline">
                          {rol}
                        </Badge>
                      ))}

                      {esUsuarioActual && (
                        <Badge variant="secondary">Tu cuenta</Badge>
                      )}
                    </div>

                    {!esUsuarioActual && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => seleccionarUsuario(usuario)}
                      >
                        {usuario.activo ? "Dar de baja" : "Restaurar"}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border bg-background shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Creación</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acción</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {usuariosVisibles.map((usuario) => {
                    const esUsuarioActual =
                      usuario.usuarioId === usuarioActualId;

                    return (
                      <tr key={usuario.usuarioId} className="hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              {usuario.roles.includes("Administrador") ? (
                                <ShieldCheck className="size-4" />
                              ) : (
                                <UserRound className="size-4" />
                              )}
                            </span>

                            <div>
                              <div className="flex items-center gap-2 font-medium">
                                {usuario.nombre}

                                {esUsuarioActual && (
                                  <Badge variant="secondary">Vos</Badge>
                                )}
                              </div>

                              <div className="mt-1 text-xs text-muted-foreground">
                                {usuario.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {usuario.roles.map((rol) => (
                              <Badge key={rol} variant="outline">
                                {rol}
                              </Badge>
                            ))}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatearFecha(usuario.fechaCreacion)}
                        </td>

                        <td className="px-4 py-4">
                          <Badge
                            variant={usuario.activo ? "secondary" : "outline"}
                          >
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>

                        <td className="px-4 py-4 text-right">
                          {esUsuarioActual ? (
                            <span className="text-xs text-muted-foreground">
                              Cuenta actual
                            </span>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => seleccionarUsuario(usuario)}
                            >
                              {usuario.activo ? "Dar de baja" : "Restaurar"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {usuariosVisibles.length === 1
              ? "1 usuario visible"
              : `${usuariosVisibles.length} usuarios visibles`}
          </p>
        </>
      )}

      <NuevoUsuarioDialog
        open={nuevoUsuarioOpen}
        onOpenChange={setNuevoUsuarioOpen}
      />

      <Dialog
        open={usuarioSeleccionado !== null}
        onOpenChange={cambiarAperturaConfirmacion}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {usuarioSeleccionado?.activo
                ? "¿Dar de baja el usuario?"
                : "¿Restaurar el usuario?"}
            </DialogTitle>

            <DialogDescription>
              {usuarioSeleccionado?.activo
                ? "La cuenta perderá inmediatamente el acceso y sus sesiones actuales quedarán invalidadas."
                : "La cuenta podrá volver a iniciar sesión en el sistema."}
            </DialogDescription>
          </DialogHeader>

          {usuarioSeleccionado && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium">{usuarioSeleccionado.nombre}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {usuarioSeleccionado.email}
              </p>
            </div>
          )}

          {cambiarEstadoMutation.isError && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <p className="text-muted-foreground">
                {cambiarEstadoMutation.error instanceof Error
                  ? cambiarEstadoMutation.error.message
                  : "No pudimos completar la operación."}
              </p>
            </div>
          )}

          <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={cambiarEstadoMutation.isPending}
              onClick={() => cambiarAperturaConfirmacion(false)}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant={usuarioSeleccionado?.activo ? "destructive" : "default"}
              disabled={cambiarEstadoMutation.isPending}
              onClick={confirmarCambioEstado}
            >
              {cambiarEstadoMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}

              {cambiarEstadoMutation.isPending
                ? "Procesando..."
                : usuarioSeleccionado?.activo
                  ? "Confirmar baja"
                  : "Confirmar restauración"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
