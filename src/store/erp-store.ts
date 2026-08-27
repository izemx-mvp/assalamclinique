import { create } from "zustand";
import {
  buildDefaultEntries,
  configKey,
  INTERVENTIONS_SEED,
  PIECES,
  type Entry,
  type Mode,
  type PieceDef,
} from "@/lib/erp/catalog";


export type Scan = {
  id: string;
  fileName: string;
  url: string;
  mime: string;
  pieceId: string | null;
  side: "recto" | "verso" | null;
  angle: number;
  straightened: boolean;
};

export type Intervention = {
  id: string;
  code: string;
  name: string;
  specialite: string;
  defaultMode: Mode;
  createdAt: string;
  createdBy: string;
  active: boolean;
};

/** Instantané persistable d'une pièce compilée dans un dossier. */
export type DossierItem = {
  order: number;
  fileName: string;
  mime: string;
  label: string;
  side: "recto" | "verso" | null;
  angle: number;
  /** Aperçu (data URL) pour les pièces image. */
  preview?: string;
};

export type DossierRecord = {
  id: string;
  num: string;
  patient: string;
  interventionId: string;
  org: string;
  mode: Mode;
  createdAt: string;
  createdBy: string;
  statut: "Brouillon" | "Audité" | "Transmis";
  pages: number;
  /** PDF compilé complet (data URI base64), persisté pour le téléchargement depuis l'historique. */
  pdfData?: string;
  /** Suite ordonnée exacte des pièces importées lors de la création. */
  items?: DossierItem[];
};


type State = {
  // --- Paramétrage ---
  interventions: Intervention[];
  pieces: PieceDef[];
  selProfil: string;
  selOrg: string;
  selMode: Mode;
  draft: Record<string, Entry[]>;
  saved: Record<string, Entry[]>;
  dirty: Record<string, boolean>;
  // --- Dossiers ---
  dossiers: DossierRecord[];
  dosProfil: string;
  dosMode: Mode;
  dosOrg: string;
  scans: Scan[];
  auditRan: boolean;
  generated: string | null;
  transmitted: boolean;
};

type Actions = {
  setSel: (p: Partial<Pick<State, "selProfil" | "selOrg" | "selMode">>) => void;
  entries: (profil?: string, org?: string, mode?: Mode) => Entry[];
  savedOrder: (profil: string, org: string, mode: Mode) => string[];
  isDirty: (profil: string, org: string, mode: Mode) => boolean;
  togglePiece: (pieceId: string) => void;
  removeFromReferentiel: (pieceId: string) => void;
  addPieceToConfig: (pieceId: string) => void;
  createPiece: (label: string) => void;
  moveActive: (pieceId: string, dir: -1 | 1) => void;
  reorderActive: (fromId: string, toId: string) => void;
  removeActive: (pieceId: string) => void;
  saveOrder: () => void;
  // interventions
  addIntervention: (p: {
    name: string;
    specialite: string;
    defaultMode: Mode;
    createdBy?: string;
  }) => string;
  updateIntervention: (id: string, p: Partial<Intervention>) => void;
  duplicateIntervention: (id: string) => void;
  removeIntervention: (id: string) => void;
  // dossiers
  setDos: (p: Partial<Pick<State, "dosProfil" | "dosMode" | "dosOrg">>) => void;
  resetDossier: () => void;
  addScan: (s: Scan) => void;
  updateScan: (id: string, p: Partial<Scan>) => void;
  removeScan: (id: string) => void;
  straightenAll: () => void;
  setAuditRan: (v: boolean) => void;
  setGenerated: (v: string | null) => void;
  setTransmitted: (v: boolean) => void;
  commitDossier: (statut: DossierRecord["statut"], pdfData?: string) => string;
  updateDossier: (id: string, patch: Partial<DossierRecord>) => void;
  removeDossier: (id: string) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Référentiel affiché : uniquement les pièces obligatoires du triplet,
 * toutes actives au départ. Désactiver une pièce la laisse dans la liste.
 */
function baseEntries(profil: string, org: string, mode: Mode): Entry[] {
  return buildDefaultEntries(profil, org, mode).filter((e) => e.active);
}

const AUTHORS = ["Dr. Alami", "Yassine E.", "Admin SI", "Dr. Bennani"];

const INITIAL_INTERVENTIONS: Intervention[] = INTERVENTIONS_SEED.map((p, i) => ({
  id: p.id,
  code: p.code,
  name: p.name,
  specialite: p.specialite,
  defaultMode: "PEC" as Mode,
  createdAt: `${String((i % 28) + 1).padStart(2, "0")}/03/2026`,
  createdBy: AUTHORS[i % AUTHORS.length]!,
  active: true,
}));


const INITIAL_DOSSIERS: DossierRecord[] = [
  {
    id: uid(),
    num: "DOS-2026-0001",
    patient: "Ouassim BEN MASSAOUD",
    interventionId: "cholecystite",
    org: "CNSS",
    mode: "PEC",
    createdAt: "12/03/2026",
    createdBy: "Dr. Alami",
    statut: "Transmis",
    pages: 8,
  },
  {
    id: uid(),
    num: "DOS-2026-0002",
    patient: "Salma IDRISSI",
    interventionId: "cesarienne",
    org: "CNOPS",
    mode: "EXPEDITION",
    createdAt: "14/03/2026",
    createdBy: "Yassine E.",
    statut: "Audité",
    pages: 11,
  },
  {
    id: uid(),
    num: "DOS-2026-0003",
    patient: "Khalid TAZI",
    interventionId: "cataracte",
    org: "CMIM",
    mode: "PEC",
    createdAt: "16/03/2026",
    createdBy: "Admin SI",
    statut: "Brouillon",
    pages: 4,
  },
];

const STORAGE_KEY = "assalam-erp-dossiers";

/** Persistance locale des dossiers (PDF compilé inclus). */
function persistDossiers(dossiers: DossierRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dossiers));
  } catch {
    // quota dépassé : on retente sans les aperçus, puis sans les binaires PDF
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          dossiers.map((d) => ({
            ...d,
            items: d.items?.map(({ preview: _p, ...it }) => it),
          })),
        ),
      );
    } catch {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(dossiers.map(({ pdfData: _pdf, items: _it, ...d }) => d)),
        );
      } catch {
        /* ignoré */
      }
    }
  }
}

function loadDossiers(): DossierRecord[] {
  if (typeof window === "undefined") return INITIAL_DOSSIERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_DOSSIERS;
    const parsed = JSON.parse(raw) as DossierRecord[];
    return Array.isArray(parsed) && parsed.length ? parsed : INITIAL_DOSSIERS;
  } catch {
    return INITIAL_DOSSIERS;
  }
}

/** Persistance locale du paramétrage partagé (interventions + matrices de pièces). */
const CONFIG_KEY = "assalam-erp-config-v2";

type ConfigSnapshot = {
  interventions: Intervention[];
  pieces: PieceDef[];
  draft: Record<string, Entry[]>;
  saved: Record<string, Entry[]>;
};

function loadConfig(): ConfigSnapshot {
  const fallback: ConfigSnapshot = {
    interventions: INITIAL_INTERVENTIONS,
    pieces: [...PIECES],
    draft: {},
    saved: {},
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Partial<ConfigSnapshot>;
    return {
      interventions: p.interventions?.length ? p.interventions : fallback.interventions,
      pieces: p.pieces?.length ? p.pieces : fallback.pieces,
      draft: p.draft ?? {},
      saved: p.saved ?? {},
    };
  } catch {
    return fallback;
  }
}

function persistConfig(s: State) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({
        interventions: s.interventions,
        pieces: s.pieces,
        draft: s.draft,
        saved: s.saved,
      }),
    );
  } catch {
    /* ignoré */
  }
}

const INITIAL_CONFIG = loadConfig();

export const useErp = create<State & Actions>((set, get) => ({
  interventions: INITIAL_CONFIG.interventions,
  pieces: INITIAL_CONFIG.pieces,
  selProfil: INITIAL_CONFIG.interventions[0]?.id ?? "cesarienne",
  selOrg: "CNSS",
  selMode: "PEC",
  draft: INITIAL_CONFIG.draft,
  saved: INITIAL_CONFIG.saved,
  dirty: {},
  dossiers: loadDossiers(),

  dosProfil: INITIAL_CONFIG.interventions[0]?.id ?? "cesarienne",
  dosMode: "PEC",
  dosOrg: "CNSS",
  scans: [],
  auditRan: false,
  generated: null,
  transmitted: false,

  setSel: (p) => set(p),

  entries: (profil, org, mode) => {
    const s = get();
    const p = profil ?? s.selProfil;
    const o = org ?? s.selOrg;
    const m = mode ?? s.selMode;
    return s.draft[configKey(p, o, m)] ?? baseEntries(p, o, m);
  },

  savedOrder: (profil, org, mode) => {
    const s = get();
    const key = configKey(profil, org, mode);
    const list = s.saved[key] ?? baseEntries(profil, org, mode);
    return list.filter((e) => e.active).map((e) => e.pieceId);
  },

  isDirty: (profil, org, mode) => !!get().dirty[configKey(profil, org, mode)],

  togglePiece: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? baseEntries(s.selProfil, s.selOrg, s.selMode);
      return {
        draft: {
          ...s.draft,
          [key]: cur.map((e) => (e.pieceId === pieceId ? { ...e, active: !e.active } : e)),
        },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  removeFromReferentiel: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? baseEntries(s.selProfil, s.selOrg, s.selMode);
      return {
        draft: { ...s.draft, [key]: cur.filter((e) => e.pieceId !== pieceId) },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  addPieceToConfig: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? baseEntries(s.selProfil, s.selOrg, s.selMode);
      if (cur.some((e) => e.pieceId === pieceId)) return {};
      return {
        draft: { ...s.draft, [key]: [...cur, { pieceId, active: true }] },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  createPiece: (label) => {
    const id = `custom_${uid()}`;
    set((s) => ({ pieces: [...s.pieces, { id, label }] }));
    get().addPieceToConfig(id);
  },

  moveActive: (pieceId, dir) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = [...(s.draft[key] ?? baseEntries(s.selProfil, s.selOrg, s.selMode))];
      const i = cur.findIndex((e) => e.pieceId === pieceId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cur.length) return {};
      [cur[i], cur[j]] = [cur[j]!, cur[i]!];
      return {
        draft: { ...s.draft, [key]: cur },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  reorderActive: (fromId, toId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = [...(s.draft[key] ?? baseEntries(s.selProfil, s.selOrg, s.selMode))];
      const from = cur.findIndex((e) => e.pieceId === fromId);
      const to = cur.findIndex((e) => e.pieceId === toId);
      if (from < 0 || to < 0 || from === to) return {};
      const [moved] = cur.splice(from, 1);
      cur.splice(to, 0, moved!);
      return {
        draft: { ...s.draft, [key]: cur },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  removeActive: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? baseEntries(s.selProfil, s.selOrg, s.selMode);
      return {
        draft: {
          ...s.draft,
          [key]: cur.map((e) => (e.pieceId === pieceId ? { ...e, active: false } : e)),
        },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  saveOrder: () =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? baseEntries(s.selProfil, s.selOrg, s.selMode);
      return {
        saved: { ...s.saved, [key]: cur.map((e) => ({ ...e })) },
        draft: { ...s.draft, [key]: cur },
        dirty: { ...s.dirty, [key]: false },
      };
    }),

  addIntervention: ({ name, specialite, defaultMode, createdBy }) => {
    const id = `p_${uid()}`;
    set((s) => ({
      interventions: [
        ...s.interventions,
        {
          id,
          code: `INT-${String(s.interventions.length + 1).padStart(3, "0")}`,
          name,
          specialite,
          defaultMode,
          createdAt: new Date().toLocaleDateString("fr-FR"),
          createdBy: createdBy || "Admin SI",
          active: true,
        },
      ],
    }));
    return id;
  },

  updateIntervention: (id, p) =>
    set((s) => ({
      interventions: s.interventions.map((i) => (i.id === id ? { ...i, ...p } : i)),
    })),

  duplicateIntervention: (id) =>
    set((s) => {
      const src = s.interventions.find((p) => p.id === id);
      if (!src) return {};
      const nid = `p_${uid()}`;
      const draft = { ...s.draft };
      const saved = { ...s.saved };
      Object.keys(s.draft).forEach((k) => {
        if (k.startsWith(`${id}|`))
          draft[k.replace(`${id}|`, `${nid}|`)] = s.draft[k]!.map((e) => ({ ...e }));
      });
      Object.keys(s.saved).forEach((k) => {
        if (k.startsWith(`${id}|`))
          saved[k.replace(`${id}|`, `${nid}|`)] = s.saved[k]!.map((e) => ({ ...e }));
      });
      return {
        interventions: [
          ...s.interventions,
          {
            ...src,
            id: nid,
            code: `INT-${String(s.interventions.length + 1).padStart(3, "0")}`,
            name: `${src.name} (copie)`,
            createdAt: new Date().toLocaleDateString("fr-FR"),
          },
        ],
        draft,
        saved,
      };
    }),

  removeIntervention: (id) =>
    set((s) => {
      const interventions = s.interventions.filter((p) => p.id !== id);
      return {
        interventions,
        selProfil: s.selProfil === id ? (interventions[0]?.id ?? "") : s.selProfil,
        dosProfil: s.dosProfil === id ? (interventions[0]?.id ?? "") : s.dosProfil,
      };
    }),

  setDos: (p) => set({ ...p, auditRan: false, generated: null, transmitted: false }),
  resetDossier: () =>
    set({ scans: [], auditRan: false, generated: null, transmitted: false }),
  addScan: (s) => set((st) => ({ scans: [...st.scans, s], auditRan: false, generated: null })),
  updateScan: (id, p) =>
    set((st) => ({ scans: st.scans.map((s) => (s.id === id ? { ...s, ...p } : s)) })),
  removeScan: (id) =>
    set((st) => ({
      scans: st.scans.filter((s) => s.id !== id),
      auditRan: false,
      generated: null,
    })),
  straightenAll: () =>
    set((st) => ({
      scans: st.scans.map((s) => ({
        ...s,
        // La demande de PEC conserve sa rotation automatique de 270°
        angle: s.pieceId === "demande_pec" ? 270 : 0,
        straightened: true,
      })),
    })),
  setAuditRan: (v) => set({ auditRan: v }),
  setGenerated: (v) => set({ generated: v }),
  setTransmitted: (v) => set({ transmitted: v }),

  removeDossier: (id) =>
    set((st) => {
      const dossiers = st.dossiers.filter((d) => d.id !== id);
      persistDossiers(dossiers);
      return { dossiers };
    }),

  updateDossier: (id, patch) =>
    set((st) => {
      const dossiers = st.dossiers.map((d) => (d.id === id ? { ...d, ...patch } : d));
      persistDossiers(dossiers);
      return { dossiers };
    }),

  commitDossier: (statut, pdfData) => {
    const newId = uid();
    set((st) => {
      const num = `DOS-2026-${String(st.dossiers.length + 1).padStart(4, "0")}`;
      const dossiers: DossierRecord[] = [
        ...st.dossiers,
        {
          id: newId,
          num,
          patient: "Ouassim BEN MASSAOUD",
          interventionId: st.dosProfil,
          org: st.dosOrg,
          mode: st.dosMode,
          createdAt: new Date().toLocaleDateString("fr-FR"),
          createdBy: "Dr. Alami",
          statut,
          pages: st.scans.length,
          ...(pdfData ? { pdfData } : {}),
        },
      ];
      persistDossiers(dossiers);
      return { dossiers };
    });
    return newId;
  },
}));

// Synchronisation temps réel du paramétrage entre les deux sous-modules.
if (typeof window !== "undefined") {
  useErp.subscribe((s) => persistConfig(s));
}
