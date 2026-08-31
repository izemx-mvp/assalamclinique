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
  Files,
  HelpCircle,
  Loader2,
  Mail,
  Plus,
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
import {
  detectFromName,
  missingFromFiles,
  detectScenario,
  etatOfScenario,
  type EtatDossier,
  type GlobalScenario,
  looksLikeCarteMutuelle,
} from "@/lib/erp/detect";
import {
  buildDossierItems,
  bytesToDataUri,
  compileGlobalDossierBytes,
  downloadDataUri,
  fetchReferenceDossierBytes,
} from "@/lib/erp/dossier-pdf";
import { renderTemplate, sendDossierEmail } from "@/lib/erp/notify";
import referenceAsset from "@/assets/dossier-reference.pdf";
import { scenarioKeyForEtat, useAdmin } from "@/store/admin-store";
import { useErp, type AuditSummary, type DossierRecord, type Scan } from "@/store/erp-store";
import { FilterInput, Pagination, Panel, Segmented, StatusPill } from "./ui-bits";
import { PdfViewer } from "./PdfViewer";
import { cn } from "@/lib/utils";

const uid = () => Math.random().toString(36).slice(2, 10);

const PATIENT = "Ouassim BEN MESSAOUD";
const ORG = "CNSS";
const INTERVENTION_ID = "cholecystite";

const STEPS = [
  { id: 1, label: "Importer et Scanner" },
  { id: 2, label: "Journal d'Audit et IA" },
  { id: 3, label: "Aperçu et Transmission" },
];

/* --------------------------- Badges d'état ------------------------------ */

export function EtatBadge({ etat }: { etat?: EtatDossier | undefined }) {
  const e = etat ?? "Conforme";
  const tone = e === "Conforme" ? "green" : e === "Non conforme" ? "red" : "orange";
  const dot =
    e === "Conforme" ? "bg-success" : e === "Non conforme" ? "bg-destructive" : "bg-amber-400";
  return (
    <StatusPill tone={tone as "green" | "red" | "orange"}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {e === "Conforme" ? "Conforme / Validé" : e}
    </StatusPill>
  );
}

/* ---------------------------- Stepper d'audit ---------------------------- */

type AuditStatus = "pending" | "running" | "success" | "warning" | "error";
type AuditStep = {
  id: number;
  label: string;
  detail: string;
  status: AuditStatus;
  badge?: string | undefined;
};

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
    label: "À vérifier",
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
  if (status === "warning") return <HelpCircle className="size-4" />;
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
          {step.status === "pending" || step.status === "running"
            ? s.label
            : (step.badge ?? s.label)}
        </span>
      </div>
      <p
        className={cn(
          "mt-1 pl-7 text-[11px]",
          step.status === "success" && "text-emerald-400",
          step.status === "warning" && "text-amber-400",
          step.status === "error" && "text-rose-400",
          step.status === "pending" && "text-slate-400",
          step.status === "running" && "text-sky-400",
        )}
      >
        {step.detail}
      </p>
    </li>
  );
}

/* ------------------- Liste des dossiers (conformes) --------------------- */

export function DossiersUnifie() {
  const st = useErp();
  const ad = useAdmin();
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
  });
  const setFilter = (k: keyof typeof filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };
  const has = (v: string, q: string) => v.toLowerCase().includes(q.trim().toLowerCase());
  const modeOf = (d: DossierRecord) => d.mode ?? "PEC";

  const filtered = st.dossiers.filter(
    (d) =>
      (d.etat ?? "Conforme") === "Conforme" &&
      `${d.num} ${d.patient} ${names[d.interventionId] ?? ""} ${d.org}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      has(d.num, filters.num) &&
      has(d.patient, filters.patient) &&
      has(names[d.interventionId] ?? "", filters.intervention) &&
      has(ad.orgLabel(d.org), filters.org) &&
      (filters.mode === "" || modeOf(d) === filters.mode) &&
      has(d.createdBy, filters.createdBy),
  );

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const fileNameOf = (d: DossierRecord) =>
    d.fileName ?? `${d.mode === "PEC" ? "PEC" : "EXP"}_${d.org}_${d.num}.pdf`;

  const downloadDossier = (d: DossierRecord) => {
    if (!d.pdfData) {
      toast.error("Aucun PDF compilé enregistré pour ce dossier");
      return;
    }
    downloadDataUri(d.pdfData, fileNameOf(d));
    toast.success(`Téléchargement : ${fileNameOf(d)}`);
  };

  if (mode === "wizard") return <DossierWizard onExit={() => setMode("list")} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
            <FileStack className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Dossiers d'intervention</p>
            <p className="text-[11px] text-muted-foreground">
              Dossiers conformes prêts à être transmis — audit IA validé
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

      <Panel
        title="Dossiers conformes"
        subtitle={`${filtered.length} dossier(s) conforme(s)`}
      >
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
                <th className="px-3 pb-1 font-medium">État du dossier</th>
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
                <th className="px-3 pb-2" />
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
                  <td className="px-3 py-3 text-muted-foreground">{ad.orgLabel(d.org)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[11px] text-accent">
                      {modeOf(d) === "EXPEDITION" ? "Expédition" : "PEC"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{d.createdAt}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.createdBy}</td>
                  <td className="px-3 py-3">
                    <EtatBadge etat={d.etat} />
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
                    Aucun dossier conforme trouvé.
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

/* ------------------------------- Wizard --------------------------------- */

type Plan = { label: string; detail: string; final: AuditStatus; badge?: string };

function DossierWizard({ onExit }: { onExit: () => void }) {
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
  const [imported, setImported] = useState<string[]>([]);
  const [scenario, setScenario] = useState<GlobalScenario | null>(null);
  const [globalName, setGlobalName] = useState<string | null>(null);
  const [globalBytes, setGlobalBytes] = useState<Uint8Array | null>(null);
  const [extras, setExtras] = useState<Scan[]>([]);
  const [log, setLog] = useState<AuditStep[]>([]);
  const [running, setRunning] = useState(false);
  const [auditRan, setAuditRan] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [compiled, setCompiled] = useState<string | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [dossierNum, setDossierNum] = useState<string | null>(null);
  const [transmitted, setTransmitted] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);


  const filesRef = useRef<HTMLInputElement>(null);

  /** Un dossier global déposé (nom contenant « dossier ») pilote le scénario IA. */
  const globalDossierName = useMemo(
    () => imported.find((n) => /dossier/i.test(n)) ?? null,
    [imported],
  );
  /** Une carte mutuelle déposée séparément complète un dossier global incomplet. */
  const carteApportee = useMemo(
    () => imported.some((n) => !/dossier/i.test(n) && looksLikeCarteMutuelle(n)),
    [imported],
  );

  /**
   * Pièces manquantes :
   * — dossier global incomplet → carte mutuelle + CIN assuré (sauf carte apportée séparément) ;
   * — dépôts pièce par pièce → matching strict des 6 documents attendus.
   */
  const missing: string[] = useMemo(() => {
    if (!imported.length) return [];
    if (globalDossierName) {
      if (detectScenario(globalDossierName) !== "manquant" || carteApportee) return [];
      const ids = required.filter((id) => id === "carte_mutuelle" || id === "cin_assure");
      return ids.length ? ids : ["carte_mutuelle", "cin_assure"];
    }
    return missingFromFiles(imported, required);
  }, [imported, globalDossierName, carteApportee, required]);

  const etat: EtatDossier | null = !scenario
    ? null
    : missing.length > 0
      ? "Non conforme"
      : scenario === "manquant"
        ? "Conforme"
        : etatOfScenario(scenario);

  /* ------------------------- Ingestion étape 1 ------------------------- */

  /**
   * Zone de dépôt universelle : PDF global, document partiel ou pièces séparées,
   * en un ou plusieurs dépôts successifs avant le lancement de l'analyse.
   */
  const ingest = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;

    const noms = [...imported, ...list.map((f) => f.name)];
    setImported(noms);
    setGlobalName(noms.join(", "));

    const globalFile = list.find((f) => /dossier/i.test(f.name));
    const pdf = globalFile ?? list.find((f) => /\.pdf$/i.test(f.name));
    if (pdf && (pdf.type === "application/pdf" || /\.pdf$/i.test(pdf.name))) {
      setGlobalBytes(new Uint8Array(await pdf.arrayBuffer()));
    }

    const pieces = list.filter((f) => !/dossier/i.test(f.name));
    if (pieces.length) {
      const scans: Scan[] = pieces.map((f) => {
        const d = detectFromName(f.name);
        return {
          id: uid(),
          fileName: f.name,
          url: URL.createObjectURL(f),
          mime: f.type,
          pieceId: d.pieceId,
          side: d.side ?? (d.needsSide ? "recto" : null),
          angle: d.angle,
          straightened: true,
        };
      });
      setExtras((prev) => [...prev, ...scans]);
    }

    const pilote = noms.find((n) => /dossier/i.test(n));
    setScenario(pilote ? detectScenario(pilote) : "complet");
    setAuditRan(false);
    setLog([]);
    setCompiled(null);
    setDossierId(null);
    setDossierNum(null);
    setMailSent(false);
    setTransmitted(false);
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1600));
    setAnalyzing(false);
    toast.success(`Analyse IA terminée : ${list.length} document(s) traité(s)`);
  };

  /* ------------------------------ Audit IA ----------------------------- */

  const buildPlan = (sc: GlobalScenario): { plan: Plan[]; summary: AuditSummary } => {
    const corrections = ["Redressement et rotation automatique des documents mal orientés"];
    const plan: Plan[] = [
      {
        label: "Initialisation du moteur d'audit IA",
        detail: "Chargement des modèles de reconnaissance documentaire",
        final: "success",
      },
      {
        label: globalDossierName
          ? "Éclatement du dossier global et regroupement des pièces"
          : "Classement automatique des fichiers importés",
        detail: globalName ?? "Dossier importé",
        final: "success",
      },
      {
        label: "OCR — extraction du texte et des identifiants",
        detail: `Patient identifié : ${PATIENT} — Organisme : ${ORG}`,
        final: "success",
      },
      {
        label: "Redressement et rotation automatique",
        detail:
          sc === "rotes"
            ? "Redressement corrigé sur 2 documents (Demande de PEC : 270°, Carte mutuelle : 180°)"
            : "Redressement corrigé sur 1 document (Demande de PEC : 270°)",
        final: "success",
        badge: "Validé",
      },
    ];

    const summary: AuditSummary = {
      missing: [],
      rules: [],
      pieces: [],
      infos: [],
      detail: "",
      corrections,
    };

    if (sc === "ordre") {
      plan.push({
        label: "Réorganisation et placement strict selon l'ordre du référentiel",
        detail: `${required.length} pièce(s) replacées selon la matrice ${ORG} / PEC`,
        final: "success",
      });
      summary.corrections.push("Réorganisation des pièces selon l'ordre du référentiel");
    }

    if (sc === "verifier") {
      plan.push(
        {
          label: "Reconnaissance de la signature du praticien",
          detail: "Signature floue — l'IA n'a pas pu confirmer son authenticité",
          final: "warning",
          badge: "À vérifier",
        },
        {
          label: "Lecture de la date d'admission",
          detail: "Date ambiguë sur la demande de PEC (03/08 ou 08/03) — non déterminée",
          final: "warning",
          badge: "À vérifier",
        },
        {
          label: "Lecture du numéro d'immatriculation",
          detail: "Information partiellement illisible sur la carte mutuelle",
          final: "warning",
          badge: "À vérifier",
        },
      );
      summary.rules = ["Lisibilité et authenticité du cachet et de la signature du praticien"];
      summary.pieces = ["Note confidentielle", "Demande de PEC", "Carte mutuelle"];
      summary.infos = [
        "Signature du praticien floue / non reconnue",
        "Date d'admission ambiguë (illisible)",
        "Numéro d'immatriculation partiellement illisible",
      ];
      summary.detail =
        "Le contrôle automatique n'a pas pu déterminer avec certitude trois informations du dossier. Une vérification humaine par l'administration est requise avant transmission à l'organisme.";
    }

    if (sc === "errone") {
      plan.push(
        {
          label: "Concordance identité patient / organisme",
          detail:
            "Incohérence : le nom porté sur la note confidentielle diffère des pièces d'identité",
          final: "error",
        },
        {
          label: "Validité des pièces d'identité",
          detail: "CIN du patient expirée à la date d'admission",
          final: "error",
        },
      );
      summary.rules = [
        "Stricte concordance du nom, prénom et date de naissance entre les pièces",
        "Contrôle de la date d'expiration de la CIN",
      ];
      summary.pieces = ["Note confidentielle", "CIN patient"];
      summary.detail =
        "Le dossier comporte des anomalies bloquantes : incohérence d'identité entre les pièces et CIN expirée. Le dossier ne peut pas être transmis à l'organisme.";
    }

    if (missing.length > 0) {
      const list = missing.map((id) => labels[id] ?? id);
      plan.push({
        label: "Conformité au référentiel de l'organisme",
        detail: `Pièces obligatoires manquantes : ${list.join(", ")}`,
        final: "error",
      });
      summary.missing = list;
      summary.rules = ["Présence obligatoire de toutes les pièces du référentiel de l'intervention"];
      summary.pieces = list;
      summary.detail =
        "Le dossier est incomplet : des pièces obligatoires du référentiel ne figurent pas dans le document importé.";
    } else if (sc !== "errone" && sc !== "verifier") {
      plan.push({
        label: "Conformité au référentiel de l'organisme",
        detail: `${required.length} pièce(s) requises présentes`,
        final: "success",
      });
    }

    return { plan, summary };
  };

  const runAudit = async () => {
    if (!scenario) {
      toast.error("Importez d'abord les documents du dossier");
      return;
    }
    setRunning(true);
    const { plan, summary } = buildPlan(scenario);
    setLog(
      plan.map((p, i) => ({
        id: i,
        label: p.label,
        detail: p.detail,
        status: "pending" as AuditStatus,
        badge: p.badge,
      })),
    );
    for (let i = 0; i < plan.length; i++) {
      setLog((prev) => prev.map((s, j) => (j === i ? { ...s, status: "running" } : s)));
      await new Promise((r) => setTimeout(r, 600));
      setLog((prev) => prev.map((s, j) => (j === i ? { ...s, status: plan[i]!.final } : s)));
    }
    setRunning(false);
    setAuditRan(true);

    const currentEtat: EtatDossier = etat ?? "Non conforme";
    const items = await buildDossierItems(extras, labels);
    if (dossierId) {
      st.updateDossier(dossierId, { etat: currentEtat, audit: summary, items });
    } else {
      const id = st.commitDossier("Audité", undefined, items, {
        source: globalDossierName ? "global" : "standard",
        patient: PATIENT,
        interventionId,
        org: ORG,
        mode: "PEC",
        etat: currentEtat,
        envoye: false,
        audit: summary,
      });
      const num = useErp.getState().dossiers.find((d) => d.id === id)?.num ?? "DOS-2026-0000";
      st.updateDossier(id, { fileName: `PEC_CNSS_Ouassim_BEN_MESSAOUD_${num}.pdf` });
      setDossierId(id);
      setDossierNum(num);
    }

    if (currentEtat === "Conforme") toast.success("Dossier conforme — aucune anomalie bloquante");
    else if (currentEtat === "À vérifier")
      toast.warning("Dossier à vérifier — éléments non déterminés par l'IA");
    else toast.error("Dossier non conforme");
  };

  /* --------------------------- Compilation ----------------------------- */

  const summary = dossierId
    ? (st.dossiers.find((d) => d.id === dossierId)?.audit ?? null)
    : null;

  const generate = async () => {
    toast.loading("Compilation du dossier…", { id: "compile-dossier" });
    const reference = await fetchReferenceDossierBytes(referenceAsset);
    const base = reference ?? globalBytes;
    if (!base) {
      toast.dismiss("compile-dossier");
      toast.error("Dossier source introuvable — réimportez les documents");
      return;
    }
    const bytes = await compileGlobalDossierBytes(
      base,
      [],
      {
        title: `Dossier d'intervention — ${interventionName}`,
        patient: PATIENT,
        intervention: interventionName,
        organisme: ORG,
        mode: "PEC",
        labels,
      },
      { rotateLast: scenario === "rotes", coverAtEnd: true },
    );

    const dataUri = bytesToDataUri(bytes);
    setCompiled(dataUri);
    if (dossierId) st.updateDossier(dossierId, { pdfData: dataUri });
    toast.dismiss("compile-dossier");
    toast.success("Dossier compilé");
  };

  const pdfName = `PEC_CNSS_Ouassim_BEN_MESSAOUD_${dossierNum ?? "DOS-2026-0000"}.pdf`;

  const download = () => {
    if (!compiled) return;
    downloadDataUri(compiled, pdfName);
    toast.success(`Téléchargement : ${pdfName}`);
  };

  const sendAdminMail = () => {
    if (!dossierId || !etat) return;
    const res = sendDossierEmail(dossierId, etat);
    setMailSent(true);
    toast.success(`E-mail envoyé à l'administration (${res?.to ?? "administration"})`);
  };

  const blocked = !auditRan || etat !== "Conforme";

  const admin = useAdmin();
  const mailPreview = useMemo(() => {
    const record = dossierId ? st.dossiers.find((d) => d.id === dossierId) : null;
    if (!record || !etat) return { to: "—", subject: "—", body: "—" };
    const sc = admin.emails.scenarios[scenarioKeyForEtat(record.mode, etat)];
    return {
      to: sc.to.join(", "),
      subject: renderTemplate(sc.subject, record, interventionName),
      body: renderTemplate(sc.body, record, interventionName),
    };
  }, [admin.emails.scenarios, dossierId, etat, interventionName, st.dossiers]);


  /* ------------------------------ Rendu -------------------------------- */

  return (
    <div className="flex flex-col gap-5">
      <div className="glass rounded-2xl px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              onClick={onExit}
            >
              <ArrowLeft className="size-4" /> Retour
            </Button>
            <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
              <FileStack className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Nouveau Dossier d'intervention</p>
              <p className="text-[11px] text-muted-foreground">
                Importez les pièces ou le dossier global : l'IA extrait et contrôle automatiquement
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {auditRan && etat && <EtatBadge etat={etat} />}
            {step > 1 && (
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => setStep((s) => s - 1)}
              >
                Précédent
              </Button>
            )}
            {step === 1 && (
              <Button
                className="rounded-xl"
                disabled={!scenario || analyzing}
                onClick={() => setStep(2)}
              >
                Suivant
              </Button>
            )}
            {step === 2 && (
              <Button
                className="rounded-xl"
                disabled={blocked}
                onClick={() => setStep(3)}
                title={blocked ? "Étape réservée aux dossiers conformes" : undefined}
              >
                Suivant
              </Button>
            )}
          </div>
        </div>
      </div>


      <div className="glass flex flex-wrap items-center justify-center gap-3 rounded-2xl px-5 py-3">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              if (s.id === 3 && blocked) {
                toast.error("Étape réservée aux dossiers conformes");
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
        ref={filesRef}
        type="file"
        hidden
        multiple
        accept="application/pdf,image/*"
        onChange={(e) => {
          void ingest(e.target.files);
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
                void ingest(e.dataTransfer.files);
              }}
              className="glass-soft flex flex-col items-center justify-center gap-2 rounded-2xl border-dashed py-12 text-center"
            >
              <FileStack className="size-9 text-accent" />
              <p className="text-sm font-medium">
                Glissez-déposez vos fichiers (PDF / Images)
              </p>
              <p className="max-w-xl text-xs text-muted-foreground">
                Déposez un dossier global complet, un document partiel ou plusieurs pièces
                séparées. L'IA extrait, regroupe et analyse l'ensemble automatiquement.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Button className="rounded-xl" onClick={() => filesRef.current?.click()}>
                <Upload className="size-4" /> Importer / Scanner les documents
              </Button>
            </div>
            {imported.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {imported.map((n) => (
                  <span
                    key={n}
                    className="glass-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] text-muted-foreground"
                  >
                    <Files className="size-3 text-accent" /> {n}
                  </span>
                ))}
              </div>
            )}
          </Panel>

          {analyzing && (
            <div className="glass flex items-center justify-center gap-3 rounded-2xl px-5 py-4 text-sm text-accent">
              <Loader2 className="size-5 animate-spin" />
              Analyse IA du document en cours…
            </div>
          )}


          {!analyzing && scenario && (
            <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-5 py-3 text-[11px]">
              <span className="mr-1 tracking-wide text-muted-foreground uppercase">
                Données extraites
              </span>
              <span className="rounded-md bg-primary/20 px-2 py-1 text-accent">
                Patient : {PATIENT}
              </span>
              <span className="rounded-md bg-primary/20 px-2 py-1 text-accent">
                Intervention : {interventionName}
              </span>
              <span className="rounded-md bg-primary/20 px-2 py-1 text-accent">Mode : PEC</span>
              <span className="rounded-md bg-primary/20 px-2 py-1 text-accent">
                Organisme : {ORG}
              </span>
            </div>
          )}

          {!analyzing && scenario && (
            <Panel
              title={`Checklist des exigences (${required.length})`}
              action={
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {required.length - missing.length}/{required.length} conformes
                </span>
              }
            >
              <div className="flex flex-col gap-2.5">
                {required.map((id, i) => {
                  const ok = !missing.includes(id);
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
                        <AlertTriangle className="size-4 shrink-0 text-destructive" />
                      )}
                      <p className={cn("min-w-0 flex-1 truncate text-sm", ok && "text-success")}>
                        {labels[id] ?? id}
                      </p>
                      {ok && <span className="text-sm text-success">✓</span>}
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          {auditRan && etat && (
            <Panel
              title="Résultats et synthèse du contrôle"
              action={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <EtatBadge etat={etat} />
                  {etat !== "Conforme" && (
                    <>
                      <Button
                        variant="secondary"
                        className="rounded-xl"
                        disabled={running}
                        onClick={runAudit}
                      >
                        <Sparkles className="size-4" /> Relancer le contrôle
                      </Button>
                      <Button
                        className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                        onClick={() => setMailOpen(true)}
                      >
                        <Mail className="size-4" />
                        {mailSent ? "E-mail envoyé" : "Envoyer l'e-mail à l'administration"}
                      </Button>
                    </>
                  )}
                </div>
              }
            >
              <div className="flex flex-col gap-3">
                {etat === "Conforme" && (
                  <p className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-3 text-sm text-success">
                    <CheckCircle2 className="size-4" />
                    Dossier conforme — aucune anomalie bloquante détectée
                  </p>
                )}

                {summary?.corrections.length ? (
                  <div className="rounded-xl border border-success/40 bg-success/10 px-3 py-3">
                    <p className="text-[11px] tracking-wide text-success uppercase">
                      Corrections automatiques
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-xs text-success">
                      {summary.corrections.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {etat !== "Conforme" && summary && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <SummaryBlock
                      title="Pièces manquantes"
                      items={summary.missing}
                      tone={etat === "Non conforme" ? "red" : "orange"}
                    />
                    <SummaryBlock
                      title="Règles non respectées"
                      items={summary.rules}
                      tone={etat === "Non conforme" ? "red" : "orange"}
                    />
                    <SummaryBlock
                      title="Pièces concernées"
                      items={summary.pieces}
                      tone={etat === "Non conforme" ? "red" : "orange"}
                    />
                    <SummaryBlock
                      title="Informations problématiques / non déterminées"
                      items={summary.infos}
                      tone={etat === "Non conforme" ? "red" : "orange"}
                    />
                    <div className="glass-soft rounded-xl px-3 py-3 md:col-span-2">
                      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Détail fourni par l'IA
                      </p>
                      <p className="mt-1 text-xs text-foreground/90">{summary.detail}</p>
                    </div>
                  </div>
                )}

                {etat !== "Conforme" && (
                  <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-xs text-amber-400">
                    L'étape « Aperçu et Transmission » est réservée aux dossiers conformes. Utilisez
                    le bouton « Envoyer l'e-mail à l'administration » ci-dessus.
                  </p>
                )}
              </div>
            </Panel>
          )}

          <Panel
            title="Journal d'Audit IA"
            action={
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {auditRan ? "Contrôle effectué" : "Contrôle non lancé"}
                </span>
                {log.length > 0 && (
                  <Button className="rounded-xl" disabled={running} onClick={runAudit}>
                    <Sparkles className="size-4" />
                    {auditRan ? "Relancer l'analyse" : "Lancer l'analyse"}
                  </Button>
                )}
              </div>
            }
          >
            {log.length === 0 ? (
              <div className="glass-soft flex flex-col items-center gap-3 rounded-2xl px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  En attente du lancement de l'analyse IA…
                </p>
                <Button className="rounded-xl" disabled={running} onClick={runAudit}>
                  <Sparkles className="size-4" /> Lancer l'analyse
                </Button>
              </div>
            ) : (
              <ol className="relative flex flex-col gap-3 pl-6">
                <span className="absolute top-2 bottom-2 left-2 w-px bg-border" />
                {log.map((s, i) => (
                  <AuditStepCard key={s.id} step={s} index={i} />
                ))}
              </ol>
            )}
          </Panel>
        </div>
      )}

      {step === 3 && (
        <Panel
          title="Aperçu et Transmission"
          subtitle={
            compiled ? pdfName : "Générez le dossier compilé (page de garde en fin de document)"
          }
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
                <p className="text-xs text-muted-foreground">
                  Cliquez sur « Générer le dossier » ci-dessous
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button className="rounded-xl" onClick={generate}>
              <FileText className="size-4" /> {compiled ? "Régénérer le dossier" : "Générer le dossier"}
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl"
              disabled={!compiled}
              onClick={download}
            >
              <Download className="size-4" /> Télécharger le PDF
            </Button>
            <Button
              className="rounded-xl"
              disabled={!compiled || transmitted}
              onClick={() => {
                if (!dossierId) return;
                const res = sendDossierEmail(dossierId, "Conforme");
                setTransmitted(true);
                toast.success(`Dossier transmis (${res?.to ?? ORG})`);
              }}
            >
              <Send className="size-4" /> Transmettre
            </Button>
          </div>
        </Panel>
      )}

      <Dialog open={mailOpen} onOpenChange={setMailOpen}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification à l'administration</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div className="glass-soft rounded-xl px-3 py-2">
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Destinataire(s)
              </p>
              <p className="mt-1 text-xs text-accent">{mailPreview.to}</p>
            </div>
            <div className="glass-soft rounded-xl px-3 py-2">
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Objet</p>
              <p className="mt-1 text-xs">{mailPreview.subject}</p>
            </div>
            <div className="glass-soft max-h-[40vh] overflow-auto rounded-xl px-3 py-2">
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Message</p>
              <pre className="mt-1 font-sans text-xs whitespace-pre-wrap text-foreground/90">
                {mailPreview.body}
              </pre>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" className="rounded-xl" onClick={() => setMailOpen(false)}>
              Annuler
            </Button>
            <Button
              className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
              onClick={() => {
                sendAdminMail();
                setMailOpen(false);
              }}
            >
              <Mail className="size-4" /> Envoyer l'e-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function SummaryBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "red" | "orange";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        tone === "red"
          ? "border-destructive/40 bg-destructive/10"
          : "border-amber-500/40 bg-amber-500/10",
      )}
    >
      <p
        className={cn(
          "text-[11px] tracking-wide uppercase",
          tone === "red" ? "text-destructive" : "text-amber-400",
        )}
      >
        {title}
      </p>
      {items.length ? (
        <ul
          className={cn(
            "mt-1 list-disc pl-5 text-xs",
            tone === "red" ? "text-destructive" : "text-amber-400",
          )}
        >
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Aucun</p>
      )}
    </div>
  );
}
