import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass rounded-2xl p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="glass-soft inline-flex rounded-xl p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-4 py-1.5 text-xs font-medium transition-all",
            value === o.value
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_var(--color-primary)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>
          {from}–{to} sur {total}
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSize(Number(e.target.value));
            onPage(1);
          }}
          className="glass-soft h-8 rounded-lg px-2 text-xs outline-none"
        >
          {[5, 10, 20].map((n) => (
            <option key={n} value={n} className="bg-popover">
              {n} / page
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="glass-soft rounded-lg px-3 py-1.5 disabled:opacity-40"
        >
          Précédent
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={cn(
              "min-w-8 rounded-lg px-2.5 py-1.5 transition-all",
              p === page
                ? "bg-primary text-primary-foreground"
                : "glass-soft text-muted-foreground hover:text-foreground",
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(Math.min(pages, page + 1))}
          disabled={page >= pages}
          className="glass-soft rounded-lg px-3 py-1.5 disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

/** Champ de filtre discret placé en en-tête de colonne de tableau. */
export function FilterInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="glass-soft h-8 w-full min-w-[90px] rounded-lg px-2 text-[11px] font-normal text-foreground normal-case placeholder:text-muted-foreground/70 outline-none focus:ring-1 focus:ring-primary/50"
    />
  );
}

/** En-tête d'écran glassmorphique (icône + titre + sous-titre + action). */
export function PageHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="glow-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary/25 text-accent">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/** Pilule d'état colorée. */
export function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "red" | "orange" | "blue" | "gray" | "violet" | "cyan";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    green: "bg-success/15 text-success border-success/30",
    red: "bg-destructive/15 text-destructive border-destructive/30",
    orange: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    blue: "bg-primary/15 text-accent border-primary/30",
    cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    violet: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    gray: "bg-muted/40 text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
