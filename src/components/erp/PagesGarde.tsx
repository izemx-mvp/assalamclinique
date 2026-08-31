import { useRef, useState } from "react";
import { FileSignature, ImagePlus, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { COVER_VARIABLES, useAdmin } from "@/store/admin-store";
import { PageHeader, Panel, Segmented } from "./ui-bits";
import { cn } from "@/lib/utils";

type Mode = "PEC" | "EXPEDITION";

export function PagesGarde() {
  const ad = useAdmin();
  const [mode, setMode] = useState<Mode>("PEC");
  const cfg = ad.pagesGarde[mode];
  const fileRef = useRef<HTMLInputElement>(null);
  const focusRef = useRef<HTMLTextAreaElement>(null);

  const upload = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      ad.updateCover(mode, { logo: String(r.result) });
      toast.success("Logo importé");
    };
    r.readAsDataURL(file);
  };

  const insertVar = (v: string) => {
    const el = focusRef.current;
    if (el) {
      const start = el.selectionStart ?? cfg.mentions.length;
      const next = cfg.mentions.slice(0, start) + v + cfg.mentions.slice(el.selectionEnd ?? start);
      ad.updateCover(mode, { mentions: next });
    } else {
      ad.updateCover(mode, { mentions: `${cfg.mentions} ${v}` });
    }
    toast.success(`Variable ${v} insérée`);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={<FileSignature className="size-5" />}
        title="Pages de Garde"
        subtitle="Modèles de première page injectés automatiquement dans les dossiers compilés"
        action={
          <div className="flex items-center gap-2">
            <Segmented
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              options={[
                { value: "PEC", label: "Modèle PEC" },
                { value: "EXPEDITION", label: "Modèle Expédition" },
              ]}
            />
            <Button
              className="rounded-xl"
              onClick={() => {
                ad.updateCover(mode, { published: true });
                toast.success("Modèle publié et appliqué aux prochaines compilations");
              }}
            >
              <Save className="size-4" /> Publier le modèle
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Éditeur du modèle"
          subtitle={`Mode ${mode === "PEC" ? "Prise en charge" : "Expédition"} · ${
            cfg.published ? "publié" : "brouillon"
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="glass-soft flex items-center gap-4 rounded-xl p-4">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/15">
                {cfg.logo ? (
                  <img src={cfg.logo} alt="Logo clinique" className="size-full object-contain" />
                ) : (
                  <ImagePlus className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">Logo de la clinique</p>
                <p className="text-[11px] text-muted-foreground">PNG transparent recommandé</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" /> Importer
              </Button>
            </div>

            <label className="text-xs text-muted-foreground">
              Titre principal
              <Input
                value={cfg.titre}
                onChange={(e) => ad.updateCover(mode, { titre: e.target.value })}
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Sous-titre / Service émetteur
              <Input
                value={cfg.sousTitre}
                onChange={(e) => ad.updateCover(mode, { sousTitre: e.target.value })}
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Mentions légales & informations dynamiques
              <Textarea
                ref={focusRef}
                value={cfg.mentions}
                onChange={(e) => ad.updateCover(mode, { mentions: e.target.value })}
                rows={5}
                className="mt-1 text-sm"
              />
            </label>

            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Variables dynamiques (cliquer pour insérer)
              </p>
              <div className="flex flex-wrap gap-2">
                {COVER_VARIABLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertVar(v)}
                    className="glass-soft rounded-full px-3 py-1.5 font-mono text-[11px] text-accent transition-all hover:bg-primary/15"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-soft flex items-center justify-between rounded-xl px-4 py-3">
              <div>
                <p className="text-xs font-medium">Sommaire automatique des pièces</p>
                <p className="text-[11px] text-muted-foreground">
                  Liste numérotée des pièces conformes au référentiel
                </p>
              </div>
              <Switch
                checked={cfg.sommaire}
                onCheckedChange={(v) => ad.updateCover(mode, { sommaire: v })}
              />
            </div>

            <div className="glass-soft flex items-center justify-between rounded-xl px-4 py-3">
              <p className="text-xs font-medium">Position dans le dossier compilé</p>
              <Segmented
                value={cfg.position}
                onChange={(v) => ad.updateCover(mode, { position: v as "debut" | "fin" })}
                options={[
                  { value: "debut", label: "Début" },
                  { value: "fin", label: "Fin" },
                ]}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Aperçu A4" subtitle="Rendu temps réel du modèle sélectionné">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="aspect-[1/1.414] w-full overflow-hidden rounded-xl border border-border bg-white p-7 text-slate-800 shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="grid size-14 place-items-center overflow-hidden rounded-lg bg-slate-100">
                  {cfg.logo ? (
                    <img src={cfg.logo} alt="Logo" className="size-full object-contain" />
                  ) : (
                    <span className="text-[9px] text-slate-400">LOGO</span>
                  )}
                </div>
                <div className="text-right text-[9px] text-slate-500">
                  <p>N° Dossier : {"{N° Dossier}"}</p>
                  <p>Date : {"{Date Admission}"}</p>
                </div>
              </div>

              <h3 className="mt-8 text-center text-[15px] font-bold tracking-wide text-slate-900 uppercase">
                {cfg.titre || "Titre du dossier"}
              </h3>
              <p className="mt-1 text-center text-[10px] text-slate-500">{cfg.sousTitre}</p>

              <div className="mt-8 space-y-1.5 text-[10px]">
                {[
                  ["Patient", "{Nom Patient} {Prénom}"],
                  ["Intervention", "{Intervention}"],
                  ["Organisme", "{Organisme}"],
                  ["Médecin traitant", "{Médecin Traitant}"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </div>

              {cfg.sommaire && (
                <div className="mt-6">
                  <p className="text-[10px] font-semibold text-slate-700 uppercase">
                    Sommaire des pièces
                  </p>
                  <ol className="mt-2 space-y-1 text-[9px] text-slate-600">
                    {["Demande de PEC", "Note confidentielle", "CIN patient", "Carte mutuelle"].map(
                      (p, i) => (
                        <li key={p} className="flex justify-between">
                          <span>
                            {i + 1}. {p}
                          </span>
                          <span className="text-slate-400">p. {i + 2}</span>
                        </li>
                      ),
                    )}
                  </ol>
                </div>
              )}

              <p className="mt-6 text-[8px] leading-relaxed text-slate-400">{cfg.mentions}</p>
            </div>
            <p
              className={cn(
                "mt-3 text-center text-[11px]",
                cfg.published ? "text-success" : "text-muted-foreground",
              )}
            >
              {cfg.published
                ? "Modèle publié — appliqué aux prochaines compilations"
                : "Brouillon non publié"}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
