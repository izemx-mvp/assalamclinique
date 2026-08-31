import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdmin, type OrgType, type Organisme } from "@/store/admin-store";
import { useErp } from "@/store/erp-store";
import { FilterInput, PageHeader, Pagination, Panel } from "./ui-bits";
import { cn } from "@/lib/utils";

const TYPES: OrgType[] = ["Public", "Mutuelle d'entreprise", "Privée"];

type Form = { id: string | null; name: string; type: OrgType; active: boolean };
const empty: Form = { id: null, name: "", type: "Public", active: true };

export function Organismes() {
  const ad = useAdmin();
  const dossiers = useErp((s) => s.dossiers);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [filters, setFilters] = useState({ code: "", name: "", type: "" });
  const [form, setForm] = useState<Form>(empty);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Organisme | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const used = useMemo(() => new Set(dossiers.map((d) => d.org)), [dossiers]);

  const rows = useMemo(() => {
    const has = (v: string, s: string) => v.toLowerCase().includes(s.trim().toLowerCase());
    return ad.organismes.filter(
      (o) =>
        (has(o.name, q) || has(o.code, q)) &&
        has(o.code, filters.code) &&
        has(o.name, filters.name) &&
        has(o.type, filters.type) &&
        (statut === "" || (statut === "actif" ? o.active : !o.active)),
    );
  }, [ad.organismes, q, statut, filters]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Le nom de l'organisme est requis");
      return;
    }
    if (form.id) {
      ad.updateOrganisme(form.id, { name: form.name.trim(), type: form.type, active: form.active });
      toast.success("Organisme modifié");
    } else {
      ad.addOrganisme({ name: form.name.trim(), type: form.type, active: form.active });
      toast.success("Organisme ajouté");
    }
    setOpen(false);
    setForm(empty);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={<Building2 className="size-5" />}
        title="Organismes"
        subtitle="Référentiel dynamique des tiers payeurs : mutuelles, caisses et assurances"
        action={
          <Button
            className="rounded-xl"
            onClick={() => {
              setForm(empty);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Ajouter un organisme
          </Button>
        }
      />

      <Panel
        title="Catalogue des organismes"
        subtitle={`${ad.organismes.length} organismes référencés`}
        action={
          <div className="flex items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="glass-soft h-9 w-48 rounded-xl border-0 text-xs"
            />
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="glass-soft h-9 rounded-xl px-3 text-xs text-foreground outline-none"
            >
              <option value="" className="bg-popover">
                Tous
              </option>
              <option value="actif" className="bg-popover">
                Actif
              </option>
              <option value="inactif" className="bg-popover">
                Inactif
              </option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-3 pb-1 font-medium">ID</th>
                <th className="px-3 pb-1 font-medium">Nom de l'organisme</th>
                <th className="px-3 pb-1 font-medium">Type / Catégorie</th>
                <th className="px-3 pb-1 font-medium">Créé le</th>
                <th className="px-3 pb-1 font-medium">Statut</th>
                <th className="px-3 pb-1 text-right font-medium">Actions</th>
              </tr>
              <tr>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.code}
                    onChange={(v) => setFilters((f) => ({ ...f, code: v }))}
                    placeholder="ID…"
                  />
                </th>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.name}
                    onChange={(v) => setFilters((f) => ({ ...f, name: v }))}
                    placeholder="Nom…"
                  />
                </th>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.type}
                    onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
                    placeholder="Type…"
                  />
                </th>
                <th className="px-3 pb-2" />
                <th className="px-3 pb-2" />
                <th className="px-3 pb-2" />
              </tr>
            </thead>
            <tbody>
              {paged.map((o) => (
                <tr key={o.id} className="glass-soft [&>td]:transition-colors hover:[&>td]:bg-primary/5">
                  <td className="rounded-l-xl px-3 py-3 font-mono text-xs text-accent">{o.code}</td>
                  <td className="px-3 py-3 font-medium">{o.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{o.type}</td>
                  <td className="px-3 py-3 text-muted-foreground">{o.createdAt}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <Switch
                        checked={o.active}
                        onCheckedChange={(v) => {
                          ad.updateOrganisme(o.id, { active: v });
                          toast.success(v ? "Organisme activé" : "Organisme désactivé");
                        }}
                      />
                      <span
                        className={cn(
                          "text-[11px]",
                          o.active ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {o.active ? "Actif" : "Inactif"}
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
                        onClick={() => {
                          setForm({ id: o.id, name: o.name, type: o.type, active: o.active });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:bg-destructive/15"
                        title={
                          used.has(o.id)
                            ? "Utilisé par un dossier en cours"
                            : "Archiver / supprimer"
                        }
                        disabled={used.has(o.id)}
                        onClick={() => setToDelete(o)}
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
                    Aucun organisme ne correspond aux filtres.
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
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier l'organisme" : "Nouvel organisme"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="text-xs text-muted-foreground">
              Nom de l'organisme
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex : CNSS"
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Type / Catégorie
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as OrgType }))}
                className="glass-soft mt-1 h-10 w-full rounded-xl px-3 text-sm text-foreground outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t} className="bg-popover">
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center justify-between rounded-xl px-1">
              <span className="text-xs text-muted-foreground">Statut actif</span>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="rounded-xl" onClick={submit}>
              {form.id ? "Enregistrer" : "Ajouter l'organisme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {toDelete?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'organisme sera retiré du référentiel et détaché des interventions associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) ad.removeOrganisme(toDelete.id);
                setToDelete(null);
                toast.success("Organisme supprimé");
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
