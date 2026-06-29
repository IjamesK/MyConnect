export type ThemeName = "canalbox" | "dark" | "emerald" | "sunset";

type ThemeColors = {
  primary: string;
  primaryDark: string;
  background: string;
  surface: string;
  surfaceSoft: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
};

export const themes: Record<ThemeName, ThemeColors> = {
  canalbox: {
    primary: "#0057B8",
    primaryDark: "#003D82",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceSoft: "#EBF2FF",
    text: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0",
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#B45309",
  },

  dark: {
    primary: "#38BDF8",
    primaryDark: "#0284C7",
    background: "#020617",
    surface: "#0F172A",
    surfaceSoft: "#1E293B",
    text: "#F8FAFC",
    muted: "#94A3B8",
    border: "#334155",
    success: "#22C55E",
    danger: "#F87171",
    warning: "#F59E0B",
  },

  emerald: {
    primary: "#059669",
    primaryDark: "#047857",
    background: "#F0FDF4",
    surface: "#FFFFFF",
    surfaceSoft: "#DCFCE7",
    text: "#052E16",
    muted: "#4B5563",
    border: "#BBF7D0",
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#B45309",
  },

  sunset: {
    primary: "#EA580C",
    primaryDark: "#C2410C",
    background: "#FFF7ED",
    surface: "#FFFFFF",
    surfaceSoft: "#FFEDD5",
    text: "#1C1917",
    muted: "#78716C",
    border: "#FED7AA",
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#D97706",
  },
};

function isThemeName(value: string | null): value is ThemeName {
  return (
    value === "canalbox" ||
    value === "dark" ||
    value === "emerald" ||
    value === "sunset"
  );
}

export function getSavedTheme(): ThemeName {
  try {
    if (typeof window === "undefined") return "canalbox";

    const saved = window.localStorage.getItem("appTheme");

    if (isThemeName(saved)) return saved;
  } catch (error) {
    console.warn("Failed to read saved theme:", error);
  }

  return "canalbox";
}

export function applyTheme(themeName: ThemeName) {
  try {
    if (typeof document === "undefined") return;

    const theme = themes[themeName] ?? themes.canalbox;
    const root = document.documentElement;

    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--color-primary-dark", theme.primaryDark);
    root.style.setProperty("--color-bg", theme.background);
    root.style.setProperty("--color-surface", theme.surface);
    root.style.setProperty("--color-surface-soft", theme.surfaceSoft);
    root.style.setProperty("--color-text", theme.text);
    root.style.setProperty("--color-muted", theme.muted);
    root.style.setProperty("--color-border", theme.border);
    root.style.setProperty("--color-success", theme.success);
    root.style.setProperty("--color-danger", theme.danger);
    root.style.setProperty("--color-warning", theme.warning);

    root.setAttribute("data-theme", themeName);

    try {
      window.localStorage.setItem("appTheme", themeName);
    } catch (error) {
      console.warn("Failed to save theme:", error);
    }
  } catch (error) {
    console.error("Failed to apply theme:", error);
  }
}
