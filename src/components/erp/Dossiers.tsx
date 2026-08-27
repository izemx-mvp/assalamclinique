import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Download,
  Loader2,
  XCircle,
  Eye,
  FileText,
  Plus,
  RefreshCcw,
  ScanLine,
  Search,
  Send,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODES, ORGANISMES, type Mode } from "@/lib/erp/catalog";
import { detectFromName, hasAnomaly, isCarteMutuelleFile } from "@/lib/erp/detect";
import {
  buildDossierPdf,
  bytesToDataUri,
  compileDossierBytes,
  dossierFileName,
  dossierPdfUrl,
  downloadDataUri,
} from "@/lib/erp/dossier-pdf";
import { useErp, type DossierRecord, type Scan } from "@/store/erp-store";
import { FilterInput, Pagination, Panel, Segmented } from "./ui-bits";
import { cn } from "@/lib/utils";


const uid = () => Math.random().toString(36).slice(2, 10);

const STEPS = [
  { id: 1, label: "Scanner et Importer" },
  { id: 2, label: "Journal d'Audit IA" },
  { id: 3, label: "Aperçu & Transmission" },
];

/* ---------------------- Stepper vertical d'audit IA ---------------------- */

type AuditStatus = "pending" | "running" | "success" | "warning" | "error";
type AuditStep = { id: number; label: string; detail: string; status: AuditStatus };

const AUDIT_STYLES: Record<AuditStatus, { box: string; badge: string; label: string }> = {
  success: {
    box: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    label: "Validé",
  },
  running: {
    box: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    label: "En cours",
  },
  warning: {
    box: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    label: "Avertissement",
  },
  error: {
    box: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    label: "Bloquant",
  },
  pending: {
    box: "bg-slate-800/40 text-slate-400 border-slate-700/50",
    badge: "bg-slate-800/60 text-slate-400 border-slate-700/50",
    label: "En attente",
  },
};

function AuditStepIcon({ status }: { status: AuditStatus }) {
  if (status === "running") return <Loader2 className="size-4 animate-spin" />;
  if (status === "success") return <CheckCircle2 className="size-4" />;
  if (status === "warning") return <AlertTriangle className="size-4" />;
  if (status === "error") return <XCircle className="size-4" />;
  return <Circle className="size-4" />;
}

function AuditStepCard({ step, index }: { step: AuditStep; index: number }) {
  const s = AUDIT_STYLES[step.status];
  return (
    <li
      className={cn("animate-fade-in rounded-xl border px-4 py-3 transition-all", s.box)}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <AuditStepIcon status={step.status} />
        <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{step.label}</p>
        <span className={cn("rounded-md border px-2 py-0.5 text-[10px]", s.badge)}>{s.label}</span>
      </div>
      <p className="mt-1 pl-7 text-[11px] text-muted-foreground">{step.detail}</p>
    </li>
  );
}


export function Dossiers() {
  const st = useErp();
  const [mode, setMode] = useState<"list" | "wizard">("list");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<DossierRecord | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<DossierRecord | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const names = useMemo(
    () => Object.fromEntries(st.interventions.map((i) => [i.id, i.name])),
    [st.interventions],
  );

  const [filters, setFilters] = useState({
    num: "",
    patient: "",
    intervention: "",
    org: "",
    createdBy: "",
    statut: "",
  });
  const setFilter = (k: keyof typeof filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const has = (v: string, q: string) => v.toLowerCase().includes(q.trim().toLowerCase());

  const filtered = st.dossiers.filter(
    (d) =>
      `${d.num} ${d.patient} ${names[d.interventionId] ?? ""} ${d.org}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      has(d.num, filters.num) &&
      has(d.patient, filters.patient) &&
      has(names[d.interventionId] ?? "", filters.intervention) &&
      has(ORGANISMES.find((o) => o.id === d.org)?.label ?? d.org, filters.org) &&
      has(d.createdBy, filters.createdBy) &&
      (filters.statut === "" || d.statut === filters.statut),
  );

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const orgLabel = (id: string) => ORGANISMES.find((o) => o.id === id)?.label ?? id;

  // Génère le PDF du dossier sélectionné pour le visualiseur
  useEffect(() => {
    let revoked: string | null = null;
    if (detail) {
      dossierPdfUrl(detail, names[detail.interventionId] ?? "—", orgLabel(detail.org)).then((u) => {
        revoked = u;
        setViewerUrl(u);
      });
    } else setViewerUrl(null);
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [detail]);

  const downloadDossier = async (d: DossierRecord) => {
    if (d.pdfData) {
      downloadDataUri(d.pdfData, dossierFileName(d));
    } else {
      const doc = await buildDossierPdf(d, names[d.interventionId] ?? "—", orgLabel(d.org));
      doc.save(dossierFileName(d));
    }
    toast.success(`Téléchargement : ${dossierFileName(d)}`);
  };



  if (mode === "wizard") return <Wizard onExit={() => setMode("list")} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
            <Stethoscope className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Dossiers d'Intervention</p>
            <p className="text-[11px] text-muted-foreground">
              Historique des dossiers — audit IA et transmission
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher : patient, N° dossier…"
              className="glass-soft h-10 rounded-xl border-0 pl-9"
            />
          </div>
          <Button
            className="rounded-xl"
            onClick={() => {
              st.resetDossier();
              setMode("wizard");
            }}
          >
            <Plus className="size-4" /> Nouveau Dossier
          </Button>
        </div>
      </div>

      <Panel title="Historique des dossiers" subtitle={`${filtered.length} dossier(s)`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-3 pb-1 font-medium">N° Dossier</th>
                <th className="px-3 pb-1 font-medium">Patient</th>
                <th className="px-3 pb-1 font-medium">Intervention</th>
                <th className="px-3 pb-1 font-medium">Organisme</th>
                <th className="px-3 pb-1 font-medium">Date de création</th>
                <th className="px-3 pb-1 font-medium">Créé par</th>
                <th className="px-3 pb-1 font-medium">Statut</th>
                <th className="px-3 pb-1 text-right font-medium">Actions</th>
              </tr>
              <tr>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.num}
                    onChange={(v) => setFilter("num", v)}
                    placeholder="N° dossier…"
                  />
                </th>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.patient}
                    onChange={(v) => setFilter("patient", v)}
                    placeholder="Patient…"
                  />
                </th>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.intervention}
                    onChange={(v) => setFilter("intervention", v)}
                    placeholder="Intervention…"
                  />
                </th>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.org}
                    onChange={(v) => setFilter("org", v)}
                    placeholder="Organisme…"
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
                    <option value="Brouillon" className="bg-popover">
                      Brouillon
                    </option>
                    <option value="Audité" className="bg-popover">
                      Audité
                    </option>
                    <option value="Transmis" className="bg-popover">
                      Transmis
                    </option>
                  </select>
                </th>
                <th className="px-3 pb-2" />
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => (
                <tr key={d.id} className="glass-soft">
                  <td className="rounded-l-xl px-3 py-3 font-mono text-xs text-accent">{d.num}</td>
                  <td className="px-3 py-3 font-medium">{d.patient}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {names[d.interventionId] ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{orgLabel(d.org)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.createdAt}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.createdBy}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px]",
                        d.statut === "Transmis" && "bg-success/15 text-success",
                        d.statut === "Audité" && "bg-primary/20 text-accent",
                        d.statut === "Brouillon" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {d.statut}
                    </span>
                  </td>
                  <td className="rounded-r-xl px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 hover:text-accent"
                        title="Aperçu du dossier PDF"
                        onClick={() => setDetail(d)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 hover:text-accent"
                        title="Télécharger le PDF"
                        onClick={() => downloadDossier(d)}
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:bg-destructive/15"
                        title="Supprimer le dossier"
                        onClick={() => setToDelete(d)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun dossier trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={filtered.length}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </Panel>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="glass max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3">
              <span>Aperçu du dossier {detail?.num}</span>
              {detail && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-lg"
                  onClick={() => downloadDossier(detail)}
                >
                  <Download className="size-3.5" /> Télécharger
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="glass-soft h-[70vh] overflow-hidden rounded-xl">
            {viewerUrl ? (
              <iframe
                src={viewerUrl}
                title={`Dossier ${detail?.num}`}
                className="h-full w-full rounded-xl border-0"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Compilation du document…
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le dossier</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Confirmez-vous la suppression définitive du dossier {toDelete?.num} —{" "}
            {toDelete?.patient} ?
          </p>
          <DialogFooter className="sm:justify-center">
            <Button variant="secondary" className="rounded-xl" onClick={() => setToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                if (toDelete) st.removeDossier(toDelete.id);
                setToDelete(null);
                toast.success("Dossier supprimé");
              }}
            >
              <Trash2 className="size-4" /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------- Wizard --------------------------------- */

function Wizard({ onExit }: { onExit: () => void }) {
  const st = useErp();
  const savedOrder = useErp((s) => s.savedOrder);
  const required = savedOrder(st.dosProfil, st.dosOrg, st.dosMode);
  const labels = useMemo(
    () => Object.fromEntries(st.pieces.map((p) => [p.id, p.label])),
    [st.pieces],
  );

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState<AuditStep[]>([]);
  const [running, setRunning] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);
  const missingTarget = useRef<string | null>(null);

  const hasSide = (side: "recto" | "verso") =>
    st.scans.some((s) => s.pieceId === "cin_patient" && s.side === side);

  const satisfied = (pieceId: string) => {
    if (pieceId === "cin_assure") return true;
    if (pieceId === "cin_patient") return hasSide("recto") && hasSide("verso");
    // Règle stricte : la carte mutuelle exige un fichier nommé "carte mut…"
    if (pieceId === "carte_mutuelle")
      return st.scans.some(
        (s) => s.pieceId === "carte_mutuelle" && isCarteMutuelleFile(s.fileName),
      );
    return st.scans.some((s) => s.pieceId === pieceId);
  };

  const missing = required.filter((id) => !satisfied(id));
  const anomalies = st.scans.filter((s) => hasAnomaly(s.fileName));
  const blocked = missing.length > 0 || anomalies.length > 0 || !st.auditRan;

  const ordered = [...st.scans].sort((a, b) => {
    const ia = a.pieceId ? required.indexOf(a.pieceId) : 999;
    const ib = b.pieceId ? required.indexOf(b.pieceId) : 999;
    if (ia !== ib) return (ia < 0 ? 998 : ia) - (ib < 0 ? 998 : ib);
    return (a.side === "verso" ? 1 : 0) - (b.side === "verso" ? 1 : 0);
  });

  const current = st.scans.find((s) => s.id === selected) ?? ordered[0] ?? null;

  // Sauvegarde automatique entre les étapes
  useEffect(() => {
    if (step > 1) toast.success("Progression sauvegardée automatiquement", { id: "autosave" });
  }, [step]);

  const ingest = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const d = detectFromName(file.name);
      const forced = missingTarget.current;
      const pieceId = forced ?? d.pieceId;
      const scan: Scan = {
        id: uid(),
        fileName: file.name,
        url: URL.createObjectURL(file),
        mime: file.type,
        pieceId,
        // classification automatique : côté par défaut si la pièce en exige un
        side: d.side ?? (d.needsSide ? "recto" : null),
        angle: d.angle,
        straightened: false,
      };
      st.addScan(scan);
      toast.success(
        pieceId
          ? `Reconnu : ${labels[pieceId] ?? pieceId}`
          : `Importé : ${file.name} (à rattacher automatiquement)`,
      );
    });
    missingTarget.current = null;
  };


  const doReplace = (files: FileList | null) => {
    const file = files?.[0];
    const id = replaceTarget.current;
    if (!file || !id) return;
    const prev = st.scans.find((s) => s.id === id);
    const d = detectFromName(file.name);
    st.updateScan(id, {
      fileName: file.name,
      url: URL.createObjectURL(file),
      mime: file.type,
      pieceId: prev?.pieceId ?? d.pieceId,
      side: prev?.side ?? d.side,
      angle: d.angle,
      straightened: false,
    });
    st.setAuditRan(false);
    st.setGenerated(null);
    toast.success("Fichier remplacé — relancez le contrôle");
  };

  const runAudit = async () => {
    setRunning(true);
    const plan: { label: string; detail: string; final: AuditStatus }[] = [
      {
        label: "Initialisation du moteur d'audit IA",
        detail: "Chargement des modèles de reconnaissance documentaire",
        final: "success",
      },
      {
        label: "Lecture des pages importées",
        detail: `${st.scans.length} page(s) analysée(s)`,
        final: st.scans.length > 0 ? "success" : "warning",
      },
      {
        label: "OCR — extraction du texte et des identifiants",
        detail: "Nom du patient, CIN, numéro d'immatriculation",
        final: "success",
      },
      {
        label: "Redressement et rotation automatique",
        detail: "Orientation normalisée (demande de PEC : 270°)",
        final: "success",
      },
      {
        label: "Vérification des anomalies de contenu",
        detail:
          anomalies.length === 0
            ? "Aucune anomalie détectée"
            : `${anomalies.length} anomalie(s) bloquante(s) détectée(s)`,
        final: anomalies.length === 0 ? "success" : "error",
      },
      {
        label: "Conformité au référentiel de l'organisme",
        detail:
          missing.length === 0
            ? `${required.length} pièce(s) requises présentes`
            : `${missing.length} pièce(s) manquante(s)`,
        final: missing.length === 0 ? "success" : "warning",
      },
    ];

    setLog(plan.map((p, i) => ({ id: i, label: p.label, detail: p.detail, status: "pending" })));

    for (let i = 0; i < plan.length; i++) {
      setLog((prev) => prev.map((s, j) => (j === i ? { ...s, status: "running" } : s)));
      await new Promise((r) => setTimeout(r, 600));
      setLog((prev) => prev.map((s, j) => (j === i ? { ...s, status: plan[i]!.final } : s)));
    }

    st.straightenAll();
    st.setAuditRan(true);
    setRunning(false);
    if (missing.length === 0 && anomalies.length === 0) toast.success("Dossier conforme");
    else toast.warning("Points bloquants détectés");
  };


  const pdfName = `${st.dosMode === "PEC" ? "PEC" : "EXP"}_${st.dosOrg}_Ouassim-BEN-MASSAOUD_CLINI-01.pdf`;

  const [compiled, setCompiled] = useState<string | null>(null);

  const generate = async () => {
    toast.loading("Compilation du dossier…", { id: "compile" });
    const bytes = await compileDossierBytes(ordered, {
      title: pdfName.replace(/\.pdf$/, ""),
      patient: "Ouassim BEN MASSAOUD",
      intervention: st.interventions.find((i) => i.id === st.dosProfil)?.name ?? "—",
      organisme: st.dosOrg,
      mode: st.dosMode === "PEC" ? "Prise en charge" : "Expédition",
      labels,
    });
    const dataUri = bytesToDataUri(bytes);
    setCompiled(dataUri);
    st.setGenerated(pdfName);
    st.commitDossier("Audité", dataUri);
    toast.dismiss("compile");
    toast.success(`Dossier généré : ${pdfName}`);
  };

  const download = () => {
    if (!compiled) return;
    downloadDataUri(compiled, pdfName);
    toast.success(`Téléchargement : ${pdfName}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="glass rounded-2xl px-5 py-4">
        <div className="mb-3 flex justify-end">
          <Button
            className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={onExit}
          >
            <ArrowLeft className="size-4" /> Retour
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
              <Stethoscope className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Nouveau Dossier</p>
              <p className="text-[11px] text-muted-foreground">
                Importez les scans : les données patient seront extraites des documents
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={st.dosMode}
              onChange={(v) => st.setDos({ dosMode: v as Mode })}
              options={MODES.map((m) => ({ value: m.id, label: m.label }))}
            />
            <select
              value={st.dosProfil}
              onChange={(e) => st.setDos({ dosProfil: e.target.value })}
              className="glass-soft h-10 rounded-xl px-3 text-sm outline-none"
            >
              {st.interventions.map((p) => (
                <option key={p.id} value={p.id} className="bg-popover">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* Stepper / fil d'Ariane */}
      <div className="glass flex flex-wrap items-center justify-center gap-3 rounded-2xl px-5 py-3">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              if (s.id === 3 && blocked) {
                toast.error("Résolvez les points bloquants de l'audit IA");
                return;
              }
              setStep(s.id);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition-all",
              step === s.id
                ? "glow-ring bg-primary/20 text-accent"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-6 place-items-center rounded-lg text-[11px] font-semibold",
                step >= s.id ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {s.id}
            </span>
            {s.label}
            {i < STEPS.length - 1 && <span className="ml-2 text-muted-foreground/50">›</span>}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          ingest(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        hidden
        onChange={(e) => {
          doReplace(e.target.files);
          e.target.value = "";
        }}
      />

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <Panel title="Scanner et Importer">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                ingest(e.dataTransfer.files);
              }}
              className="glass-soft flex flex-col items-center justify-center gap-2 rounded-2xl border-dashed py-12 text-center"
            >
              <ScanLine className="size-9 text-accent" />
              <p className="text-sm font-medium">Glissez-déposez vos scans ici</p>
              <p className="text-xs text-muted-foreground">Images ou PDF — détection automatique</p>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Button className="rounded-xl" onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" /> Importer des fichiers / Scanner
              </Button>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {ordered.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "glass-soft flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2",
                    current?.id === s.id && "glow-ring",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/25 text-[11px] text-accent">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {s.pieceId ? (labels[s.pieceId] ?? s.pieceId) : "Non classé"}
                      {s.side ? ` — ${s.side}` : ""}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{s.fileName}</p>
                  </div>
                  {hasAnomaly(s.fileName) && <AlertTriangle className="size-4 text-destructive" />}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:bg-destructive/15"
                    onClick={(e) => {
                      e.stopPropagation();
                      st.removeScan(s.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Panel>

          <div className="flex flex-col gap-5">
            <Panel
              title={`Checklist des exigences (${required.length})`}
              action={
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {required.filter((id) => satisfied(id)).length}/{required.length} conformes
                </span>
              }
            >
              <div className="flex flex-col gap-2.5">
                {required.map((id, i) => {
                  const ok = satisfied(id);
                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3",
                        ok ? "border border-success/40 bg-success/10" : "glass-soft",
                      )}
                    >
                      <span className="w-4 shrink-0 text-center text-[11px] text-muted-foreground">
                        {i + 1}
                      </span>
                      {ok ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      ) : (
                        <span className="size-4 shrink-0 rounded-full border border-muted-foreground/50" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm", ok && "text-success")}>
                          {labels[id] ?? id}
                        </p>
                        {id === "cin_patient" && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            Recto {hasSide("recto") ? "✓" : "–"} · Verso{" "}
                            {hasSide("verso") ? "✓" : "–"}
                          </p>
                        )}
                      </div>
                      {ok && <span className="text-sm text-success">✓</span>}
                    </div>
                  );
                })}
              </div>
            </Panel>

            <div className="flex justify-end">
              <Button className="rounded-xl px-6" onClick={() => setStep(2)}>
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <Panel
            title="Journal d'Audit IA"
            action={
              <span className="text-[11px] text-muted-foreground">
                {st.auditRan ? "Contrôle effectué" : "Contrôle non lancé"}
              </span>
            }
          >
            <div className="flex items-center justify-center gap-3">
              <Button className="rounded-xl" disabled={running} onClick={runAudit}>
                <Sparkles className="size-4" />
                {st.auditRan ? "Relancer le contrôle" : "Lancer le contrôle IA"}
              </Button>
            </div>
            <div className="mt-5">
              {log.length === 0 ? (
                <p className="glass-soft rounded-2xl px-4 py-10 text-center text-sm text-muted-foreground">
                  En attente du lancement du contrôle IA…
                </p>
              ) : (
                <ol className="relative flex flex-col gap-3 pl-6">
                  <span className="absolute top-2 bottom-2 left-2 w-px bg-border" />
                  {log.map((s, i) => (
                    <AuditStepCard key={s.id} step={s} index={i} />
                  ))}
                </ol>
              )}
            </div>

          </Panel>

          <div className="flex flex-col gap-5">
            {st.auditRan && (
              <Panel title="Résultats du contrôle">
                <div className="flex flex-col gap-2">
                  {missing.length === 0 && anomalies.length === 0 && (
                    <p className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-3 text-sm text-success">
                      <CheckCircle2 className="size-4" /> Dossier conforme — aucune anomalie
                      détectée.
                    </p>
                  )}
                  {missing.map((id) => (
                    <div
                      key={id}
                      className="glass-soft flex flex-wrap items-center gap-3 rounded-xl px-3 py-3"
                    >
                      <AlertTriangle className="size-4 shrink-0 text-destructive" />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        Manquant : {labels[id] ?? id}
                      </span>
                      <Button
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          missingTarget.current = id;
                          inputRef.current?.click();
                        }}
                      >
                        <Upload className="size-3.5" /> Importer le document
                      </Button>
                    </div>
                  ))}
                  {anomalies.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-3"
                    >
                      <AlertTriangle className="size-4 shrink-0 text-destructive" />
                      <span className="min-w-0 flex-1 text-sm text-destructive">
                        Anomalie : Informations erronées (nom du patient non valide ou non correct
                        dans le document {s.fileName})
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-lg"
                        onClick={() => {
                          replaceTarget.current = s.id;
                          replaceRef.current?.click();
                        }}
                      >
                        <RefreshCcw className="size-3.5" /> Remplacer le fichier
                      </Button>
                    </div>
                  ))}
                  {(missing.length > 0 || anomalies.length > 0) && (
                    <div className="mt-2 flex justify-center">
                      <Button variant="secondary" className="rounded-xl" onClick={runAudit}>
                        <RefreshCcw className="size-4" /> Relancer le contrôle
                      </Button>
                    </div>
                  )}
                </div>
              </Panel>
            )}

            <div className="flex justify-between">
              <Button variant="secondary" className="rounded-xl" onClick={() => setStep(1)}>
                Précédent
              </Button>
              <Button
                className="rounded-xl px-6"
                disabled={blocked}
                onClick={() => setStep(3)}
                title={blocked ? "Résolvez les points bloquants" : undefined}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <Panel title="Aperçu & Transmission" subtitle={`${ordered.length} page(s) ordonnée(s)`}>
          <div className="flex flex-col gap-5">
            <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
              {ordered.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "glass-soft flex items-center gap-3 rounded-xl px-3 py-2 text-left",
                    current?.id === s.id && "glow-ring",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/25 text-[11px] text-accent">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {s.pieceId ? (labels[s.pieceId] ?? s.pieceId) : "Non classé"}
                    {s.side ? ` — ${s.side}` : ""}
                  </span>
                </button>
              ))}
            </div>
            <div className="glass-soft grid min-h-[360px] place-items-center overflow-hidden rounded-2xl p-3">
              {current ? (
                current.mime.startsWith("image/") ? (
                  <img
                    src={current.url}
                    alt={current.fileName}
                    style={{ transform: `rotate(${current.angle}deg)` }}
                    className="max-h-[360px] rounded-xl object-contain transition-transform"
                  />
                ) : (
                  <object
                    data={current.url}
                    type="application/pdf"
                    className="h-[360px] w-full rounded-xl"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="size-8" />
                      <span className="text-sm">{current.fileName}</span>
                    </div>
                  </object>
                )
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <FileText className="size-14 text-muted-foreground/60" />
                  <p className="text-sm font-medium">Aucun scan importé</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              className="rounded-xl"
              onClick={generate}
            >
              <FileText className="size-4" /> Générer le dossier
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl"
              disabled={!st.generated || !compiled}
              onClick={download}
            >
              <Download className="size-4" /> Télécharger le dossier (PDF)
            </Button>
            <Button
              className="rounded-xl"
              disabled={!st.generated || st.transmitted}
              onClick={() => {
                st.setTransmitted(true);
                toast.success(
                  st.dosMode === "PEC"
                    ? "Dossier transmis à la PEC"
                    : "Dossier transmis pour expédition",
                );
              }}
            >
              <Send className="size-4" />
              {st.dosMode === "PEC" ? "Transmettre à la PEC" : "Transmettre pour Expédition"}
            </Button>
          </div>
        </Panel>
      )}


    </div>
  );
}
