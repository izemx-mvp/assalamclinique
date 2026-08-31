import { useState } from "react";
import {
  Activity,
  Building2,
  BrainCircuit,
  ChevronDown,
  FileSignature,
  FileStack,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  SlidersHorizontal,
  Stamp,
  Stethoscope,
  Send,
  Settings2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Parametrage } from "./Parametrage";
import { DossiersUnifie } from "./DossiersUnifie";
import { HistoriqueEnvoi } from "./HistoriqueEnvoi";
import { Organismes } from "./Organismes";
import { ReglesIA } from "./ReglesIA";
import { PagesGarde } from "./PagesGarde";
import { ConfigEmails } from "./ConfigEmails";
import { CachetsSignatures } from "./CachetsSignatures";
import { Utilisateurs } from "./Utilisateurs";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

type View =
  | "dossiers"
  | "historique"
  | "parametrage"
  | "organismes"
  | "regles-ia"
  | "pages-garde"
  | "emails"
  | "cachets"
  | "utilisateurs";

type Item = { id: View; label: string; Icon: LucideIcon };
type Group = { id: string; label: string; Icon: LucideIcon; items: Item[] };

const GROUPS: Group[] = [
  {
    id: "dossiers",
    label: "DOSSIERS & CONTRÔLE",
    Icon: FileStack,
    items: [
      { id: "dossiers", label: "Dossiers d'intervention", Icon: Stethoscope },
      { id: "historique", label: "Historique d'envoi", Icon: Send },
    ],
  },
  {
    id: "referentiels",
    label: "RÉFÉRENTIELS & CONFORMITÉ",
    Icon: ShieldCheck,
    items: [
      { id: "parametrage", label: "Paramétrage des interventions", Icon: SlidersHorizontal },
      { id: "organismes", label: "Organismes", Icon: Building2 },
      { id: "regles-ia", label: "Règles IA", Icon: BrainCircuit },
    ],
  },
  {
    id: "administration",
    label: "ADMINISTRATION",
    Icon: Settings2,
    items: [
      { id: "pages-garde", label: "Pages de Garde", Icon: FileSignature },
      { id: "emails", label: "E-mails", Icon: Mail },
      { id: "cachets", label: "Cachets & Signatures", Icon: Stamp },
      { id: "utilisateurs", label: "Utilisateurs", Icon: Users },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

export function Shell() {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<View>("dossiers");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    dossiers: true,
    referentiels: true,
    administration: true,
  });

  const screen = () => {
    switch (view) {
      case "dossiers":
        return <DossiersUnifie />;
      case "historique":
        return <HistoriqueEnvoi />;
      case "parametrage":
        return <Parametrage />;
      case "organismes":
        return <Organismes />;
      case "regles-ia":
        return <ReglesIA />;
      case "pages-garde":
        return <PagesGarde />;
      case "emails":
        return <ConfigEmails />;
      case "cachets":
        return <CachetsSignatures />;
      case "utilisateurs":
        return <Utilisateurs />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "glass sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto p-3 transition-all duration-300 md:flex",
          open ? "w-72" : "w-20",
        )}
      >
        <div className="mb-6 flex items-center gap-3 px-2 py-3">
          <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
            <Activity className="size-5" />
          </span>
          {open && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">CLINIQUE ASSALAM ERP</p>
              <p className="truncate text-[11px] text-muted-foreground">Clinique · Santé</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {GROUPS.map(({ id, label, Icon, items }) => (
            <div key={id}>
              <button
                onClick={() => setOpenGroups((g) => ({ ...g, [id]: !g[id] }))}
                title={label}
                className="glass-soft flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
              >
                <Icon className="size-4 shrink-0 text-accent" />
                {open && <span className="flex-1 text-left text-[13px]">{label}</span>}
                {open && (
                  <ChevronDown
                    className={cn("size-4 transition-transform", openGroups[id] && "rotate-180")}
                  />
                )}
              </button>

              {openGroups[id] && (
                <nav className="mt-1.5 flex flex-col gap-1">
                  {items.map(({ id: itemId, label: itemLabel, Icon: ItemIcon }) => (
                    <button
                      key={itemId}
                      onClick={() => setView(itemId)}
                      title={itemLabel}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition-all",
                        open && "ml-3",
                        view === itemId
                          ? "glass glow-ring text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <ItemIcon className="size-4 shrink-0" />
                      {open && <span className="truncate">{itemLabel}</span>}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4">
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
          <select
            value={view}
            onChange={(e) => setView(e.target.value as View)}
            className="glass-soft h-9 flex-1 rounded-xl px-3 text-xs text-foreground outline-none"
          >
            {ALL_ITEMS.map((i) => (
              <option key={i.id} value={i.id} className="bg-popover">
                {i.label}
              </option>
            ))}
          </select>
          <ThemeToggle />
        </div>
        {screen()}
      </main>
    </div>
  );
}
