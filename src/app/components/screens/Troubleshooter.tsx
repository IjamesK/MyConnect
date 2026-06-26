import { useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { Wifi, WifiOff, Zap, AlertCircle, HelpCircle, ChevronRight } from "lucide-react";

const issues = [
  { icon: WifiOff, label: "No Internet", desc: "Can't connect at all", value: "no-internet" },
  { icon: Zap, label: "Slow Internet", desc: "Slower than expected speed", value: "slow" },
  { icon: Wifi, label: "WiFi Problems", desc: "Router or signal issues", value: "wifi" },
  { icon: AlertCircle, label: "Intermittent", desc: "Keeps dropping connection", value: "intermittent" },
  { icon: HelpCircle, label: "Other Issue", desc: "Something else", value: "other" },
];

const devices = [
  { label: "ZTE ZXHN F670L", model: "ZTEGD...", img: "ZTE", value: "zte" },
  { label: "Nokia ONT G-240G-B", model: "ALCL...", img: "Nokia", value: "nokia" },
  { label: "I'm not sure", model: "Identify my device", img: "?", value: "unknown" },
];

export function Troubleshooter() {
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState("no-internet");
  const [selectedDevice, setSelectedDevice] = useState("zte");

  return (
    <Layout showBack backTo="/dashboard" title="Troubleshoot">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
            className="text-[#0F172A] text-2xl"
          >
            Smart Troubleshooter
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Let's diagnose your connection issue</p>
        </div>

        {/* Step 1 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-[#0057B8] text-white text-xs font-bold flex items-center justify-center">1</span>
            <p className="text-[#0F172A] text-sm font-semibold">What's happening?</p>
          </div>
          <div className="space-y-2">
            {issues.map(({ icon: Icon, label, desc, value }) => (
              <button
                key={value}
                onClick={() => setSelectedIssue(value)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  selectedIssue === value
                    ? "border-[#0057B8] bg-[#EBF2FF]"
                    : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedIssue === value ? "bg-[#0057B8] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${selectedIssue === value ? "text-[#0057B8]" : "text-[#0F172A]"}`}>{label}</p>
                  <p className="text-[#94A3B8] text-xs">{desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedIssue === value ? "border-[#0057B8]" : "border-[#CBD5E1]"}`}>
                  {selectedIssue === value && <div className="w-2 h-2 rounded-full bg-[#0057B8]" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-[#0057B8] text-white text-xs font-bold flex items-center justify-center">2</span>
            <p className="text-[#0F172A] text-sm font-semibold">Select Your Device</p>
          </div>
          <div className="space-y-2">
            {devices.map(({ label, model, img, value }) => (
              <button
                key={value}
                onClick={() => setSelectedDevice(value)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  selectedDevice === value
                    ? "border-[#0057B8] bg-[#EBF2FF]"
                    : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                }`}
              >
                <div className={`w-12 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${
                  selectedDevice === value ? "bg-[#0057B8] text-white border-transparent" : "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
                }`}>
                  {img}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${selectedDevice === value ? "text-[#0057B8]" : "text-[#0F172A]"}`}>{label}</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#94A3B8] text-xs">{model}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedDevice === value ? "border-[#0057B8]" : "border-[#CBD5E1]"}`}>
                  {selectedDevice === value && <div className="w-2 h-2 rounded-full bg-[#0057B8]" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active outage notice */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 flex items-center gap-3">
          <span className="text-base">⚠️</span>
          <p className="text-[#92400E] text-xs flex-1">
            Active outage detected in your area (Ntinda). This may be causing your issue.
          </p>
          <button onClick={() => navigate("/outage/INC-2026-0045")} className="text-[#0057B8] text-xs font-semibold whitespace-nowrap flex items-center gap-0.5">
            View <ChevronRight size={12} />
          </button>
        </div>

        <button
          onClick={() => navigate(selectedDevice === "zte" ? "/troubleshoot/zte" : "/troubleshoot/result")}
          className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Start Diagnosis →
        </button>
      </div>
    </Layout>
  );
}
