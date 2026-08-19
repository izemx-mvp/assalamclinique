import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
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
import { useErp, type DossierRecord, type Scan } from "@/store/erp-store";
import { Panel, Segmented } from "./ui-bits";
import { cn } from "@/lib/utils";

const PATIENT = {
  code: "CLINI-001",
  nom: "Ouassim BEN MASSAOUD",
  cin: "S774138",
};

const uid = () => Math.random().toString(36).slice(2, 10);

const STEPS = [
  { id: 1, label: "Scanner et Importer" },
  { id: 2, label: "Journal d'Audit IA" },
  { id: 3, label: "Aperçu & Transmission" },
];

export function Dossiers() {
  const st = useErp();
  const [mode, setMode] = useState<"list" | "wizard">("list");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<DossierRecord | null>(null);
  const [toDelete, setToDelete] = useState<DossierRecord | null>(null);

  const names = useMemo(
    () => Object.fromEntries(st.interventions.map((i) => [i.id, i.name])),
    [st.interventions],
  );

  const filtered = st.dossiers.filter((d) =>
    `${d.num} ${d.patient} ${names[d.interventionId] ?? ""} ${d.org}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

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
                <th className="px-3 pb-1 text-right font-medium">Aperçu</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="glass-soft">
                  <td className="rounded-l-xl px-3 py-3 font-mono text-xs text-accent">{d.num}</td>
                  <td className="px-3 py-3 font-medium">{d.patient}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {names[d.interventionId] ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {ORGANISMES.find((o) => o.id === d.org)?.label ?? d.org}
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
                        title="Consulter le dossier"
                        onClick={() => setDetail(d)}
                      >
                        <Eye className="size-4" />
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
      </Panel>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail du dossier {detail?.num}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-2 text-sm">
              {[
                ["Patient", detail.patient],
                ["Intervention", names[detail.interventionId] ?? "—"],
                ["Organisme", ORGANISMES.find((o) => o.id === detail.org)?.label ?? detail.org],
                ["Mode", detail.mode === "PEC" ? "PEC" : "Expédition"],
                ["Date de création", detail.createdAt],
                ["Créé par", detail.createdBy],
                ["Statut", detail.statut],
                ["Pages compilées", `${detail.pages} page(s)`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="glass-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground">{k}</span>
                  <span className="truncate font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter />
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
  const [pending, setPending] = useState<Scan | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
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
      const scan: Scan = {
        id: uid(),
        fileName: file.name,
        url: URL.createObjectURL(file),
        mime: file.type,
        pieceId: forced ?? d.pieceId,
        side: d.side,
        angle: d.angle,
        straightened: false,
      };
      if (!forced && (d.needsSide || !d.pieceId)) setPending(scan);
      else {
        st.addScan(scan);
        toast.success(`Reconnu : ${labels[scan.pieceId!] ?? scan.pieceId}`);
      }
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
    setLog([]);
    const lines = [
      "Initialisation du moteur d'audit IA…",
      `Lecture de ${st.scans.length} page(s) importée(s)`,
      "OCR : extraction du texte et des identifiants…",
      "Redressement / rotation automatique des documents…",
      "Vérification des anomalies (flou, coupure, doublon)…",
      "Détection de conformité par rapport au référentiel…",
    ];
    for (const l of lines) {
      await new Promise((r) => setTimeout(r, 420));
      setLog((p) => [...p, l]);
    }
    st.straightenAll();
    await new Promise((r) => setTimeout(r, 300));
    setLog((p) => [
      ...p,
      `Résultat : ${missing.length} pièce(s) manquante(s), ${anomalies.length} anomalie(s).`,
    ]);
    st.setAuditRan(true);
    setRunning(false);
    if (missing.length === 0 && anomalies.length === 0) toast.success("Dossier conforme");
    else toast.warning("Points bloquants détectés");
  };

  const pdfName = `${st.dosMode === "PEC" ? "PEC" : "EXP"}_${st.dosOrg}_Ouassim-BEN-MASSAOUD_CLINI-01.pdf`;

  const download = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i]!;
      if (i > 0) doc.addPage();
      doc.setFontSize(11);
      doc.text(
        `${i + 1}. ${s.pieceId ? (labels[s.pieceId] ?? s.pieceId) : "Non classé"}${s.side ? ` (${s.side})` : ""}`,
        40,
        40,
      );
      if (s.mime.startsWith("image/")) {
        try {
          doc.addImage(s.url, 40, 60, 515, 700, undefined, "FAST");
        } catch {
          doc.text(s.fileName, 40, 80);
        }
      } else {
        doc.text(s.fileName, 40, 80);
      }
    }
    doc.save(pdfName);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
            <Stethoscope className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Nouveau Dossier</p>
            <p className="text-[11px] text-muted-foreground">
              Patient : {PATIENT.nom} | CIN : {PATIENT.cin} | Organisme :{" "}
              {ORGANISMES.find((o) => o.id === st.dosOrg)?.label} | Intervention :{" "}
              {st.interventions.find((p) => p.id === st.dosProfil)?.name}
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
          <select
            value={st.dosOrg}
            onChange={(e) => st.setDos({ dosOrg: e.target.value })}
            className="glass-soft h-10 rounded-xl px-3 text-sm outline-none"
          >
            {ORGANISMES.map((o) => (
              <option key={o.id} value={o.id} className="bg-popover">
                {o.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" className="rounded-xl" onClick={onExit}>
            <ArrowLeft className="size-4" /> Retour
          </Button>
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
            <div className="glass-soft mt-4 h-[280px] overflow-y-auto rounded-2xl p-4 font-mono text-[11px] text-muted-foreground">
              {log.length === 0 && <p>En attente du lancement du contrôle…</p>}
              {log.map((l, i) => (
                <p key={i} className="py-0.5">
                  <span className="text-accent">›</span> {l}
                </p>
              ))}
              {running && <p className="animate-pulse py-0.5 text-accent">› traitement…</p>}
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
              onClick={() => {
                st.setGenerated(pdfName);
                st.commitDossier("Audité");
                toast.success(`Dossier généré : ${pdfName}`);
              }}
            >
              <FileText className="size-4" /> Générer le dossier
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl"
              disabled={!st.generated}
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

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Classer le document</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{pending?.fileName}</p>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {pending?.pieceId === "cin_patient" ? (
              <div className="flex gap-2">
                {(["recto", "verso"] as const).map((side) => (
                  <Button
                    key={side}
                    variant="secondary"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      st.addScan({ ...pending, side });
                      setPending(null);
                      toast.success(`CIN patient (${side}) ajoutée`);
                    }}
                  >
                    {side}
                  </Button>
                ))}
              </div>
            ) : (
              st.pieces.map((p) => (
                <button
                  key={p.id}
                  className="glass-soft w-full rounded-xl px-3 py-2 text-left text-sm hover:text-accent"
                  onClick={() => {
                    if (!pending) return;
                    st.addScan({ ...pending, pieceId: p.id });
                    setPending(null);
                    toast.success(`Classé : ${p.label}`);
                  }}
                >
                  {p.label}
                </button>
              ))
            )}
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
