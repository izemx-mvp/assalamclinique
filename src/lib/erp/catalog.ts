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
  { id: "BP", label: "B.Populaire" },
  { id: "BAM", label: "BAM" },
  { id: "MGBM", label: "MGBM" },
  { id: "ETR", label: "Assur Étrangère" },
] as const;

const ALL_ORGS = ORGANISMES.map((o) => o.id) as string[];

export type PieceDef = { id: string; label: string };

export const PIECES: PieceDef[] = [
  // Administratif
  { id: "feuille_soins", label: "Feuille de soins signée par assuré" },
  { id: "engagement", label: "Engagement de paiement" },
  { id: "demande_pec", label: "Demande de PEC" },
  { id: "devis", label: "Devis" },
  { id: "note_conf", label: "Note confidentielle" },
  { id: "rapport_admission", label: "Rapport médical d'admission" },
  // Identité & droit
  { id: "cin_patient", label: "CIN patient / Passeport" },
  { id: "carte_mutuelle", label: "Carte mutuelle / Droit d'assuré (portail)" },
  { id: "cin_assure", label: "CIN assuré / Passeport" },
  // Facturation
  { id: "feuille_ras", label: "Feuille RAS" },
  { id: "accord_pec", label: "Accord de prise en charge" },
  { id: "facture_forfaitaire", label: "Facture forfaitaire" },
  { id: "facture_forfaitaire_ras", label: "Facture forfaitaire avec RAS" },
  { id: "facture_detaillee", label: "Facture détaillée" },
  { id: "detail_pharmacie", label: "Détail pharmacie" },
  { id: "honoraires", label: "Notes des honoraires médecins" },
  // Clinique & imagerie
  { id: "cr_radio", label: "Compte rendu radiologique (Échographie, Scanner, IRM…)" },
  { id: "enmg", label: "Compte rendu radiologique (ENMG) L'électroneuromyogramme" },
  { id: "cr_radio_preop", label: "Compte rendu radiologique pré-opératoire" },
  { id: "cr_radio_postop", label: "Compte rendu radiologique post-opératoire" },
  { id: "declaration_honneur", label: "Déclaration sur l'honneur" },
  { id: "devis_materiel", label: "Devis de matériel mis en place" },
  { id: "ett", label: "Échocardiographie (ETT)" },
  { id: "ecg", label: "ECG pré-opératoire" },
  { id: "troponine", label: "Troponine" },
  { id: "holter", label: "Holter ECG" },
  { id: "bilan_bio", label: "Bilans biologiques (Urée, Créatinine)" },
  { id: "bilan_bio_chirurgien", label: "Bilans biologiques demandés par le chirurgien" },
  { id: "cr_corona", label: "Compte rendu de coronarographie" },
  // Justificatifs médicaux (Expédition)
  { id: "cr_operatoire", label: "Compte rendu opératoire" },
  { id: "anapath", label: "Résultat anapath" },
  { id: "acte_naissance", label: "Acte de naissance" },
  { id: "cd_corona", label: "CD de coronarographie" },
  { id: "cd_dilatation", label: "CD de dilatation" },
  { id: "cd_fistulographie", label: "CD de fistulographie" },
  { id: "vignettes_stents", label: "Vignettes et N° de série des stents" },
  { id: "vignettes_pacemaker", label: "Vignettes et N° de série de pacemaker" },
  { id: "facture_stents", label: "Facture des stents" },
  { id: "carnet_pacemaker", label: "Copie de carnet de pacemaker" },
  { id: "etiquette_valve", label: "Étiquette / sticker de la valve implantée" },
  { id: "ecg_postop", label: "ECG post-opératoire" },
  { id: "images_pre_post", label: "Images pré & post opératoires" },
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
  { id: "varicocelle", code: "INT-009", name: "Varicocèle", specialite: "Urologie" },
  { id: "hydrocelle", code: "INT-010", name: "Hydrocèle", specialite: "Urologie" },
  { id: "hernie", code: "INT-011", name: "Hernie", specialite: "Chirurgie générale" },
  { id: "amygdalectomie", code: "INT-012", name: "Amygdalectomie", specialite: "ORL" },
  { id: "thyroidectomie", code: "INT-013", name: "Thyroïdectomie", specialite: "ORL / Chirurgie générale" },
  { id: "cervecotomie", code: "INT-014", name: "Cervicotomie", specialite: "ORL / Chirurgie générale" },
  { id: "fistule_anale", code: "INT-015", name: "Fistule anale", specialite: "Proctologie / Viscérale" },
  { id: "canal_carpien", code: "INT-016", name: "Canal carpien", specialite: "Orthopédie / Chirurgie de la main" },
  { id: "ptg", code: "INT-017", name: "PTG (Prothèse Totale du Genou)", specialite: "Orthopédie" },
  { id: "fracture", code: "INT-018", name: "Fracture", specialite: "Orthopédie" },
  { id: "circoncision", code: "INT-019", name: "Circoncision", specialite: "Urologie / Pédiatrie" },
  { id: "fistuliographie", code: "INT-020", name: "Fistulographie", specialite: "Néphrologie / Radiologie" },
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
/*  Matrice des pièces (fidèle au référentiel Excel)                          */
/* -------------------------------------------------------------------------- */

type Rule = { id: string; on: (org: string, mode: Mode) => boolean };

const NEVER = () => false;
const pec = (orgs: string[] = ALL_ORGS) => (o: string, m: Mode) => m === "PEC" && orgs.includes(o);
const exp = (orgs: string[] = ALL_ORGS) => (o: string, m: Mode) => m === "EXPEDITION" && orgs.includes(o);
const both = (orgs: string[] = ALL_ORGS) => (o: string) => orgs.includes(o);

/** Bloc administratif (avant le bloc clinique). */
const ADMIN: Rule[] = [
  { id: "feuille_soins", on: exp(["CNOPS", "BP", "BAM", "MGBM"]) },
  { id: "engagement", on: both(["BP"]) },
  { id: "demande_pec", on: pec(["CNSS", "CNOPS", "FAR"]) },
  { id: "devis", on: pec(["CMIM", "BP", "BAM", "MGBM", "ETR"]) },
  { id: "note_conf", on: pec(["CNSS", "CNOPS", "FAR", "CMIM", "BAM", "MGBM", "ETR"]) },
];

/** Bloc identité + facturation (après le bloc clinique). */
const IDENT_FACTURATION: Rule[] = [
  { id: "rapport_admission", on: NEVER },
  { id: "cin_patient", on: () => true },
  { id: "carte_mutuelle", on: () => true },
  { id: "cin_assure", on: () => true },
  { id: "feuille_ras", on: exp(["CNSS", "CNOPS", "FAR"]) },
  { id: "accord_pec", on: exp() },

  { id: "facture_forfaitaire", on: exp(["CNSS"]) },
  { id: "facture_forfaitaire_ras", on: exp(["CNOPS", "FAR"]) },
  { id: "facture_detaillee", on: exp(["CMIM", "BP", "BAM", "MGBM", "ETR"]) },
  { id: "detail_pharmacie", on: exp(["CMIM", "BP", "BAM", "MGBM", "ETR"]) },
  { id: "honoraires", on: exp(["CMIM", "BP", "BAM", "MGBM", "ETR"]) },
];

const P = (id: string): Rule => ({ id, on: pec() });
const E = (id: string): Rule => ({ id, on: exp() });
const B = (id: string): Rule => ({ id, on: both() });

/** Pièces cliniques (insérées après le bloc administratif). */
const CLINIQUE: Record<string, Rule[]> = {
  cesarienne: [],
  accouchement: [],
  cholecystite: [P("cr_radio")],
  kyste_ovarien: [P("cr_radio")],
  myomectomie: [P("cr_radio")],
  hysterectomie: [P("cr_radio")],
  appendicite: [P("cr_radio")],
  prostate: [P("cr_radio")],
  varicocelle: [P("cr_radio")],
  hydrocelle: [P("cr_radio")],
  hernie: [],
  amygdalectomie: [],
  thyroidectomie: [P("cr_radio")],
  cervecotomie: [P("cr_radio")],
  fistule_anale: [],
  canal_carpien: [P("enmg")],
  ptg: [P("cr_radio_preop"), P("declaration_honneur"), P("devis_materiel")],
  fracture: [P("cr_radio_preop"), P("declaration_honneur"), P("devis_materiel")],
  circoncision: [],
  fistuliographie: [],
  fav: [P("bilan_bio")],
  catheter: [P("bilan_bio")],
  coronarographie: [P("ett"), P("ecg"), P("troponine")],
  dilatation_coronaire: [P("cr_corona"), P("ett"), P("ecg"), P("troponine")],
  pacemaker: [P("ecg"), P("ett"), P("holter")],
  pontage_coronaire: [P("cr_corona"), P("ett"), P("ecg"), P("bilan_bio_chirurgien")],
  remplacement_valvulaire: [P("cr_corona"), P("ett"), P("ecg"), P("bilan_bio_chirurgien")],

};

/** Justificatifs médicaux Expédition (après la facturation). */
const MEDICAL_EXP: Record<string, Rule[]> = {
  cesarienne: [E("cr_operatoire"), E("acte_naissance")],
  accouchement: [E("cr_operatoire"), E("acte_naissance")],
  cholecystite: [E("cr_operatoire"), E("anapath")],
  kyste_ovarien: [E("cr_operatoire"), E("anapath")],
  myomectomie: [E("cr_operatoire"), E("anapath")],
  hysterectomie: [E("cr_operatoire"), E("anapath")],
  appendicite: [E("cr_operatoire"), E("anapath")],
  prostate: [E("cr_operatoire"), E("anapath")],
  varicocelle: [E("cr_operatoire"), E("anapath")],
  hydrocelle: [E("cr_operatoire"), E("anapath")],
  hernie: [E("cr_operatoire")],
  amygdalectomie: [E("cr_operatoire")],
  thyroidectomie: [E("cr_operatoire"), E("anapath")],
  cervecotomie: [E("cr_operatoire")],
  fistule_anale: [E("cr_operatoire")],
  canal_carpien: [E("cr_operatoire")],
  ptg: [E("cr_operatoire"), E("facture_materiel"), E("cr_radio_postop"), E("images_pre_post")],
  fracture: [E("cr_operatoire"), E("facture_materiel"), E("cr_radio_postop"), E("images_pre_post")],
  circoncision: [E("cr_operatoire")],
  fistuliographie: [E("cr_operatoire"), E("cd_fistulographie")],
  fav: [E("cr_operatoire")],
  catheter: [E("cr_operatoire")],
  coronarographie: [E("cr_corona"), E("cd_corona")],
  dilatation_coronaire: [E("cd_dilatation"), E("vignettes_stents"), E("facture_stents")],
  pacemaker: [E("ecg_postop"), E("carnet_pacemaker"), E("vignettes_pacemaker")],
  pontage_coronaire: [E("cr_operatoire")],
  remplacement_valvulaire: [E("cr_operatoire"), E("etiquette_valve")],
};

/** Séquence ordonnée complète des pièces d'une intervention. */
function sequence(profil: string): Rule[] {
  const seen = new Set<string>();
  return [
    ...ADMIN,
    ...(CLINIQUE[profil] ?? []),
    ...IDENT_FACTURATION,
    ...(MEDICAL_EXP[profil] ?? []),
  ].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/** Liste ordonnée des pièces actives (valeur = 1) pour intervention / organisme / mode. */
export function requiredPieces(profil: string, organisme: string, mode: Mode): string[] {
  return sequence(profil)
    .filter((r) => r.on(organisme, mode))
    .map((r) => r.id);
}

export const configKey = (profil: string, organisme: string, mode: Mode) =>
  `${profil}|${organisme}|${mode}`;

export type Entry = { pieceId: string; active: boolean };

export function buildDefaultEntries(profil: string, organisme: string, mode: Mode): Entry[] {
  const seq = sequence(profil);
  const inSeq = new Set(seq.map((r) => r.id));
  return [
    ...seq.map((r) => ({ pieceId: r.id, active: r.on(organisme, mode) })),
    ...PIECES.filter((p) => !inSeq.has(p.id)).map((p) => ({ pieceId: p.id, active: false })),
  ];
}
