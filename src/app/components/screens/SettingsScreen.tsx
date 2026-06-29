import {
  getSavedLanguage,
  languageLabels,
  saveLanguage,
  type AppLanguage,
} from "../../../lib/i18n";
import { useEffect, useState } from "react";
import { CheckCircle, Palette } from "lucide-react";
import { Layout } from "../isp/Layout";
import {
  applyTheme,
  getSavedTheme,
  themes,
  type ThemeName,
} from "../../../lib/theme";

const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>("en");

const themeLabels: Record<ThemeName, string> = {
  canalbox: "CanalBox Blue",
  dark: "Dark Mode",
  emerald: "Emerald",
  sunset: "Sunset",
};

const themeDescriptions: Record<ThemeName, string> = {
  canalbox: "The default MyConnect blue theme.",
  dark: "A darker interface for low-light use.",
  emerald: "A clean green theme for a softer look.",
  sunset: "A warm orange theme with bright highlights.",
};

export function SettingsScreen() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>("canalbox");

  useEffect(() => {
    setSelectedLanguage(getSavedLanguage());
    setSelectedTheme(getSavedTheme());
  }, []);

  const handleLanguageChange = (language: AppLanguage) => {
  setSelectedLanguage(language);
  saveLanguage(language);
};

  const handleThemeChange = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
    applyTheme(themeName);
  };

  return (
    <Layout showBack backTo="/dashboard" title="Settings">
      <div className="px-4 py-5 space-y-5">
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
            Choose how MyConnect looks on this device.
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center">
              <Palette size={20} className="text-[var(--color-primary)]" />
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

          <div className="space-y-3">
            {(Object.keys(themes) as ThemeName[]).map((themeName) => {
              const theme = themes[themeName];
              const active = selectedTheme === themeName;

              return (
                <button
                  key={themeName}
                  type="button"
                  onClick={() => handleThemeChange(themeName)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: theme.background }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border"
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
                        className="text-[var(--color-primary)]"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-2xl p-4">
          <p className="text-[var(--color-text)] text-sm font-semibold">
            Note
          </p>

          <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
            Some older pages may still use fixed colors. We can gradually update
            them to use the theme system so the entire app changes perfectly.
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
  <p className="text-[var(--color-text)] text-sm font-bold mb-1">
    Language
  </p>

  <p className="text-[var(--color-muted)] text-xs mb-4">
    Choose the language used in the customer app.
  </p>

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
              ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]"
              : "border-[var(--color-border)] text-[var(--color-text)]"
          }`}
        >
          {languageLabels[language]}
        </button>
      );
    })}
  </div>
</div>
      
    </Layout>
  );
}
