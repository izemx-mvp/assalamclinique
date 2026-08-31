import { scenarioKeyForEtat, useAdmin } from "@/store/admin-store";
import { useErp, type DossierRecord } from "@/store/erp-store";

export type Etat = "Conforme" | "Non conforme" | "À vérifier";

const now = () =>
  new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Remplace les tags dynamiques du modèle par les données du dossier audité. */
export function renderTemplate(text: string, d: DossierRecord, interventionName: string) {
  const a = d.audit;
  return text
    .replaceAll("{PATIENT}", d.patient)
    .replaceAll("{NUM_DOSSIER}", d.num)
    .replaceAll("{INTERVENTION}", interventionName)
    .replaceAll("{ORGANISME}", d.org)
    .replaceAll("{STATUT_GLOBAL}", d.etat ?? "—")
    .replaceAll("{PIECES_MANQUANTES}", a?.missing.join(", ") || "Aucune")
    .replaceAll(
      "{PIECES_CONCERNEES}",
      [...(a?.missing ?? []), ...(a?.infos ?? [])].join(", ") || "Aucune",
    )
    .replaceAll("{ANOMALIES_DETECTEES}", a?.rules.join(", ") || "Aucune")
    .replaceAll("{ELEMENTS_A_VERIFIER}", a?.infos.join(", ") || "Aucun")
    .replaceAll("{CORRECTIONS_AUTOMATIQUES}", a?.corrections.join(", ") || "Aucune");
}

/**
 * Simule l'envoi de la notification e-mail configurée en administration
 * et met à jour le statut d'envoi du dossier.
 */
export function sendDossierEmail(dossierId: string, etat: Etat) {
  const erp = useErp.getState();
  const d = erp.dossiers.find((x) => x.id === dossierId);
  if (!d) return null;
  const admin = useAdmin.getState();
  const key = scenarioKeyForEtat(d.mode, etat);
  const sc = admin.emails.scenarios[key];
  const to = sc.to.join(", ");
  erp.updateDossier(dossierId, {
    envoye: true,
    sentAt: now(),
    sentTo: to,
    ...(etat === "Conforme" ? { statut: "Transmis" as const } : {}),
  });
  return { to, subject: sc.subject };
}
