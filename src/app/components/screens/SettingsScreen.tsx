import { useEffect, useState } from "react";
import { CheckCircle, KeyRound, Languages, Palette, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import {
  applyTheme,
  getSavedTheme,
  themes,
  type ThemeName,
} from "../../../lib/theme";
import {
  getSavedLanguage,
  languageLabels,
  saveLanguage,
  type AppLanguage,
} from "../../../lib/i18n";

const themeLabels: Record<ThemeName, string> = {
  canalbox: "CanalBox Rose",
  slate: "Mist Grey",
  dark: "Midnight",
  emerald: "Emerald",
  sunset: "Sunset",
};

const themeDescriptions: Record<ThemeName, string> = {
  canalbox: "Signature CanalBox accents on calm neutral surfaces.",
  slate: "Soft grey backgrounds, crisp cards and minimal color.",
  dark: "Balanced dark surfaces for low-light use.",
  emerald: "A clean green theme for a softer look.",
  sunset: "A warm orange theme with bright highlights.",
};

export function SettingsScreen() {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(() => getSavedTheme());
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>("en");

  useEffect(() => {
    setSelectedTheme(getSavedTheme());
    setSelectedLanguage(getSavedLanguage());
  }, []);

  const handleThemeChange = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
    applyTheme(themeName);
  };

  const handleLanguageChange = (language: AppLanguage) => {
    setSelectedLanguage(language);
    saveLanguage(language);
  };

  return (
    <Layout showBack backTo="/dashboard" title="Settings">
      <div className="mx-auto max-w-3xl px-4 py-5 space-y-5 sm:px-6 lg:py-8">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[var(--color-text)] text-2xl"
          >
            App Settings
          </h1>

          <p className="text-[var(--color-muted)] text-sm mt-1">
            Choose how MyConnect looks and feels on this device.
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center">
              <Palette size={20} className="text-[var(--color-primary-text)]" />
            </div>

            <div>
              <p className="text-[var(--color-text)] text-sm font-bold">
                Theme
              </p>
              <p className="text-[var(--color-muted)] text-xs">
                Change the app color style.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(themes) as ThemeName[]).map((themeName) => {
              const theme = themes[themeName];
              const active = selectedTheme === themeName;

              return (
                <button
                  key={themeName}
                  type="button"
                  onClick={() => handleThemeChange(themeName)}
                  aria-pressed={active}
                  className={`w-full p-4 rounded-2xl border text-left transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="mb-3 flex h-14 items-stretch overflow-hidden rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.background }} aria-hidden="true">
                    <div className="w-9 border-r p-2" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                      <div className="h-2 w-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                      <div className="mt-2 h-1 w-4 rounded-full" style={{ backgroundColor: theme.border }} />
                      <div className="mt-1 h-1 w-3 rounded-full" style={{ backgroundColor: theme.border }} />
                    </div>
                    <div className="flex flex-1 items-center gap-2 p-2">
                      <div className="h-8 flex-1 rounded-md border" style={{ borderColor: theme.border, backgroundColor: theme.surface }} />
                      <div className="h-8 w-9 rounded-md" style={{ backgroundColor: theme.primary }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-5 h-5 rounded-full border border-[var(--color-border)]"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-[var(--color-border)]"
                        style={{ backgroundColor: theme.background }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-[var(--color-border)]"
                        style={{ backgroundColor: theme.surface }}
                      />
                    </div>

                    <div className="flex-1">
                      <p className="text-[var(--color-text)] text-sm font-semibold">
                        {themeLabels[themeName]}
                      </p>

                      <p className="text-[var(--color-muted)] text-xs mt-0.5">
                        {themeDescriptions[themeName]}
                      </p>
                    </div>

                    {active && (
                      <CheckCircle
                        size={18}
                        className="text-[var(--color-primary-text)]"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center">
              <ShieldCheck size={20} className="text-[var(--color-primary-text)]" />
            </div>

            <div>
              <p className="text-[var(--color-text)] text-sm font-bold">
                Account Security
              </p>
              <p className="text-[var(--color-muted)] text-xs">
                Manage your login password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/settings/change-password")}
            className="w-full p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
                <KeyRound size={18} className="text-[var(--color-primary-text)]" />
              </div>

              <div className="flex-1">
                <p className="text-[var(--color-text)] text-sm font-semibold">
                  Change Password
                </p>
                <p className="text-[var(--color-muted)] text-xs mt-0.5">
                  Use your old password to set a new one.
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center">
              <Languages size={20} className="text-[var(--color-primary-text)]" />
            </div>

            <div>
              <p className="text-[var(--color-text)] text-sm font-bold">
                Language
              </p>
              <p className="text-[var(--color-muted)] text-xs">
                Choose the language used in the customer app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(languageLabels) as AppLanguage[]).map((language) => {
              const active = selectedLanguage === language;

              return (
                <button
                  key={language}
                  type="button"
                  onClick={() => handleLanguageChange(language)}
                  className={`p-3 rounded-xl border text-sm font-semibold ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)] text-[var(--color-primary-text)]"
                      : "border-[var(--color-border)] text-[var(--color-text)]"
                  }`}
                >
                  {languageLabels[language]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
