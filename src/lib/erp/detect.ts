export type Detection = {
  pieceId: string | null;
  side: "recto" | "verso" | null;
  needsSide: boolean;
  angle: number;
};

/** Mots-clés déclenchant une anomalie de contenu. */
const ANOMALY_RE = /anomalie|anom|probleme|problème|érroné|erroné|errone|erreur/i;

/** Règle stricte : la carte mutuelle n'est reconnue que si le nom contient "carte mut". */
const CARTE_MUT_RE = /carte\s*mut/i;

export const isCarteMutuelleFile = (name: string) => CARTE_MUT_RE.test(name);

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
