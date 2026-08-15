"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Files,
  Home,
  Landmark,
  Loader2,
  LogOut,
  Menu,
  ShieldCheck,
  UserCog,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

type AppShellProps = {
  children: ReactNode;
};

const navigationItems = [
  {
    href: "/",
    label: "Inicio",
    icon: Home,
    adminOnly: false,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: UsersRound,
    adminOnly: false,
  },
  {
    href: "/casos",
    label: "Casos",
    icon: BriefcaseBusiness,
    adminOnly: false,
  },
  {
    href: "/expedientes",
    label: "Expedientes",
    icon: Files,
    adminOnly: false,
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: UserCog,
    adminOnly: true,
  },
];

function rutaActiva(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const itemsVisibles = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1">
      {itemsVisibles.map((item) => {
        const Icon = item.icon;
        const isActive = rutaActiva(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm before:absolute before:left-0 before:h-5 before:w-0.5 before:rounded-full before:bg-sidebar-primary"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
        <Landmark className="size-5" />
      </span>

      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
          Mántaras Jurídico
        </span>

        <span className="truncate text-xs text-sidebar-foreground/55">
          Gestión del estudio
        </span>
      </span>
    </Link>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">Cargando sesión...</p>
      </div>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { session, isReady, cerrarSesion } = useAuth();

  const isLoginPage = pathname === "/login";
  const isAdmin = session?.usuario.roles.includes("Administrador") ?? false;

  const isUnauthorizedAdminPage = pathname.startsWith("/usuarios") && !isAdmin;

  const currentNavigationItem = navigationItems.find((item) =>
    rutaActiva(pathname, item.href),
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session && !isLoginPage) {
      router.replace("/login");
      return;
    }

    if (session && isLoginPage) {
      router.replace("/");
      return;
    }

    if (session && isUnauthorizedAdminPage) {
      router.replace("/");
    }
  }, [isLoginPage, isReady, isUnauthorizedAdminPage, router, session]);

  const salir = () => {
    cerrarSesion();
    router.replace("/login");
  };

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (isLoginPage) {
    return session ? <LoadingScreen /> : children;
  }

  if (!session || isUnauthorizedAdminPage) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-[4.5rem] items-center px-5">
          <Brand />
        </div>

        <div className="h-px bg-sidebar-border" />

        <div className="flex-1 px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/35">
            Navegación
          </p>

          <Navigation isAdmin={isAdmin} />
        </div>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-sidebar-foreground">
              <UserRound className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {session.usuario.nombre}
              </p>

              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/50">
                {isAdmin && <ShieldCheck className="size-3" />}
                <span>{isAdmin ? "Administrador" : "Usuario"}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/60 hover:bg-white/10 hover:text-sidebar-foreground"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={salir}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center border-b bg-card/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Abrir menú de navegación"
                  />
                }
              >
                <Menu />
              </SheetTrigger>

              <SheetContent
                side="left"
                className="flex w-72 flex-col border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
              >
                <SheetHeader className="border-b border-sidebar-border p-5 text-left">
                  <SheetTitle>
                    <Brand />
                  </SheetTitle>

                  <SheetDescription className="sr-only">
                    Navegación principal del sistema
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 px-4 py-5">
                  <Navigation isAdmin={isAdmin} />
                </div>

                <div className="border-t border-sidebar-border p-4">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {session.usuario.nombre}
                  </p>

                  <p className="mt-1 truncate text-xs text-sidebar-foreground/50">
                    {session.usuario.email}
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full border-white/15 bg-white/5 text-sidebar-foreground hover:bg-white/10 hover:text-white"
                    onClick={salir}
                  >
                    <LogOut />
                    Cerrar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <span className="font-semibold tracking-tight sm:hidden">
              Mántaras Jurídico
            </span>
          </div>

          <div className="hidden lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Gestión
            </p>

            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {currentNavigationItem?.label ?? "Mántaras Jurídico"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-52 truncate text-sm font-medium">
                {session.usuario.nombre}
              </p>

              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Administrador" : "Usuario"}
              </p>
            </div>

            <span className="hidden size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground sm:flex lg:hidden">
              <UserRound className="size-4" />
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={salir}
            >
              <LogOut />
            </Button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
