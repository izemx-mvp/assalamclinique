import { create } from "zustand";
import {
  buildDefaultEntries,
  configKey,
  PIECES,
  PROFILS,
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
  commitDossier: (statut: DossierRecord["statut"]) => void;
  removeDossier: (id: string) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const SPECIALITES: Record<string, string> = {
  cholecystite: "Chirurgie viscérale",
  cesarienne: "Gynécologie-obstétrique",
  cataracte: "Ophtalmologie",
  pth: "Orthopédie",
  accouchement: "Gynécologie-obstétrique",
  amygdalectomie: "ORL",
  coronarographie: "Cardiologie",
  appendicectomie: "Chirurgie viscérale",
};

const AUTHORS = ["Dr. Alami", "Yassine E.", "Admin SI", "Dr. Bennani"];

const INITIAL_INTERVENTIONS: Intervention[] = PROFILS.map((p, i) => ({
  id: p.id,
  code: `INT-${String(i + 1).padStart(3, "0")}`,
  name: p.name,
  specialite: SPECIALITES[p.id] ?? "Générale",
  defaultMode: "PEC" as Mode,
  createdAt: `0${(i % 9) + 1}/03/2026`,
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

export const useErp = create<State & Actions>((set, get) => ({
  interventions: INITIAL_INTERVENTIONS,
  pieces: [...PIECES],
  selProfil: "cholecystite",
  selOrg: "CNSS",
  selMode: "PEC",
  draft: {},
  saved: {},
  dirty: {},
  dossiers: INITIAL_DOSSIERS,
  dosProfil: "cholecystite",
  dosMode: "PEC",
  dosOrg: "CNSS",
  scans: [],
  auditRan: false,
  generated: null,
  transmitted: false,

  setSel: (p) => set(p),

  entries: (profil, org, mode) => {
    const s = get();
    const key = configKey(profil ?? s.selProfil, org ?? s.selOrg, mode ?? s.selMode);
    return s.draft[key] ?? buildDefaultEntries(org ?? s.selOrg, mode ?? s.selMode);
  },

  savedOrder: (profil, org, mode) => {
    const s = get();
    const key = configKey(profil, org, mode);
    const list = s.saved[key] ?? buildDefaultEntries(org, mode);
    return list.filter((e) => e.active).map((e) => e.pieceId);
  },

  isDirty: (profil, org, mode) => !!get().dirty[configKey(profil, org, mode)],

  togglePiece: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
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
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
      return {
        draft: { ...s.draft, [key]: cur.filter((e) => e.pieceId !== pieceId) },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  addPieceToConfig: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
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
      const cur = [...(s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode))];
      const actives = cur.filter((e) => e.active);
      const i = actives.findIndex((e) => e.pieceId === pieceId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= actives.length) return {};
      [actives[i], actives[j]] = [actives[j]!, actives[i]!];
      const inactives = cur.filter((e) => !e.active);
      return {
        draft: { ...s.draft, [key]: [...actives, ...inactives] },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  reorderActive: (fromId, toId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = [...(s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode))];
      const actives = cur.filter((e) => e.active);
      const from = actives.findIndex((e) => e.pieceId === fromId);
      const to = actives.findIndex((e) => e.pieceId === toId);
      if (from < 0 || to < 0 || from === to) return {};
      const [moved] = actives.splice(from, 1);
      actives.splice(to, 0, moved!);
      const inactives = cur.filter((e) => !e.active);
      return {
        draft: { ...s.draft, [key]: [...actives, ...inactives] },
        dirty: { ...s.dirty, [key]: true },
      };
    }),

  removeActive: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
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
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
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

  removeDossier: (id) => set((st) => ({ dossiers: st.dossiers.filter((d) => d.id !== id) })),

  commitDossier: (statut) =>
    set((st) => {
      const num = `DOS-2026-${String(st.dossiers.length + 1).padStart(4, "0")}`;
      return {
        dossiers: [
          ...st.dossiers,
          {
            id: uid(),
            num,
            patient: "Ouassim BEN MASSAOUD",
            interventionId: st.dosProfil,
            org: st.dosOrg,
            mode: st.dosMode,
            createdAt: new Date().toLocaleDateString("fr-FR"),
            createdBy: "Dr. Alami",
            statut,
            pages: st.scans.length,
          },
        ],
      };
    }),
}));
