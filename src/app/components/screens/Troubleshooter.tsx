import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Wifi,
  WifiOff,
  Zap,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  KeyRound,
  Wrench,
} from "lucide-react";
import { Layout } from "../isp/Layout";
import type { CustomerProfile } from "../../../lib/auth";
import {
  listenToRelevantIncidents,
  type PublicIncident,
} from "../../../lib/incidents";

const issues = [
  {
    icon: WifiOff,
    label: "No Internet",
    desc: "Can't connect at all",
    value: "no-internet",
  },
  {
    icon: Zap,
    label: "Slow Internet",
    desc: "Slower than expected speed",
    value: "slow",
  },
  {
    icon: Wifi,
    label: "Wi-Fi Problems",
    desc: "Signal, SSID, or router issues",
    value: "wifi",
  },
  {
    icon: AlertCircle,
    label: "Intermittent",
    desc: "Connection keeps dropping",
    value: "intermittent",
  },
  {
    icon: KeyRound,
    label: "Change Wi-Fi Password",
    desc: "Guidance or password reset request",
    value: "password-reset",
  },
  {
    icon: HelpCircle,
    label: "Other Issue",
    desc: "Something else",
    value: "other",
  },
];

const devices = [
  {
    label: "White ZTE ONT",
    model: "ZTE ONT / ZXHN series",
    img: "ZTE",
    value: "zte",
  },
  {
    label: "Nokia ONT",
    model: "Nokia / ALCL ONT",
    img: "Nokia",
    value: "nokia",
  },
  {
    label: "I'm not sure",
    model: "Identify my device later",
    img: "?",
    value: "unknown",
  },
];

function incidentLabel(incident: PublicIncident) {
  if (incident.type === "maintenance") return "Planned maintenance";
  if (incident.type === "upgrade") return "Scheduled upgrade";
  if (incident.severity === "high") return "Full outage";
  return "Network update";
}

export function Troubleshooter() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [selectedIssue, setSelectedIssue] = useState("no-internet");
  const [selectedDevice, setSelectedDevice] = useState("zte");

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (!savedProfile) return;

    try {
      const parsedProfile = JSON.parse(savedProfile) as CustomerProfile;
      setProfile(parsedProfile);

      const unsubscribe = listenToRelevantIncidents(parsedProfile, setIncidents);

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to load customer profile:", error);
    }
  }, []);

  const activeIncident = useMemo(() => {
    return incidents.find(
      (incident) =>
        incident.status === "active" ||
        incident.status === "monitoring" ||
        incident.status === "scheduled"
    );
  }, [incidents]);

  const handleStartDiagnosis = () => {
    if (selectedIssue === "password-reset") {
      navigate(
        `/troubleshoot/result?issue=password-reset&device=${selectedDevice}`
      );
      return;
    }

    if (selectedDevice === "zte") {
      navigate(`/troubleshoot/zte?issue=${selectedIssue}`);
      return;
    }

    navigate(`/troubleshoot/result?issue=${selectedIssue}&device=${selectedDevice}`);
  };

  return (
    <Layout showBack backTo="/dashboard" title="Troubleshoot">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[#0F172A] text-2xl"
          >
            Smart Troubleshooter
          </h1>

          <p className="text-[#64748B] text-sm mt-1">
            Diagnose connection issues, check router guidance, or request support.
          </p>
        </div>

        {/* Step 1 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-[#0057B8] text-white text-xs font-bold flex items-center justify-center">
              1
            </span>

            <p className="text-[#0F172A] text-sm font-semibold">
              What do you need help with?
            </p>
          </div>

          <div className="space-y-2">
            {issues.map(({ icon: Icon, label, desc, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedIssue(value)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  selectedIssue === value
                    ? "border-[#0057B8] bg-[#EBF2FF]"
                    : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedIssue === value
                      ? "bg-[#0057B8] text-white"
                      : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                >
                  <Icon size={16} />
                </div>

                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      selectedIssue === value
                        ? "text-[#0057B8]"
                        : "text-[#0F172A]"
                    }`}
                  >
                    {label}
                  </p>

                  <p className="text-[#94A3B8] text-xs">{desc}</p>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedIssue === value
                      ? "border-[#0057B8]"
                      : "border-[#CBD5E1]"
                  }`}
                >
                  {selectedIssue === value && (
                    <div className="w-2 h-2 rounded-full bg-[#0057B8]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-[#0057B8] text-white text-xs font-bold flex items-center justify-center">
              2
            </span>

            <p className="text-[#0F172A] text-sm font-semibold">
              Select your device
            </p>
          </div>

          <div className="space-y-2">
            {devices.map(({ label, model, img, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedDevice(value)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  selectedDevice === value
                    ? "border-[#0057B8] bg-[#EBF2FF]"
                    : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                }`}
              >
                <div
                  className={`w-12 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${
                    selectedDevice === value
                      ? "bg-[#0057B8] text-white border-transparent"
                      : "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
                  }`}
                >
                  {img}
                </div>

                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      selectedDevice === value
                        ? "text-[#0057B8]"
                        : "text-[#0F172A]"
                    }`}
                  >
                    {label}
                  </p>

                  <p
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    className="text-[#94A3B8] text-xs"
                  >
                    {model}
                  </p>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedDevice === value
                      ? "border-[#0057B8]"
                      : "border-[#CBD5E1]"
                  }`}
                >
                  {selectedDevice === value && (
                    <div className="w-2 h-2 rounded-full bg-[#0057B8]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Real incident notice */}
        {activeIncident && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 flex items-center gap-3">
            <span className="text-base">⚠️</span>

            <div className="flex-1">
              <p className="text-[#92400E] text-xs font-semibold">
                {incidentLabel(activeIncident)} affecting your area
              </p>

              <p className="text-[#92400E] text-xs mt-0.5">
                {activeIncident.title}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/outage/${activeIncident.id}`)}
              className="text-[#0057B8] text-xs font-semibold whitespace-nowrap flex items-center gap-0.5"
            >
              View <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* Password guidance preview */}
        {selectedIssue === "password-reset" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] flex items-center justify-center">
                <KeyRound size={16} className="text-[#0057B8]" />
              </div>

              <p className="text-[#0F172A] text-sm font-semibold">
                Wi-Fi password guidance
              </p>
            </div>

            <div className="space-y-2 text-[#64748B] text-xs leading-relaxed">
              <p>
                We’ll add exact ZTE and Nokia steps after you provide the approved
                router guidance.
              </p>

              <p>
                For now, customers can continue to diagnosis for general guidance
                or submit a password reset ticket for remote support.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/report-issue")}
              className="mt-3 w-full py-2.5 bg-[#FCE7F3] text-[#E5007D] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Wrench size={14} />
              Request password reset
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleStartDiagnosis}
          className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Continue →
        </button>
      </div>
    </Layout>
  );
}
