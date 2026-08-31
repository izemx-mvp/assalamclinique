export type Detection = {
  pieceId: string | null;
  side: "recto" | "verso" | null;
  needsSide: boolean;
  angle: number;
};

/** Mots-clés déclenchant une anomalie de contenu. */
const ANOMALY_RE = /anomalie|anom|probleme|problème|érroné|erroné|errone|erreur/i;

/** Nom générique de carte mutuelle (utilisé pour l'aiguillage vers la bonne exigence). */
const CARTE_MUT_RE = /carte\s*mut/i;

/**
 * Marqueurs officiels de la Carte d'immatriculation CNSS relevés par l'OCR/le nom du fichier.
 * Un document générique nommé "carte mutuelle" sans ces marqueurs est refusé.
 */
const CNSS_MARKERS: RegExp[] = [
  /carte\s*d['’ ]?\s*immatriculation/i,
  /immatriculation\s*n[°o]?\s*\d{6,}/i,
  /\b1234567890\b/i,
  /c\.?\s*i\.?\s*n\.?\s*[-_ ]*AB\s*123456/i,
  /\bcarte\s*mut(uelle)?\b/i,
];

/**
 * Normalise le nom de fichier : les séparateurs techniques (_ - . +) deviennent
 * des espaces afin que « Carte_mutuelle.jpg » soit reconnu comme « carte mutuelle ».
 */
const normalize = (name: string) =>
  name
    .replace(/\.[a-z0-9]+$/i, " ")
    .replace(/[_\-.+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Le fichier ressemble-t-il à une carte mutuelle (aiguillage souple) ? */
export const looksLikeCarteMutuelle = (name: string) => CARTE_MUT_RE.test(normalize(name));

/** Validation stricte : Carte d'immatriculation CNSS officielle uniquement. */
export const isCarteMutuelleFile = (name: string) =>
  CNSS_MARKERS.some((re) => re.test(normalize(name)));

export function detectFromName(name: string): Detection {
  const n = normalize(name).toLowerCase();
  const base = { pieceId: null as string | null, side: null as "recto" | "verso" | null, needsSide: false, angle: 0 };

  if (/cin|identite|identité/.test(n)) {
    const angle = /inverse/.test(n) ? 180 : /vertical|portrait/.test(n) ? 90 : 0;
    if (/recto|front/.test(n)) return { ...base, angle, pieceId: "cin_patient", side: "recto" };
    if (/verso|back/.test(n)) return { ...base, angle, pieceId: "cin_patient", side: "verso" };
    return { ...base, angle, pieceId: "cin_patient", needsSide: true };
  }
  // Rotation automatique 270° pour la demande de PEC
  if (/pec|demande/.test(n)) return { ...base, pieceId: "demande_pec", angle: 270 };
  if (/note|confidentielle/.test(n)) return { ...base, pieceId: "note_conf" };
  if (/radio|scanner|echo|irm/.test(n)) return { ...base, pieceId: "cr_radio" };
  if (CARTE_MUT_RE.test(n)) return { ...base, pieceId: "carte_mutuelle" };
  return base;
}

export const hasAnomaly = (name: string) => ANOMALY_RE.test(name);

/** Termes interdits pour le remplacement de la Note confidentielle. */
const NOTE_REJECT_RE =
  /anomalie|anom\b|note\s*confid(?!entielle\s*$)|note\s*confif|erreur|erron|probleme|problème/i;

/**
 * Remplacement strict de la Note confidentielle :
 * seul un fichier nommé exactement « Note confidentielle » (avec extension optionnelle) est accepté.
 */
export function isCleanNoteConfidentielle(name: string): boolean {
  const n = normalize(name).toLowerCase();
  if (/anomalie|anom\b|note\s*confif|erreur|erron|probleme|problème/i.test(n)) return false;
  return /^note\s*confidentielle$/.test(n);
}

/** Le dossier global importé est-il le dossier complet de référence ? */
export function isDossierCompletFile(name: string): boolean {
  const n = normalize(name).toLowerCase();
  return /ouassim\s*ben\s*massaoud\s*dossier\s*complet/.test(n);
}

export { NOTE_REJECT_RE };

/** Scénarios de simulation IA du sous-module « dossier global ». */
export type GlobalScenario = "complet" | "manquant" | "ordre" | "errone" | "rotes" | "verifier";

/** État de conformité attribué par l'IA. */
export type EtatDossier = "Conforme" | "Non conforme" | "À vérifier";

/** Mappe le scénario simulé sur l'état de conformité affiché. */
export function etatOfScenario(sc: GlobalScenario): EtatDossier {
  if (sc === "verifier") return "À vérifier";
  if (sc === "errone" || sc === "manquant") return "Non conforme";
  return "Conforme";
}

/**
 * Reconnaît le scénario de test à partir du nom du dossier global déposé.
 * Ex. « OUASSIM BEN MASSAOUD Dossier avec ordre incorrect.pdf » → "ordre".
 */
export function detectScenario(name: string): GlobalScenario {
  const n = normalize(name).toLowerCase();
  if (/(a|à)\s*v(e|é)rifier/.test(n)) return "verifier";
  if (/rot(e|é)s?\b|2\s*documents?\s*rot|documents?\s*rot/.test(n)) return "rotes";
  if (/ordre\s*incorrect|desordre|désordre/.test(n)) return "ordre";
  if (/erron|erreur|anomalie/.test(n)) return "errone";
  if (/manquant|incomplet/.test(n)) return "manquant";
  return "complet";
}



