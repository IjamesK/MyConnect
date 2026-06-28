import { useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  KeyRound,
  Ticket,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { Layout } from "../isp/Layout";

type ResultConfig = {
  title: string;
  subtitle: string;
  confidence: number;
  cause: string;
  deviceStatus: string;
  recommendation: string;
  icon: typeof AlertTriangle;
  tone: "danger" | "warning" | "success" | "info";
  steps: string[];
};

function getResultConfig(issue: string, device: string): ResultConfig {
  if (issue === "password-reset") {
    return {
      title: "Wi-Fi Password Help",
      subtitle: "Guidance and reset request options",
      confidence: 90,
      cause: "Password change or reset request",
      deviceStatus:
        device === "nokia"
          ? "Nokia ONT guidance pending"
          : device === "zte"
            ? "ZTE ONT guidance pending"
            : "Device-specific guide pending",
      recommendation:
        "Use the password reset ticket option if you cannot access the router settings. Do not share your new password inside a ticket conversation.",
      icon: KeyRound,
      tone: "info",
      steps: [
        "Identified this as a Wi-Fi password request",
        "Checked selected ONT/router type",
        "Prepared remote support option",
        "Device-specific ZTE/Nokia instructions will be added after approval",
      ],
    };
  }

  if (issue === "slow") {
    return {
      title: "Possible Speed Degradation",
      subtitle: "Connection may need monitoring",
      confidence: 78,
      cause: "Slow speed or congestion",
      deviceStatus: "Router may still be online",
      recommendation:
        "Try restarting the router and testing close to the Wi-Fi router. If the issue continues, submit a ticket so support can monitor the connection.",
      icon: Wifi,
      tone: "warning",
      steps: [
        "Checked selected issue type",
        "Classified issue as speed-related",
        "Recommended basic local checks",
        "Prepared monitoring ticket path",
      ],
    };
  }

  if (issue === "wifi") {
    return {
      title: "Possible Wi-Fi Issue",
      subtitle: "Router signal or SSID issue",
      confidence: 75,
      cause: "Wi-Fi coverage or settings",
      deviceStatus: "Internet may still be active",
      recommendation:
        "Check if you are connected to the correct Wi-Fi name and move closer to the router. For password changes, use the password reset option.",
      icon: Wifi,
      tone: "info",
      steps: [
        "Classified issue as Wi-Fi related",
        "Checked device type",
        "Prepared router guidance path",
        "Support ticket available if problem continues",
      ],
    };
  }

  if (issue === "intermittent") {
    return {
      title: "Intermittent Connection",
      subtitle: "Connection keeps dropping",
      confidence: 80,
      cause: "Unstable link or router issue",
      deviceStatus: "Needs monitoring",
      recommendation:
        "This type of issue may need monitoring. Submit a support ticket if drops continue so staff can track your connection stability.",
      icon: AlertTriangle,
      tone: "warning",
      steps: [
        "Classified issue as intermittent",
        "Recommended monitoring",
        "Prepared support escalation path",
        "Customer can submit ticket if issue continues",
      ],
    };
  }

  return {
    title: "Possible Fiber Signal Issue",
    subtitle: "Connection issue identified",
    confidence: 85,
    cause: "Fiber signal, router, or service issue",
    deviceStatus:
      device === "zte" ? "ZTE LED check recommended" : "ONT check recommended",
    recommendation:
      "Check the Network Status page first. If there is no active outage in your area, submit a support ticket for assistance.",
    icon: WifiOff,
    tone: "danger",
    steps: [
      "Checked selected issue type",
      "Checked selected device type",
      "Recommended Network Status review",
      "Prepared support ticket path",
    ],
  };
}

function toneClasses(tone: ResultConfig["tone"]) {
  if (tone === "danger") {
    return {
      box: "bg-[#FEF2F2] border-[#FECACA]",
      icon: "text-[#DC2626]",
      bar: "from-[#DC2626] to-[#F87171]",
      text: "text-[#991B1B]",
    };
  }

  if (tone === "warning") {
    return {
      box: "bg-[#FFFBEB] border-[#FDE68A]",
      icon: "text-[#B45309]",
      bar: "from-[#F59E0B] to-[#FBBF24]",
      text: "text-[#92400E]",
    };
  }

  if (tone === "success") {
    return {
      box: "bg-[#F0FDF4] border-[#BBF7D0]",
      icon: "text-[#16A34A]",
      bar: "from-[#16A34A] to-[#4ADE80]",
      text: "text-[#166534]",
    };
  }

  return {
    box: "bg-[#EBF2FF] border-[#BFDBFE]",
    icon: "text-[#0057B8]",
    bar: "from-[#0057B8] to-[#3B82F6]",
    text: "text-[#1D4ED8]",
  };
}

function deviceLabel(device: string) {
  if (device === "zte") return "ZTE ONT";
  if (device === "nokia") return "Nokia ONT";
  return "Unknown device";
}

function ticketTypeFromIssue(issue: string) {
  if (issue === "password-reset") return "password_reset";
  if (issue === "slow") return "slow_speed";
  if (issue === "wifi") return "router_issue";
  if (issue === "intermittent") return "slow_speed";
  return "no_internet";
}

export function DiagnosisResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const issue = searchParams.get("issue") ?? "no-internet";
  const device = searchParams.get("device") ?? "unknown";

  const result = getResultConfig(issue, device);
  const Icon = result.icon;
  const classes = toneClasses(result.tone);

  return (
    <Layout showBack backTo="/troubleshoot" title="Diagnosis">
      <div className="px-4 py-5 space-y-4">
        {/* Result header */}
        <div className="text-center py-4">
          <div
            className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center mx-auto mb-4 ${classes.box}`}
          >
            <Icon size={28} className={classes.icon} />
          </div>

          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[#0F172A] text-2xl"
          >
            {result.title}
          </h1>

          <p className="text-[#64748B] text-sm mt-1">{result.subtitle}</p>
        </div>

        {/* Confidence card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#0F172A] text-sm font-semibold">
              Confidence Score
            </span>

            <span
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontWeight: 800,
              }}
              className="text-[#16A34A] text-xl"
            >
              {result.confidence}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${classes.bar}`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#F8FAFC] rounded-xl p-3">
              <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">
                Possible Cause
              </p>

              <p className="text-[#0F172A] text-sm font-semibold mt-1">
                {result.cause}
              </p>
            </div>

            <div className="bg-[#F8FAFC] rounded-xl p-3">
              <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">
                Selected Device
              </p>

              <p className="text-[#0F172A] text-sm font-semibold mt-1">
                {deviceLabel(device)}
              </p>

              <p className="text-[#64748B] text-xs mt-0.5">
                {result.deviceStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Diagnosis steps */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <p className="text-[#0F172A] text-xs font-semibold mb-3 uppercase tracking-wide">
            Diagnostic Steps
          </p>

          <div className="space-y-2.5">
            {result.steps.map((step) => (
              <div key={step} className="flex items-center gap-3">
                <CheckCircle size={14} className="text-[#16A34A]" />
                <p className="text-[#475569] text-xs">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className={`${classes.box} rounded-2xl p-4`}>
          <p
            className={`text-xs font-semibold uppercase tracking-wide mb-1 ${classes.text}`}
          >
            Recommended Action
          </p>

          <p className={`text-sm font-medium ${classes.text}`}>
            {result.recommendation}
          </p>
        </div>

        {/* Password-specific guide */}
        {issue === "password-reset" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#0F172A] text-sm font-semibold mb-3">
              General password-change guidance
            </p>

            <div className="space-y-2 text-[#64748B] text-xs leading-relaxed">
              <p>1. Make sure you are connected to your home Wi-Fi.</p>
              <p>
                2. Open the router/ONT management page if your account has local
                access.
              </p>
              <p>
                3. Look for Wi-Fi, WLAN, SSID, or Wireless settings.
              </p>
              <p>
                4. Change the Wi-Fi password, save, then reconnect your devices
                using the new password.
              </p>
              <p>
                5. If local access is not available, submit a password reset
                request so support can assist remotely.
              </p>
            </div>

            <p className="text-[#DC2626] text-xs mt-3">
              Do not share your new Wi-Fi password inside a ticket message.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <button
          type="button"
          onClick={() => navigate("/service-status")}
          className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={15} />
          View Network Status
        </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/report-issue?mode=ticket&type=${ticketTypeFromIssue(issue)}&source=troubleshooter`
                )
              }
              className="w-full py-3 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl font-semibold text-sm hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2"
            >
              <Ticket size={15} />
              Open Support Ticket
            </button>

        <button
          type="button"
          onClick={() => navigate("/troubleshoot")}
          className="w-full py-3 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl font-semibold text-sm hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2"
        >
          <Wrench size={15} />
          Try Another Diagnosis
        </button>
      </div>
    </Layout>
  );
}
