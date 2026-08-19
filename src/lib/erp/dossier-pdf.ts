import type { DossierRecord } from "@/store/erp-store";

export const dossierFileName = (d: DossierRecord) =>
  `${d.mode === "PEC" ? "PEC" : "EXP"}_${d.org}_${d.num}.pdf`;

/** Génère le PDF complet d'un dossier (mock de compilation) et renvoie le document jsPDF. */
export async function buildDossierPdf(d: DossierRecord, interventionName: string, orgLabel: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pages = Math.max(1, d.pages);

  for (let i = 0; i < pages; i++) {
    if (i > 0) doc.addPage();
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("CLINIQUE ASSALAM — Dossier d'intervention", 40, 40);
    doc.text(`Page ${i + 1}/${pages}`, 515, 40, { align: "right" });
    doc.setDrawColor(200);
    doc.line(40, 50, 555, 50);

    if (i === 0) {
      doc.setFontSize(20);
      doc.setTextColor(20);
      doc.text(d.num, 40, 100);
      doc.setFontSize(11);
      doc.setTextColor(60);
      const rows: [string, string][] = [
        ["Patient", d.patient],
        ["Intervention", interventionName],
        ["Organisme", orgLabel],
        ["Mode", d.mode === "PEC" ? "Prise en charge" : "Expédition"],
        ["Date de création", d.createdAt],
        ["Créé par", d.createdBy],
        ["Statut", d.statut],
        ["Pages compilées", `${pages}`],
      ];
      rows.forEach(([k, v], r) => {
        const y = 140 + r * 24;
        doc.setTextColor(130);
        doc.text(k, 40, y);
        doc.setTextColor(30);
        doc.text(String(v), 220, y);
      });
    } else {
      doc.setFontSize(14);
      doc.setTextColor(30);
      doc.text(`Pièce ${i} — document scanné`, 40, 110);
      doc.setDrawColor(180);
      doc.rect(40, 130, 515, 640);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Aperçu de la pièce compilée", 297, 450, { align: "center" });
    }
  }
  return doc;
}

export async function dossierPdfUrl(d: DossierRecord, interventionName: string, orgLabel: string) {
  const doc = await buildDossierPdf(d, interventionName, orgLabel);
  return doc.output("bloburl").toString();
}
