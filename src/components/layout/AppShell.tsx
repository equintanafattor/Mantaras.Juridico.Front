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
  UserRound,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: UsersRound,
  },
  {
    href: "/casos",
    label: "Casos",
    icon: BriefcaseBusiness,
  },
  {
    href: "/expedientes",
    label: "Expedientes",
    icon: Files,
  },
];

function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;

        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Landmark className="size-5" />
      </span>

      <span className="flex flex-col">
        <span className="font-semibold leading-tight">Mántaras Jurídico</span>

        <span className="text-xs text-muted-foreground">
          Gestión del estudio
        </span>
      </span>
    </Link>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
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
    }
  }, [isLoginPage, isReady, router, session]);

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

  if (!session) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>

        <Separator />

        <div className="flex-1 p-4">
          <Navigation />
        </div>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <UserRound className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {session.usuario.nombre}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {session.usuario.email}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={salir}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
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

              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>
                    <Brand />
                  </SheetTitle>

                  <SheetDescription>
                    Navegación principal del sistema
                  </SheetDescription>
                </SheetHeader>

                <Separator />

                <div className="px-4">
                  <Navigation />
                </div>

                <div className="mt-auto border-t p-4">
                  <p className="truncate text-sm font-medium">
                    {session.usuario.nombre}
                  </p>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {session.usuario.email}
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={salir}
                  >
                    <LogOut />
                    Cerrar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <span className="font-semibold sm:hidden">Mántaras Jurídico</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.usuario.nombre}
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

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
