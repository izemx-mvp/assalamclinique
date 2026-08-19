import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Plus,
  Save,
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
import { MODES, ORGANISMES, type Mode } from "@/lib/erp/catalog";
import { useErp } from "@/store/erp-store";
import { Panel, Segmented } from "./ui-bits";

export function Parametrage() {
  const st = useErp();
  const entries = useErp((s) => s.entries)(st.selProfil, st.selOrg, st.selMode);
  const pieceLabel = useMemo(
    () => Object.fromEntries(st.pieces.map((p) => [p.id, p.label])),
    [st.pieces],
  );
  const actives = entries.filter((e) => e.active);
  const [newProfil, setNewProfil] = useState("");
  const [profilOpen, setProfilOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [customDoc, setCustomDoc] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const available = st.pieces.filter((p) => !entries.some((e) => e.pieceId === p.id));

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
              Matrices de pièces, ordre strict et règles d'audit — synchronisés en temps réel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newProfil}
            onChange={(e) => setNewProfil(e.target.value)}
            placeholder="Nouvelle intervention…"
            className="glass-soft h-10 w-[220px] rounded-xl border-0 text-sm"
          />
          <Button
            className="rounded-xl"
            onClick={() => {
              if (!newProfil.trim()) return;
              st.addProfil(newProfil.trim());
              setNewProfil("");
              toast.success("Intervention créée");
            }}
          >
            <Plus className="size-4" /> Créer
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col gap-5">
        <Panel
          title="Profils d'intervention"

          subtitle="Sélectionnez le profil à configurer"
        >
          <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
            {st.profils.map((p) => (
              <div
                key={p.id}
                onClick={() => st.setSel({ selProfil: p.id })}
                className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all ${
                  st.selProfil === p.id
                    ? "glass glow-ring text-foreground"
                    : "glass-soft text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      st.duplicateProfil(p.id);
                      toast.success("Profil dupliqué");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:bg-destructive/15 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      st.removeProfil(p.id);
                      toast.success("Profil supprimé");
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        </Panel>

        <Panel
          title="Référentiel des pièces"
          subtitle="Activez (1) ou désactivez (0) les documents requis"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Organisme
              <select
                value={st.selOrg}
                onChange={(e) => st.setSel({ selOrg: e.target.value })}
                className="glass-soft mt-1 h-10 w-full rounded-xl px-3 text-sm text-foreground outline-none"
              >
                {ORGANISMES.map((o) => (
                  <option key={o.id} value={o.id} className="bg-popover">
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-xs text-muted-foreground">
              Mode
              <div className="mt-1">
                <Segmented
                  value={st.selMode}
                  onChange={(v) => st.setSel({ selMode: v as Mode })}
                  options={MODES.map((m) => ({ value: m.id, label: m.label }))}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
            {entries.map((e) => (
              <div
                key={e.pieceId}
                className="glass-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Switch
                    checked={e.active}
                    onCheckedChange={() => st.togglePiece(e.pieceId)}
                  />
                  <span
                    className={`truncate text-sm ${e.active ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {pieceLabel[e.pieceId] ?? e.pieceId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-xs ${
                      e.active
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {e.active ? 1 : 0}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:bg-destructive/15"
                    onClick={() => {
                      st.removeFromReferentiel(e.pieceId);
                      toast.success("Document supprimé du référentiel");
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Input
              value={customDoc}
              onChange={(e) => setCustomDoc(e.target.value)}
              placeholder="Document personnalisé…"
              className="glass-soft h-10 w-[220px] rounded-xl border-0 text-sm"
            />
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                const label = customDoc.trim();
                if (label) {
                  st.createPiece(label);
                  setCustomDoc("");
                  toast.success("Document ajouté au catalogue");
                } else {
                  setDocOpen(true);
                }
              }}
            >
              <Plus className="size-4" /> Ajouter au catalogue
            </Button>
          </div>

        </Panel>
      </div>

      <Panel
        title="Ordre strict"
        subtitle={`Pièces actives — ${st.profils.find((p) => p.id === st.selProfil)?.name ?? "—"} · ${
          ORGANISMES.find((o) => o.id === st.selOrg)?.label
        } · ${st.selMode === "PEC" ? "PEC" : "Expédition"}`}
        className="min-h-[620px]"
      >
        <div className="flex flex-col gap-2">
          {actives.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucune pièce active pour cette combinaison.
            </p>
          )}
          {actives.map((e, i) => (
            <div
              key={e.pieceId}
              draggable
              onDragStart={() => setDragId(e.pieceId)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (dragId) st.reorderActive(dragId, e.pieceId);
                setDragId(null);
              }}
              className={`glass flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                dragId === e.pieceId ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="size-4 cursor-grab text-muted-foreground" />
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/25 text-xs font-semibold text-accent">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {pieceLabel[e.pieceId] ?? e.pieceId}
              </span>
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
                  disabled={i === actives.length - 1}
                  onClick={() => st.moveActive(e.pieceId, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:bg-destructive/15"
                  onClick={() => st.removeActive(e.pieceId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            className="rounded-xl px-6"
            onClick={() => {
              st.saveOrder();
              toast.success("Ordre enregistré et synchronisé avec les Dossiers d'Intervention");
            }}
          >
            <Save className="size-4" /> Enregistrer l'ordre des pièces
          </Button>
        </div>
      </Panel>

      <Dialog open={profilOpen} onOpenChange={setProfilOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Nouveau profil d'intervention</DialogTitle>
          </DialogHeader>
          <Input
            value={newProfil}
            onChange={(e) => setNewProfil(e.target.value)}
            placeholder="Ex : Hernie inguinale"
          />
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => {
                if (!newProfil.trim()) return;
                st.addProfil(newProfil.trim());
                setNewProfil("");
                setProfilOpen(false);
                toast.success("Profil créé");
              }}
            >
              Créer le profil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Ajouter un document type</DialogTitle>
          </DialogHeader>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {available.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Tous les documents du catalogue sont déjà présents.
              </p>
            )}
            {available.map((p) => (
              <button
                key={p.id}
                className="glass-soft w-full rounded-xl px-3 py-2 text-left text-sm hover:text-accent"
                onClick={() => {
                  st.addPieceToConfig(p.id);
                  setDocOpen(false);
                  toast.success("Document ajouté");
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={customDoc}
              onChange={(e) => setCustomDoc(e.target.value)}
              placeholder="Document personnalisé…"
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (!customDoc.trim()) return;
                st.createPiece(customDoc.trim());
                setCustomDoc("");
                setDocOpen(false);
                toast.success("Document créé");
              }}
            >
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
