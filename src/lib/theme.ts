/** One palette drives every customer screen, staff view, modal and support assistant. */
export type ThemeName = "canalbox" | "slate" | "dark" | "emerald" | "sunset";

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
  subtleText: string;
  raised: string;
  hover: string;
  input: string;
  primaryContrast: string;
  primaryText: string;
  successText: string;
  dangerText: string;
  warningText: string;
  successAction: string;
  dangerAction: string;
  warningAction: string;
  successSoft: string;
  successBorder: string;
  successStrong: string;
  dangerSoft: string;
  dangerBorder: string;
  dangerStrong: string;
  warningSoft: string;
  warningBorder: string;
  warningStrong: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarMuted: string;
  sidebarHover: string;
  overlay: string;
};

const lightTokens = {
  surface: "#FFFFFF", text: "#172033", muted: "#66758B", subtleText: "#8895A7",
  border: "#E3E7EE", raised: "#FFFFFF", hover: "#EFF2F7", input: "#FFFFFF",
  primaryContrast: "#FFFFFF", success: "#15803D", danger: "#B42318", warning: "#A15C07",
  primaryText: "#C00069", successText: "#15803D", dangerText: "#B42318", warningText: "#A15C07",
  successAction: "#15803D", dangerAction: "#B42318", warningAction: "#A15C07",
  successSoft: "#ECFDF3", successBorder: "#B7ECC9", successStrong: "#166534",
  dangerSoft: "#FEF3F2", dangerBorder: "#F6C4BE", dangerStrong: "#912018",
  warningSoft: "#FFF7E6", warningBorder: "#F4D49E", warningStrong: "#8B4A05",
  sidebarBg: "#FFFFFF", sidebarText: "#172033", sidebarMuted: "#66758B",
  sidebarHover: "#F1F4F8", overlay: "#0F172A",
};

export const themes: Record<ThemeName, ThemeColors> = {
  canalbox: {
    ...lightTokens, primary: "#C00069", primaryDark: "#990052", background: "#F7F8FB",
    surfaceSoft: "#FCEBF4", hover: "#FAF0F6", border: "#E8E6ED",
  },
  slate: {
    ...lightTokens, primary: "#475569", primaryText: "#475569", primaryDark: "#334155", background: "#F1F3F6",
    surfaceSoft: "#E7EBF0", hover: "#E9EDF2", border: "#DCE1E8",
    text: "#19212D", muted: "#606D7C", sidebarHover: "#E9EDF2",
  },
  dark: {
    primary: "#4F46E5", primaryText: "#A5B4FC", primaryDark: "#4338CA", background: "#10151F",
    surface: "#1B2432", surfaceSoft: "#292F4A", text: "#F0F4FA", muted: "#B1BDD0",
    subtleText: "#96A4BB", border: "#344153", raised: "#242F40", hover: "#2A3446",
    input: "#222D3F", primaryContrast: "#FFFFFF", success: "#4ADE80", danger: "#FB7185",
    warning: "#FBBF24", successText: "#4ADE80", dangerText: "#FDA4AF", warningText: "#FCD34D",
    successAction: "#166534", dangerAction: "#BE123C", warningAction: "#A16207", successSoft: "#14372C", successBorder: "#235844", successStrong: "#86EFAC",
    dangerSoft: "#49252E", dangerBorder: "#75404C", dangerStrong: "#FDA4AF",
    warningSoft: "#463518", warningBorder: "#785B30", warningStrong: "#FCD34D",
    sidebarBg: "#161E2B", sidebarText: "#F0F4FA", sidebarMuted: "#B1BDD0",
    sidebarHover: "#273346", overlay: "#020617",
  },
  emerald: {
    ...lightTokens, primary: "#047857", primaryText: "#047857", primaryDark: "#065F46", background: "#F4F9F7",
    surfaceSoft: "#E5F6EE", hover: "#EAF7F0", border: "#DAE7DF",
    text: "#172A25", muted: "#5F766D",
  },
  sunset: {
    ...lightTokens, primary: "#C2410C", primaryText: "#C2410C", primaryDark: "#9A3412", background: "#FBF8F5",
    surfaceSoft: "#FCEBDD", hover: "#F9F0E7", border: "#EAE3DA",
    text: "#32231B", muted: "#76675E",
  },
};

export function getSavedTheme(): ThemeName {
  try {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("appTheme") : null;
    if (saved && Object.prototype.hasOwnProperty.call(themes, saved)) return saved as ThemeName;
  } catch { /* Storage can be disabled by the browser. */ }
  return "canalbox";
}

export function applyTheme(themeName: ThemeName) {
  if (typeof document === "undefined") return;
  const theme = themes[themeName] ?? themes.canalbox;
  const root = document.documentElement;
  const properties: Record<string, string> = {
    "--color-primary": theme.primary,
    "--color-primary-text": theme.primaryText,
    "--color-success-text": theme.successText,
    "--color-danger-text": theme.dangerText,
    "--color-warning-text": theme.warningText,
    "--color-success-action": theme.successAction,
    "--color-danger-action": theme.dangerAction,
    "--color-warning-action": theme.warningAction,
    "--color-primary-dark": theme.primaryDark,
    "--color-bg": theme.background,
    "--color-surface": theme.surface,
    "--color-surface-soft": theme.surfaceSoft,
    "--color-text": theme.text,
    "--color-muted": theme.muted,
    "--color-subtle-text": theme.subtleText,
    "--color-border": theme.border,
    "--color-success": theme.success,
    "--color-danger": theme.danger,
    "--color-warning": theme.warning,
    "--color-raised": theme.raised,
    "--color-hover": theme.hover,
    "--color-input": theme.input,
    "--color-primary-contrast": theme.primaryContrast,
    "--color-success-soft": theme.successSoft,
    "--color-success-border": theme.successBorder,
    "--color-success-strong": theme.successStrong,
    "--color-danger-soft": theme.dangerSoft,
    "--color-danger-border": theme.dangerBorder,
    "--color-danger-strong": theme.dangerStrong,
    "--color-warning-soft": theme.warningSoft,
    "--color-warning-border": theme.warningBorder,
    "--color-warning-strong": theme.warningStrong,
    "--color-sidebar-bg": theme.sidebarBg,
    "--color-sidebar-text": theme.sidebarText,
    "--color-sidebar-muted": theme.sidebarMuted,
    "--color-sidebar-hover": theme.sidebarHover,
    "--color-overlay": theme.overlay,
  };
  for (const [property, value] of Object.entries(properties)) root.style.setProperty(property, value);
  root.setAttribute("data-theme", themeName);
  root.classList.toggle("dark", themeName === "dark");
  root.style.colorScheme = themeName === "dark" ? "dark" : "light";
  try { window.localStorage.setItem("appTheme", themeName); } catch { /* Optional persistence. */ }
  window.dispatchEvent(new CustomEvent("myconnect:theme-changed", { detail: { theme: themeName } }));
}
