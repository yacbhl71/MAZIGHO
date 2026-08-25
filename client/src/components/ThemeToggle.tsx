import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocale } from "@/contexts/LocaleContext";

type ThemeLabels = {
  enableDark: string;
  enableLight: string;
};

const themeLabels: Record<string, ThemeLabels> = {
  fr: { enableDark: "Activer le mode sombre", enableLight: "Activer le mode clair" },
  de: { enableDark: "Dunklen Modus aktivieren", enableLight: "Hellen Modus aktivieren" },
  it: { enableDark: "Attiva la modalità scura", enableLight: "Attiva la modalità chiara" },
  en: { enableDark: "Enable dark mode", enableLight: "Enable light mode" },
  es: { enableDark: "Activar el modo oscuro", enableLight: "Activar el modo claro" },
  nl: { enableDark: "Donkere modus inschakelen", enableLight: "Lichte modus inschakelen" },
  ar: { enableDark: "تفعيل الوضع الداكن", enableLight: "تفعيل الوضع الفاتح" },
};

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { locale } = useLocale();
  const labels = themeLabels[locale] ?? themeLabels.fr;
  const isDark = theme === "dark";
  const label = isDark ? labels.enableLight : labels.enableDark;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      <span className="sr-only">{label}</span>
    </button>
  );
}
