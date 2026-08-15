"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  RotateCcw,
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  }).format(date);
}

function EstadoUsuario({ activo }: { activo: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        activo
          ? "rounded-sm border-emerald-700/15 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
          : "rounded-sm bg-muted text-muted-foreground"
      }
    >
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  );
}

function RolBadge({ rol }: { rol: string }) {
  const esAdministrador = rol === "Administrador";

  return (
    <Badge
      variant="outline"
      className={
        esAdministrador
          ? "rounded-sm border-transparent bg-accent text-accent-foreground"
          : "rounded-sm border-transparent bg-secondary text-secondary-foreground"
      }
    >
      {rol}
    </Badge>
  );
}

function UsuariosSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/40 px-5 py-3">
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="divide-y px-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-4">
            <Skeleton className="size-9 shrink-0 rounded-md" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>

            <Skeleton className="hidden h-6 w-24 sm:block" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
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

  const hayFiltros = busqueda.trim().length > 0 || incluirInactivos;

  const limpiarFiltros = () => {
    setBusqueda("");
    setIncluirInactivos(false);
  };

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
      <section className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
            Administración
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Usuarios
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Gestioná las cuentas y los permisos de acceso al sistema.
          </p>
        </div>

        <Button onClick={() => setNuevoUsuarioOpen(true)}>
          <UserPlus />
          Nuevo usuario
        </Button>
      </section>

      <section
        aria-label="Filtros de usuarios"
        className="rounded-lg border bg-card p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busqueda}
              className="h-10 bg-background pl-9"
              placeholder="Buscar por nombre, correo o rol..."
              aria-label="Buscar usuarios"
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <label className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm">
            <input
              type="checkbox"
              checked={incluirInactivos}
              className="size-4 rounded border-input accent-primary"
              onChange={(event) => setIncluirInactivos(event.target.checked)}
            />
            Incluir inactivos
          </label>

          {hayFiltros && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 text-muted-foreground"
              onClick={limpiarFiltros}
            >
              <RotateCcw />
              Limpiar
            </Button>
          )}
        </div>
      </section>

      {usuariosQuery.isError ? (
        <section className="flex flex-col items-center rounded-lg border border-destructive/30 bg-card px-6 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </span>

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
        <section className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UserRound className="size-5" />
          </span>

          <h2 className="mt-4 font-semibold">No se encontraron usuarios</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Probá modificando o limpiando los filtros aplicados.
          </p>

          {hayFiltros && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={limpiarFiltros}
            >
              <RotateCcw />
              Limpiar filtros
            </Button>
          )}
        </section>
      ) : (
        <>
          <section aria-label="Resultados de usuarios">
            <div className="grid gap-3 md:hidden">
              {usuariosVisibles.map((usuario) => {
                const esUsuarioActual = usuario.usuarioId === usuarioActualId;
                const esAdministrador = usuario.roles.includes("Administrador");

                const Icon = esAdministrador ? ShieldCheck : UserRound;

                return (
                  <article
                    key={usuario.usuarioId}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={
                          esAdministrador
                            ? "flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
                            : "flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground"
                        }
                      >
                        <Icon className="size-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{usuario.nombre}</p>

                          {esUsuarioActual && (
                            <Badge
                              variant="outline"
                              className="rounded-sm bg-primary/10 text-primary"
                            >
                              Tu cuenta
                            </Badge>
                          )}
                        </div>

                        <p className="mt-1 break-all text-sm text-muted-foreground">
                          {usuario.email}
                        </p>
                      </div>

                      <EstadoUsuario activo={usuario.activo} />
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t pt-4">
                      <div className="flex flex-wrap gap-2">
                        {usuario.roles.map((rol) => (
                          <RolBadge key={rol} rol={rol} />
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Creado el {formatearFecha(usuario.fechaCreacion)}
                        </p>

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
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Usuario</th>
                      <th className="px-5 py-3 font-medium">Rol</th>
                      <th className="px-5 py-3 font-medium">Creación</th>
                      <th className="px-5 py-3 font-medium">Estado</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {usuariosVisibles.map((usuario) => {
                      const esUsuarioActual =
                        usuario.usuarioId === usuarioActualId;

                      const esAdministrador =
                        usuario.roles.includes("Administrador");

                      const Icon = esAdministrador ? ShieldCheck : UserRound;

                      return (
                        <tr
                          key={usuario.usuarioId}
                          className="transition-colors hover:bg-secondary/20"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={
                                  esAdministrador
                                    ? "flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
                                    : "flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground"
                                }
                              >
                                <Icon className="size-4" />
                              </span>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 font-medium">
                                  {usuario.nombre}

                                  {esUsuarioActual && (
                                    <Badge
                                      variant="outline"
                                      className="rounded-sm bg-primary/10 text-primary"
                                    >
                                      Vos
                                    </Badge>
                                  )}
                                </div>

                                <div className="mt-1 max-w-72 truncate text-xs text-muted-foreground">
                                  {usuario.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {usuario.roles.map((rol) => (
                                <RolBadge key={rol} rol={rol} />
                              ))}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                            {formatearFecha(usuario.fechaCreacion)}
                          </td>

                          <td className="px-5 py-4">
                            <EstadoUsuario activo={usuario.activo} />
                          </td>

                          <td className="px-5 py-4 text-right">
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
          </section>

          <footer className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {usuariosVisibles.length === 1
                ? "1 usuario visible"
                : `${usuariosVisibles.length} usuarios visibles`}
            </p>
          </footer>
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
          <DialogHeader className="text-left">
            <DialogTitle>
              {usuarioSeleccionado?.activo
                ? "¿Dar de baja el usuario?"
                : "¿Restaurar el usuario?"}
            </DialogTitle>

            <DialogDescription className="leading-6">
              {usuarioSeleccionado?.activo
                ? "La cuenta perderá inmediatamente el acceso y sus sesiones actuales quedarán invalidadas."
                : "La cuenta podrá volver a iniciar sesión en el sistema."}
            </DialogDescription>
          </DialogHeader>

          {usuarioSeleccionado && (
            <div className="flex items-start gap-3 rounded-lg border bg-secondary/20 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <UserRound className="size-4" />
              </span>

              <div className="min-w-0">
                <p className="font-medium">{usuarioSeleccionado.nombre}</p>

                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {usuarioSeleccionado.email}
                </p>
              </div>
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

          <footer className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
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
