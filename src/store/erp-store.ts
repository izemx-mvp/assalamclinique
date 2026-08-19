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

type State = {
  // --- Paramétrage ---
  profils: { id: string; name: string }[];
  pieces: PieceDef[];
  selProfil: string;
  selOrg: string;
  selMode: Mode;
  draft: Record<string, Entry[]>;
  saved: Record<string, Entry[]>;
  // --- Dossiers ---
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
  togglePiece: (pieceId: string) => void;
  removeFromReferentiel: (pieceId: string) => void;
  addPieceToConfig: (pieceId: string) => void;
  createPiece: (label: string) => void;
  moveActive: (pieceId: string, dir: -1 | 1) => void;
  reorderActive: (fromId: string, toId: string) => void;
  removeActive: (pieceId: string) => void;
  saveOrder: () => void;
  addProfil: (name: string) => void;
  duplicateProfil: (id: string) => void;
  removeProfil: (id: string) => void;
  // dossiers
  setDos: (p: Partial<Pick<State, "dosProfil" | "dosMode" | "dosOrg">>) => void;
  addScan: (s: Scan) => void;
  updateScan: (id: string, p: Partial<Scan>) => void;
  removeScan: (id: string) => void;
  straightenAll: () => void;
  setAuditRan: (v: boolean) => void;
  setGenerated: (v: string | null) => void;
  setTransmitted: (v: boolean) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useErp = create<State & Actions>((set, get) => ({
  profils: [...PROFILS],
  pieces: [...PIECES],
  selProfil: "cholecystite",
  selOrg: "CNSS",
  selMode: "PEC",
  draft: {},
  saved: {},
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

  togglePiece: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
      return {
        draft: {
          ...s.draft,
          [key]: cur.map((e) => (e.pieceId === pieceId ? { ...e, active: !e.active } : e)),
        },
      };
    }),

  removeFromReferentiel: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
      return { draft: { ...s.draft, [key]: cur.filter((e) => e.pieceId !== pieceId) } };
    }),

  addPieceToConfig: (pieceId) =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
      if (cur.some((e) => e.pieceId === pieceId)) return {};
      return { draft: { ...s.draft, [key]: [...cur, { pieceId, active: true }] } };
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
      return { draft: { ...s.draft, [key]: [...actives, ...inactives] } };
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
      return { draft: { ...s.draft, [key]: [...actives, ...inactives] } };
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
      };
    }),

  saveOrder: () =>
    set((s) => {
      const key = configKey(s.selProfil, s.selOrg, s.selMode);
      const cur = s.draft[key] ?? buildDefaultEntries(s.selOrg, s.selMode);
      return { saved: { ...s.saved, [key]: cur.map((e) => ({ ...e })) }, draft: { ...s.draft, [key]: cur } };
    }),

  addProfil: (name) => set((s) => ({ profils: [...s.profils, { id: `p_${uid()}`, name }] })),

  duplicateProfil: (id) =>
    set((s) => {
      const src = s.profils.find((p) => p.id === id);
      if (!src) return {};
      const nid = `p_${uid()}`;
      const draft = { ...s.draft };
      const saved = { ...s.saved };
      Object.keys(s.draft).forEach((k) => {
        if (k.startsWith(`${id}|`)) draft[k.replace(`${id}|`, `${nid}|`)] = s.draft[k]!.map((e) => ({ ...e }));
      });
      Object.keys(s.saved).forEach((k) => {
        if (k.startsWith(`${id}|`)) saved[k.replace(`${id}|`, `${nid}|`)] = s.saved[k]!.map((e) => ({ ...e }));
      });
      return { profils: [...s.profils, { id: nid, name: `${src.name} (copie)` }], draft, saved };
    }),

  removeProfil: (id) =>
    set((s) => {
      const profils = s.profils.filter((p) => p.id !== id);
      return {
        profils,
        selProfil: s.selProfil === id ? (profils[0]?.id ?? "") : s.selProfil,
        dosProfil: s.dosProfil === id ? (profils[0]?.id ?? "") : s.dosProfil,
      };
    }),

  setDos: (p) => set({ ...p, auditRan: false, generated: null, transmitted: false }),
  addScan: (s) => set((st) => ({ scans: [...st.scans, s], auditRan: false, generated: null })),
  updateScan: (id, p) =>
    set((st) => ({ scans: st.scans.map((s) => (s.id === id ? { ...s, ...p } : s)) })),
  removeScan: (id) =>
    set((st) => ({ scans: st.scans.filter((s) => s.id !== id), auditRan: false, generated: null })),
  straightenAll: () =>
    set((st) => ({ scans: st.scans.map((s) => ({ ...s, angle: 0, straightened: true })) })),
  setAuditRan: (v) => set({ auditRan: v }),
  setGenerated: (v) => set({ generated: v }),
  setTransmitted: (v) => set({ transmitted: v }),
}));
