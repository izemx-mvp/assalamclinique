export type Mode = "PEC" | "EXPEDITION";

export const MODES: { id: Mode; label: string }[] = [
  { id: "PEC", label: "PEC" },
  { id: "EXPEDITION", label: "Expédition" },
];

export const ORGANISMES = [
  { id: "CNSS", label: "CNSS" },
  { id: "CNOPS", label: "CNOPS" },
  { id: "FAR", label: "FAR" },
  { id: "CMIM", label: "CMIM" },
  { id: "BP", label: "Banque Populaire" },
  { id: "BAM", label: "Bank Al Maghreb" },
  { id: "MGBM", label: "MGBM" },
  { id: "ETR", label: "ASSUR Étrangère" },
] as const;

export type PieceDef = { id: string; label: string };

export const PIECES: PieceDef[] = [
  { id: "demande_pec", label: "Demande de PEC" },
  { id: "devis", label: "Devis" },
  { id: "engagement", label: "Engagement de paiement" },
  { id: "note_conf", label: "Note confidentielle" },
  { id: "cr_radio", label: "Compte rendu radiologique (IRM - Scanner - Echographie)" },
  { id: "cin_patient", label: "CIN patient /Passeport" },
  { id: "carte_mutuelle", label: "Carte mutuelle /Droit d'assuré (portail)" },
  { id: "cin_assure", label: "CIN assuré /Passeport" },
  { id: "feuille_soins", label: "Feuille de soins signé par assuré" },
  { id: "feuille_ras", label: "Feuille RAS" },
  { id: "accord_pec", label: "Accord de prise en charge" },
  { id: "facture_forfaitaire", label: "Facture forfaitaire" },
  { id: "facture_forfaitaire_ras", label: "Facture forfaitaire avec RAS" },
  { id: "facture_detaillee", label: "Facture détaillée" },
  { id: "detail_pharmacie", label: "Détail pharmacie" },
  { id: "honoraires", label: "Notes des honoraires médecins" },
  { id: "cr_operatoire", label: "Compte rendu opératoire" },
  { id: "anapath", label: "Résultat anapath" },
];

export const PROFILS = [
  { id: "cholecystite", name: "Cholécystite" },
  { id: "cesarienne", name: "Césarienne" },
  { id: "cataracte", name: "Cataracte" },
  { id: "pth", name: "PTH" },
  { id: "accouchement", name: "Accouchement voie basse" },
  { id: "amygdalectomie", name: "Amygdalectomie" },
  { id: "coronarographie", name: "Coronarographie" },
  { id: "appendicectomie", name: "Appendicectomie" },
];

const PEC_STD = ["demande_pec", "note_conf", "cr_radio", "cin_patient", "carte_mutuelle", "cin_assure"];
const PEC_DEVIS = ["devis", "note_conf", "cr_radio", "cin_patient", "carte_mutuelle", "cin_assure"];

/** Matrice détaillée de référence (Cholécystite), réutilisée comme base pour les autres profils. */
export const BASE_MATRIX: Record<string, Record<Mode, string[]>> = {
  CNSS: {
    PEC: PEC_STD,
    EXPEDITION: [
      "cin_patient",
      "carte_mutuelle",
      "cin_assure",
      "feuille_ras",
      "accord_pec",
      "facture_forfaitaire",
      "cr_operatoire",
      "anapath",
    ],
  },
  CNOPS: {
    PEC: PEC_STD,
    EXPEDITION: [
      "feuille_soins",
      "cin_patient",
      "carte_mutuelle",
      "cin_assure",
      "accord_pec",
      "facture_forfaitaire_ras",
      "cr_operatoire",
      "anapath",
    ],
  },
  FAR: {
    PEC: PEC_STD,
    EXPEDITION: [
      "cin_patient",
      "carte_mutuelle",
      "cin_assure",
      "accord_pec",
      "facture_forfaitaire_ras",
      "cr_operatoire",
      "anapath",
    ],
  },
  CMIM: {
    PEC: PEC_DEVIS,
    EXPEDITION: [
      "cin_patient",
      "carte_mutuelle",
      "cin_assure",
      "accord_pec",
      "facture_detaillee",
      "detail_pharmacie",
      "honoraires",
      "cr_operatoire",
      "anapath",
    ],
  },
  BP: {
    PEC: ["engagement", "note_conf", "cr_radio", "cin_patient", "carte_mutuelle", "cin_assure"],
    EXPEDITION: [
      "feuille_soins",
      "engagement",
      "cin_patient",
      "carte_mutuelle",
      "cin_assure",
      "accord_pec",
      "facture_detaillee",
      "detail_pharmacie",
      "honoraires",
      "cr_operatoire",
      "anapath",
    ],
  },
  BAM: {
    PEC: PEC_DEVIS,
    EXPEDITION: [
      "cin_patient",
      "carte_mutuelle",
      "cin_assure",
      "accord_pec",
      "facture_detaillee",
      "detail_pharmacie",
      "honoraires",
      "cr_operatoire",
      "anapath",
    ],
  },
  MGBM: {
    PEC: ["note_conf", "cr_radio", "cin_patient", "carte_mutuelle", "cin_assure"],
    EXPEDITION: [
      "devis",
      "cin_patient",
      "carte_mutuelle",
      "cin_assure",
      "accord_pec",
      "facture_detaillee",
      "detail_pharmacie",
      "honoraires",
      "cr_operatoire",
      "anapath",
    ],
  },
  ETR: {
    PEC: PEC_DEVIS,
    EXPEDITION: [
      "cin_patient",
      "carte_mutuelle",
      "cin_assure",
      "accord_pec",
      "facture_detaillee",
      "detail_pharmacie",
      "honoraires",
      "cr_operatoire",
      "anapath",
    ],
  },
};

export const configKey = (profil: string, organisme: string, mode: Mode) =>
  `${profil}|${organisme}|${mode}`;

export type Entry = { pieceId: string; active: boolean };

export function buildDefaultEntries(organisme: string, mode: Mode): Entry[] {
  const actives = BASE_MATRIX[organisme]?.[mode] ?? [];
  const rest = PIECES.map((p) => p.id).filter((id) => !actives.includes(id));
  return [
    ...actives.map((pieceId) => ({ pieceId, active: true })),
    ...rest.map((pieceId) => ({ pieceId, active: false })),
  ];
}
