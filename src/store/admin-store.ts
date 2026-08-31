import { create } from "zustand";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type OrgType = "Public" | "Mutuelle d'entreprise" | "Privée";

export type Organisme = {
  id: string;
  code: string;
  name: string;
  type: OrgType;
  createdAt: string;
  active: boolean;
};

export type Severite = "bloquant" | "avertissement";
export type Portee = "global" | "specialite" | "intervention";

export type RegleIA = {
  id: string;
  code: string;
  prompt: string;
  portee: Portee;
  severite: Severite;
  active: boolean;
  interventions: string[];
};

export type CoverConfig = {
  position: "debut" | "fin";
  logo: string | null;
  titre: string;
  sousTitre: string;
  mentions: string;
  sommaire: boolean;
  published: boolean;
};

export type ScenarioKey = "pec_ok" | "pec_ko" | "exp_ok" | "exp_ko";

export type EmailPhase = "PEC" | "EXPEDITION";
export type EmailIssue = "ok" | "ko";

export type EmailScenario = {
  to: string[];
  subject: string;
  body: string;
};

export type EmailsConfig = {
  inboxAddress: string;
  inboxActive: boolean;
  frequency: string;
  scenarios: Record<ScenarioKey, EmailScenario>;
};

/** Identité et cachet officiel de l'établissement. */
export type CliniqueConfig = {
  nom: string;
  ice: string;
  if: string;
  patente: string;
  cachet: string | null;
};


export type Praticien = {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  inpe: string;
  cachet: string | null;
  signature: string | null;
  createdAt: string;
  lastUsed: string;
  active: boolean;
};

export type RoleUtilisateur = "Administrateur" | "Paramétreur" | "Agent Métier";

export type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  lastLogin: string;
  active: boolean;
  droits: string[];
};

export const MODULES_DROITS = [
  "Dossiers d'Intervention",
  "Paramétrage des Interventions",
  "Organismes",
  "Règles de Conformité IA",
  "Pages de Garde",
  "Configuration E-mails",
  "Cachets & Signatures",
  "Utilisateurs & Rôles",
];

export const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "pec_ok", label: "PEC Validée" },
  { key: "pec_ko", label: "PEC Non conforme" },
  { key: "pec_verif", label: "PEC À vérifier" },
  { key: "exp_ok", label: "Expédition Validée" },
  { key: "exp_ko", label: "Expédition Non conforme" },
  { key: "exp_verif", label: "Expédition À vérifier" },
];

/** Clé de scénario à partir de la phase et de l'issue du contrôle. */
export const scenarioKey = (phase: EmailPhase, issue: EmailIssue): ScenarioKey =>
  `${phase === "PEC" ? "pec" : "exp"}_${issue === "ok" ? "ok" : issue === "ko" ? "ko" : "verif"}` as ScenarioKey;

/** Clé de scénario correspondant à l'état d'un dossier audité. */
export const scenarioKeyForEtat = (
  mode: "PEC" | "EXPEDITION",
  etat: "Conforme" | "Non conforme" | "À vérifier",
): ScenarioKey =>
  scenarioKey(mode, etat === "Conforme" ? "ok" : etat === "Non conforme" ? "ko" : "verif");

export const EMAIL_VARIABLES = [
  "{PATIENT}",
  "{NUM_DOSSIER}",
  "{INTERVENTION}",
  "{ORGANISME}",
  "{STATUT_GLOBAL}",
  "{PIECES_MANQUANTES}",
  "{PIECES_CONCERNEES}",
  "{ANOMALIES_DETECTEES}",
  "{ELEMENTS_A_VERIFIER}",
  "{CORRECTIONS_AUTOMATIQUES}",
];


export const COVER_VARIABLES = [
  "{Nom Patient}",
  "{Prénom}",
  "{N° Dossier}",
  "{Intervention}",
  "{Organisme}",
  "{Date Admission}",
  "{Médecin Traitant}",
];

/* -------------------------------------------------------------------------- */
/*  Données initiales                                                         */
/* -------------------------------------------------------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () =>
  new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const ORG_SEED: { id: string; name: string; type: OrgType }[] = [
  { id: "CNSS", name: "CNSS", type: "Public" },
  { id: "CNOPS", name: "CNOPS", type: "Public" },
  { id: "FAR", name: "FAR", type: "Public" },
  { id: "CMIM", name: "CMIM", type: "Mutuelle d'entreprise" },
  { id: "BP", name: "Banque Populaire", type: "Mutuelle d'entreprise" },
  { id: "BAM", name: "BAM", type: "Mutuelle d'entreprise" },
  { id: "MGBM", name: "MGBM", type: "Mutuelle d'entreprise" },
  { id: "ETR", name: "Assurances Internationales", type: "Privée" },
];

const INITIAL_ORGANISMES: Organisme[] = ORG_SEED.map((o, i) => ({
  id: o.id,
  code: `ORG-${String(i + 1).padStart(3, "0")}`,
  name: o.name,
  type: o.type,
  createdAt: `${String((i % 27) + 1).padStart(2, "0")}/01/2026`,
  active: true,
}));

const REGLES_SEED: { prompt: string; severite: Severite; portee: Portee }[] = [
  {
    prompt: "Contrôler la validité de la date d'expiration de la CIN et de la carte mutuelle.",
    severite: "bloquant",
    portee: "global",
  },
  {
    prompt:
      "Vérifier que la carte mutuelle de l'assuré principal est présente si le patient est un ayant droit différent de l'assuré.",
    severite: "bloquant",
    portee: "global",
  },
  {
    prompt:
      "Vérifier la stricte concordance du nom, prénom et date de naissance entre le rapport opératoire et la prise en charge.",
    severite: "bloquant",
    portee: "global",
  },
  {
    prompt: "Vérifier la présence et la lisibilité du cachet du praticien sur la note confidentielle.",
    severite: "avertissement",
    portee: "global",
  },
  {
    prompt:
      "Vérifier que le compte rendu opératoire mentionne lisiblement le nom du chirurgien intervenant.",
    severite: "avertissement",
    portee: "specialite",
  },
];

const INITIAL_REGLES: RegleIA[] = REGLES_SEED.map((r, i) => ({
  id: uid(),
  code: `RGL-${String(i + 1).padStart(3, "0")}`,
  prompt: r.prompt,
  portee: r.portee,
  severite: r.severite,
  active: true,
  interventions: [],
}));

const cover = (titre: string, sousTitre: string): CoverConfig => ({
  position: "debut",
  logo: null,
  titre,
  sousTitre,
  mentions:
    "Document confidentiel — Clinique Assalam. Toute pièce jointe est numérotée conformément au référentiel de conformité en vigueur.",
  sommaire: true,
  published: false,
});

const INITIAL_EMAILS: EmailsConfig = {
  inboxAddress: "reception.dossiers@clinique-assalam.ma",
  inboxActive: true,
  frequency: "Toutes les 15 minutes",
  scenarios: {
    pec_ok: {
      to: ["pec@cnss.ma"],
      subject: "PEC {NUM_DOSSIER} — {PATIENT} — {INTERVENTION}",
      body:
        "Bonjour,\n\nVeuillez trouver ci-joint le dossier de PEC {NUM_DOSSIER} du patient {PATIENT} ({INTERVENTION} — {ORGANISME}).\nStatut du contrôle : {STATUT_GLOBAL}.\nCorrections automatiques appliquées : {CORRECTIONS_AUTOMATIQUES}.\n\nCordialement,\nClinique Assalam",
    },
    pec_ko: {
      to: ["admissions@clinique-assalam.ma"],
      subject: "Dossier PEC non conforme — {NUM_DOSSIER} — {PATIENT}",
      body:
        "Bonjour,\n\nLe dossier de PEC {NUM_DOSSIER} ({PATIENT} — {INTERVENTION} — {ORGANISME}) est déclaré NON CONFORME.\nPièces manquantes : {PIECES_MANQUANTES}\nAnomalies détectées : {ANOMALIES_DETECTEES}\n\nMerci de compléter le dossier avant nouvelle soumission.\n\nClinique Assalam",
    },
    pec_verif: {
      to: ["administration@clinique-assalam.ma"],
      subject: "Dossier PEC à vérifier — {NUM_DOSSIER} — {PATIENT}",
      body:
        "Bonjour,\n\nLe contrôle IA du dossier de PEC {NUM_DOSSIER} ({PATIENT} — {INTERVENTION} — {ORGANISME}) n'a pas permis de déterminer certains éléments.\nÉléments à vérifier manuellement : {ELEMENTS_A_VERIFIER}\nPièces concernées : {PIECES_CONCERNEES}\n\nMerci de procéder à une vérification humaine avant transmission.\n\nClinique Assalam",
    },
    exp_ok: {
      to: ["pec@cnss.ma"],
      subject: "Expédition {NUM_DOSSIER} — {PATIENT} — {INTERVENTION}",
      body:
        "Bonjour,\n\nVeuillez trouver ci-joint le dossier d'Expédition {NUM_DOSSIER} du patient {PATIENT} ({INTERVENTION} — {ORGANISME}).\nStatut du contrôle : {STATUT_GLOBAL}.\nCorrections automatiques appliquées : {CORRECTIONS_AUTOMATIQUES}.\n\nCordialement,\nClinique Assalam",
    },
    exp_ko: {
      to: ["admissions@clinique-assalam.ma"],
      subject: "Dossier Expédition non conforme — {NUM_DOSSIER} — {PATIENT}",
      body:
        "Bonjour,\n\nLe dossier d'Expédition {NUM_DOSSIER} ({PATIENT} — {INTERVENTION} — {ORGANISME}) est déclaré NON CONFORME.\nPièces manquantes : {PIECES_MANQUANTES}\nAnomalies détectées : {ANOMALIES_DETECTEES}\n\nMerci de compléter le dossier avant nouvelle soumission.\n\nClinique Assalam",
    },
    exp_verif: {
      to: ["administration@clinique-assalam.ma"],
      subject: "Dossier Expédition à vérifier — {NUM_DOSSIER} — {PATIENT}",
      body:
        "Bonjour,\n\nLe contrôle IA du dossier d'Expédition {NUM_DOSSIER} ({PATIENT} — {INTERVENTION} — {ORGANISME}) n'a pas permis de déterminer certains éléments.\nÉléments à vérifier manuellement : {ELEMENTS_A_VERIFIER}\nPièces concernées : {PIECES_CONCERNEES}\n\nMerci de procéder à une vérification humaine avant transmission.\n\nClinique Assalam",
    },
  },
};

const INITIAL_CLINIQUE: CliniqueConfig = {
  nom: "Clinique Assalam",
  ice: "001789456000027",
  if: "40219876",
  patente: "34561209",
  cachet: null,
};


const INITIAL_PRATICIENS: Praticien[] = [
  {
    id: uid(),
    nom: "ALAMI",
    prenom: "Youssef",
    specialite: "Chirurgie viscérale",
    inpe: "INPE-114520",
    cachet: null,
    signature: null,
    createdAt: "08/01/2026",
    lastUsed: "12/03/2026",
    active: true,
  },
  {
    id: uid(),
    nom: "BENNANI",
    prenom: "Salma",
    specialite: "Gynécologie-obstétrique",
    inpe: "INPE-227841",
    cachet: null,
    signature: null,
    createdAt: "19/01/2026",
    lastUsed: "14/03/2026",
    active: true,
  },
  {
    id: uid(),
    nom: "TAZI",
    prenom: "Reda",
    specialite: "Cardiologie interventionnelle",
    inpe: "INPE-330192",
    cachet: null,
    signature: null,
    createdAt: "02/02/2026",
    lastUsed: "—",
    active: false,
  },
];

const INITIAL_UTILISATEURS: Utilisateur[] = [
  {
    id: uid(),
    nom: "Houda EL MANSOURI",
    email: "houda.elmansouri@clinique-assalam.ma",
    role: "Administrateur",
    lastLogin: "31/08/2026 09:12",
    active: true,
    droits: [...MODULES_DROITS],
  },
  {
    id: uid(),
    nom: "Yassine EL OUAFI",
    email: "yassine.elouafi@clinique-assalam.ma",
    role: "Paramétreur",
    lastLogin: "30/08/2026 17:45",
    active: true,
    droits: ["Paramétrage des Interventions", "Organismes", "Règles de Conformité IA"],
  },
  {
    id: uid(),
    nom: "Nadia CHERKAOUI",
    email: "nadia.cherkaoui@clinique-assalam.ma",
    role: "Agent Métier",
    lastLogin: "29/08/2026 11:03",
    active: true,
    droits: ["Dossiers d'Intervention"],
  },
];

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */

type State = {
  organismes: Organisme[];
  regles: RegleIA[];
  pagesGarde: { PEC: CoverConfig; EXPEDITION: CoverConfig };
  emails: EmailsConfig;
  clinique: CliniqueConfig;
  praticiens: Praticien[];
  utilisateurs: Utilisateur[];
  /** Organismes associés par intervention (undefined = tous les organismes actifs). */
  interventionOrgs: Record<string, string[]>;
};


type Actions = {
  // organismes
  addOrganisme: (p: { name: string; type: OrgType; active: boolean }) => void;
  updateOrganisme: (id: string, p: Partial<Organisme>) => void;
  removeOrganisme: (id: string) => void;
  activeOrganismes: () => Organisme[];
  orgLabel: (id: string) => string;
  // associations intervention <-> organismes
  orgsFor: (interventionId: string) => string[];
  attachOrg: (interventionId: string, orgId: string) => void;
  detachOrg: (interventionId: string, orgId: string) => void;
  // règles IA
  addRegle: (p: Omit<RegleIA, "id" | "code">) => void;
  updateRegle: (id: string, p: Partial<RegleIA>) => void;
  duplicateRegle: (id: string) => void;
  removeRegle: (id: string) => void;
  // pages de garde
  updateCover: (mode: "PEC" | "EXPEDITION", p: Partial<CoverConfig>) => void;
  // emails
  updateEmails: (p: Partial<Omit<EmailsConfig, "scenarios">>) => void;
  updateScenario: (key: ScenarioKey, p: Partial<EmailScenario>) => void;
  // clinique
  updateClinique: (p: Partial<CliniqueConfig>) => void;

  // praticiens
  addPraticien: (p: Omit<Praticien, "id" | "createdAt" | "lastUsed">) => void;
  updatePraticien: (id: string, p: Partial<Praticien>) => void;
  removePraticien: (id: string) => void;
  // utilisateurs
  addUtilisateur: (p: Omit<Utilisateur, "id" | "lastLogin">) => void;
  updateUtilisateur: (id: string, p: Partial<Utilisateur>) => void;
  removeUtilisateur: (id: string) => void;
};

const KEY = "assalam-erp-admin-v2";

const FALLBACK: State = {
  organismes: INITIAL_ORGANISMES,
  regles: INITIAL_REGLES,
  pagesGarde: {
    PEC: cover("DOSSIER DE PRISE EN CHARGE", "Clinique Assalam — Service Admissions & Conventions"),
    EXPEDITION: cover(
      "DOSSIER D'EXPÉDITION",
      "Clinique Assalam — Service Facturation & Tiers Payants",
    ),
  },
  emails: INITIAL_EMAILS,
  clinique: INITIAL_CLINIQUE,
  praticiens: INITIAL_PRATICIENS,
  utilisateurs: INITIAL_UTILISATEURS,
  interventionOrgs: {},
};

function load(): State {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return FALLBACK;
    const p = JSON.parse(raw) as Partial<State>;
    return {
      organismes: p.organismes?.length ? p.organismes : FALLBACK.organismes,
      regles: p.regles?.length ? p.regles : FALLBACK.regles,
      pagesGarde: { ...FALLBACK.pagesGarde, ...(p.pagesGarde ?? {}) },
      emails: {
        ...FALLBACK.emails,
        ...(p.emails ?? {}),
        scenarios: { ...FALLBACK.emails.scenarios, ...(p.emails?.scenarios ?? {}) },
      },
      clinique: { ...FALLBACK.clinique, ...(p.clinique ?? {}) },
      praticiens: p.praticiens?.length ? p.praticiens : FALLBACK.praticiens,
      utilisateurs: p.utilisateurs?.length ? p.utilisateurs : FALLBACK.utilisateurs,
      interventionOrgs: p.interventionOrgs ?? {},
    };
  } catch {
    return FALLBACK;
  }
}

function persist(s: State) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        organismes: s.organismes,
        regles: s.regles,
        pagesGarde: s.pagesGarde,
        emails: s.emails,
        clinique: s.clinique,
        praticiens: s.praticiens,
        utilisateurs: s.utilisateurs,
        interventionOrgs: s.interventionOrgs,
      }),
    );
  } catch {
    /* ignoré */
  }
}


export const useAdmin = create<State & Actions>((set, get) => {
  const commit = (patch: Partial<State>) =>
    set((s) => {
      const next = { ...s, ...patch };
      persist(next);
      return patch as State;
    });

  return {
    ...load(),

    /* --- Organismes --- */
    addOrganisme: ({ name, type, active }) => {
      const list = get().organismes;
      const n = list.length + 1;
      commit({
        organismes: [
          ...list,
          {
            id: `ORG_${uid()}`,
            code: `ORG-${String(n).padStart(3, "0")}`,
            name,
            type,
            createdAt: today(),
            active,
          },
        ],
      });
    },
    updateOrganisme: (id, p) =>
      commit({ organismes: get().organismes.map((o) => (o.id === id ? { ...o, ...p } : o)) }),
    removeOrganisme: (id) => {
      const { organismes, interventionOrgs } = get();
      const cleaned = Object.fromEntries(
        Object.entries(interventionOrgs).map(([k, v]) => [k, v.filter((o) => o !== id)]),
      );
      commit({ organismes: organismes.filter((o) => o.id !== id), interventionOrgs: cleaned });
    },
    activeOrganismes: () => get().organismes.filter((o) => o.active),
    orgLabel: (id) => get().organismes.find((o) => o.id === id)?.name ?? id,

    /* --- Associations --- */
    orgsFor: (interventionId) => {
      const s = get();
      const explicit = s.interventionOrgs[interventionId];
      if (explicit) return explicit.filter((id) => s.organismes.some((o) => o.id === id));
      return s.organismes.filter((o) => o.active).map((o) => o.id);
    },
    attachOrg: (interventionId, orgId) => {
      const cur = get().orgsFor(interventionId);
      if (cur.includes(orgId)) return;
      commit({
        interventionOrgs: { ...get().interventionOrgs, [interventionId]: [...cur, orgId] },
      });
    },
    detachOrg: (interventionId, orgId) => {
      const cur = get().orgsFor(interventionId);
      commit({
        interventionOrgs: {
          ...get().interventionOrgs,
          [interventionId]: cur.filter((o) => o !== orgId),
        },
      });
    },

    /* --- Règles IA --- */
    addRegle: (p) => {
      const list = get().regles;
      commit({
        regles: [
          ...list,
          { ...p, id: uid(), code: `RGL-${String(list.length + 1).padStart(3, "0")}` },
        ],
      });
    },
    updateRegle: (id, p) =>
      commit({ regles: get().regles.map((r) => (r.id === id ? { ...r, ...p } : r)) }),
    duplicateRegle: (id) => {
      const list = get().regles;
      const src = list.find((r) => r.id === id);
      if (!src) return;
      commit({
        regles: [
          ...list,
          {
            ...src,
            id: uid(),
            code: `RGL-${String(list.length + 1).padStart(3, "0")}`,
            prompt: `${src.prompt} (copie)`,
          },
        ],
      });
    },
    removeRegle: (id) => commit({ regles: get().regles.filter((r) => r.id !== id) }),

    /* --- Pages de garde --- */
    updateCover: (mode, p) =>
      commit({ pagesGarde: { ...get().pagesGarde, [mode]: { ...get().pagesGarde[mode], ...p } } }),

    /* --- E-mails --- */
    updateEmails: (p) => commit({ emails: { ...get().emails, ...p } }),
    updateScenario: (key, p) => {
      const e = get().emails;
      commit({ emails: { ...e, scenarios: { ...e.scenarios, [key]: { ...e.scenarios[key], ...p } } } });
    },

    /* --- Clinique --- */
    updateClinique: (p) => commit({ clinique: { ...get().clinique, ...p } }),



    /* --- Praticiens --- */
    addPraticien: (p) =>
      commit({
        praticiens: [
          ...get().praticiens,
          { ...p, id: uid(), createdAt: today(), lastUsed: "—" },
        ],
      }),
    updatePraticien: (id, p) =>
      commit({ praticiens: get().praticiens.map((x) => (x.id === id ? { ...x, ...p } : x)) }),
    removePraticien: (id) => commit({ praticiens: get().praticiens.filter((x) => x.id !== id) }),

    /* --- Utilisateurs --- */
    addUtilisateur: (p) =>
      commit({ utilisateurs: [...get().utilisateurs, { ...p, id: uid(), lastLogin: "—" }] }),
    updateUtilisateur: (id, p) =>
      commit({ utilisateurs: get().utilisateurs.map((u) => (u.id === id ? { ...u, ...p } : u)) }),
    removeUtilisateur: (id) => commit({ utilisateurs: get().utilisateurs.filter((u) => u.id !== id) }),
  };
});
