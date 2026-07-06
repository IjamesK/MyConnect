import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Gauge,
  MapPin,
  RefreshCw,
  Router,
  Smartphone,
  Upload,
  WifiOff,
  X,
} from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";
import { createTicket, type TicketPriority } from "../../../lib/tickets";
import {
  createIncidentReport,
  type IncidentType,
} from "../../../lib/incidents";
import {
  qualityLabel,
  runBrowserSpeedTest,
  type SpeedTestResult,
} from "../../../lib/speedTest";
import {
  normalizeRouterType,
  routerName,
  routerPatternLabel,
  type RouterLightCheck,
} from "../../../lib/routerTypes";
import { Layout } from "../isp/Layout";

type ReportMode = "ticket" | "incident";

const personalIssueTypes = [
  { icon: "📶", label: "No Internet", value: "no_internet", priority: "high" },
  { icon: "🐢", label: "Slow Speed", value: "slow_speed", priority: "medium" },
  { icon: "🔴", label: "LOS Light Red", value: "los_light", priority: "high" },
  { icon: "📡", label: "Router / Wi-Fi Issue", value: "router_issue", priority: "medium" },
  {
    icon: "💳",
    label: "Payment Not Reflected",
    value: "payment_not_reflected",
    priority: "medium",
  },
  {
    icon: "↩️",
    label: "Paid on Wrong Router",
    value: "wrong_router_payment",
    priority: "medium",
  },
  { icon: "🔑", label: "Wi-Fi Password Reset", value: "password_reset", priority: "low" },
  { icon: "📝", label: "Other Account Issue", value: "other", priority: "low" },
] as const;

const networkIssueTypes = [
  { icon: "🪵", label: "Knocked Pole", value: "knocked_pole" },
  { icon: "✂️", label: "Cable Cut / Vandalism", value: "fiber_cut" },
  { icon: "🔧", label: "Damaged Cabinet", value: "damaged_cabinet" },
  { icon: "📡", label: "Area Outage", value: "area_outage" },
  { icon: "🏗️", label: "Road Construction Damage", value: "outage" },
  { icon: "⚠️", label: "Other Network Issue", value: "other" },
] as const;

function isPersonalIssueType(value: string) {
  return personalIssueTypes.some((item) => item.value === value);
}

function getPrefilledDescription(type: string) {
  if (type === "password_reset") {
    return "I would like help resetting or changing my Wi-Fi password.";
  }

  if (type === "no_internet") {
    return "I have no internet connection. Please help check my connection.";
  }

  if (type === "slow_speed") {
    return "My internet speed is slower than expected. Please help check the connection.";
  }

  if (type === "los_light") {
    return "The LOS light on my router/ONT is red or blinking.";
  }

  if (type === "router_issue") {
    return "I am experiencing a router or Wi-Fi issue. Please assist.";
  }

  if (type === "payment_not_reflected") {
    return "I made a payment, but it is not reflected on my account.";
  }

  if (type === "wrong_router_payment") {
    return "I paid on the wrong router/customer account and need help correcting the payment.";
  }

  return "";
}

function issueNeedsRouterLights(issueType: string) {
  return (
    issueType === "no_internet" ||
    issueType === "los_light" ||
    issueType === "router_issue"
  );
}

function buildRouterLightCheck(profile: CustomerProfile | null, pattern: string | null, lights: string | null): RouterLightCheck | null {
  if (!pattern && !lights) return null;

  const routerType = normalizeRouterType(profile?.routerType);
  const selectedLights = (lights ?? "")
    .split(",")
    .map((light) => light.trim())
    .filter(Boolean);

  return {
    routerType,
    routerName: routerName(routerType),
    pattern: pattern || "not_detected",
    selectedLights,
    checkedAt: new Date().toISOString(),
  };
}

export function ReportIssue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const patternParam = searchParams.get("pattern");
  const lightsParam = searchParams.get("lights");
  const sourceParam = searchParams.get("source");
  const cameFromRouterLights = sourceParam === "router_lights";

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [mode, setMode] = useState<ReportMode>("ticket");
  const [personalIssueType, setPersonalIssueType] = useState("");
  const [networkIssueType, setNetworkIssueType] =
    useState<IncidentType>("knocked_pole");
  const [description, setDescription] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [connectedDevices, setConnectedDevices] = useState(3);
  const [speedTest, setSpeedTest] = useState<SpeedTestResult | null>(null);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [submitted, setSubmitted] = useState<{
    mode: ReportMode;
    id: string;
  } | null>(null);
  const [error, setError] = useState("");

  const routerLightCheck = buildRouterLightCheck(
    profile,
    patternParam,
    lightsParam
  );

  const selectedRouterType = normalizeRouterType(profile?.routerType);
  const selectedRouterName = routerName(selectedRouterType);
  const isSlowSpeedTicket =
    mode === "ticket" && personalIssueType === "slow_speed";

  const handleIssueSelect = (issueType: string) => {
    setError("");
    setSpeedTest(null);

    if (issueNeedsRouterLights(issueType)) {
      navigate(`/troubleshoot/zte?issue=${issueType}`);
      return;
    }

    setMode("ticket");
    setPersonalIssueType(issueType);
  };

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (!savedProfile) {
      navigate("/", { replace: true });
      return;
    }

    try {
      setProfile(JSON.parse(savedProfile));
    } catch (err) {
      console.error("Failed to load customer profile:", err);
      localStorage.removeItem("customerProfile");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const typeParam = searchParams.get("type");
    const source = searchParams.get("source");

    if (modeParam === "ticket") {
      setMode("ticket");
    }

    if (modeParam === "incident") {
      setMode("incident");
    }

    if (typeParam && networkIssueTypes.some((item) => item.value === typeParam)) {
      setMode("incident");
      setNetworkIssueType(typeParam as IncidentType);
    }

    if (typeParam && isPersonalIssueType(typeParam)) {
      setMode("ticket");
      setPersonalIssueType(typeParam);

      if (source === "self_help" || source === "troubleshooter") {
        const prefilledText = getPrefilledDescription(typeParam);
        if (prefilledText) setDescription((current) => current || prefilledText);
      }
    }
  }, [searchParams]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []) as File[];
    const files = selectedFiles.slice(0, 5 - photos.length);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (ev) => {
        setPhotos((prev) => [...prev, ev.target?.result as string]);
      };

      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!profile) return;

    setError("");
    setStatusMessage("");

    if (mode === "ticket" && !personalIssueType) {
      setError("Please select the problem you are experiencing.");
      return;
    }

    if (mode === "incident" && !description.trim()) {
      setError("Please describe the network incident before submitting.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "ticket") {
        const selectedIssue = personalIssueTypes.find(
          (item) => item.value === personalIssueType
        );

        let capturedSpeedTest: SpeedTestResult | null = null;

        if (personalIssueType === "slow_speed") {
          setSpeedTesting(true);
          setStatusMessage("Checking your connection and attaching the result...");

          try {
            capturedSpeedTest = await runBrowserSpeedTest(connectedDevices);
            setSpeedTest(capturedSpeedTest);
          } catch (err) {
            console.error("Speed test failed:", err);
            capturedSpeedTest = null;
          } finally {
            setSpeedTesting(false);
          }
        }

        const baseDescription =
          description.trim() ||
          getPrefilledDescription(personalIssueType) ||
          selectedIssue?.label ||
          "Customer issue";

        const speedNote =
          personalIssueType === "slow_speed"
            ? capturedSpeedTest
              ? `\n\nAutomatic speed test attached: ${capturedSpeedTest.downloadMbps} Mbps download, ${capturedSpeedTest.uploadMbps} Mbps upload, ${capturedSpeedTest.latencyMs} ms latency, ${capturedSpeedTest.connectedDevices} connected device(s), ${qualityLabel(capturedSpeedTest.quality)}.`
              : `\n\nAutomatic speed test was attempted but could not be completed. Customer was asked to stay connected to CanalBox Wi-Fi. Reported connected devices: ${connectedDevices}.`
            : "";

        const routerLightNote = routerLightCheck
          ? `\n\nRouter light check:\nRouter type: ${routerLightCheck.routerName}\nIssue detected: ${routerPatternLabel(routerLightCheck.pattern)}\nSelected lights: ${
              routerLightCheck.selectedLights.length > 0
                ? routerLightCheck.selectedLights.join(", ")
                : "None selected"
            }`
          : "";

        setStatusMessage("Creating your support ticket...");

        const ticketId = await createTicket(profile, {
          category: personalIssueType,
          title: selectedIssue?.label ?? "Customer Issue",
          description: `${baseDescription}${speedNote}${routerLightNote}`,
          priority: (selectedIssue?.priority ?? "medium") as TicketPriority,
          workType:
            personalIssueType === "password_reset" ||
            personalIssueType === "payment_not_reflected" ||
            personalIssueType === "wrong_router_payment"
              ? "remote_support"
              : personalIssueType === "slow_speed"
                ? "monitoring"
                : "technician",
          photoCount: photos.length,
          locationNote: locationNote.trim(),
          speedTest: personalIssueType === "slow_speed" ? capturedSpeedTest : null,
          routerLightCheck,
        });

        setSubmitted({ mode: "ticket", id: ticketId });
        return;
      }

      const selectedIncident = networkIssueTypes.find(
        (item) => item.value === networkIssueType
      );

      const reportId = await createIncidentReport(profile, {
        type: networkIssueType,
        title: selectedIncident?.label ?? "Network Incident",
        description: description.trim(),
        photoCount: photos.length,
        locationNote: locationNote.trim(),
      });

      setSubmitted({ mode: "incident", id: reportId });
    } catch (err) {
      console.error("Submit issue failed:", err);
      setError("Failed to submit. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  if (!profile) {
    return (
      <Layout showBack backTo="/dashboard" title="Report">
        <div className="px-4 py-10 text-center text-[var(--color-muted)] text-sm">
          Loading account details...
        </div>
      </Layout>
    );
  }

  if (submitted) {
    const isTicket = submitted.mode === "ticket";

    return (
      <Layout showBack backTo="/dashboard" title="Report">
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] border-2 border-[var(--color-border)] flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-[var(--color-success)]" />
          </div>

          <h2
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[var(--color-text)] text-xl mb-2"
          >
            {isTicket ? "Ticket Created" : "Incident Sent for Review"}
          </h2>

          <p className="text-[var(--color-muted)] text-sm mb-4">
            {isTicket
              ? "Your issue has been sent to support. You will receive updates as the ticket progresses."
              : "Your network incident report has been sent to admin for approval."}
          </p>

          <p
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[var(--color-muted)] text-xs mb-5"
          >
            Reference: {submitted.id}
          </p>

          <button
            type="button"
            onClick={() =>
              isTicket
                ? navigate(`/ticket/${submitted.id}`)
                : navigate("/service-status")
            }
            className="px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold"
          >
            {isTicket ? "View Ticket" : "Go to Network Status"}
          </button>
        </div>
      </Layout>
    );
  }

  const activeIssueTypes =
    mode === "ticket" ? personalIssueTypes : networkIssueTypes;

  return (
    <Layout showBack backTo="/dashboard" title="Report">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[var(--color-text)] text-2xl"
          >
            Report a Problem
          </h1>

          <p className="text-[var(--color-muted)] text-sm mt-1">
            Choose the problem. MyConnect will collect the useful technical details quietly.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("ticket");
              setError("");
            }}
            className={`p-3 rounded-2xl border-2 text-left transition-all ${
              mode === "ticket"
                ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
            }`}
          >
            <WifiOff
              size={20}
              className={
                mode === "ticket"
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted)]"
              }
            />
            <p className="text-[var(--color-text)] text-sm font-semibold mt-2">
              My Connection
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-0.5">
              Private support ticket
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("incident");
              setError("");
            }}
            className={`p-3 rounded-2xl border-2 text-left transition-all ${
              mode === "incident"
                ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
            }`}
          >
            <AlertTriangle
              size={20}
              className={
                mode === "incident"
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted)]"
              }
            />
            <p className="text-[var(--color-text)] text-sm font-semibold mt-2">
              Network Incident
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-0.5">
              Admin approval first
            </p>
          </button>
        </div>

        <div>
          <p className="text-[var(--color-text)] text-sm font-semibold mb-2">
            {mode === "ticket" ? "What is the problem?" : "Incident Type"}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {activeIssueTypes.map(({ icon, label, value }) => {
              const selected =
                mode === "ticket"
                  ? personalIssueType === value
                  : networkIssueType === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    if (mode === "ticket") handleIssueSelect(value);
                    else setNetworkIssueType(value as IncidentType);
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    selected
                      ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  <span className="mr-1.5">{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {cameFromRouterLights && routerLightCheck && (
          <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-2xl p-4 flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0">
              <Router size={20} className="text-[var(--color-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--color-text)] text-sm font-bold">
                Router light check complete
              </p>
              <p className="text-[var(--color-muted)] text-xs mt-1">
                {routerLightCheck.routerName} · {routerPatternLabel(routerLightCheck.pattern)}
              </p>
              <p className="text-[var(--color-primary)] text-xs mt-1 font-medium">
                Lights selected: {routerLightCheck.selectedLights.length > 0 ? routerLightCheck.selectedLights.join(", ") : "None selected"}
              </p>
            </div>
          </div>
        )}

        <div>
          <p className="text-[var(--color-text)] text-sm font-semibold mb-2">
            Account Location
          </p>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 flex items-center gap-3">
            <MapPin size={16} className="text-[var(--color-primary)] shrink-0" />

            <div className="flex-1">
              <p className="text-[var(--color-text)] text-sm font-medium">
                {profile.area}, {profile.district}
              </p>

              <p className="text-[var(--color-muted)] text-xs">
                {profile.customerNumber} · {profile.routerSerial}
              </p>
            </div>
          </div>

          <input
            type="text"
            value={locationNote}
            onChange={(e) => setLocationNote(e.target.value)}
            placeholder="Optional: add nearby landmark or exact spot"
            className="mt-2 w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
          />
        </div>

        {isSlowSpeedTicket && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
                <Gauge size={20} className="text-[var(--color-primary)]" />
              </div>

              <div className="flex-1">
                <p className="text-[var(--color-text)] text-sm font-bold">
                  Connection check will run automatically
                </p>
                <p className="text-[var(--color-muted)] text-xs mt-0.5 leading-relaxed">
                  Make sure you are connected to your CanalBox Wi-Fi. When you submit, we’ll check the connection and attach the result to your ticket.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="text-[var(--color-text)] text-xs font-semibold">
                Devices currently connected to your router
              </span>
              <div className="mt-2 flex items-center gap-2">
                <Smartphone size={15} className="text-[var(--color-muted)]" />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={connectedDevices}
                  onChange={(e) => {
                    setConnectedDevices(Math.max(1, Number(e.target.value) || 1));
                    setSpeedTest(null);
                  }}
                  className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </label>

            {speedTesting && (
              <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-3">
                <div className="flex items-center gap-2 text-[var(--color-primary)] text-xs font-semibold mb-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Checking connection...
                </div>
                <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-[var(--color-primary)] animate-pulse" />
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-[var(--color-text)] text-sm font-semibold mb-2">
            Attach Photos <span className="text-[var(--color-muted)] font-normal">(up to 5)</span>
          </p>

          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {photos.map((src, i) => (
                <div
                  key={src}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--color-border)]"
                >
                  <img src={src} alt="Upload" className="w-full h-full object-cover" />

                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-[var(--color-border)] rounded-xl py-6 flex flex-col items-center gap-2 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] transition-colors"
            >
              <Camera size={24} className="text-[var(--color-muted)]" />
              <p className="text-[var(--color-muted)] text-sm font-medium">
                Tap to add photos
              </p>
              <p className="text-[var(--color-muted)] text-xs">
               Photos will be attached to your ticket.
              </p>
            </button>
          )}

          <div className="mt-2 bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-3 flex items-start gap-2">
            <Upload size={12} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
            <p className="text-[var(--color-muted)] text-xs">
              {mode === "ticket"
                ? "This will create a private support ticket for your account."
                : "This will go to admin for approval before appearing as a public network incident."}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[var(--color-text)] text-sm font-semibold mb-2">
            Additional Details
          </p>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={
              mode === "ticket"
                ? "Optional: add anything else support should know."
                : "Describe what you saw, e.g. pole knocked down near Total station."
            }
            className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition resize-none"
          />
        </div>

        {(error || statusMessage) && (
          <div
            className={`text-xs rounded-lg px-3 py-2 border ${
              error
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-[var(--color-surface-soft)] text-[var(--color-primary)] border-[var(--color-border)]"
            }`}
          >
            {error || statusMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-primary)]/60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading && <RefreshCw size={15} className="animate-spin" />}
          {loading
            ? speedTesting
              ? "Checking connection..."
              : "Submitting..."
            : mode === "ticket"
              ? "Submit Ticket"
              : "Submit Incident for Review"}
        </button>
      </div>
    </Layout>
  );
}
