import type { DossierItem, DossierRecord, Scan } from "@/store/erp-store";

export const dossierFileName = (d: DossierRecord) =>
  `${d.mode === "PEC" ? "PEC" : "EXP"}_${d.org}_${d.num}.pdf`;

/** Charge une image (blob url incluse) et la convertit en data URL exploitable par jsPDF. */
export async function toDataUrl(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return { data: canvas.toDataURL("image/jpeg", 0.9), w: canvas.width, h: canvas.height };
  } catch {
    return null;
  }
}

export type CompileMeta = {
  title: string;
  patient: string;
  intervention: string;
  organisme: string;
  mode: string;
  labels: Record<string, string>;
};

/**
 * Compile le dossier complet en PDF réel.
 * Les pages de la « Demande de PEC » sont réellement pivotées à 270° dans le flux binaire du PDF.
 */
export async function compileDossierBytes(scans: Scan[], meta: CompileMeta): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595.28;
  const H = 841.89;

  // Page de garde
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("CLINIQUE ASSALAM — Dossier d'intervention", 40, 40);
  doc.setDrawColor(200);
  doc.line(40, 50, 555, 50);
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text(meta.title, 40, 100);
  doc.setFontSize(11);
  const rows: [string, string][] = [
    ["Patient", meta.patient],
    ["Intervention", meta.intervention],
    ["Organisme", meta.organisme],
    ["Mode", meta.mode],
    ["Pages compilées", String(scans.length)],
    ["Date de compilation", new Date().toLocaleString("fr-FR")],
  ];
  rows.forEach(([k, v], r) => {
    const y = 140 + r * 24;
    doc.setTextColor(130);
    doc.text(k, 40, y);
    doc.setTextColor(30);
    doc.text(String(v), 220, y);
  });

  // Index (base 1 car la page 1 est la page de garde) des pages à pivoter réellement
  const rotate270: number[] = [];

  for (let i = 0; i < scans.length; i++) {
    const s = scans[i]!;
    doc.addPage();
    const pageIndex = i + 1; // 0-based dans pdf-lib
    if (s.pieceId === "demande_pec" || s.angle === 270) rotate270.push(pageIndex);

    doc.setFontSize(10);
    doc.setTextColor(120);
    const label = s.pieceId ? (meta.labels[s.pieceId] ?? s.pieceId) : "Non classé";
    doc.text(`${i + 1}. ${label}${s.side ? ` (${s.side})` : ""}`, 40, 40);
    doc.setDrawColor(210);
    doc.line(40, 50, 555, 50);

    if (s.mime.startsWith("image/")) {
      const img = await toDataUrl(s.url);
      if (img) {
        const maxW = W - 80;
        const maxH = H - 120;
        const ratio = Math.min(maxW / img.w, maxH / img.h);
        const w = img.w * ratio;
        const h = img.h * ratio;
        doc.addImage(img.data, "JPEG", (W - w) / 2, 70, w, h, undefined, "FAST");
      } else {
        doc.setTextColor(40);
        doc.text(s.fileName, 40, 90);
      }
    } else {
      doc.setTextColor(40);
      doc.setFontSize(12);
      doc.text(s.fileName, 40, 90);
      doc.setDrawColor(200);
      doc.rect(40, 110, W - 80, H - 180);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Document joint (non image)", W / 2, H / 2, { align: "center" });
    }
  }

  const bytes = new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
  if (!rotate270.length) return bytes;

  // Rotation réelle (binaire) des pages « Demande de PEC »
  const { PDFDocument, degrees } = await import("pdf-lib");
  const pdf = await PDFDocument.load(bytes);
  const pageList = pdf.getPages();
  rotate270.forEach((idx) => pageList[idx]?.setRotation(degrees(270)));
  return await pdf.save();
}

/**
 * Photographie l'état exact des scans importés (ordre 1..N, aperçus persistables)
 * afin de pouvoir rejouer le dossier depuis l'historique après rechargement.
 */
export async function buildDossierItems(
  scans: Scan[],
  labels: Record<string, string>,
): Promise<DossierItem[]> {
  const items: DossierItem[] = [];
  for (let i = 0; i < scans.length; i++) {
    const s = scans[i]!;
    let preview: string | undefined;
    if (s.mime.startsWith("image/")) {
      const img = await toDataUrl(s.url);
      if (img) preview = img.data;
    }
    items.push({
      order: i + 1,
      fileName: s.fileName,
      mime: s.mime,
      label: s.pieceId ? (labels[s.pieceId] ?? s.pieceId) : "Non classé",
      side: s.side,
      angle: s.angle,
      ...(preview ? { preview } : {}),
    });
  }
  return items;
}

/**
 * Compilation du sous-module « ingestion de dossier global » :
 * les pages du PDF global sont réellement reprises (la 1ère page — Demande de PEC —
 * est pivotée à 270° dans le flux binaire), puis les pièces importées séparément
 * sont ajoutées à la suite dans l'ordre du référentiel.
 */
export async function compileGlobalDossierBytes(
  globalBytes: Uint8Array | null,
  extras: Scan[],
  meta: CompileMeta,
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import("pdf-lib");
  const out = await PDFDocument.create();

  if (globalBytes) {
    try {
      const src = await PDFDocument.load(globalBytes);
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach((p, i) => {
        if (i === 0) p.setRotation(degrees(270));
        out.addPage(p);
      });
    } catch {
      /* fichier global illisible : on retombe sur les pièces */
    }
  }

  if (extras.length) {
    const extraBytes = await compileDossierBytes(extras, meta);
    const src2 = await PDFDocument.load(extraBytes);
    const copied2 = await out.copyPages(src2, src2.getPageIndices());
    copied2.forEach((p) => out.addPage(p));
  }

  if (out.getPageCount() === 0) return await compileDossierBytes(extras, meta);
  return await out.save();
}

export const bytesToDataUri = (bytes: Uint8Array) => {

  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk)
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:application/pdf;base64,${btoa(bin)}`;
};

export const dataUriToBlobUrl = (dataUri: string) => {
  const base64 = dataUri.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
};

export const downloadDataUri = (dataUri: string, fileName: string) => {
  const url = dataUriToBlobUrl(dataUri);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/** PDF de repli pour les dossiers historiques sans binaire enregistré. */
export async function buildDossierPdf(
  d: DossierRecord,
  interventionName: string,
  orgLabel: string,
) {
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
  if (d.pdfData) return dataUriToBlobUrl(d.pdfData);
  const doc = await buildDossierPdf(d, interventionName, orgLabel);
  return doc.output("bloburl").toString();
}
