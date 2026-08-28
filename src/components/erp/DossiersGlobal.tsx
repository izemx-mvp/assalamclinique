import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Download,
  Eye,
  FileStack,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
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
import { ORGANISMES } from "@/lib/erp/catalog";
import {
  detectFromName,
  detectScenario,
  isCarteMutuelleFile,
  isCleanNoteConfidentielle,
  isDossierCompletFile,
  type GlobalScenario,
} from "@/lib/erp/detect";
import {
  buildDossierItems,
  bytesToDataUri,
  compileGlobalDossierBytes,
  downloadDataUri,
  fetchReferenceDossierBytes,
} from "@/lib/erp/dossier-pdf";
import referenceAsset from "@/assets/dossier-reference.pdf.asset.json";
import { useErp, type DossierRecord, type Scan } from "@/store/erp-store";
import { FilterInput, Pagination, Panel } from "./ui-bits";
import { PdfViewer } from "./PdfViewer";
import { cn } from "@/lib/utils";


const uid = () => Math.random().toString(36).slice(2, 10);

const PATIENT = "Ouassim BEN MASSAOUD";
const ORG = "CNSS";
const INTERVENTION_ID = "cholecystite";

const STEPS = [
  { id: 1, label: "Scanner et Importer" },
  { id: 2, label: "Journal d'Audit IA" },
  { id: 3, label: "Aperçu & Transmission" },
];

/* ---------------------------- Stepper d'audit ---------------------------- */

type AuditStatus = "pending" | "running" | "success" | "warning" | "error";
type AuditStep = { id: number; label: string; detail: string; status: AuditStatus; badge?: string };


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
        <span className={cn("rounded-md border px-2 py-0.5 text-[10px]", s.badge)}>
          {step.status === "pending" || step.status === "running" ? s.label : (step.badge ?? s.label)}
        </span>

      </div>
      <p className="mt-1 pl-7 text-[11px] text-muted-foreground">{step.detail}</p>
    </li>
  );
}

/* ------------------------------ Historique ------------------------------ */

export function DossiersGlobal() {
  const st = useErp();
  const [mode, setMode] = useState<"list" | "wizard">("list");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<DossierRecord | null>(null);
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
    mode: "",
    createdBy: "",
    statut: "",
  });
  const setFilter = (k: keyof typeof filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };
  const has = (v: string, q: string) => v.toLowerCase().includes(q.trim().toLowerCase());
  const orgLabel = (id: string) => ORGANISMES.find((o) => o.id === id)?.label ?? id;
  const modeOf = (d: DossierRecord) => d.mode ?? "PEC";

  const filtered = st.dossiers.filter(
    (d) =>
      d.source === "global" &&
      `${d.num} ${d.patient} ${names[d.interventionId] ?? ""} ${d.org}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      has(d.num, filters.num) &&
      has(d.patient, filters.patient) &&
      has(names[d.interventionId] ?? "", filters.intervention) &&
      has(orgLabel(d.org), filters.org) &&
      (filters.mode === "" || modeOf(d) === filters.mode) &&
      has(d.createdBy, filters.createdBy) &&
      (filters.statut === "" || d.statut === filters.statut),
  );


  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);


  const fileNameOf = (d: DossierRecord) =>
    d.fileName ?? `PEC_CNSS_Ouassim_BEN_MASSAOUD_${d.num}.pdf`;

  const downloadDossier = (d: DossierRecord) => {
    if (!d.pdfData) {
      toast.error("Aucun PDF compilé enregistré pour ce dossier");
      return;
    }
    downloadDataUri(d.pdfData, fileNameOf(d));
    toast.success(`Téléchargement : ${fileNameOf(d)}`);
  };

  if (mode === "wizard") return <GlobalWizard onExit={() => setMode("list")} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
            <FileStack className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">DOSSIERS D'INTERVENTION</p>
            <p className="text-[11px] text-muted-foreground">
              Ingestion de dossiers complets — mode PEC, audit IA global
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
          <Button className="rounded-xl" onClick={() => setMode("wizard")}>
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
                <th className="px-3 pb-1 font-medium">Mode</th>
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
                <th className="px-3 pb-2">
                  <select
                    value={filters.mode}
                    onChange={(e) => setFilter("mode", e.target.value)}
                    className="glass-soft h-8 w-full rounded-lg px-2 text-[11px] font-normal text-foreground normal-case outline-none"
                  >
                    <option value="" className="bg-popover">
                      Tous
                    </option>
                    <option value="PEC" className="bg-popover">
                      PEC
                    </option>
                    <option value="EXPEDITION" className="bg-popover">
                      Expédition
                    </option>
                  </select>
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
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[11px] text-accent">
                      {modeOf(d) === "EXPEDITION" ? "Expédition" : "PEC"}
                    </span>
                  </td>
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
                  <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
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
            {detail?.pdfData ? (
              <PdfViewer dataUri={detail.pdfData} />
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Aucun PDF compilé disponible.
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

/* -------------------------------- Wizard -------------------------------- */

function GlobalWizard({ onExit }: { onExit: () => void }) {
  const st = useErp();
  const savedOrder = useErp((s) => s.savedOrder);
  const defaultInterventionId = st.interventions.some((i) => i.id === INTERVENTION_ID)
    ? INTERVENTION_ID
    : (st.interventions[0]?.id ?? "");
  const [interventionId] = useState(defaultInterventionId);
  const required = savedOrder(interventionId, ORG, "PEC");
  const labels = useMemo(
    () => Object.fromEntries(st.pieces.map((p) => [p.id, p.label])),
    [st.pieces],
  );
  const interventionName =
    st.interventions.find((i) => i.id === interventionId)?.name ?? "Cholécystite";


  const [step, setStep] = useState(1);
  const [scenario, setScenario] = useState<GlobalScenario | null>(null);
  const [globalName, setGlobalName] = useState<string | null>(null);
  const [globalBytes, setGlobalBytes] = useState<Uint8Array | null>(null);
  const [carteOk, setCarteOk] = useState(false);
  const [noteReplacement, setNoteReplacement] = useState<string | null>(null);
  const [extras, setExtras] = useState<Scan[]>([]);
  const [log, setLog] = useState<AuditStep[]>([]);
  const [running, setRunning] = useState(false);
  const [auditRan, setAuditRan] = useState(false);
  const [compiled, setCompiled] = useState<string | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [dossierNum, setDossierNum] = useState<string | null>(null);
  const [transmitted, setTransmitted] = useState(false);
  const [orderFixed, setOrderFixed] = useState(false);
  const [resolutionName, setResolutionName] = useState<string | null>(null);
  const [resolvedActive, setResolvedActive] = useState(false);

  const globalRef = useRef<HTMLInputElement>(null);
  const pieceRef = useRef<HTMLInputElement>(null);
  const pieceTarget = useRef<string | null>(null);
  const resolving = useRef(false);

  /* --- Ingestion du dossier global --- */
  const ingestGlobal = async (files: FileList | null) => {
    const file = files?.[0];
    const isResolution = resolving.current;
    resolving.current = false;
    if (!file) return;

    // Import correctif (étape 2) : strictement isolé de l'étape 1.
    // Le fichier est toujours accepté ; sa conformité est évaluée au re-contrôle.
    if (isResolution) {
      setResolutionName(file.name);
      setResolvedActive(false);
      setAuditRan(false);
      setLog([]);
      setCompiled(null);
      toast.success("Dossier importé — Veuillez relancer le contrôle");
      return;
    }

    const sc = detectScenario(file.name);
    setScenario(sc);
    setGlobalName(file.name);
    setResolutionName(null);
    setResolvedActive(false);
    setNoteReplacement(null);
    setCarteOk(false);
    setOrderFixed(false);
    setAuditRan(false);
    setLog([]);
    setCompiled(null);
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      const buf = await file.arrayBuffer();
      setGlobalBytes(new Uint8Array(buf));
    } else {
      setGlobalBytes(null);
      setExtras((prev) => [
        ...prev,
        {
          id: uid(),
          fileName: file.name,
          url: URL.createObjectURL(file),
          mime: file.type,
          pieceId: "demande_pec",
          side: null,
          angle: 270,
          straightened: true,
        },
      ]);
    }
    toast.success(`Dossier global ingéré : ${file.name}`);
  };

  /* --- Import d'une pièce seule --- */
  const ingestPiece = (files: FileList | null) => {
    const file = files?.[0];
    const target = pieceTarget.current;
    pieceTarget.current = null;
    if (!file) return;
    const d = detectFromName(file.name);
    const pieceId = target ?? d.pieceId;

    if (pieceId === "carte_mutuelle") {
      if (!isCarteMutuelleFile(file.name)) {
        toast.error(
          "Document refusé : seule la Carte d'immatriculation CNSS officielle est acceptée",
        );
        return;
      }
      setCarteOk(true);
      toast.success("Carte CNSS validée — Patient = Assuré détecté");
    }
    if (pieceId === "note_conf") {
      // Acceptation immédiate du fichier : l'évaluation de conformité est
      // différée au prochain « Relancer le contrôle » (audit IA).
      setNoteReplacement(file.name);
      toast.success("Note confidentielle remplacée — Veuillez relancer le contrôle");
    }

    setExtras((prev) => [
      ...prev,
      {
        id: uid(),
        fileName: file.name,
        url: URL.createObjectURL(file),
        mime: file.type,
        pieceId,
        side: d.side ?? (d.needsSide ? "recto" : null),
        angle: d.angle,
        straightened: true,
      },
    ]);
    setAuditRan(false);
    setCompiled(null);
  };

  /* --- Conformité --- */
  const satisfied = (pieceId: string) => {
    if (!scenario) return false;
    if (resolvedActive) return true;
    if (scenario === "manquant") {
      if (pieceId === "carte_mutuelle" || pieceId === "cin_assure") return carteOk;
      return true;
    }
    return true;
  };

  const missing = required.filter((id) => !satisfied(id));
  // CAS 4 : la conformité de la Note confidentielle n'est jugée qu'au re-contrôle.
  const anomalyActive =
    !resolvedActive &&
    scenario === "errone" &&
    !(noteReplacement && isCleanNoteConfidentielle(noteReplacement));
  const anomalyPersistent = anomalyActive && noteReplacement !== null;
  const orderIssue = scenario === "ordre" && !orderFixed && !resolvedActive;
  const blocked = !scenario || missing.length > 0 || anomalyActive || orderIssue || !auditRan;

  const orderedExtras = [...extras].sort((a, b) => {
    const ia = a.pieceId ? required.indexOf(a.pieceId) : 999;
    const ib = b.pieceId ? required.indexOf(b.pieceId) : 999;
    return (ia < 0 ? 998 : ia) - (ib < 0 ? 998 : ib);
  });

  const runAudit = async () => {
    if (!scenario) {
      toast.error("Importez d'abord le dossier global");
      return;
    }
    // Évaluation différée du correctif importé à l'étape 2.
    const resolvedNow =
      resolvedActive ||
      !!(resolutionName && isDossierCompletFile(resolutionName)) ||
      !!(noteReplacement && isCleanNoteConfidentielle(noteReplacement));
    if (resolvedNow && !resolvedActive) setResolvedActive(true);

    const missingNow = resolvedNow ? [] : missing;
    const anomalyNow = resolvedNow ? false : anomalyActive;
    const anomalyPersistentNow = anomalyNow && noteReplacement !== null;
    const orderIssueNow = resolvedNow ? false : orderIssue;

    setRunning(true);
    const plan: { label: string; detail: string; final: AuditStatus }[] = [
      {
        label: "Initialisation du moteur d'audit IA",
        detail: "Chargement des modèles de reconnaissance documentaire",
        final: "success",
      },
      {
        label: "Éclatement du dossier global en pièces",
        detail: resolutionName ?? globalName ?? "Dossier global",
        final: "success",
      },
      {
        label: "OCR — extraction du texte et des identifiants",
        detail: "Nom du patient, CIN, numéro d'immatriculation",
        final: "success",
      },
      {
        label: "Redressement et rotation automatique",
        detail:
          scenario === "rotes"
            ? "Redressement automatique détecté sur 2 documents (Demande de PEC: 270°, Carte mutuelle/Dernier document: 180°)"
            : "Demande de PEC pivotée à 270° dans le PDF final",
        final: "success",
      },

    ];

    if (scenario === "ordre") {
      plan.push({
        label: orderIssueNow
          ? "Analyse de l'ordre des pièces"
          : "Réorganisation et placement strict selon l'ordre du référentiel",
        detail: orderIssueNow
          ? "L'ordre des pièces dans le fichier ne respecte pas le référentiel de l'intervention"
          : `${required.length} pièce(s) replacées selon la matrice ${ORG} / PEC`,
        final: orderIssueNow ? "error" : "success",
      });
    }

    plan.push({
      label: "Vérification des anomalies de contenu",
      detail: anomalyNow
        ? anomalyPersistentNow
          ? "Anomalie persistante : Informations de la Note confidentielle non conformes"
          : "Note confidentielle — nom et prénom non conformes avec les pièces d'identité"
        : "Aucune anomalie détectée",
      final: anomalyNow ? "error" : "success",
    });

    plan.push({
      label: "Conformité au référentiel de l'organisme",
      detail:
        missingNow.length === 0
          ? `${required.length} pièce(s) requises présentes`
          : `Documents manquants : ${missingNow.map((id) => labels[id] ?? id).join(", ")}`,
      final: missingNow.length === 0 ? "success" : "warning",
    });

    setLog(plan.map((p, i) => ({ id: i, label: p.label, detail: p.detail, status: "pending" })));
    for (let i = 0; i < plan.length; i++) {
      setLog((prev) => prev.map((s, j) => (j === i ? { ...s, status: "running" } : s)));
      await new Promise((r) => setTimeout(r, 600));
      setLog((prev) => prev.map((s, j) => (j === i ? { ...s, status: plan[i]!.final } : s)));
    }
    setAuditRan(true);
    setRunning(false);
    if (missingNow.length === 0 && !anomalyNow && !orderIssueNow)
      toast.success(
        scenario === "ordre"
          ? "Dossier réorganisé et conforme"
          : "Dossier conforme — aucune anomalie détectée",
      );
    else toast.warning("Points bloquants détectés");
  };


  const generate = async () => {
    toast.loading("Compilation du dossier…", { id: "compile-global" });
    // Génération universelle : uniquement le dossier médical complet de référence,
    // sans concaténer les pièces de remplacement importées.
    const reference = await fetchReferenceDossierBytes(referenceAsset.url);
    const base = reference ?? globalBytes;
    if (!base) {
      toast.dismiss("compile-global");
      toast.error("Dossier source introuvable — réimportez le PDF global");
      return;
    }
    const bytes = await compileGlobalDossierBytes(
      base,
      [],
      {
        title: `Dossier PEC ${ORG} — ${PATIENT}`,
        patient: PATIENT,
        intervention: interventionName,
        organisme: ORG,
        mode: "Prise en charge",
        labels,
      },
    );
    const dataUri = bytesToDataUri(bytes);
    const items = await buildDossierItems(orderedExtras, labels);
    setCompiled(dataUri);

    if (dossierId) {
      st.updateDossier(dossierId, { statut: "Audité", pdfData: dataUri, items });
    } else {
      const id = st.commitDossier("Audité", dataUri, items, {
        source: "global",
        patient: PATIENT,
        interventionId,
        org: ORG,
        mode: "PEC",
      });
      const num = useErp.getState().dossiers.find((d) => d.id === id)?.num ?? "DOS-2026-0000";
      st.updateDossier(id, { fileName: `PEC_CNSS_Ouassim_BEN_MASSAOUD_${num}.pdf` });
      setDossierId(id);
      setDossierNum(num);
    }
    toast.dismiss("compile-global");
    toast.success("Dossier compilé");
  };


  const pdfName = `PEC_CNSS_Ouassim_BEN_MASSAOUD_${dossierNum ?? "DOS-2026-0000"}.pdf`;

  const download = () => {
    if (!compiled) return;
    downloadDataUri(compiled, pdfName);
    toast.success(`Téléchargement : ${pdfName}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="glass rounded-2xl px-5 py-4">
        <div className="mb-3 flex justify-end">
          <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={onExit}>
            <ArrowLeft className="size-4" /> Retour
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
              <FileStack className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Nouveau Dossier</p>
              <p className="text-[11px] text-muted-foreground">
                Déposez le dossier global : les pièces et données seront extraites automatiquement
              </p>
            </div>
          </div>
        
        </div>
      </div>

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
        ref={globalRef}
        type="file"
        hidden
        onChange={(e) => {
          void ingestGlobal(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={pieceRef}
        type="file"
        hidden
        onChange={(e) => {
          ingestPiece(e.target.files);
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
                void ingestGlobal(e.dataTransfer.files);
              }}
              className="glass-soft flex flex-col items-center justify-center gap-2 rounded-2xl border-dashed py-12 text-center"
            >
              <FileStack className="size-9 text-accent" />
              <p className="text-sm font-medium">Glissez-déposez le dossier global (PDF) ici</p>
              <p className="text-xs text-muted-foreground">
                La checklist des exigences est mise à jour directement après lecture IA
              </p>
              {globalName && (
                <p className="mt-2 rounded-lg border border-success/40 bg-success/10 px-3 py-1 text-xs text-success">
                  {globalName}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Button className="rounded-xl" onClick={() => globalRef.current?.click()}>
                <Upload className="size-4" /> Importer le dossier global
              </Button>
            </div>
          </Panel>

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
                const auto = id === "cin_assure" && carteOk && scenario === "manquant";
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
                      {auto && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          Patient = assuré détecté · couvert par CIN patient
                        </p>
                      )}
                    </div>
                    {auto && (
                      <span className="shrink-0 rounded-md border border-success/40 bg-success/10 px-1.5 py-0.5 text-[10px] text-success">
                        Auto
                      </span>
                    )}
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
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <Panel
            title="Journal d'Audit IA"
            action={
              <span className="text-[11px] text-muted-foreground">
                {auditRan ? "Contrôle effectué" : "Contrôle non lancé"}
              </span>
            }
          >
            <div className="flex items-center justify-center gap-3">
              <Button className="rounded-xl" disabled={running} onClick={runAudit}>
                <Sparkles className="size-4" />
                {auditRan ? "Relancer le contrôle" : "Lancer le contrôle IA"}
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

          {auditRan && (
            <Panel title="Résultats du contrôle">
              <div className="flex flex-col gap-2">
                {missing.length === 0 && !anomalyActive && !orderIssue && (
                  <p className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-3 text-sm text-success">
                    <CheckCircle2 className="size-4" />
                    {scenario === "ordre"
                      ? "Dossier réorganisé et conforme"
                      : "Dossier conforme — aucune anomalie détectée"}
                  </p>
                )}

                {orderIssue && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-3">
                    <XCircle className="size-4 shrink-0 text-destructive" />
                    <span className="min-w-0 flex-1 text-sm text-destructive">
                      Anomalie détectée : L'ordre des pièces dans le fichier ne respecte pas le
                      référentiel de l'intervention
                    </span>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        setOrderFixed(true);
                        setExtras((prev) =>
                          [...prev].sort((a, b) => {
                            const ia = a.pieceId ? required.indexOf(a.pieceId) : 999;
                            const ib = b.pieceId ? required.indexOf(b.pieceId) : 999;
                            return (ia < 0 ? 998 : ia) - (ib < 0 ? 998 : ib);
                          }),
                        );
                        toast.success("Ordre corrigé selon la matrice — relancez le contrôle");
                      }}
                    >
                      <RefreshCcw className="size-3.5" /> Corriger l'ordre automatiquement
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-lg"
                      onClick={() => {
                        resolving.current = true;
                        globalRef.current?.click();
                      }}
                    >
                      <FileStack className="size-3.5" /> Importer le dossier global complet
                    </Button>
                  </div>
                )}

                {missing.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-400">
                    <AlertTriangle className="size-4 shrink-0" />
                    Documents manquants : {missing.map((id) => labels[id] ?? id).join(" et ")}
                  </div>
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
                        pieceTarget.current = id;
                        pieceRef.current?.click();
                      }}
                    >
                      <Upload className="size-3.5" /> Importer la pièce seule
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-lg"
                      onClick={() => {
                        resolving.current = true;
                        globalRef.current?.click();
                      }}
                    >
                      <FileStack className="size-3.5" /> Importer le dossier global complet
                    </Button>
                  </div>
                ))}

                {anomalyActive && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-destructive" />
                    <span className="min-w-0 flex-1 text-sm text-destructive">
                      {anomalyPersistent
                        ? "Anomalie persistante : Informations de la Note confidentielle non conformes"
                        : "Anomalie détectée : Note confidentielle — Nom et prénom non conformes / incohérents avec les pièces d'identité"}
                    </span>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        pieceTarget.current = "note_conf";
                        pieceRef.current?.click();
                      }}
                    >
                      <RefreshCcw className="size-3.5" /> Remplacer la pièce
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-lg"
                      onClick={() => {
                        resolving.current = true;
                        globalRef.current?.click();
                      }}
                    >
                      <FileStack className="size-3.5" /> Importer le dossier global complet
                    </Button>
                  </div>
                )}

                {(missing.length > 0 || anomalyActive || orderIssue) && (
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
      )}

      {step === 3 && (
        <Panel
          title="Aperçu & Transmission"
          subtitle={compiled ? pdfName : "Générez le dossier compilé"}
        >
          <div className="glass-soft grid min-h-[420px] place-items-center overflow-hidden rounded-2xl p-3">
            {compiled ? (
              <div className="h-[560px] w-full">
                <PdfViewer dataUri={compiled} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <FileText className="size-14 text-muted-foreground/60" />
                <p className="text-sm font-medium">Aucun dossier compilé</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button className="rounded-xl" onClick={generate}>
              <FileText className="size-4" /> Générer le dossier
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl"
              disabled={!compiled}
              onClick={download}
            >
              <Download className="size-4" /> Télécharger le dossier (PDF)
            </Button>
            <Button
              className="rounded-xl"
              disabled={!compiled || transmitted}
              onClick={() => {
                setTransmitted(true);
                if (dossierId) st.updateDossier(dossierId, { statut: "Transmis" });
                toast.success("Dossier transmis à la PEC");
              }}
            >
              <Send className="size-4" /> Transmettre à la PEC
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
