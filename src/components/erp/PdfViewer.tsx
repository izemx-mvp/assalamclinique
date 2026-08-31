import { useEffect, useRef, useState } from "react";
import { Loader2, FileWarning, Minus, Plus, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Décode une data URI base64 en octets. */
const dataUriToBytes = (dataUri: string) => {
  const base64 = dataUri.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const MIN = 0.25;
const MAX = 2;
const clamp = (z: number) => Math.min(MAX, Math.max(MIN, z));

/**
 * Visualiseur PDF réel : rend chaque page du PDF dans un <canvas> via pdf.js.
 * Affichage par défaut adapté à la largeur du conteneur (100 % = fit), avec
 * une barre d'outils de zoom de 25 % à 200 %.
 */
export function PdfViewer({
  dataUri,
  className = "",
  scale = 1.6,
}: {
  dataUri: string;
  className?: string;
  scale?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setPageCount(0);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

        // Le worker doit être instancié par le bundler (?worker) : l'approche `?url`
        // casse en production (module ESM servi avec un mauvais type MIME / chemin).
        if (!pdfjs.GlobalWorkerOptions.workerPort && !pdfjs.GlobalWorkerOptions.workerSrc) {
          try {
            const mod = await import("pdfjs-dist/legacy/build/pdf.worker.mjs?worker");
            pdfjs.GlobalWorkerOptions.workerPort = new mod.default();
          } catch (workerError) {
            console.error("[PdfViewer] worker indisponible, fallback URL", workerError);
            const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs?url");
            pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
          }
        }

        const doc = await pdfjs.getDocument({ data: dataUriToBytes(dataUri) }).promise;
        if (cancelled) return;

        const host = hostRef.current;
        if (!host) return;
        host.innerHTML = "";
        setPageCount(doc.numPages);
        setState("ready");

        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = "mx-auto mb-3 block h-auto w-full rounded-lg bg-white shadow-lg";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          host.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch (error) {
        console.error("[PdfViewer] rendu impossible", error);
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataUri, scale]);

  return (
    <div className={`relative h-full overflow-auto p-3 ${className}`}>
      {state === "loading" && (
        <div className="grid h-full place-items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          Chargement du document…
        </div>
      )}
      {state === "error" && (
        <div className="grid h-full place-items-center gap-2 text-sm text-muted-foreground">
          <FileWarning className="size-8" />
          Document illisible.
        </div>
      )}

      {state === "ready" && (
        <div className="sticky top-0 z-10 mb-3 flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-background/70 p-1 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Réduire le zoom"
            onClick={() => setZoom((z) => clamp(Math.round((z - 0.25) * 100) / 100))}
            disabled={zoom <= MIN}
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Augmenter le zoom"
            onClick={() => setZoom((z) => clamp(Math.round((z + 0.25) * 100) / 100))}
            disabled={zoom >= MAX}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Adapter à la vue"
            onClick={() => setZoom(1)}
          >
            <Maximize className="size-4" />
          </Button>
        </div>
      )}

      <div
        className={`mx-auto transition-[width] duration-200 ${state === "ready" ? "" : "hidden"}`}
        style={{ width: `${zoom * 100}%`, maxWidth: zoom <= 1 ? "100%" : "none" }}
      >
        <div ref={hostRef} />
      </div>

      {state === "ready" && pageCount > 0 && (
        <p className="pb-1 text-center text-xs text-muted-foreground">{pageCount} page(s)</p>
      )}
    </div>
  );
}
