import { useMemo, useState } from "react";
import { BrainCircuit, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdmin, type Portee, type RegleIA, type Severite } from "@/store/admin-store";
import { useErp } from "@/store/erp-store";
import { PageHeader, Pagination, Panel, StatusPill } from "./ui-bits";
import { cn } from "@/lib/utils";

const PORTEES: { id: Portee; label: string }[] = [
  { id: "global", label: "Global" },
  { id: "specialite", label: "Par spécialité" },
  { id: "intervention", label: "Par intervention" },
];

type Form = {
  id: string | null;
  prompt: string;
  severite: Severite;
  portee: Portee;
  active: boolean;
  interventions: string[];
};

const empty: Form = {
  id: null,
  prompt: "",
  severite: "bloquant",
  portee: "global",
  active: true,
  interventions: [],
};

export function ReglesIA() {
  const ad = useAdmin();
  const interventions = useErp((s) => s.interventions);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("");
  const [portee, setPortee] = useState("");
  const [form, setForm] = useState<Form>(empty);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(
    () =>
      ad.regles.filter(
        (r) =>
          (r.prompt.toLowerCase().includes(q.trim().toLowerCase()) ||
            r.code.toLowerCase().includes(q.trim().toLowerCase())) &&
          (sev === "" || r.severite === sev) &&
          (portee === "" || r.portee === portee),
      ),
    [ad.regles, q, sev, portee],
  );
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const edit = (r: RegleIA) => {
    setForm({
      id: r.id,
      prompt: r.prompt,
      severite: r.severite,
      portee: r.portee,
      active: r.active,
      interventions: r.interventions,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.prompt.trim()) {
      toast.error("La consigne métier est requise");
      return;
    }
    const { id, ...payload } = form;
    if (id) {
      ad.updateRegle(id, { ...payload, prompt: payload.prompt.trim() });
      toast.success("Règle modifiée");
    } else {
      ad.addRegle({ ...payload, prompt: payload.prompt.trim() });
      toast.success("Règle métier ajoutée");
    }
    setOpen(false);
    setForm(empty);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={<BrainCircuit className="size-5" />}
        title="Règles de Conformité IA"
        subtitle="Consignes en langage naturel lues comme directives par le moteur d'audit"
        action={
          <Button
            className="rounded-xl"
            onClick={() => {
              setForm(empty);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Ajouter une règle métier
          </Button>
        }
      />

      <Panel
        title="Catalogue des règles"
        subtitle={`${ad.regles.filter((r) => r.active).length} règles actives sur ${ad.regles.length}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une consigne…"
              className="glass-soft h-9 w-56 rounded-xl border-0 text-xs"
            />
            <select
              value={sev}
              onChange={(e) => setSev(e.target.value)}
              className="glass-soft h-9 rounded-xl px-3 text-xs text-foreground outline-none"
            >
              <option value="" className="bg-popover">
                Toute sévérité
              </option>
              <option value="bloquant" className="bg-popover">
                Bloquant
              </option>
              <option value="avertissement" className="bg-popover">
                Non bloquant
              </option>
            </select>
            <select
              value={portee}
              onChange={(e) => setPortee(e.target.value)}
              className="glass-soft h-9 rounded-xl px-3 text-xs text-foreground outline-none"
            >
              <option value="" className="bg-popover">
                Toute portée
              </option>
              {PORTEES.map((p) => (
                <option key={p.id} value={p.id} className="bg-popover">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-3 pb-2 font-medium">Code règle</th>
                <th className="px-3 pb-2 font-medium">Consigne métier / Prompt IA</th>
                <th className="px-3 pb-2 font-medium">Portée</th>
                <th className="px-3 pb-2 font-medium">Sévérité</th>
                <th className="px-3 pb-2 font-medium">Statut</th>
                <th className="px-3 pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="glass-soft [&>td]:transition-colors hover:[&>td]:bg-primary/5">
                  <td className="rounded-l-xl px-3 py-3 align-top font-mono text-xs text-accent">
                    {r.code}
                  </td>
                  <td className="max-w-[420px] px-3 py-3 align-top text-[13px] leading-relaxed">
                    {r.prompt}
                    {r.interventions.length > 0 && (
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        Interventions :{" "}
                        {r.interventions
                          .map((id) => interventions.find((i) => i.id === id)?.name ?? id)
                          .join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <StatusPill tone="blue">
                      {PORTEES.find((p) => p.id === r.portee)?.label}
                    </StatusPill>
                  </td>
                  <td className="px-3 py-3 align-top">
                    {r.severite === "bloquant" ? (
                      <StatusPill tone="red">Bloquant</StatusPill>
                    ) : (
                      <StatusPill tone="orange">Avertissement</StatusPill>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className="flex items-center gap-2">
                      <Switch
                        checked={r.active}
                        onCheckedChange={(v) => {
                          ad.updateRegle(r.id, { active: v });
                          toast.success(v ? "Règle activée" : "Règle désactivée");
                        }}
                      />
                      <span
                        className={cn(
                          "text-[11px]",
                          r.active ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {r.active ? "Actif" : "Inactif"}
                      </span>
                    </span>
                  </td>
                  <td className="rounded-r-xl px-3 py-3 text-right align-top">
                    <span className="inline-flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        title="Éditer"
                        onClick={() => edit(r)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        title="Dupliquer"
                        onClick={() => {
                          ad.duplicateRegle(r.id);
                          toast.success("Règle dupliquée");
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:bg-destructive/15"
                        title="Supprimer"
                        onClick={() => {
                          ad.removeRegle(r.id);
                          toast.success("Règle supprimée");
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Aucune règle ne correspond aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={rows.length}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier la règle" : "Nouvelle règle métier"}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
            <label className="text-xs text-muted-foreground">
              Consigne métier / Prompt IA
              <Textarea
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                rows={5}
                placeholder="Ex : Contrôler la validité de la date d'expiration de la CIN…"
                className="mt-1 text-sm"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Sévérité
                <select
                  value={form.severite}
                  onChange={(e) => setForm((f) => ({ ...f, severite: e.target.value as Severite }))}
                  className="glass-soft mt-1 h-10 w-full rounded-xl px-3 text-sm text-foreground outline-none"
                >
                  <option value="bloquant" className="bg-popover">
                    Bloquant (Non conforme)
                  </option>
                  <option value="avertissement" className="bg-popover">
                    Avertissement (À vérifier)
                  </option>
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Portée
                <select
                  value={form.portee}
                  onChange={(e) => setForm((f) => ({ ...f, portee: e.target.value as Portee }))}
                  className="glass-soft mt-1 h-10 w-full rounded-xl px-3 text-sm text-foreground outline-none"
                >
                  {PORTEES.map((p) => (
                    <option key={p.id} value={p.id} className="bg-popover">
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Association optionnelle à des interventions
              </p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {interventions.map((i) => {
                  const on = form.interventions.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          interventions: on
                            ? f.interventions.filter((x) => x !== i.id)
                            : [...f.interventions, i.id],
                        }))
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[11px] transition-all",
                        on
                          ? "glow-ring bg-primary text-primary-foreground"
                          : "glass-soft text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {i.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Règle active</span>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="rounded-xl" onClick={submit}>
              {form.id ? "Enregistrer" : "Créer la règle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
