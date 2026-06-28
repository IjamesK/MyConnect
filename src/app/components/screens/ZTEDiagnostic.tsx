import { useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { Info } from "lucide-react";

interface LED {
  id: string;
  label: string;
  normalState: "green" | "off" | "green-blink";
  currentColor: string;
  position: { top: string };
}

const initialLEDs: LED[] = [
  { id: "power", label: "PWR", normalState: "green", currentColor: "#16A34A", position: { top: "12%" } },
  { id: "pon", label: "PON", normalState: "green", currentColor: "transparent", position: { top: "24%" } },
  { id: "los", label: "LOS", normalState: "off", currentColor: "#DC2626", position: { top: "36%" } },
  { id: "internet", label: "INT", normalState: "green", currentColor: "transparent", position: { top: "48%" } },
  { id: "wifi", label: "WiFi", normalState: "green", currentColor: "transparent", position: { top: "60%" } },
  { id: "lan1", label: "LAN1", normalState: "green", currentColor: "transparent", position: { top: "72%" } },
  { id: "lan2", label: "LAN2", normalState: "off", currentColor: "transparent", position: { top: "84%" } },
];

const ledInfo: Record<string, string> = {
  power: "Device power status",
  pon: "Fiber signal from ISP",
  los: "Loss of Signal — RED means no fiber",
  internet: "Internet connectivity",
  wifi: "Wireless radio active",
  lan1: "Wired device connected",
  lan2: "Wired device connected",
};

export function ZTEDiagnostic() {
  const navigate = useNavigate();
  const [leds, setLeds] = useState(initialLEDs);
  const [activeLed, setActiveLed] = useState<string | null>("los");
  const [showInfo, setShowInfo] = useState(false);

  const toggleLed = (id: string) => {
    setActiveLed(id);
    setLeds(prev => prev.map(led => {
      if (led.id !== id) return led;
      if (led.currentColor === "transparent") {
        return { ...led, currentColor: id === "los" ? "#DC2626" : "#16A34A" };
      }
      return { ...led, currentColor: "transparent" };
    }));
  };

  const isOn = (led: LED) => led.currentColor !== "transparent";

  return (
    <Layout showBack backTo="/troubleshoot" title="ZTE Diagnostic">
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1
              style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
              className="text-[#0F172A] text-2xl"
            >
              ZTE ZXHN F670L
            </h1>
            <p className="text-[#64748B] text-sm mt-1">Tap each LED that is currently ON or flashing</p>
          </div>
          <button onClick={() => setShowInfo(!showInfo)} className="w-8 h-8 rounded-full bg-[#EBF2FF] flex items-center justify-center">
            <Info size={15} className="text-[#0057B8]" />
          </button>
        </div>

        {showInfo && (
          <div className="bg-[#EBF2FF] border border-[#BFDBFE] rounded-xl p-4">
            <p className="text-[#1D4ED8] text-xs font-semibold mb-2">LED Guide</p>
            {Object.entries(ledInfo).map(([id, desc]) => (
              <div key={id} className="flex items-center gap-2 py-1">
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[10px] text-[#64748B] w-10">{id.toUpperCase()}</span>
                <span className="text-[#475569] text-xs">{desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* ONT Device visual */}
        <div className="flex justify-center py-2">
          <div className="relative">
            {/* Router body */}
            <div className="w-28 h-72 bg-gradient-to-b from-[#E2E8F0] to-[#CBD5E1] rounded-2xl border-2 border-[#94A3B8] shadow-xl relative overflow-hidden">
              {/* Top vent */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#94A3B8]/50 rounded-full" />
              {/* Logo text */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
                <p style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }} className="text-[#475569] text-[9px] tracking-widest">ZTE</p>
              </div>
              {/* LED strip area */}
              <div className="absolute left-3 top-12 bottom-12 w-5 bg-[#1E293B] rounded-lg flex flex-col items-center justify-around py-2">
                {leds.map((led) => (
                  <button
                    key={led.id}
                    onClick={() => toggleLed(led.id)}
                    className="relative group"
                  >
                    <div
                      className={`w-3 h-3 rounded-full border border-white/20 transition-all ${isOn(led) ? "shadow-lg" : ""}`}
                      style={{
                        backgroundColor: isOn(led) ? led.currentColor : "#0F172A",
                        boxShadow: isOn(led) ? `0 0 8px ${led.currentColor}` : "none",
                      }}
                    />
                  </button>
                ))}
              </div>
              {/* Side vents */}
              <div className="absolute right-3 top-16 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-3 h-0.5 bg-[#94A3B8]/40 rounded" />
                ))}
              </div>
              {/* Bottom ports */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-3 h-2 bg-[#0F172A] rounded-sm" />
                ))}
              </div>
            </div>

            {/* LED labels beside device */}
            <div className="absolute left-full ml-4 top-12 bottom-12 flex flex-col justify-around">
              {leds.map((led) => (
                <button
                  key={led.id}
                  onClick={() => toggleLed(led.id)}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${
                    activeLed === led.id ? "bg-[#EBF2FF]" : ""
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full border flex-shrink-0"
                    style={{
                      backgroundColor: isOn(led) ? led.currentColor : "transparent",
                      borderColor: isOn(led) ? led.currentColor : "#CBD5E1",
                      boxShadow: isOn(led) ? `0 0 6px ${led.currentColor}80` : "none",
                    }}
                  />
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    className={`text-[11px] font-medium ${isOn(led) ? "text-[#0F172A]" : "text-[#94A3B8]"}`}
                  >
                    {led.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current state summary */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[#0F172A] text-xs font-semibold mb-2">Active LEDs</p>
          <div className="flex flex-wrap gap-2">
            {leds.filter(isOn).map(led => (
              <span
                key={led.id}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: led.currentColor + "20",
                  color: led.currentColor,
                  borderColor: led.currentColor + "40",
                }}
                className="px-2 py-0.5 rounded-full text-xs font-medium border"
              >
                {led.label}
              </span>
            ))}
            {leds.filter(isOn).length === 0 && (
              <span className="text-[#94A3B8] text-xs">No LEDs selected — tap the device LEDs above</span>
            )}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3">
          <p className="text-[#92400E] text-xs">
            <span className="font-semibold">Tip:</span> A red LOS LED combined with PON being off usually indicates a fiber signal issue.
          </p>
        </div>

          <button
            type="button"
            onClick={() =>
              navigate("/troubleshoot/result?issue=no-internet&device=zte&pattern=led-check")
            }
            className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Analyze LEDs →
          </button>
      </div>
    </Layout>
  );
}
