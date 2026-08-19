import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("erp-theme") as Theme | null) ?? "dark";
    setTheme(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("erp-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-label="Changer de thème"
      className={cn(
        "glass-soft flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground",
        !showLabel && "justify-center",
      )}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {showLabel && <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>}
    </button>
  );
}
