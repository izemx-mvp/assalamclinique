import { useEffect, useRef, useState } from "react";
import { Loader2, FileWarning } from "lucide-react";

/** Décode une data URI base64 en octets. */
const dataUriToBytes = (dataUri: string) => {
  const base64 = dataUri.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/**
 * Visualiseur PDF réel : rend chaque page du PDF dans un <canvas> via pdf.js.
 * Évite l'iframe (bloquée par Chrome pour les blob/data URLs dans les previews).
 */
export function PdfViewer({
  dataUri,
  className = "",
  scale = 1.5,
}: {
  dataUri: string;
  className?: string;
  scale?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";
    setState("loading");

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

        const doc = await pdfjs.getDocument({ data: dataUriToBytes(dataUri) }).promise;
        if (cancelled) return;
        setPageCount(doc.numPages);

        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = "mx-auto mb-3 w-full max-w-full rounded-lg bg-white shadow-lg";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          host.appendChild(canvas);
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) setState("ready");
      } catch (e) {
        setErr(String(e));
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataUri, scale]);

  return (
    <div className={`relative h-full overflow-y-auto p-3 ${className}`}>
      {state === "loading" && (
        <div className="grid h-full place-items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          Chargement du document…
        </div>
      )}
      {state === "error" && (
        <div className="grid h-full place-items-center gap-2 text-sm text-muted-foreground">
          <FileWarning className="size-8" />
          Document illisible. {err}
        </div>
      )}
      <div ref={hostRef} className={state === "ready" ? "" : "hidden"} />
      {state === "ready" && pageCount > 0 && (
        <p className="pb-1 text-center text-xs text-muted-foreground">{pageCount} page(s)</p>
      )}
    </div>
  );
}
