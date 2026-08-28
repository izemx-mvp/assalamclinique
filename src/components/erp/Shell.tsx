import { useState } from "react";
import {
  Activity,
  ChevronDown,
  FolderHeart,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Stethoscope,
  FileStack,
} from "lucide-react";
import { Parametrage } from "./Parametrage";
import { Dossiers } from "./Dossiers";
import { DossiersGlobal } from "./DossiersGlobal";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

type View = "parametrage" | "dossiers" | "dossiers-global";

export function Shell() {
  const [open, setOpen] = useState(true);
  const [group, setGroup] = useState(true);
  const [view, setView] = useState<View>("parametrage");

  const items = [
    { id: "parametrage" as const, label: "Paramétrage des Interventions", Icon: SlidersHorizontal },
    { id: "dossiers" as const, label: "Dossiers d'Intervention", Icon: Stethoscope },
    { id: "dossiers-global" as const, label: "DOSSIERS D'INTERVENTION", Icon: FileStack },
  ];

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "glass sticky top-0 hidden h-screen shrink-0 flex-col p-3 transition-all duration-300 md:flex",
          open ? "w-72" : "w-20",
        )}
      >
        <div className="mb-6 flex items-center gap-3 px-2 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent glow-ring">
            <Activity className="size-5" />
          </span>
          {open && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">CLINIQUE ASSALAM ERP</p>
              <p className="truncate text-[11px] text-muted-foreground">Clinique · Santé</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setGroup((g) => !g)}
          className="glass-soft flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
        >
          <FolderHeart className="size-4 shrink-0 text-accent" />
          {open && <span className="flex-1 text-left">AI Interventions</span>}
          {open && (
            <ChevronDown className={cn("size-4 transition-transform", group && "rotate-180")} />
          )}
        </button>

        {group && (
          <nav className="mt-2 flex flex-col gap-1.5">
            {items.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                title={label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                  open && "ml-3",
                  view === id
                    ? "glass glow-ring text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {open && <span className="truncate">{label}</span>}
              </button>
            ))}
          </nav>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <ThemeToggle showLabel={open} />
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            {open && "Réduire"}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 md:hidden">
          <div className="flex flex-wrap gap-2">
            {items.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "glass-soft rounded-xl px-3 py-2 text-xs",
                  view === id && "glow-ring text-accent",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
        {view === "parametrage" ? (
          <Parametrage />
        ) : view === "dossiers" ? (
          <Dossiers />
        ) : (
          <DossiersGlobal />
        )}
      </main>
    </div>
  );
}
