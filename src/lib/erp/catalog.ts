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
  // Administratif
  { id: "demande_pec", label: "Demande de PEC" },
  { id: "devis", label: "Devis" },
  { id: "engagement", label: "Engagement de paiement" },
  { id: "note_conf", label: "Note confidentielle" },
  // Identité & droit
  { id: "cin_patient", label: "CIN patient /Passeport" },
  { id: "carte_mutuelle", label: "Carte mutuelle /Droit d'assuré (portail)" },
  { id: "cin_assure", label: "CIN assuré /Passeport" },
  // Clinique & imagerie
  { id: "cr_radio", label: "Compte rendu radiologique (IRM - Scanner - Echographie)" },
  { id: "cr_radio_preop", label: "Compte rendu radiologique pré-opératoire" },
  { id: "cr_radio_postop", label: "Compte rendu radiologique post-opératoire" },
  { id: "enmg", label: "ENMG" },
  { id: "ett", label: "Échocardiographie ETT" },
  { id: "ecg", label: "ECG pré-opératoire" },
  { id: "ecg_postop", label: "ECG post-opératoire" },
  { id: "troponine", label: "Troponine" },
  { id: "bilan_bio", label: "Bilans biologiques (Urée / Créatinine)" },
  { id: "holter", label: "Holter ECG" },
  { id: "cr_corona", label: "Compte rendu de coronarographie" },
  { id: "declaration_honneur", label: "Déclaration sur l'honneur" },
  { id: "devis_materiel", label: "Devis de matériel mis en place" },
  // Expédition — administratif & facturation
  { id: "feuille_soins", label: "Feuille de soins signé par assuré" },
  { id: "feuille_ras", label: "Feuille RAS" },
  { id: "accord_pec", label: "Accord de prise en charge" },
  { id: "facture_forfaitaire", label: "Facture forfaitaire" },
  { id: "facture_forfaitaire_ras", label: "Facture forfaitaire avec RAS" },
  { id: "facture_detaillee", label: "Facture détaillée" },
  { id: "detail_pharmacie", label: "Détail pharmacie" },
  { id: "honoraires", label: "Notes des honoraires médecins" },
  // Justificatifs médicaux
  { id: "cr_operatoire", label: "Compte rendu opératoire" },
  { id: "anapath", label: "Résultat anapath" },
  { id: "acte_naissance", label: "Acte de naissance" },
  { id: "cd_corona", label: "CD de coronarographie / dilatation / fistuliographie" },
  { id: "vignettes_stents", label: "Vignettes et N° de série des stents / pacemaker" },
  { id: "facture_stents", label: "Facture des stents / pacemaker / matériel" },
  { id: "carnet_pacemaker", label: "Copie de carnet de pacemaker" },
  { id: "etiquette_valve", label: "Étiquette / sticker de valve implantée" },
  { id: "images_pre_post", label: "Images pré & post-opératoires" },
  { id: "facture_materiel", label: "Facture de matériel mis en place" },
];

/** Jeu de données MVP : 27 interventions. */
export type InterventionSeed = {
  id: string;
  code: string;
  name: string;
  specialite: string;
};

export const INTERVENTIONS_SEED: InterventionSeed[] = [
  { id: "cesarienne", code: "INT-001", name: "Césarienne", specialite: "Gynécologie-obstétrique" },
  { id: "accouchement", code: "INT-002", name: "Accouchement", specialite: "Gynécologie-obstétrique" },
  { id: "cholecystite", code: "INT-003", name: "Cholécystite", specialite: "Chirurgie viscérale" },
  { id: "kyste_ovarien", code: "INT-004", name: "Kyste ovarien", specialite: "Gynécologie-obstétrique" },
  { id: "myomectomie", code: "INT-005", name: "Myomectomie", specialite: "Gynécologie-obstétrique" },
  { id: "hysterectomie", code: "INT-006", name: "Hystérectomie", specialite: "Gynécologie-obstétrique" },
  { id: "appendicite", code: "INT-007", name: "Appendicite", specialite: "Chirurgie viscérale" },
  { id: "prostate", code: "INT-008", name: "Prostate", specialite: "Urologie" },
  { id: "varicocelle", code: "INT-009", name: "Varicocelle", specialite: "Urologie" },
  { id: "hydrocelle", code: "INT-010", name: "Hydrocelle", specialite: "Urologie" },
  { id: "hernie", code: "INT-011", name: "Hernie", specialite: "Chirurgie générale" },
  { id: "amygdalectomie", code: "INT-012", name: "Amygdalectomie", specialite: "ORL" },
  { id: "thyroidectomie", code: "INT-013", name: "Thyroïdectomie", specialite: "ORL / Chirurgie générale" },
  { id: "cervecotomie", code: "INT-014", name: "Cervecotomie", specialite: "ORL / Chirurgie générale" },
  { id: "fistule_anale", code: "INT-015", name: "Fistule anale", specialite: "Proctologie / Viscérale" },
  { id: "canal_carpien", code: "INT-016", name: "Canal carpien", specialite: "Orthopédie / Chirurgie de la main" },
  { id: "ptg", code: "INT-017", name: "PTG", specialite: "Orthopédie" },
  { id: "fracture", code: "INT-018", name: "Fracture", specialite: "Orthopédie" },
  { id: "circoncision", code: "INT-019", name: "Circoncision", specialite: "Urologie / Pédiatrie" },
  { id: "fistuliographie", code: "INT-020", name: "Fistuliographie", specialite: "Néphrologie / Radiologie" },
  { id: "fav", code: "INT-021", name: "FAV", specialite: "Chirurgie vasculaire" },
  { id: "catheter", code: "INT-022", name: "Cathéter", specialite: "Chirurgie vasculaire / Néphrologie" },
  { id: "coronarographie", code: "INT-023", name: "Coronarographie", specialite: "Cardiologie interventionnelle" },
  { id: "dilatation_coronaire", code: "INT-024", name: "Dilatation coronaire", specialite: "Cardiologie interventionnelle" },
  { id: "pacemaker", code: "INT-025", name: "Pacemaker", specialite: "Cardiologie / Rythmologie" },
  { id: "pontage_coronaire", code: "INT-026", name: "Pontage coronaire", specialite: "Chirurgie cardiaque" },
  { id: "remplacement_valvulaire", code: "INT-027", name: "Remplacement valvulaire", specialite: "Chirurgie cardiaque" },
];

/** Ancien alias conservé pour compatibilité. */
export const PROFILS = INTERVENTIONS_SEED.map((i) => ({ id: i.id, name: i.name }));

/* -------------------------------------------------------------------------- */
/*  Matrice des pièces                                                        */
/* -------------------------------------------------------------------------- */

const IDENTITE = ["cin_patient", "carte_mutuelle", "cin_assure"];

/** Pièces administratives PEC selon l'organisme. */
function pecAdmin(org: string): string[] {
  const out: string[] = [];
  if (["CNSS", "CNOPS", "FAR"].includes(org)) out.push("demande_pec");
  else out.push("devis");
  if (org === "BP") out.push("engagement");
  out.push("note_conf");
  return out;
}

/** Pièces cliniques PEC selon l'intervention. */
const PEC_CLINIQUE: Record<string, string[]> = {
  // Gynéco / viscérale / uro / ORL : imagerie standard
  cesarienne: ["cr_radio"],
  accouchement: ["cr_radio"],
  cholecystite: ["cr_radio"],
  kyste_ovarien: ["cr_radio"],
  myomectomie: ["cr_radio"],
  hysterectomie: ["cr_radio"],
  appendicite: ["cr_radio"],
  prostate: ["cr_radio"],
  varicocelle: ["cr_radio"],
  hydrocelle: ["cr_radio"],
  hernie: ["cr_radio"],
  amygdalectomie: ["cr_radio"],
  thyroidectomie: ["cr_radio"],
  cervecotomie: ["cr_radio"],
  fistule_anale: ["cr_radio"],
  circoncision: ["cr_radio"],
  // Orthopédie
  canal_carpien: ["cr_radio_preop", "enmg", "declaration_honneur", "devis_materiel"],
  ptg: ["cr_radio_preop", "declaration_honneur", "devis_materiel"],
  fracture: ["cr_radio_preop", "declaration_honneur", "devis_materiel"],
  // Vasculaire / néphro
  fistuliographie: ["ecg", "bilan_bio"],
  fav: ["ecg", "bilan_bio"],
  catheter: ["ecg", "bilan_bio"],
  // Cardiologie
  coronarographie: ["ett", "ecg", "troponine"],
  dilatation_coronaire: ["ett", "ecg", "troponine", "cr_corona"],
  pacemaker: ["ett", "ecg", "holter"],
  pontage_coronaire: ["ett", "ecg", "troponine", "cr_corona"],
  remplacement_valvulaire: ["ett", "ecg", "troponine", "cr_corona"],
};

/** Pièces de facturation Expédition selon l'organisme. */
function expAdmin(org: string): string[] {
  const out: string[] = [];
  if (["CNOPS", "BP", "BAM", "MGBM"].includes(org)) out.push("feuille_soins");
  if (org === "BP") out.push("engagement");
  if (org === "MGBM") out.push("devis");
  out.push("accord_pec");
  switch (org) {
    case "CNSS":
      out.unshift("feuille_ras");
      out.push("facture_forfaitaire");
      break;
    case "CNOPS":
    case "FAR":
      out.push("facture_forfaitaire_ras");
      break;
    default:
      out.push("facture_detaillee", "detail_pharmacie", "honoraires");
  }
  return out;
}

/** Justificatifs médicaux Expédition selon l'intervention. */
const EXP_MEDICAL: Record<string, string[]> = {
  cesarienne: ["acte_naissance"],
  accouchement: ["acte_naissance"],
  kyste_ovarien: ["anapath"],
  myomectomie: ["anapath"],
  hysterectomie: ["anapath"],
  amygdalectomie: ["anapath"],
  thyroidectomie: ["anapath"],
  cholecystite: ["anapath"],
  appendicite: ["anapath"],
  canal_carpien: ["cr_radio_postop", "images_pre_post", "facture_materiel"],
  ptg: ["cr_radio_postop", "images_pre_post", "facture_materiel"],
  fracture: ["cr_radio_postop", "images_pre_post", "facture_materiel"],
  fistuliographie: ["cd_corona"],
  fav: ["ecg_postop"],
  catheter: ["ecg_postop", "facture_materiel"],
  coronarographie: ["cd_corona", "ecg_postop"],
  dilatation_coronaire: ["cd_corona", "vignettes_stents", "facture_stents", "ecg_postop"],
  pacemaker: ["vignettes_stents", "facture_stents", "carnet_pacemaker", "ecg_postop"],
  pontage_coronaire: ["ecg_postop", "facture_materiel"],
  remplacement_valvulaire: ["etiquette_valve", "facture_materiel", "ecg_postop"],
};

/** Liste ordonnée des pièces actives pour une combinaison intervention / organisme / mode. */
export function requiredPieces(profil: string, organisme: string, mode: Mode): string[] {
  const list =
    mode === "PEC"
      ? [...pecAdmin(organisme), ...(PEC_CLINIQUE[profil] ?? ["cr_radio"]), ...IDENTITE]
      : [
          ...IDENTITE,
          ...expAdmin(organisme),
          "cr_operatoire",
          ...(EXP_MEDICAL[profil] ?? []),
        ];
  return Array.from(new Set(list));
}

export const configKey = (profil: string, organisme: string, mode: Mode) =>
  `${profil}|${organisme}|${mode}`;

export type Entry = { pieceId: string; active: boolean };

export function buildDefaultEntries(profil: string, organisme: string, mode: Mode): Entry[] {
  const actives = requiredPieces(profil, organisme, mode);
  const rest = PIECES.map((p) => p.id).filter((id) => !actives.includes(id));
  return [
    ...actives.map((pieceId) => ({ pieceId, active: true })),
    ...rest.map((pieceId) => ({ pieceId, active: false })),
  ];
}
