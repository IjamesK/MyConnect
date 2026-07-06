import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Info } from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";
import {
  diagnoseRouterLights,
  normalizeRouterType,
  routerLightsFor,
  routerName,
  ticketTypeFromRouterPattern,
  type RouterLight,
} from "../../../lib/routerTypes";
import { Layout } from "../isp/Layout";

function loadProfile() {
  try {
    const savedProfile = localStorage.getItem("customerProfile");
    return savedProfile ? (JSON.parse(savedProfile) as CustomerProfile) : null;
  } catch {
    return null;
  }
}

function lightColor(light: RouterLight) {
  return light.color === "red" ? "var(--color-danger)" : "var(--color-success)";
}

export function ZTEDiagnostic() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const issue = searchParams.get("issue") ?? "no_internet";
  const profile = loadProfile();
  const routerType = normalizeRouterType(profile?.routerType ?? "zte_white");
  const lights = useMemo(() => routerLightsFor(routerType), [routerType]);
  const [selectedLights, setSelectedLights] = useState<string[]>([]);
  const [activeLight, setActiveLight] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const selectedLightObjects = lights.filter((light) =>
    selectedLights.includes(light.id)
  );

  const toggleLight = (id: string) => {
    setActiveLight(id);
    setSelectedLights((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleContinue = () => {
    const pattern = diagnoseRouterLights(routerType, selectedLights, issue);
    const activeLightLabels = selectedLightObjects
      .map((light) => light.label)
      .join(",");

    navigate(
      `/report-issue?mode=ticket&type=${ticketTypeFromRouterPattern(
        issue,
        pattern
      )}&source=router_lights&routerType=${routerType}&pattern=${pattern}&lights=${encodeURIComponent(
        activeLightLabels
      )}`
    );
  };

  const isBlackOnt = routerType === "alc_black" || routerType === "alcl_black";
  const deviceWidth = isBlackOnt ? "min-w-[560px]" : "min-w-[390px]";
  const bodyWidth = isBlackOnt ? "w-[560px]" : "w-[390px]";

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
              Your account is linked to {routerName(routerType)}. Tap each light that is currently on, red, or blinking.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="w-9 h-9 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0"
          >
            <Info size={16} className="text-[var(--color-primary)]" />
          </button>
        </div>

        {showInfo && (
          <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-[var(--color-primary)] text-xs font-semibold mb-2">
              Router light guide
            </p>

            {lights.map((light) => (
              <div key={light.id} className="flex items-start gap-2 py-1">
                <span
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  className="text-[10px] text-[var(--color-muted)] w-20 shrink-0 whitespace-nowrap"
                >
                  {light.label}
                </span>

                <span className="text-[var(--color-muted)] text-xs">
                  {light.description}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
          <p className="text-[var(--color-muted)] text-[11px] mb-2 text-right">
            Scroll to see all lights →
          </p>
          <div className="flex justify-start py-3 overflow-x-auto">
            <div className={`relative ${deviceWidth}`}>
              {/* Router body starts */}
              <div
                className={`${bodyWidth} h-[150px] rounded-2xl border-2 shadow-xl relative overflow-hidden ${
                  isBlackOnt
                    ? "bg-gradient-to-b from-[#111827] to-[#020617] border-[#334155]"
                    : "bg-gradient-to-b from-[#E2E8F0] to-[#CBD5E1] border-[#94A3B8]"
                }`}
              >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center">
                  <p
                    style={{
                      fontFamily: "'Inter Tight', system-ui, sans-serif",
                      fontWeight: 800,
                    }}
                    className={`text-[10px] tracking-[0.25em] ${
                      isBlackOnt ? "text-white/70" : "text-[#475569]"
                    }`}
                  >
                    {isBlackOnt ? "ALCL" : "ZTE"}
                  </p>
                </div>

                <div
                  className={`absolute top-8 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full ${
                    isBlackOnt ? "bg-white/15" : "bg-[#94A3B8]/40"
                  }`}
                />

                <div className="absolute left-1/2 -translate-x-1/2 top-[54px] flex items-start justify-center gap-2.5">
                  {lights.map((light) => {
                    const selected = selectedLights.includes(light.id);
                    const color = lightColor(light);

                    return (
                      <button
                        key={light.id}
                        type="button"
                        onClick={() => toggleLight(light.id)}
                        className={`flex flex-col items-center gap-2 px-1.5 py-1 rounded-lg transition-all ${
                          activeLight === light.id
                            ? isBlackOnt
                              ? "bg-white/10"
                              : "bg-white/50"
                            : isBlackOnt
                              ? "hover:bg-white/10"
                              : "hover:bg-white/30"
                        }`}
                        aria-label={`Toggle ${light.label}`}
                      >
                        <div
                          className={`${selected ? "w-4 h-4 border-white/20" : "w-3.5 h-3.5 border-dashed border-[#94A3B8]/70"} rounded-full border transition-all`}
                          style={{
                            backgroundColor: selected ? color : isBlackOnt ? "#475569" : "#CBD5E1",
                            boxShadow: selected ? `0 0 9px ${color}` : "none",
                          }}
                        />

                        <span
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          className={`text-[8.5px] font-bold whitespace-nowrap leading-none ${
                            selected
                              ? isBlackOnt
                                ? "text-white"
                                : "text-[#0F172A]"
                              : isBlackOnt
                                ? "text-white/55"
                                : "text-[#64748B]"
                          }`}
                        >
                          {light.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="absolute bottom-4 right-5 flex gap-1">
                  {[...Array(isBlackOnt ? 5 : 4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-2.5 rounded-sm ${
                        isBlackOnt ? "bg-white/20" : "bg-[#0F172A]"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Router body ends */}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-[var(--color-text)] text-xs font-semibold mb-2">
            Selected lights
          </p>

          <div className="flex flex-wrap gap-2">
            {selectedLightObjects.map((light) => (
              <span
                key={light.id}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: lightColor(light),
                  borderColor: lightColor(light),
                }}
                className="px-2 py-0.5 rounded-full text-xs font-medium border bg-[var(--color-surface-soft)] whitespace-nowrap"
              >
                {light.label}
              </span>
            ))}

            {selectedLightObjects.length === 0 && (
              <span className="text-[var(--color-muted)] text-xs">
                No lights selected yet. Tap the lights you can see on your router.
              </span>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-3">
          <p className="text-[var(--color-muted)] text-xs">
            <span className="font-semibold text-[var(--color-text)]">Tip:</span>{" "}
            This light check is attached to your ticket so support can understand the issue faster.
          </p>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3 bg-[#E5007D] hover:bg-[#BE0067] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Continue →
        </button>
      </div>
    </Layout>
  );
}
