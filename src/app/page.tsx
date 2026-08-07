import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Files, UsersRound } from "lucide-react";

const modules = [
  {
    href: "/clientes",
    title: "Clientes",
    description:
      "Registrar personas, consultar sus datos y acceder a sus casos relacionados.",
    icon: UsersRound,
  },
  {
    href: "/casos",
    title: "Casos",
    description:
      "Gestionar las necesidades jurídicas y su avance dentro del estudio.",
    icon: BriefcaseBusiness,
  },
  {
    href: "/expedientes",
    title: "Expedientes",
    description:
      "Consultar expedientes judiciales, relaciones y datos procesales.",
    icon: Files,
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section>
        <p className="text-sm font-medium text-primary">Panel principal</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Gestión del estudio jurídico
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Accedé a la información de clientes, casos y expedientes desde un
          único lugar.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.href}
              href={module.href}
              className="group flex min-h-52 flex-col rounded-xl border bg-background p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>

              <h2 className="mt-5 text-lg font-semibold">{module.title}</h2>

              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                {module.description}
              </p>

              <span className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                Ingresar
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
