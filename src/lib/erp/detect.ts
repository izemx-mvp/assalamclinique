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
  /^carte\s*mutuelle\s*\.(jpg|jpeg|png|pdf)$/i,
];

/** Le fichier ressemble-t-il à une carte mutuelle (aiguillage souple) ? */
export const looksLikeCarteMutuelle = (name: string) => CARTE_MUT_RE.test(name);

/** Validation stricte : Carte d'immatriculation CNSS officielle uniquement. */
export const isCarteMutuelleFile = (name: string) =>
  CNSS_MARKERS.some((re) => re.test(name.trim()));

export function detectFromName(name: string): Detection {
  const n = name.toLowerCase();
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
