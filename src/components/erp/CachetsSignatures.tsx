import { useMemo, useRef, useState } from "react";
import { Pencil, Plus, Stamp, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdmin, type Praticien } from "@/store/admin-store";
import { PageHeader, Panel, StatusPill } from "./ui-bits";
import { cn } from "@/lib/utils";

type Form = {
  id: string | null;
  nom: string;
  prenom: string;
  specialite: string;
  inpe: string;
  cachet: string | null;
  signature: string | null;
  active: boolean;
};

const empty: Form = {
  id: null,
  nom: "",
  prenom: "",
  specialite: "",
  inpe: "",
  cachet: null,
  signature: null,
  active: true,
};

function AssetSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="glass-soft flex flex-col gap-2 rounded-xl p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="grid h-24 place-items-center overflow-hidden rounded-lg bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:14px_14px]">
        {value ? (
          <img src={value} alt={label} className="max-h-24 object-contain" />
        ) : (
          <span className="text-[11px] text-muted-foreground">Aucun fichier</span>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => onChange(String(r.result));
          r.readAsDataURL(f);
        }}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 rounded-lg text-[11px]"
          onClick={() => ref.current?.click()}
        >
          <Upload className="size-3.5" /> Importer
        </Button>
        {value && (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg text-[11px] text-destructive"
            onClick={() => onChange(null)}
          >
            Retirer
          </Button>
        )}
      </div>
    </div>
  );
}

export function CachetsSignatures() {
  const ad = useAdmin();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const rows = useMemo(
    () =>
      ad.praticiens.filter((p) =>
        `${p.nom} ${p.prenom} ${p.specialite} ${p.inpe}`
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
      ),
    [ad.praticiens, q],
  );

  const edit = (p: Praticien) => {
    setForm({
      id: p.id,
      nom: p.nom,
      prenom: p.prenom,
      specialite: p.specialite,
      inpe: p.inpe,
      cachet: p.cachet,
      signature: p.signature,
      active: p.active,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast.error("Nom et prénom du praticien requis");
      return;
    }
    const { id, ...payload } = form;
    if (id) {
      ad.updatePraticien(id, payload);
      toast.success("Praticien mis à jour");
    } else {
      ad.addPraticien(payload);
      toast.success("Praticien ajouté à la bibliothèque");
    }
    setOpen(false);
    setForm(empty);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={<Stamp className="size-5" />}
        title="Cachets & Signatures"
        subtitle="Bibliothèque des praticiens : cachets et signatures apposés automatiquement"
        action={
          <Button
            className="rounded-xl"
            onClick={() => {
              setForm(empty);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Ajouter un praticien
          </Button>
        }
      />

      <Panel
        title="Bibliothèque des praticiens"
        subtitle={`${ad.praticiens.filter((p) => p.active).length} praticiens actifs sur ${ad.praticiens.length}`}
        action={
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un praticien…"
            className="glass-soft h-9 w-56 rounded-xl border-0 text-xs"
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <article key={p.id} className="glass-soft flex flex-col gap-3 rounded-2xl p-4">
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    Dr {p.prenom} {p.nom}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{p.specialite}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-accent">{p.inpe}</p>
                </div>
                <StatusPill tone={p.active ? "green" : "gray"}>
                  {p.active ? "Actif" : "Inactif"}
                </StatusPill>
              </header>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Cachet", v: p.cachet },
                  { label: "Signature", v: p.signature },
                ].map((a) => (
                  <div
                    key={a.label}
                    className="grid h-20 place-items-center rounded-xl bg-background/40 p-1"
                  >
                    {a.v ? (
                      <img src={a.v} alt={a.label} className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{a.label} manquant</span>
                    )}
                  </div>
                ))}
              </div>

              <footer className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-[10px] text-muted-foreground">
                  Dernier usage : {p.lastUsed}
                </span>
                <span className="flex items-center gap-1">
                  <Switch
                    checked={p.active}
                    onCheckedChange={(v) => ad.updatePraticien(p.id, { active: v })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    title="Modifier"
                    onClick={() => edit(p)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:bg-destructive/15"
                    title="Supprimer"
                    onClick={() => {
                      ad.removePraticien(p.id);
                      toast.success("Praticien supprimé");
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </span>
              </footer>
            </article>
          ))}
          {rows.length === 0 && (
            <p className={cn("col-span-full py-10 text-center text-sm text-muted-foreground")}>
              Aucun praticien ne correspond à la recherche.
            </p>
          )}
        </div>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier le praticien" : "Nouveau praticien"}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Nom
                <Input
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Prénom
                <Input
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Spécialité
                <Input
                  value={form.specialite}
                  onChange={(e) => setForm((f) => ({ ...f, specialite: e.target.value }))}
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                N° INPE
                <Input
                  value={form.inpe}
                  onChange={(e) => setForm((f) => ({ ...f, inpe: e.target.value }))
                  }
                  className="mt-1"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AssetSlot
                label="Cachet (PNG transparent)"
                value={form.cachet}
                onChange={(v) => setForm((f) => ({ ...f, cachet: v }))}
              />
              <AssetSlot
                label="Signature (PNG transparent)"
                value={form.signature}
                onChange={(v) => setForm((f) => ({ ...f, signature: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Praticien actif</span>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="rounded-xl" onClick={submit}>
              {form.id ? "Enregistrer" : "Ajouter le praticien"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
