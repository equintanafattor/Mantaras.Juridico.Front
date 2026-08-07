"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Files,
  Home,
  Landmark,
  Menu,
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

export default function AppShell({ children }: AppShellProps) {
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

        <div className="border-t p-4 text-xs text-muted-foreground">
          Sistema de gestión jurídica
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
              </SheetContent>
            </Sheet>

            <span className="font-semibold sm:hidden">Mántaras Jurídico</span>
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            Estudio Jurídico Mántaras
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
