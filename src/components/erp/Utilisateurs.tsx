import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
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
import {
  MODULES_DROITS,
  useAdmin,
  type RoleUtilisateur,
  type Utilisateur,
} from "@/store/admin-store";
import { FilterInput, PageHeader, Pagination, Panel, StatusPill } from "./ui-bits";
import { cn } from "@/lib/utils";

const ROLES: RoleUtilisateur[] = ["Administrateur", "Paramétreur", "Agent Métier"];

const DEFAULT_DROITS: Record<RoleUtilisateur, string[]> = {
  Administrateur: [...MODULES_DROITS],
  Paramétreur: [
    "Paramétrage des Interventions",
    "Organismes",
    "Règles de Conformité IA",
    "Pages de Garde",
  ],
  "Agent Métier": ["Dossiers d'Intervention"],
};

type Form = {
  id: string | null;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  active: boolean;
  droits: string[];
};

const empty: Form = {
  id: null,
  nom: "",
  email: "",
  role: "Agent Métier",
  active: true,
  droits: DEFAULT_DROITS["Agent Métier"],
};

const roleTone = (r: RoleUtilisateur) =>
  r === "Administrateur" ? "violet" : r === "Paramétreur" ? "cyan" : "blue";

export function Utilisateurs() {
  const ad = useAdmin();
  const [filters, setFilters] = useState({ nom: "", email: "", role: "" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(() => {
    const has = (v: string, s: string) => v.toLowerCase().includes(s.trim().toLowerCase());
    return ad.utilisateurs.filter(
      (u) => has(u.nom, filters.nom) && has(u.email, filters.email) && has(u.role, filters.role),
    );
  }, [ad.utilisateurs, filters]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const edit = (u: Utilisateur) => {
    setForm({
      id: u.id,
      nom: u.nom,
      email: u.email,
      role: u.role,
      active: u.active,
      droits: u.droits,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.nom.trim() || !form.email.trim()) {
      toast.error("Nom et e-mail requis");
      return;
    }
    const { id, ...payload } = form;
    if (id) {
      ad.updateUtilisateur(id, payload);
      toast.success("Utilisateur mis à jour");
    } else {
      ad.addUtilisateur(payload);
      toast.success("Utilisateur créé");
    }
    setOpen(false);
    setForm(empty);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={<Users className="size-5" />}
        title="Utilisateurs & Rôles"
        subtitle="Comptes, rôles et droits d'accès par module de l'ERP"
        action={
          <Button
            className="rounded-xl"
            onClick={() => {
              setForm(empty);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Ajouter un utilisateur
          </Button>
        }
      />

      <Panel
        title="Comptes utilisateurs"
        subtitle={`${ad.utilisateurs.filter((u) => u.active).length} comptes actifs sur ${ad.utilisateurs.length}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-3 pb-1 font-medium">Nom complet</th>
                <th className="px-3 pb-1 font-medium">E-mail</th>
                <th className="px-3 pb-1 font-medium">Rôle</th>
                <th className="px-3 pb-1 font-medium">Modules autorisés</th>
                <th className="px-3 pb-1 font-medium">Dernière connexion</th>
                <th className="px-3 pb-1 font-medium">Statut</th>
                <th className="px-3 pb-1 text-right font-medium">Actions</th>
              </tr>
              <tr>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.nom}
                    onChange={(v) => setFilters((f) => ({ ...f, nom: v }))}
                    placeholder="Nom…"
                  />
                </th>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.email}
                    onChange={(v) => setFilters((f) => ({ ...f, email: v }))}
                    placeholder="E-mail…"
                  />
                </th>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.role}
                    onChange={(v) => setFilters((f) => ({ ...f, role: v }))}
                    placeholder="Rôle…"
                  />
                </th>
                <th className="px-3 pb-2" />
                <th className="px-3 pb-2" />
                <th className="px-3 pb-2" />
                <th className="px-3 pb-2" />
              </tr>
            </thead>
            <tbody>
              {paged.map((u) => (
                <tr key={u.id} className="glass-soft [&>td]:transition-colors hover:[&>td]:bg-primary/5">
                  <td className="rounded-l-xl px-3 py-3 font-medium">{u.nom}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-3">
                    <StatusPill tone={roleTone(u.role)}>{u.role}</StatusPill>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-muted-foreground">
                    {u.droits.length === MODULES_DROITS.length
                      ? "Tous les modules"
                      : `${u.droits.length} module(s)`}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{u.lastLogin}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <Switch
                        checked={u.active}
                        onCheckedChange={(v) => {
                          ad.updateUtilisateur(u.id, { active: v });
                          toast.success(v ? "Compte activé" : "Compte désactivé");
                        }}
                      />
                      <span
                        className={cn(
                          "text-[11px]",
                          u.active ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {u.active ? "Actif" : "Inactif"}
                      </span>
                    </span>
                  </td>
                  <td className="rounded-r-xl px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        title="Modifier"
                        onClick={() => edit(u)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:bg-destructive/15"
                        title="Supprimer"
                        onClick={() => {
                          ad.removeUtilisateur(u.id);
                          toast.success("Utilisateur supprimé");
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
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun utilisateur ne correspond aux filtres.
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
        <DialogContent className="glass max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Nom complet
                <Input
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                E-mail professionnel
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1"
                />
              </label>
            </div>
            <label className="text-xs text-muted-foreground">
              Rôle
              <select
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value as RoleUtilisateur;
                  setForm((f) => ({ ...f, role, droits: DEFAULT_DROITS[role] }));
                }}
                className="glass-soft mt-1 h-10 w-full rounded-xl px-3 text-sm text-foreground outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-popover">
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Droits d'accès par module</p>
              <div className="flex flex-col gap-2">
                {MODULES_DROITS.map((m) => {
                  const on = form.droits.includes(m);
                  return (
                    <div
                      key={m}
                      className="glass-soft flex items-center justify-between rounded-xl px-3 py-2"
                    >
                      <span className="text-xs">{m}</span>
                      <Switch
                        checked={on}
                        onCheckedChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            droits: v ? [...f.droits, m] : f.droits.filter((x) => x !== m),
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Compte actif</span>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="rounded-xl" onClick={submit}>
              {form.id ? "Enregistrer" : "Créer l'utilisateur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
