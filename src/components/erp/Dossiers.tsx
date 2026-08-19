import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  RefreshCcw,
  ScanLine,
  Search,
  Send,
  Sparkles,
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
import { detectFromName, hasAnomaly } from "@/lib/erp/detect";
import { useErp, type Scan } from "@/store/erp-store";
import { Panel, Segmented } from "./ui-bits";

const PATIENT = {
  code: "CLINI-001",
  nom: "Ouassim BEN MASSAOUD",
  cin: "S774138",
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function Dossiers() {
  const st = useErp();
  const savedOrder = useErp((s) => s.savedOrder);
  const required = savedOrder(st.dosProfil, st.dosOrg, st.dosMode);
  const labels = useMemo(
    () => Object.fromEntries(st.pieces.map((p) => [p.id, p.label])),
    [st.pieces],
  );

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<Scan | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);

  const hasSide = (side: "recto" | "verso") =>
    st.scans.some((s) => s.pieceId === "cin_patient" && s.side === side);

  const satisfied = (pieceId: string) => {
    if (pieceId === "cin_assure") return true;
    if (pieceId === "cin_patient") return hasSide("recto") && hasSide("verso");
    return st.scans.some((s) => s.pieceId === pieceId);
  };

  const missing = required.filter((id) => !satisfied(id));
  const anomalies = st.scans.filter((s) => hasAnomaly(s.fileName));
  const conform = st.auditRan && missing.length === 0 && anomalies.length === 0;

  const ordered = [...st.scans].sort((a, b) => {
    const ia = a.pieceId ? required.indexOf(a.pieceId) : 999;
    const ib = b.pieceId ? required.indexOf(b.pieceId) : 999;
    if (ia !== ib) return (ia < 0 ? 998 : ia) - (ib < 0 ? 998 : ib);
    return (a.side === "verso" ? 1 : 0) - (b.side === "verso" ? 1 : 0);
  });

  const current = st.scans.find((s) => s.id === selected) ?? ordered[0] ?? null;

  const ingest = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const d = detectFromName(file.name);
      const scan: Scan = {
        id: uid(),
        fileName: file.name,
        url: URL.createObjectURL(file),
        mime: file.type,
        pieceId: d.pieceId,
        side: d.side,
        angle: d.angle,
        straightened: false,
      };
      if (d.needsSide || !d.pieceId) setPending(scan);
      else {
        st.addScan(scan);
        toast.success(`Reconnu : ${labels[d.pieceId] ?? d.pieceId}`);
      }
    });
  };

  const doReplace = (files: FileList | null) => {
    const file = files?.[0];
    const id = replaceTarget.current;
    if (!file || !id) return;
    const d = detectFromName(file.name);
    st.updateScan(id, {
      fileName: file.name,
      url: URL.createObjectURL(file),
      mime: file.type,
      pieceId: d.pieceId ?? st.scans.find((s) => s.id === id)?.pieceId ?? null,
      side: d.side ?? st.scans.find((s) => s.id === id)?.side ?? null,
      angle: d.angle,
      straightened: false,
    });
    st.setAuditRan(false);
    st.setGenerated(null);
    toast.success("Pièce remplacée — relancez le contrôle IA");
  };

  const pdfName = `${st.dosMode === "PEC" ? "PEC" : "EXP"}_${st.dosOrg}_Ouassim-BEN-MASSAOUD_CLINI-01.pdf`;

  const generate = async () => {
    st.setGenerated(pdfName);
    toast.success(`Dossier compilé (${ordered.length} pages) : ${pdfName}`);
  };

  const download = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i];
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
      <Panel title="Dossiers Interventions / ERP Clinique — Audit IA">
        <div className="flex flex-wrap items-center gap-3">
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
            {st.profils.map((p) => (
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
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une pièce, un patient…"
              className="glass-soft h-10 rounded-xl border-0 pl-9"
            />
          </div>
          <select className="glass-soft h-10 rounded-xl px-3 text-sm outline-none">
            <option className="bg-popover">
              {PATIENT.code} — {PATIENT.nom}
            </option>
          </select>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Patient : {PATIENT.nom} | CIN Patient : {PATIENT.cin} | CIN Assuré : {PATIENT.cin} |
          Assuré : {PATIENT.nom} (lui-même) | Organisme :{" "}
          {ORGANISMES.find((o) => o.id === st.dosOrg)?.label}
        </p>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-5">
          <Panel title="Checklist dynamique" subtitle="Pièces attendues issues du paramétrage">
            <div className="flex flex-col gap-2">
              {required
                .filter((id) =>
                  (labels[id] ?? id).toLowerCase().includes(search.toLowerCase()),
                )
                .map((id, i) => {
                  const ok = satisfied(id);
                  return (
                    <div
                      key={id}
                      className={`glass-soft flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                        ok ? "border-success/40" : ""
                      }`}
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/25 text-[11px] text-accent">
                        {i + 1}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${ok ? "text-success" : "text-muted-foreground"}`}
                      >
                        {labels[id] ?? id}
                      </span>
                      {id === "cin_assure" && (
                        <span className="text-[10px] text-muted-foreground">Patient = Assuré</span>
                      )}
                      {id === "cin_patient" && (
                        <span className="text-[10px] text-muted-foreground">
                          {hasSide("recto") ? "R✓" : "R–"} {hasSide("verso") ? "V✓" : "V–"}
                        </span>
                      )}
                      {ok ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : (
                        <AlertTriangle className="size-4 text-destructive" />
                      )}
                    </div>
                  );
                })}
            </div>
          </Panel>

          <Panel title="Zone de dépôt des scans">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                ingest(e.dataTransfer.files);
              }}
              className="glass-soft flex flex-col items-center justify-center gap-2 rounded-2xl border-dashed py-10 text-center"
            >
              <ScanLine className="size-7 text-accent" />
              <p className="text-sm text-muted-foreground">
                Glissez-déposez vos scans ici (images ou PDF)
              </p>
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
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button className="rounded-xl" onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" /> Importer des fichiers
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  st.straightenAll();
                  toast.success("Pages rangées et redressées en paysage");
                }}
              >
                <Sparkles className="size-4" /> IA : ranger &amp; redresser
              </Button>
            </div>
          </Panel>

          <Panel title="Ordre du dossier" subtitle={`${ordered.length} page(s) téléversée(s)`}>
            <div className="flex flex-col gap-2">
              {ordered.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun scan importé.
                </p>
              )}
              {ordered.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`glass-soft flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${
                    current?.id === s.id ? "glow-ring" : ""
                  }`}
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
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {s.angle}°
                  </span>
                  {hasAnomaly(s.fileName) && (
                    <AlertTriangle className="size-4 text-destructive" />
                  )}
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
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Aperçu document" subtitle={current?.fileName ?? "Aucun document"}>
            <div className="glass-soft grid min-h-[320px] place-items-center overflow-hidden rounded-2xl p-3">
              {current ? (
                current.mime.startsWith("image/") ? (
                  <img
                    src={current.url}
                    alt={current.fileName}
                    style={{ transform: `rotate(${current.angle}deg)` }}
                    className="max-h-[320px] rounded-xl object-contain transition-transform"
                  />
                ) : (
                  <object
                    data={current.url}
                    type="application/pdf"
                    className="h-[320px] w-full rounded-xl"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="size-8" />
                      <span className="text-sm">{current.fileName}</span>
                    </div>
                  </object>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sélectionnez une pièce dans l'ordre du dossier
                </p>
              )}
            </div>
            <input
              ref={replaceRef}
              type="file"
              hidden
              onChange={(e) => {
                doReplace(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                className="rounded-xl"
                disabled={!current}
                onClick={() => {
                  replaceTarget.current = current?.id ?? null;
                  replaceRef.current?.click();
                }}
              >
                <RefreshCcw className="size-4" /> Remplacer la pièce
              </Button>
            </div>
          </Panel>

          <Panel title="Journal d'audit IA">
            <div className="flex items-center justify-center gap-3">
              <Button
                className="rounded-xl"
                onClick={() => {
                  st.setAuditRan(true);
                  toast.success("Contrôle IA (OCR) terminé");
                }}
              >
                <Sparkles className="size-4" /> Lancer le contrôle IA
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {!st.auditRan && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Lancez le contrôle IA pour analyser le dossier.
                </p>
              )}
              {st.auditRan && conform && (
                <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 px-3 py-3 text-sm text-success">
                  <CheckCircle2 className="size-4" /> Dossier 100% conforme — transmission
                  autorisée.
                </div>
              )}
              {st.auditRan &&
                missing.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm"
                  >
                    <AlertTriangle className="size-4 shrink-0 text-destructive" />
                    <span className="min-w-0 flex-1 text-destructive">
                      Document manquant : {labels[id] ?? id}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-lg"
                      onClick={() => inputRef.current?.click()}
                    >
                      <Plus className="size-3.5" /> Ajouter la pièce
                    </Button>
                  </div>
                ))}
              {st.auditRan &&
                anomalies.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm"
                  >
                    <AlertTriangle className="size-4 shrink-0 text-destructive" />
                    <span className="min-w-0 flex-1 text-destructive">
                      Anomalie détectée sur « {s.fileName} » : document illisible / non conforme
                      (signature ou cachet absent).
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
                      <RefreshCcw className="size-3.5" /> Remplacer la pièce
                    </Button>
                  </div>
                ))}
            </div>
          </Panel>

          <Panel title="Génération &amp; transmission" subtitle={st.generated ?? pdfName}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button className="rounded-xl" onClick={generate} disabled={ordered.length === 0}>
                <FileText className="size-4" /> Générer le dossier
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl"
                disabled={!conform || !st.generated}
                onClick={download}
              >
                <Download className="size-4" /> Télécharger le dossier (PDF)
              </Button>
              <Button
                className="rounded-xl"
                disabled={!conform}
                onClick={() => {
                  st.setTransmitted(true);
                  toast.success(
                    st.dosMode === "PEC" ? "Transmis à la PEC" : "Transmis à l'Expédition",
                  );
                }}
              >
                <Send className="size-4" />
                {st.dosMode === "PEC"
                  ? "Transmettre à la PEC"
                  : "Valider et Transmettre à l'Expédition"}
              </Button>
            </div>
            {st.transmitted && (
              <p className="mt-3 text-center text-xs text-success">
                Dossier transmis avec succès.
              </p>
            )}
          </Panel>
        </div>
      </div>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>
              {pending?.pieceId === "cin_patient"
                ? "Est-ce le Recto ou le Verso de la CIN ?"
                : "Classification manuelle du document"}
            </DialogTitle>
          </DialogHeader>
          {pending?.pieceId === "cin_patient" ? (
            <DialogFooter className="sm:justify-center">
              {(["recto", "verso"] as const).map((side) => (
                <Button
                  key={side}
                  onClick={() => {
                    st.addScan({ ...pending, side });
                    setPending(null);
                  }}
                >
                  {side === "recto" ? "Recto" : "Verso"}
                </Button>
              ))}
            </DialogFooter>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {required.map((id) => (
                <button
                  key={id}
                  className="glass-soft w-full rounded-xl px-3 py-2 text-left text-sm hover:text-accent"
                  onClick={() => {
                    if (!pending) return;
                    st.addScan({ ...pending, pieceId: id });
                    setPending(null);
                  }}
                >
                  {labels[id] ?? id}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
