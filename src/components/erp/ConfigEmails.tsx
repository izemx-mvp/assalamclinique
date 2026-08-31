import { useRef, useState } from "react";
import { Inbox, Mail, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  EMAIL_VARIABLES,
  scenarioKey,
  useAdmin,
  type EmailIssue,
  type EmailPhase,
} from "@/store/admin-store";
import { PageHeader, Panel, StatusPill } from "./ui-bits";
import { cn } from "@/lib/utils";

const FREQUENCES = [
  "Temps réel",
  "Toutes les 5 minutes",
  "Toutes les 15 minutes",
  "Toutes les heures",
];

const PHASES: { key: EmailPhase; label: string }[] = [
  { key: "PEC", label: "Phase 1 — Prise en charge (PEC)" },
  { key: "EXPEDITION", label: "Phase 2 — Expédition du dossier" },
];

const ISSUES: { key: EmailIssue; label: string; tone: string }[] = [
  { key: "ok", label: "🟢 Dossier conforme", tone: "text-success" },
  { key: "ko", label: "🔴 Dossier non conforme", tone: "text-destructive" },
  { key: "verif", label: "🟠 Dossier à vérifier", tone: "text-amber-400" },
];

export function ConfigEmails() {
  const ad = useAdmin();
  const [phase, setPhase] = useState<EmailPhase>("PEC");
  const [issue, setIssue] = useState<EmailIssue>("ok");
  const key = scenarioKey(phase, issue);
  const sc = ad.emails.scenarios[key];
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertVar = (v: string) => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? sc.body.length;
    const end = el?.selectionEnd ?? start;
    ad.updateScenario(key, { body: sc.body.slice(0, start) + v + sc.body.slice(end) });
    toast.success(`Variable ${v} insérée`);
  };


  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={<Mail className="size-5" />}
        title="Configuration E-mails"
        subtitle="Boîte d'ingestion des dossiers et modèles de transmission automatique"
      />

      <Panel
        title="Boîte d'ingestion des dossiers"
        subtitle="Adresse surveillée pour la réception automatique des pièces scannées"
        action={
          <StatusPill tone={ad.emails.inboxActive ? "green" : "gray"}>
            {ad.emails.inboxActive ? "Surveillance active" : "Surveillance suspendue"}
          </StatusPill>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-xs text-muted-foreground md:col-span-2">
            Adresse e-mail de réception
            <div className="mt-1 flex items-center gap-2">
              <span className="glass-soft grid size-10 shrink-0 place-items-center rounded-xl text-accent">
                <Inbox className="size-4" />
              </span>
              <Input
                value={ad.emails.inboxAddress}
                onChange={(e) => ad.updateEmails({ inboxAddress: e.target.value })}
              />
            </div>
          </label>
          <label className="text-xs text-muted-foreground">
            Fréquence de relève
            <select
              value={ad.emails.frequency}
              onChange={(e) => ad.updateEmails({ frequency: e.target.value })}
              className="glass-soft mt-1 h-10 w-full rounded-xl px-3 text-sm text-foreground outline-none"
            >
              {FREQUENCES.map((f) => (
                <option key={f} value={f} className="bg-popover">
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="glass-soft mt-4 flex items-center justify-between rounded-xl px-4 py-3">
          <div>
            <p className="text-xs font-medium">Ingestion automatique des pièces jointes</p>
            <p className="text-[11px] text-muted-foreground">
              Les PDF reçus créent un dossier en brouillon et déclenchent l'audit IA
            </p>
          </div>
          <Switch
            checked={ad.emails.inboxActive}
            onCheckedChange={(v) => {
              ad.updateEmails({ inboxActive: v });
              toast.success(v ? "Ingestion activée" : "Ingestion suspendue");
            }}
          />
        </div>
      </Panel>

      <Panel
        title="Modèles de transmission"
        subtitle="Deux niveaux : phase du workflow (PEC / Expédition) puis issue du contrôle IA"
        action={
          <Button
            className="rounded-xl"
            onClick={() => toast.success("Modèle e-mail enregistré")}
          >
            <Save className="size-4" /> Enregistrer le modèle
          </Button>
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => setPhase(p.key)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-medium transition-all",
                phase === p.key
                  ? "glow-ring bg-primary text-primary-foreground"
                  : "glass-soft text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2 border-t border-border pt-3">
          {ISSUES.map((s) => (
            <button
              key={s.key}
              onClick={() => setIssue(s.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                issue === s.key
                  ? cn("glass glow-ring", s.tone)
                  : "glass-soft text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>


        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <label className="text-xs text-muted-foreground">
              Destinataires (séparés par des virgules)
              <Input
                value={sc.to.join(", ")}
                onChange={(e) =>
                  ad.updateScenario(key, {
                    to: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Objet
              <Input
                value={sc.subject}
                onChange={(e) => ad.updateScenario(key, { subject: e.target.value })}
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Corps du message
              <Textarea
                ref={bodyRef}
                value={sc.body}
                onChange={(e) => ad.updateScenario(key, { body: e.target.value })}
                rows={12}
                className="mt-1 text-sm"
              />
            </label>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Variables disponibles (cliquer pour insérer)
              </p>
              <div className="flex flex-wrap gap-2">
                {EMAIL_VARIABLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertVar(v)}
                    className="glass-soft rounded-full px-3 py-1.5 font-mono text-[11px] text-accent transition-all hover:bg-primary/15"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-soft flex flex-col gap-3 rounded-xl p-4">
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Aperçu de l'e-mail
            </p>
            <div className="rounded-xl bg-background/50 p-4 text-xs">
              <p className="text-muted-foreground">
                À : <span className="text-foreground">{sc.to.join(", ") || "—"}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Objet : <span className="font-medium text-foreground">{sc.subject}</span>
              </p>
              <hr className="my-3 border-border" />
              <pre className="font-sans text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                {sc.body}
              </pre>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => toast.success("E-mail de test envoyé")}
            >
              <Send className="size-4" /> Envoyer un test
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
