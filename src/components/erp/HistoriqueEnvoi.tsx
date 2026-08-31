import { useMemo, useState } from "react";
import { Download, Eye, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadDataUri } from "@/lib/erp/dossier-pdf";
import { sendDossierEmail } from "@/lib/erp/notify";
import { useAdmin } from "@/store/admin-store";
import { useErp, type DossierRecord } from "@/store/erp-store";
import { EtatBadge } from "./DossiersUnifie";
import { FilterInput, PageHeader, Pagination, Panel, StatusPill } from "./ui-bits";
import { cn } from "@/lib/utils";

/** Motif affiché en infobulle lorsque la transmission e-mail a échoué. */
const MAIL_ERROR =
  "Échec de la transmission : aucun accusé de remise reçu du serveur de messagerie. Relancez l'envoi.";

const ETATS = [
  { value: "", label: "Tous les états", dot: "bg-muted-foreground" },
  { value: "Conforme", label: "Conforme", dot: "bg-success" },
  { value: "Non conforme", label: "Non conforme", dot: "bg-destructive" },
  { value: "À vérifier", label: "À vérifier", dot: "bg-amber-400" },
];

export function HistoriqueEnvoi() {
  const st = useErp();
  const ad = useAdmin();
  const [detail, setDetail] = useState<DossierRecord | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filters, setFilters] = useState({
    num: "",
    patient: "",
    intervention: "",
    org: "",
    mode: "",
    etat: "",
    envoye: "",
  });

  const names = useMemo(
    () => Object.fromEntries(st.interventions.map((i) => [i.id, i.name])),
    [st.interventions],
  );
  const setFilter = (k: keyof typeof filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };
  const has = (v: string, q: string) => v.toLowerCase().includes(q.trim().toLowerCase());

  const filtered = st.dossiers.filter((d) => {
    const etat = d.etat ?? "Conforme";
    return (
      has(d.num, filters.num) &&
      has(d.patient, filters.patient) &&
      has(names[d.interventionId] ?? "", filters.intervention) &&
      has(ad.orgLabel(d.org), filters.org) &&
      (filters.mode === "" || (d.mode ?? "PEC") === filters.mode) &&
      (filters.etat === "" || etat === filters.etat) &&
      (filters.envoye === "" ||
        (filters.envoye === "ok" ? !!d.envoye : !d.envoye))
    );
  });

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = {
    total: st.dossiers.length,
    ok: st.dossiers.filter((d) => (d.etat ?? "Conforme") === "Conforme").length,
    ko: st.dossiers.filter((d) => d.etat === "Non conforme").length,
    verif: st.dossiers.filter((d) => d.etat === "À vérifier").length,
  };

  const resend = (d: DossierRecord) => {
    const res = sendDossierEmail(d.id, d.etat ?? "Conforme");
    toast.success(`E-mail renvoyé à ${res?.to ?? "—"}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={<Send className="size-5" />}
        title="Historique d'envoi"
        subtitle="Tous les dossiers audités, conformes ou non, avec leur statut de transmission"
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Dossiers audités", value: stats.total, tone: "text-accent" },
          { label: "Conformes", value: stats.ok, tone: "text-success" },
          { label: "Non conformes", value: stats.ko, tone: "text-destructive" },
          { label: "À vérifier", value: stats.verif, tone: "text-amber-400" },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl px-4 py-3">
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
            <p className={cn("text-2xl font-semibold", c.tone)}>{c.value}</p>
          </div>
        ))}
      </div>

      <Panel
        title="Dossiers transmis et audités"
        subtitle={`${filtered.length} dossier(s)`}
        action={
          <select
            value={filters.etat}
            onChange={(e) => setFilter("etat", e.target.value)}
            className="glass-soft h-9 rounded-xl px-3 text-xs text-foreground outline-none"
          >
            {ETATS.map((e) => (
              <option key={e.value} value={e.value} className="bg-popover">
                {e.value === "Conforme"
                  ? "🟢 Conforme"
                  : e.value === "Non conforme"
                    ? "🔴 Non conforme"
                    : e.value === "À vérifier"
                      ? "🟠 À vérifier"
                      : e.label}
              </option>
            ))}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-3 pb-1 font-medium">N° Dossier</th>
                <th className="px-3 pb-1 font-medium">Patient</th>
                <th className="px-3 pb-1 font-medium">Intervention</th>
                <th className="px-3 pb-1 font-medium">Organisme</th>
                <th className="px-3 pb-1 font-medium">Mode</th>
                <th className="px-3 pb-1 font-medium">État</th>
                <th className="px-3 pb-1 font-medium">Statut E-mail</th>
                <th className="px-3 pb-1 font-medium">Destinataire</th>
                <th className="px-3 pb-1 text-right font-medium">Actions</th>
              </tr>
              <tr>
                <th className="px-3 pb-2">
                  <FilterInput
                    value={filters.num}
                    onChange={(v) => setFilter("num", v)}
                    placeholder="N°…"
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
                    className="glass-soft h-8 w-full rounded-lg px-2 text-[11px] font-normal normal-case outline-none"
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
                <th className="px-3 pb-2">
                  <select
                    value={filters.etat}
                    onChange={(e) => setFilter("etat", e.target.value)}
                    className="glass-soft h-8 w-full rounded-lg px-2 text-[11px] font-normal normal-case outline-none"
                  >
                    {ETATS.map((e) => (
                      <option key={e.value} value={e.value} className="bg-popover">
                        {e.label}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-3 pb-2">
                  <select
                    value={filters.envoye}
                    onChange={(e) => setFilter("envoye", e.target.value)}
                    className="glass-soft h-8 w-full rounded-lg px-2 text-[11px] font-normal normal-case outline-none"
                  >
                    <option value="" className="bg-popover">
                      Tous
                    </option>
                    <option value="ok" className="bg-popover">
                      🟢 Succès
                    </option>
                    <option value="ko" className="bg-popover">
                      🔴 Échec
                    </option>
                  </select>
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
                      {(d.mode ?? "PEC") === "EXPEDITION" ? "Expédition" : "PEC"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <EtatBadge etat={d.etat} />
                  </td>
                  <td className="px-3 py-3 text-[11px]">
                    {d.envoye ? (
                      <span title={`Envoyé le ${d.sentAt ?? d.createdAt}`}>
                        <StatusPill tone="green">Succès · {d.sentAt ?? d.createdAt}</StatusPill>
                      </span>
                    ) : (
                      <span title={MAIL_ERROR}>
                        <StatusPill tone="red">Échec</StatusPill>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-muted-foreground">
                    {d.sentTo ?? "—"}
                  </td>
                  <td className="rounded-r-xl px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 hover:text-accent"
                        title="Détail de l'audit"
                        onClick={() => setDetail(d)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 hover:text-accent"
                        title="Télécharger le PDF"
                        onClick={() => {
                          if (!d.pdfData) {
                            toast.error("Aucun PDF compilé pour ce dossier");
                            return;
                          }
                          downloadDataUri(d.pdfData, d.fileName ?? `${d.num}.pdf`);
                        }}
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "size-8 hover:text-accent",
                          !d.envoye && "text-amber-400 hover:text-amber-300",
                        )}
                        title={d.envoye ? "Renvoyer l'e-mail" : "Relancer l'envoi (échec)"}
                        onClick={() => resend(d)}
                      >
                        <Mail className="size-4" />
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun dossier ne correspond aux filtres.
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
        <DialogContent className="glass max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détail d'audit — {detail?.num}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Patient", detail.patient],
                  ["Intervention", names[detail.interventionId] ?? "—"],
                  ["Organisme", ad.orgLabel(detail.org)],
                  ["Mode", (detail.mode ?? "PEC") === "EXPEDITION" ? "Expédition" : "PEC"],
                ].map(([k, v]) => (
                  <div key={k} className="glass-soft rounded-xl px-3 py-2 text-xs">
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ))}
              </div>

              <div className="glass-soft rounded-xl px-3 py-3 text-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    Synthèse du contrôle IA
                  </p>
                  <EtatBadge etat={detail.etat} />
                </div>
                {detail.audit?.detail && (
                  <p className="mt-2 text-foreground/90">{detail.audit.detail}</p>
                )}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    { label: "Pièces manquantes", items: detail.audit?.missing ?? [] },
                    {
                      label: "Pièces concernées",
                      items: [...(detail.audit?.missing ?? []), ...(detail.audit?.infos ?? [])],
                    },
                    { label: "Anomalies détectées", items: detail.audit?.rules ?? [] },
                    { label: "Informations non déterminées", items: detail.audit?.infos ?? [] },
                    {
                      label: "Corrections automatiques",
                      items: detail.audit?.corrections ?? [],
                    },
                  ].map((b) => (
                    <div key={b.label} className="rounded-xl bg-background/40 px-3 py-2">
                      <p className="text-[11px] text-muted-foreground">{b.label}</p>
                      {b.items.length ? (
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-foreground/90">
                          {b.items.map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-foreground/60">Aucun</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-soft rounded-xl px-3 py-3 text-xs">
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  Détail de l'envoi
                </p>
                <div className="mt-2 space-y-1">
                  <p>
                    Statut d'envoi :{" "}
                    <span className={detail.envoye ? "text-success" : "text-muted-foreground"}>
                      {detail.envoye ? "Envoyé" : "Non envoyé"}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Date d'envoi : <span className="text-foreground">{detail.sentAt ?? "—"}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Destinataires : <span className="text-foreground">{detail.sentTo ?? "—"}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Historique :{" "}
                    <span className="text-foreground">
                      Créé le {detail.createdAt} par {detail.createdBy}
                      {detail.sentAt ? ` · notifié le ${detail.sentAt}` : ""}
                    </span>
                  </p>
                </div>
                {!detail.envoye && (
                  <Button
                    size="sm"
                    className="mt-3 rounded-xl"
                    onClick={() => {
                      resend(detail);
                      setDetail(useErp.getState().dossiers.find((x) => x.id === detail.id) ?? null);
                    }}
                  >
                    <Mail className="size-4" /> Envoyer la notification
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
