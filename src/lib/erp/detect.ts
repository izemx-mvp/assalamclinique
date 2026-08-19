export type Detection = {
  pieceId: string | null;
  side: "recto" | "verso" | null;
  needsSide: boolean;
  angle: number;
};

export function detectFromName(name: string): Detection {
  const n = name.toLowerCase();
  const angle = /inverse/.test(n) ? 180 : /vertical|portrait/.test(n) ? 90 : 0;
  const base = { pieceId: null as string | null, side: null as "recto" | "verso" | null, needsSide: false, angle };

  if (/cin|identite|identité/.test(n)) {
    if (/recto|front/.test(n)) return { ...base, pieceId: "cin_patient", side: "recto" };
    if (/verso|back/.test(n)) return { ...base, pieceId: "cin_patient", side: "verso" };
    return { ...base, pieceId: "cin_patient", needsSide: true };
  }
  if (/pec|demande/.test(n)) return { ...base, pieceId: "demande_pec" };
  if (/note|confidentielle/.test(n)) return { ...base, pieceId: "note_conf" };
  if (/radio|scanner|echo|irm/.test(n)) return { ...base, pieceId: "cr_radio" };
  if (/mutuelle|mut|carte/.test(n)) return { ...base, pieceId: "carte_mutuelle" };
  return base;
}

export const hasAnomaly = (name: string) => /anom/i.test(name);
