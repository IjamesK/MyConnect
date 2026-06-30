import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Info } from "lucide-react";
import { Layout } from "../isp/Layout";

interface LED {
  id: string;
  label: string;
  description: string;
  normalState: "green" | "off";
  currentColor: string;
}

const successColor = "var(--color-success)";
const dangerColor = "var(--color-danger)";

const initialLEDs: LED[] = [
  {
    id: "power",
    label: "PWR",
    normalState: "green",
    currentColor: "transparent",
    description: "Device power status",
  },
  {
    id: "pon",
    label: "PON",
    normalState: "green",
    currentColor: "transparent",
    description: "Fiber signal from the ISP",
  },
  {
    id: "los",
    label: "LOS",
    normalState: "off",
    currentColor: "transparent",
    description: "Loss of Signal. Red means the fiber signal may be down",
  },
  {
    id: "internet",
    label: "INT",
    normalState: "green",
    currentColor: "transparent",
    description: "Internet connection status",
  },
  {
    id: "wifi",
    label: "Wi-Fi",
    normalState: "green",
    currentColor: "transparent",
    description: "Wireless network is active",
  },
  {
    id: "lan1",
    label: "LAN1",
    normalState: "green",
    currentColor: "transparent",
    description: "Wired device connected",
  },
  {
    id: "lan2",
    label: "LAN2",
    normalState: "off",
    currentColor: "transparent",
    description: "Second wired device connection",
  },
];

function isOn(led: LED) {
  return led.currentColor !== "transparent";
}

function getDiagnosisPattern(leds: LED[]) {
  const state = Object.fromEntries(
    leds.map((led) => [led.id, isOn(led)])
  ) as Record<string, boolean>;

  const powerOn = state.power;
  const ponOn = state.pon;
  const losRedOn = state.los;
  const internetOn = state.internet;
  const wifiOn = state.wifi;
  const lanOn = state.lan1 || state.lan2;

  if (!powerOn) {
    return "zte_no_power";
  }

  if (losRedOn) {
    return "zte_los_red";
  }

  if (powerOn && ponOn && !losRedOn && !internetOn) {
    return "zte_internet_off_noc";
  }

  if (powerOn && ponOn && internetOn && !wifiOn) {
    return "zte_wifi_disabled";
  }

  if (powerOn && ponOn && internetOn && wifiOn) {
    return "zte_normal_lights";
  }

  if (powerOn && !ponOn && !losRedOn) {
    return "zte_fiber_unclear";
  }

  if (powerOn && lanOn && !internetOn) {
    return "zte_lan_but_no_internet";
  }

  return "zte_unclear";
}

function routerLightsSummary(leds: LED[]) {
  return leds
    .filter(isOn)
    .map((led) => led.label)
    .join(",");
}

export function ZTEDiagnostic() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const issue = searchParams.get("issue") ?? "no-internet";

  const [leds, setLeds] = useState<LED[]>(initialLEDs);
  const [activeLed, setActiveLed] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const toggleLed = (id: string) => {
    setActiveLed(id);

    setLeds((prev) =>
      prev.map((led) => {
        if (led.id !== id) return led;

        if (isOn(led)) {
          return { ...led, currentColor: "transparent" };
        }

        return {
          ...led,
          currentColor: id === "los" ? dangerColor : successColor,
        };
      })
    );
  };

  const handleAnalyze = () => {
    const pattern = getDiagnosisPattern(leds);
    const activeLights = routerLightsSummary(leds);

    navigate(
      `/troubleshoot/result?issue=${issue}&device=zte&pattern=${pattern}&lights=${encodeURIComponent(
        activeLights
      )}`
    );
  };

  const activeLEDs = leds.filter(isOn);

  return (
    <Layout showBack backTo="/report-issue" title="Check Router Lights">
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontWeight: 800,
              }}
              className="text-[var(--color-text)] text-2xl"
            >
              Tell us what lights you see
            </h1>

            <p className="text-[var(--color-muted)] text-sm mt-1">
              Tap each router light that is currently on, red, or blinking.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="w-9 h-9 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center"
          >
            <Info size={16} className="text-[var(--color-primary)]" />
          </button>
        </div>

        {showInfo && (
          <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-[var(--color-primary)] text-xs font-semibold mb-2">
              Router light guide
            </p>

            {leds.map((led) => (
              <div key={led.id} className="flex items-start gap-2 py-1">
                <span
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  className="text-[10px] text-[var(--color-muted)] w-12"
                >
                  {led.label}
                </span>

                <span className="text-[var(--color-muted)] text-xs">
                  {led.description}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
          <div className="flex justify-center py-3">
            <div className="relative">
              {/* Router body. These colours are part of the physical device illustration. */}
              <div className="w-28 h-72 bg-gradient-to-b from-[#E2E8F0] to-[#CBD5E1] rounded-2xl border-2 border-[#94A3B8] shadow-xl relative overflow-hidden">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#94A3B8]/50 rounded-full" />

                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
                  <p
                    style={{
                      fontFamily: "'Inter Tight', system-ui, sans-serif",
                      fontWeight: 800,
                    }}
                    className="text-[#475569] text-[9px] tracking-widest"
                  >
                    ZTE
                  </p>
                </div>

                <div className="absolute left-3 top-12 bottom-12 w-5 bg-[#1E293B] rounded-lg flex flex-col items-center justify-around py-2">
                  {leds.map((led) => (
                    <button
                      key={led.id}
                      type="button"
                      onClick={() => toggleLed(led.id)}
                      className="relative"
                      aria-label={`Toggle ${led.label}`}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-white/20 transition-all"
                        style={{
                          backgroundColor: isOn(led)
                            ? led.currentColor
                            : "#0F172A",
                          boxShadow: isOn(led)
                            ? `0 0 8px ${led.currentColor}`
                            : "none",
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div className="absolute right-3 top-16 space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-0.5 bg-[#94A3B8]/40 rounded"
                    />
                  ))}
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-3 h-2 bg-[#0F172A] rounded-sm" />
                  ))}
                </div>
              </div>

              {/* LED labels beside device */}
              <div className="absolute left-full ml-4 top-12 bottom-12 flex flex-col justify-around">
                {leds.map((led) => {
                  const selected = isOn(led);

                  return (
                    <button
                      key={led.id}
                      type="button"
                      onClick={() => toggleLed(led.id)}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${
                        activeLed === led.id
                          ? "bg-[var(--color-surface-soft)]"
                          : ""
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full border flex-shrink-0"
                        style={{
                          backgroundColor: selected
                            ? led.currentColor
                            : "transparent",
                          borderColor: selected
                            ? led.currentColor
                            : "var(--color-border)",
                          boxShadow: selected
                            ? `0 0 6px ${led.currentColor}`
                            : "none",
                        }}
                      />

                      <span
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        className={`text-[11px] font-medium ${
                          selected
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-muted)]"
                        }`}
                      >
                        {led.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-[var(--color-text)] text-xs font-semibold mb-2">
            Selected lights
          </p>

          <div className="flex flex-wrap gap-2">
            {activeLEDs.map((led) => (
              <span
                key={led.id}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: `color-mix(in srgb, ${led.currentColor} 14%, transparent)`,
                  color: led.currentColor,
                  borderColor: `color-mix(in srgb, ${led.currentColor} 35%, transparent)`,
                }}
                className="px-2 py-0.5 rounded-full text-xs font-medium border"
              >
                {led.label}
              </span>
            ))}

            {activeLEDs.length === 0 && (
              <span className="text-[var(--color-muted)] text-xs">
                No lights selected yet. Tap the lights you can see on your
                router.
              </span>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-3">
          <p className="text-[var(--color-muted)] text-xs">
            <span className="font-semibold text-[var(--color-text)]">
              Tip:
            </span>{" "}
            If LOS is red or blinking, it usually points to a fiber signal
            problem.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Continue →
        </button>
      </div>
    </Layout>
  );
}
