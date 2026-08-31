import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  GripVertical,
  Pencil,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MODES, type Mode } from "@/lib/erp/catalog";
import { useAdmin } from "@/store/admin-store";
import { useErp, type Intervention } from "@/store/erp-store";
import { FilterInput, Pagination, Panel, Segmented } from "./ui-bits";
import { cn } from "@/lib/utils";

const SPECIALITES = [
  "Chirurgie viscérale",
  "Gynécologie-obstétrique",
  "Ophtalmologie",
  "Orthopédie",
  "ORL",
  "Cardiologie",
  "Urologie",
  "Générale",
];

type FormState = {
  id: string | null;
  name: string;
  specialite: string;
  defaultMode: Mode;
};

const emptyForm: FormState = {
  id: null,
  name: "",
  specialite: SPECIALITES[0]!,
  defaultMode: "PEC",
};

export function Parametrage() {
  const st = useErp();
  const [detail, setDetail] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [filters, setFilters] = useState({
    code: "",
    name: "",
    specialite: "",
    createdBy: "",
    statut: "",
  });
  const setFilter = (k: keyof typeof filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const orderedInterventions = useMemo(() => {
    const has = (v: string, q: string) => v.toLowerCase().includes(q.trim().toLowerCase());
    return [...st.interventions].reverse().filter(
      (i) =>
        has(i.code, filters.code) &&
        has(i.name, filters.name) &&
        has(i.specialite, filters.specialite) &&
        has(i.createdBy, filters.createdBy) &&
        (filters.statut === "" ||
          (filters.statut === "actives" ? i.active : !i.active)),
    );
  }, [st.interventions, filters]);
  const pages = Math.max(1, Math.ceil(orderedInterventions.length / pageSize));
  const safePage = Math.min(page, pages);
  const pagedInterventions = orderedInterventions.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (i: Intervention) => {
    setForm({ id: i.id, name: i.name, specialite: i.specialite, defaultMode: i.defaultMode });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Le nom de l'intervention est requis");
      return;
    }
    if (form.id) {
      st.updateIntervention(form.id, {
        name: form.name.trim(),
        specialite: form.specialite,
        defaultMode: form.defaultMode,
      });
      toast.success("Intervention modifiée");
    } else {
      const newId = st.addIntervention({
        name: form.name.trim(),
        specialite: form.specialite,
        defaultMode: form.defaultMode,
      });
      toast.success("Intervention créée");
      setFormOpen(false);
      setForm(emptyForm);
      setPage(1);
      st.setSel({ selProfil: newId, selMode: form.defaultMode });
      setDetail(newId);
      return;
    }
    setFormOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
            <SlidersHorizontal className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Paramétrage des Interventions</p>
            <p className="text-[11px] text-muted-foreground">
              Catalogue des interventions, référentiels de pièces et ordre strict
            </p>
          </div>
        </div>
        {detail ? (
          <Button variant="secondary" className="rounded-xl" onClick={() => setDetail(null)}>
            <ArrowLeft className="size-4" /> Retour à la liste
          </Button>
        ) : (
          <Button className="rounded-xl" onClick={openCreate}>
            <Plus className="size-4" /> Ajouter une intervention
          </Button>
        )}
      </div>

      {detail ? (
        <Referentiel interventionId={detail} />
      ) : (
        <Panel title="Interventions" subtitle="Cliquez sur une ligne pour configurer son référentiel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="px-3 pb-1 font-medium">ID</th>
                  <th className="px-3 pb-1 font-medium">Nom d'intervention</th>
                  <th className="px-3 pb-1 font-medium">Spécialité</th>
                  <th className="px-3 pb-1 font-medium">Créé le</th>
                  <th className="px-3 pb-1 font-medium">Créé par</th>
                  <th className="px-3 pb-1 font-medium">Statut</th>
                  <th className="px-3 pb-1 text-right font-medium">Actions</th>
                </tr>
                <tr>
                  <th className="px-3 pb-2">
                    <FilterInput
                      value={filters.code}
                      onChange={(v) => setFilter("code", v)}
                      placeholder="ID…"
                    />
                  </th>
                  <th className="px-3 pb-2">
                    <FilterInput
                      value={filters.name}
                      onChange={(v) => setFilter("name", v)}
                      placeholder="Nom…"
                    />
                  </th>
                  <th className="px-3 pb-2">
                    <FilterInput
                      value={filters.specialite}
                      onChange={(v) => setFilter("specialite", v)}
                      placeholder="Spécialité…"
                    />
                  </th>
                  <th className="px-3 pb-2" />
                  <th className="px-3 pb-2">
                    <FilterInput
                      value={filters.createdBy}
                      onChange={(v) => setFilter("createdBy", v)}
                      placeholder="Créé par…"
                    />
                  </th>
                  <th className="px-3 pb-2">
                    <select
                      value={filters.statut}
                      onChange={(e) => setFilter("statut", e.target.value)}
                      className="glass-soft h-8 w-full rounded-lg px-2 text-[11px] font-normal text-foreground normal-case outline-none"
                    >
                      <option value="" className="bg-popover">
                        Tous
                      </option>
                      <option value="actives" className="bg-popover">
                        Activées
                      </option>
                      <option value="inactives" className="bg-popover">
                        Désactivées
                      </option>
                    </select>
                  </th>
                  <th className="px-3 pb-2" />
                </tr>
              </thead>
              <tbody>
                {pagedInterventions.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => {
                      st.setSel({ selProfil: i.id, selMode: i.defaultMode });
                      setDetail(i.id);
                    }}
                    className="glass-soft cursor-pointer [&>td]:transition-colors hover:[&>td]:bg-primary/5"
                  >
                    <td className="rounded-l-xl px-3 py-3 font-mono text-xs text-accent">
                      {i.code}
                    </td>
                    <td className="px-3 py-3 font-medium">{i.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{i.specialite}</td>
                    <td className="px-3 py-3 text-muted-foreground">{i.createdAt}</td>
                    <td className="px-3 py-3 text-muted-foreground">{i.createdBy}</td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <span className="flex items-center gap-2">
                        <Switch
                          checked={i.active}
                          onCheckedChange={(v) => {
                            st.updateIntervention(i.id, { active: v });
                            toast.success(v ? "Intervention activée" : "Intervention désactivée");
                          }}
                        />
                        <span
                          className={cn(
                            "text-[11px]",
                            i.active ? "text-success" : "text-muted-foreground",
                          )}
                        >
                          {i.active ? "Activée" : "Désactivée"}
                        </span>
                      </span>
                    </td>
                    <td
                      className="rounded-r-xl px-3 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title="Modifier"
                          onClick={() => openEdit(i)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 hover:text-accent"
                          title="Dupliquer"
                          onClick={() => {
                            st.duplicateIntervention(i.id);
                            toast.success("Intervention dupliquée");
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
                            st.removeIntervention(i.id);
                            toast.success("Intervention supprimée");
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={orderedInterventions.length}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </Panel>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Modifier l'intervention" : "Nouvelle intervention"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="text-xs text-muted-foreground">
              Nom de l'intervention
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex : Cholécystite"
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Spécialité
              <select
                value={form.specialite}
                onChange={(e) => setForm((f) => ({ ...f, specialite: e.target.value }))}
                className="glass-soft mt-1 h-10 w-full rounded-xl px-3 text-sm text-foreground outline-none"
              >
                {SPECIALITES.map((s) => (
                  <option key={s} value={s} className="bg-popover">
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="rounded-xl" onClick={submit}>
              {form.id ? "Enregistrer" : "Créer l'intervention"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Referentiel({ interventionId }: { interventionId: string }) {
  const st = useErp();
  // Les actions du store agissent sur la sélection courante : on la garde alignée.
  useEffect(() => {
    if (st.selProfil !== interventionId) st.setSel({ selProfil: interventionId });
  }, [interventionId, st.selProfil]);
  // Toutes les pièces du référentiel restent visibles, même désactivées.
  const entries = useErp((s) => s.entries)(interventionId, st.selOrg, st.selMode);
  const dirty = useErp((s) => s.isDirty)(interventionId, st.selOrg, st.selMode);
  const intervention = st.interventions.find((i) => i.id === interventionId);
  const [newDoc, setNewDoc] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const ad = useAdmin();
  const actifs = ad.organismes.filter((o) => o.active);
  const associes = ad.orgsFor(interventionId);
  const orgsDispo = actifs.filter((o) => associes.includes(o.id));
  const orgsAbsents = actifs.filter((o) => !associes.includes(o.id));

  const pieceLabel = useMemo(
    () => Object.fromEntries(st.pieces.map((p) => [p.id, p.label])),
    [st.pieces],
  );


  return (
    <div className="w-full">
      <Panel
        title={intervention?.name ?? "Intervention"}
        subtitle={`${intervention?.code ?? ""} · ${intervention?.specialite ?? ""} — référentiel des pièces`}
        action={
          <Segmented
            value={st.selMode}
            onChange={(v) => st.setSel({ selMode: v as Mode })}
            options={MODES.map((m) => ({ value: m.id, label: m.label }))}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {orgsDispo.map((o) => (
            <span key={o.id} className="group relative inline-flex">
              <button
                onClick={() => st.setSel({ selOrg: o.id })}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                  st.selOrg === o.id
                    ? "glow-ring bg-primary text-primary-foreground"
                    : "glass-soft text-muted-foreground hover:text-foreground",
                )}
              >
                {o.name}
              </button>
              <button
                title="Détacher cet organisme de l'intervention"
                onClick={() => {
                  ad.detachOrg(interventionId, o.id);
                  if (st.selOrg === o.id) {
                    const next = orgsDispo.find((x) => x.id !== o.id);
                    if (next) st.setSel({ selOrg: next.id });
                  }
                }}
                className="absolute -top-1 -right-1 hidden size-4 place-items-center rounded-full bg-destructive text-[9px] text-destructive-foreground group-hover:grid"
              >
                ×
              </button>
            </span>
          ))}
          {orgsAbsents.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                ad.attachOrg(interventionId, e.target.value);
                st.setSel({ selOrg: e.target.value });
              }}
              className="glass-soft h-8 rounded-full px-3 text-xs text-muted-foreground outline-none"
            >
              <option value="" className="bg-popover">
                + Associer un organisme
              </option>
              {orgsAbsents.map((o) => (
                <option key={o.id} value={o.id} className="bg-popover">
                  {o.name}
                </option>
              ))}
            </select>
          )}
        </div>


        <div className="mt-5 flex flex-col gap-2">
          {entries.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucune pièce pour cette combinaison.
            </p>
          )}
          {entries.map((e, i) => (
            <div
              key={e.pieceId}
              draggable
              onDragStart={() => setDragId(e.pieceId)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (dragId) st.reorderActive(dragId, e.pieceId);
                setDragId(null);
              }}
              className={cn(
                "glass-soft flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                dragId === e.pieceId && "opacity-50",
              )}
            >
              <GripVertical className="size-4 cursor-grab text-muted-foreground" />
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/20 text-xs font-semibold text-accent">
                {i + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  !e.active && "text-muted-foreground line-through",
                )}
              >
                {pieceLabel[e.pieceId] ?? e.pieceId}
              </span>
              <Switch checked={e.active} onCheckedChange={() => st.togglePiece(e.pieceId)} />
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={i === 0}
                  onClick={() => st.moveActive(e.pieceId, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={i === entries.length - 1}
                  onClick={() => st.moveActive(e.pieceId, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:bg-destructive/15"
                  onClick={() => st.removeFromReferentiel(e.pieceId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Input
            value={newDoc}
            onChange={(e) => setNewDoc(e.target.value)}
            placeholder="Ajouter un document supplémentaire…"
            className="glass-soft h-10 flex-1 rounded-xl border-0 text-sm"
          />
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => {
              const label = newDoc.trim();
              if (!label) return;
              st.createPiece(label);
              setNewDoc("");
              toast.success("Document ajouté");
            }}
          >
            <Plus className="size-4" /> Ajouter
          </Button>
        </div>

        {dirty && (
          <div className="mt-6 flex items-center justify-center">
            <Button
              className="rounded-xl px-8"
              onClick={() => {
                st.saveOrder();
                toast.success("Référentiel enregistré et synchronisé");
              }}
            >
              <Save className="size-4" /> Enregistrer
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
