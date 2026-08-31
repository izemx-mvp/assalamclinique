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
 * `opts.cover = false` produit un PDF strictement composé des pages des documents
 * (aucune page de garde ni en-tête textuel ajouté par le système).
 */
export async function compileDossierBytes(
  scans: Scan[],
  meta: CompileMeta,
  opts: { cover?: boolean } = {},
): Promise<Uint8Array> {
  const withCover = opts.cover !== false;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595.28;
  const H = 841.89;

  if (withCover) {
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
  }

  // Index 0-based (pdf-lib) des pages à pivoter réellement
  const rotate270: number[] = [];

  for (let i = 0; i < scans.length; i++) {
    const s = scans[i]!;
    if (withCover || i > 0) doc.addPage();
    const pageIndex = withCover ? i + 1 : i;
    if (s.pieceId === "demande_pec" || s.angle === 270) rotate270.push(pageIndex);

    const top = withCover ? 70 : 24;
    if (withCover) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      const label = s.pieceId ? (meta.labels[s.pieceId] ?? s.pieceId) : "Non classé";
      doc.text(`${i + 1}. ${label}${s.side ? ` (${s.side})` : ""}`, 40, 40);
      doc.setDrawColor(210);
      doc.line(40, 50, 555, 50);
    }

    if (s.mime.startsWith("image/")) {
      const img = await toDataUrl(s.url);
      if (img) {
        const maxW = W - (withCover ? 80 : 48);
        const maxH = H - (withCover ? 120 : 48);
        const ratio = Math.min(maxW / img.w, maxH / img.h);
        const w = img.w * ratio;
        const h = img.h * ratio;
        doc.addImage(img.data, "JPEG", (W - w) / 2, top, w, h, undefined, "FAST");
      } else if (withCover) {
        doc.setTextColor(40);
        doc.text(s.fileName, 40, 90);
      }
    } else if (withCover) {
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

/** Charge le dossier PDF de référence (Ouassim BEN MASSAOUD) depuis le CDN. */
export async function fetchReferenceDossierBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) {
      console.error("[dossier-pdf] référence introuvable", url, res.status);
      return null;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    // En production, un mauvais routage peut renvoyer du HTML (index.html) avec un 200 :
    // on vérifie la signature binaire du PDF avant de l'utiliser.
    const header = String.fromCharCode(...bytes.subarray(0, 5));
    if (header !== "%PDF-") {
      console.error("[dossier-pdf] la référence n'est pas un PDF", url, header);
      return null;
    }
    return bytes;
  } catch (error) {
    console.error("[dossier-pdf] échec du chargement de la référence", url, error);
    return null;
  }
}


/** Page de garde autonome (A4) insérée vers la fin du dossier compilé. */
export async function buildCoverPageBytes(meta: CompileMeta): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("CLINIQUE ASSALAM — Page de garde du dossier", 40, 40);
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
    ["Date de compilation", new Date().toLocaleString("fr-FR")],
  ];
  rows.forEach(([k, v], r) => {
    const y = 140 + r * 24;
    doc.setTextColor(130);
    doc.text(k, 40, y);
    doc.setTextColor(30);
    doc.text(String(v), 220, y);
  });
  return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
}

/**
 * Compilation du sous-module « ingestion de dossier global ».
 * Le PDF final ne contient QUE les pages réelles des documents :
 * la 1ère page (Demande de PEC) est pivotée à 270° dans le flux binaire, et,
 * si `rotateLast`, la dernière page (Carte mutuelle) l'est également.
 * `coverAtEnd` insère la page de garde vers la fin du document.
 */
export async function compileGlobalDossierBytes(
  globalBytes: Uint8Array | null,
  extras: Scan[],
  meta: CompileMeta,
  opts: { rotateLast?: boolean; lastAngle?: number; coverAtEnd?: boolean } = {},
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import("pdf-lib");
  const out = await PDFDocument.create();
  const lastAngle = opts.lastAngle ?? 180;

  if (globalBytes) {
    try {
      const src = await PDFDocument.load(globalBytes);
      const copied = await out.copyPages(src, src.getPageIndices());
      const last = copied.length - 1;
      copied.forEach((p, i) => {
        if (i === 0) p.setRotation(degrees(270));
        else if (opts.rotateLast && i === last) p.setRotation(degrees(lastAngle));
        out.addPage(p);
      });
    } catch {
      /* fichier global illisible : on retombe sur les pièces */
    }
  }

  if (extras.length) {
    const extraBytes = await compileDossierBytes(extras, meta, { cover: false });
    const src2 = await PDFDocument.load(extraBytes);
    const copied2 = await out.copyPages(src2, src2.getPageIndices());
    copied2.forEach((p) => out.addPage(p));
  }

  if (out.getPageCount() === 0) return await compileDossierBytes(extras, meta, { cover: false });

  // Page de garde unique, strictement en dernière page du document.
  if (opts.coverAtEnd) {
    try {
      const coverDoc = await PDFDocument.load(await buildCoverPageBytes(meta));
      const [coverPage] = await out.copyPages(coverDoc, [0]);
      if (coverPage) out.addPage(coverPage);
    } catch {
      /* page de garde non bloquante */
    }
  }


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
