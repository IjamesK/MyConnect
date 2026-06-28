import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Power,
  Radio,
  Router,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { Layout } from "../isp/Layout";

type LightValue = "on" | "off" | "unknown";

type LightQuestion = {
  key: string;
  label: string;
  description: string;
  icon: typeof Power;
};

const lightQuestions: LightQuestion[] = [
  {
    key: "power",
    label: "Power",
    description: "Is the Power light green/on?",
    icon: Power,
  },
  {
    key: "pon",
    label: "PON",
    description: "Is the PON light green/on?",
    icon: Radio,
  },
  {
    key: "los",
    label: "LOS",
    description: "Is the LOS red light on?",
    icon: AlertTriangle,
  },
  {
    key: "internet",
    label: "Internet",
    description: "Is the Internet light green/on?",
    icon: Zap,
  },
  {
    key: "wifi",
    label: "Wi-Fi",
    description: "Is the Wi-Fi indicator on?",
    icon: Wifi,
  },
  {
    key: "ethernet",
    label: "Ethernet",
    description: "Is Ethernet green/on when cable is connected?",
    icon: Router,
  },
];

function getDiagnosisPattern(data: Record<string, LightValue>, issue: string) {
  const powerOn = data.power === "on";
  const ponOn = data.pon === "on";
  const losRedOn = data.los === "on";
  const internetOn = data.internet === "on";
  const wifiOn = data.wifi === "on";

  if (!powerOn) {
    return "zte_no_power";
  }

  if (losRedOn) {
    return "zte_los_red";
  }

  if (!wifiOn && issue === "wifi") {
    return "zte_wifi_disabled";
  }

  if (!wifiOn && internetOn) {
    return "zte_wifi_disabled";
  }

  if (powerOn && ponOn && !losRedOn && !internetOn) {
    return "zte_internet_off_noc";
  }

  if (
    issue === "slow" &&
    powerOn &&
    ponOn &&
    !losRedOn &&
    internetOn &&
    wifiOn
  ) {
    return "zte_slow_speed_normal_lights";
  }

  if (powerOn && ponOn && !losRedOn && internetOn) {
    return "zte_normal_lights";
  }

  return "zte_unclear";
}

function lightStatusLabel(value: LightValue) {
  if (value === "on") return "On";
  if (value === "off") return "Off";
  return "Not sure";
}

function lightStatusClass(value: LightValue) {
  if (value === "on") return "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]";
  if (value === "off") return "border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]";
  return "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]";
}

function getPreview(pattern: string) {
  if (pattern === "zte_no_power") {
    return {
      title: "Power issue detected",
      body: "The ONT may not be powered. Customer should check socket, adapter, and power button before escalation.",
      color: "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]",
      icon: Power,
    };
  }

  if (pattern === "zte_los_red") {
    return {
      title: "LOS red light detected",
      body: "This indicates fibre loss of signal. It is likely a fibre cut or physical fibre issue and should be escalated for field support.",
      color: "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]",
      icon: AlertTriangle,
    };
  }

  if (pattern === "zte_wifi_disabled") {
    return {
      title: "Wi-Fi may be disabled",
      body: "The customer may have accidentally pressed the Wi-Fi button and turned off wireless broadcasting.",
      color: "bg-[#EBF2FF] border-[#BFDBFE] text-[#1D4ED8]",
      icon: WifiOff,
    };
  }

  if (pattern === "zte_internet_off_noc") {
    return {
      title: "Internet light is off",
      body: "Power and PON may be okay, but the Internet light is off. This is usually not a fibre cut and should be monitored by NOC.",
      color: "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]",
      icon: Zap,
    };
  }

  if (pattern === "zte_slow_speed_normal_lights") {
    return {
      title: "Slow speed with normal lights",
      body: "The ONT lights look normal. Customer should run a speed test and submit results for monitoring.",
      color: "bg-[#FCE7F3] border-[#FBCFE8] text-[#BE0067]",
      icon: Wifi,
    };
  }

  if (pattern === "zte_normal_lights") {
    return {
      title: "ZTE ONT lights look normal",
      body: "Power, PON, Internet and Wi-Fi indicators appear normal. If the customer still has issues, continue with support checks.",
      color: "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]",
      icon: CheckCircle2,
    };
  }

  return {
    title: "Diagnosis needs more information",
    body: "The selected light pattern is unclear. Customer may need guided support from the team.",
    color: "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]",
    icon: Info,
  };
}

type LightValue = "on" | "off" | "unknown";

function getDiagnosisPattern(data: Record<string, LightValue>, issue: string) {
  const powerOn = data.power === "on";
  const ponOn = data.pon === "on";
  const losRedOn = data.los === "on";
  const internetOn = data.internet === "on";
  const wifiOn = data.wifi === "on";

  if (!powerOn) {
    return "zte_no_power";
  }

  if (losRedOn) {
    return "zte_los_red";
  }

  if (!wifiOn && issue === "wifi") {
    return "zte_wifi_disabled";
  }

  if (!wifiOn && internetOn) {
    return "zte_wifi_disabled";
  }

  if (powerOn && ponOn && !losRedOn && !internetOn) {
    return "zte_internet_off_noc";
  }

  if (
    issue === "slow" &&
    powerOn &&
    ponOn &&
    !losRedOn &&
    internetOn &&
    wifiOn
  ) {
    return "zte_slow_speed_normal_lights";
  }

  if (powerOn && ponOn && !losRedOn && internetOn) {
    return "zte_normal_lights";
  }

  return "zte_unclear";
}

export function ZTEDiagnostic() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const issue = searchParams.get("issue") ?? "no-internet";

  const [lights, setLights] = useState<Record<string, LightValue>>({
    power: "on",
    pon: "on",
    los: "off",
    internet: issue === "no-internet" ? "off" : "on",
    wifi: issue === "wifi" ? "off" : "on",
    ethernet: "unknown",
  });

  const pattern = useMemo(() => {
    return getDiagnosisPattern(lights, issue);
  }, [lights, issue]);

  const preview = getPreview(pattern);
  const PreviewIcon = preview.icon;

  const setLight = (key: string, value: LightValue) => {
    setLights((current) => ({
      ...current,
      [key]: value,
    }));
  };

const handleAnalyze = () => {
  const pattern = getDiagnosisPattern(lights, issue);

  navigate(`/troubleshoot/result?issue=${issue}&device=zte&pattern=${pattern}`);
};
  
  return (
    <Layout showBack backTo="/troubleshoot" title="ZTE ONT Check">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[#0F172A] text-2xl"
          >
            White ZTE ONT Lights
          </h1>

          <p className="text-[#64748B] text-sm mt-1">
            Select what the customer sees on the ZTE ONT. The app will suggest
            the likely issue and next step.
          </p>
        </div>

        {/* Healthy reference */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <p className="text-[#0F172A] text-sm font-semibold mb-3">
            Normal working indicators
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              Power: Green
            </div>

            <div className="flex items-center gap-2 text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              PON: Green
            </div>

            <div className="flex items-center gap-2 text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              Internet: Green
            </div>

            <div className="flex items-center gap-2 text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              Wi-Fi: Green unless disabled
            </div>

            <div className="flex items-center gap-2 text-[#475569] col-span-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              Ethernet: Green only when LAN cable is in use
            </div>
          </div>
        </div>

        {/* Light selector */}
        <div className="space-y-3">
          {lightQuestions.map(({ key, label, description, icon: Icon }) => (
            <div
              key={key}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF2FF] flex items-center justify-center">
                  <Icon size={17} className="text-[#0057B8]" />
                </div>

                <div className="flex-1">
                  <p className="text-[#0F172A] text-sm font-semibold">{label}</p>
                  <p className="text-[#94A3B8] text-xs">{description}</p>
                </div>

                <span
                  className={`px-2 py-1 rounded-full border text-[10px] font-semibold ${lightStatusClass(
                    lights[key]
                  )}`}
                >
                  {lightStatusLabel(lights[key])}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLight(key, "on")}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    lights[key] === "on"
                      ? "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]"
                      : "border-[#E2E8F0] bg-white text-[#64748B]"
                  }`}
                >
                  On
                </button>

                <button
                  type="button"
                  onClick={() => setLight(key, "off")}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    lights[key] === "off"
                      ? "border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]"
                      : "border-[#E2E8F0] bg-white text-[#64748B]"
                  }`}
                >
                  Off
                </button>

                <button
                  type="button"
                  onClick={() => setLight(key, "unknown")}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    lights[key] === "unknown"
                      ? "border-[#64748B] bg-[#F8FAFC] text-[#475569]"
                      : "border-[#E2E8F0] bg-white text-[#64748B]"
                  }`}
                >
                  Not sure
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Diagnosis preview */}
        <div className={`border rounded-2xl p-4 ${preview.color}`}>
          <div className="flex items-start gap-3">
            <PreviewIcon size={20} className="shrink-0 mt-0.5" />

            <div>
              <p className="text-sm font-bold">{preview.title}</p>
              <p className="text-xs mt-1 leading-relaxed">{preview.body}</p>
            </div>
          </div>
        </div>

        {/* Slow speed note */}
        {issue === "slow" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#0F172A] text-sm font-semibold">
              Speed test note
            </p>

            <p className="text-[#64748B] text-xs mt-1 leading-relaxed">
              Since we do not yet have a reliable free speed test API integrated,
              the customer can run a speed test manually and include the download,
              upload, ping, and whether they tested on Wi-Fi or cable.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleAnalyze}
          className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Analyze ZTE Lights →
        </button>
      </div>
    </Layout>
  );
}
