import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { runBrowserSpeedTest, type SpeedTestResult } from "../../../lib/speedTest";
import { useNavigate, useSearchParams } from "react-router";
import { Layout } from "../isp/Layout";
import {
  Camera,
  X,
  Upload,
  MapPin,
  CheckCircle,
  WifiOff,
  AlertTriangle,
  Gauge,
  Smartphone,
  Download,
  Timer,
  RefreshCw,
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

type ReportMode = "ticket" | "incident";

const personalIssueTypes = [
  { label: "No Internet", value: "no_internet", priority: "high" },
  { label: "Slow Speed", value: "slow_speed", priority: "medium" },
  { label: "LOS Light Red", value: "los_light", priority: "high" },
  {
    label: "Payment Not Reflected",
    value: "payment_not_reflected",
    priority: "medium",
  },
  { label: "Router Not Working", value: "router_issue", priority: "medium" },
  { label: "Wi-Fi Password Reset", value: "password_reset", priority: "low" },
  { label: "Other Account Issue", value: "other", priority: "low" },
] as const;

const networkIssueTypes = [
  { label: "Knocked Pole", value: "knocked_pole" },
  { label: "Cable Cut / Vandalism", value: "fiber_cut" },
  { label: "Damaged Cabinet", value: "damaged_cabinet" },
  { label: "Area Outage", value: "area_outage" },
  { label: "Road Construction Damage", value: "outage" },
  { label: "Other Network Issue", value: "other" },
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

  return "";
}

export function ReportIssue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const handleIssueSelect = (issueType: string) => {
  if (
    issueType === "no_internet" ||
    issueType === "los_light" ||
    issueType === "router_issue"
  ) {
    navigate(`/troubleshoot/zte?issue=${issueType}`);
    return;
  }

  setMode("ticket");
  setPersonalIssueType(issueType);
};
  
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [mode, setMode] = useState<ReportMode>("ticket");
  const [personalIssueType, setPersonalIssueType] = useState("no_internet");
  const [networkIssueType, setNetworkIssueType] =
    useState<IncidentType>("knocked_pole");
  const [description, setDescription] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [connectedDevices, setConnectedDevices] = useState(3);
  const [speedTest, setSpeedTest] = useState<SpeedTestResult | null>(null);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [connectedDevices, setConnectedDevices] = useState(1);
  const [submitted, setSubmitted] = useState<{
    mode: ReportMode;
    id: string;
  } | null>(null);
  const [error, setError] = useState("");

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
    const sourceParam = searchParams.get("source");

    if (modeParam === "ticket") {
      setMode("ticket");
    }

    if (typeParam && isPersonalIssueType(typeParam)) {
      setMode("ticket");
      setPersonalIssueType(typeParam);

      if (sourceParam === "troubleshooter") {
        const prefilledText = getPrefilledDescription(typeParam);

        if (prefilledText) {
          setDescription((current) => current || prefilledText);
        }
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

    const isSlowSpeedTicket =
      mode === "ticket" && personalIssueType === "slow_speed";
    
    const handleRunSpeedTest = async () => {
      setError("");
      setSpeedTesting(true);
    
      try {
        const result = await runBrowserSpeedTest(connectedDevices);
        setSpeedTest(result);
      } catch (err) {
        console.error("Speed test failed:", err);
        setError(
          "We could not complete the connection check, but you can still submit the report."
        );
      } finally {
        setSpeedTesting(false);
      }
    };
    
    useEffect(() => {
      if (
        isSlowSpeedTicket &&
        !speedTest &&
        !speedTesting
      ) {
        handleRunSpeedTest();
      }
    }, [mode, personalIssueType]);

  const handleSubmit = async () => {
    if (!profile) return;

    setError("");

    if (!description.trim()) {
      setError("Please describe the issue before submitting.");
      return;
    }

    if (mode === "ticket" && personalIssueType === "slow_speed" && !speedTest) {
      setError(
        "Please run the speed test first so download and upload speed are attached to the ticket.",
      );
      return;
    }

    try {
      setLoading(true);

      if (mode === "ticket") {
        const selectedIssue = personalIssueTypes.find(
          (item) => item.value === personalIssueType,
        );

        const ticketId = await createTicket(profile, {
          category: personalIssueType,
          title: selectedIssue?.label ?? "Customer Issue",
          description: speedTest
            ? `${description.trim()}\n\nSpeed test attached: ${speedTest.downloadMbps} Mbps download, ${speedTest.uploadMbps} Mbps upload, ${speedTest.latencyMs} ms latency, ${speedTest.connectedDevices} connected device(s), ${qualityLabel(speedTest.quality)}.`
            : description.trim(),
          priority: (selectedIssue?.priority ?? "medium") as TicketPriority,
          workType:
            personalIssueType === "password_reset" ||
            personalIssueType === "payment_not_reflected"
              ? "remote_support"
              : personalIssueType === "slow_speed"
                ? "monitoring"
                : "technician",
          photoCount: photos.length,
          locationNote: locationNote.trim(),
          speedTest: personalIssueType === "slow_speed" ? speedTest : null,
        });

        setSubmitted({ mode: "ticket", id: ticketId });
        return;
      }

      const selectedIncident = networkIssueTypes.find(
        (item) => item.value === networkIssueType,
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
    }
  };

  if (!profile) {
    return (
      <Layout showBack backTo="/dashboard" title="Report Issue">
        <div className="px-4 py-10 text-center text-[#64748B] text-sm">
          Loading account details...
        </div>
      </Layout>
    );
  }

  if (submitted) {
    const isTicket = submitted.mode === "ticket";

    return (
      <Layout showBack backTo="/dashboard" title="Report Issue">
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] border-2 border-[#BBF7D0] flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-[#16A34A]" />
          </div>

          <h2
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[#0F172A] text-xl mb-2"
          >
            {isTicket ? "Ticket Created!" : "Incident Sent for Review!"}
          </h2>

          <p className="text-[#64748B] text-sm mb-4">
            {isTicket
              ? "Your issue has been sent to support. You will receive notifications when the ticket is updated."
              : "Your network incident report has been sent to admin for approval. If confirmed, it will appear on the Network Status page and affected customers will be notified."}
          </p>

          <p
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[#94A3B8] text-xs mb-5"
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
            className="px-4 py-2.5 bg-[#0057B8] text-white rounded-xl text-sm font-semibold"
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
    <Layout showBack backTo="/dashboard" title="Report Issue">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[#0F172A] text-2xl"
          >
            Report an Issue
          </h1>

          <p className="text-[#64748B] text-sm mt-1">
            Choose whether this affects only your account or the wider network.
          </p>
        </div>

        {/* Report mode */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("ticket")}
            className={`p-3 rounded-2xl border-2 text-left transition-all ${
              mode === "ticket"
                ? "border-[#0057B8] bg-[#EBF2FF]"
                : "border-[#E2E8F0] bg-white"
            }`}
          >
            <WifiOff
              size={20}
              className={
                mode === "ticket" ? "text-[#0057B8]" : "text-[#94A3B8]"
              }
            />
            <p className="text-[#0F172A] text-sm font-semibold mt-2">
              My Connection
            </p>
            <p className="text-[#64748B] text-xs mt-0.5">
              Private support ticket
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("incident")}
            className={`p-3 rounded-2xl border-2 text-left transition-all ${
              mode === "incident"
                ? "border-[#E5007D] bg-[#FCE7F3]"
                : "border-[#E2E8F0] bg-white"
            }`}
          >
            <AlertTriangle
              size={20}
              className={
                mode === "incident" ? "text-[#E5007D]" : "text-[#94A3B8]"
              }
            />
            <p className="text-[#0F172A] text-sm font-semibold mt-2">
              Network Incident
            </p>
            <p className="text-[#64748B] text-xs mt-0.5">
              Admin approval first
            </p>
          </button>
        </div>

        {/* Issue type */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2">
            {mode === "ticket" ? "Ticket Type" : "Incident Type"}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {activeIssueTypes.map(({ label, value }) => {
              const selected =
                mode === "ticket"
                  ? personalIssueType === value
                  : networkIssueType === value;

              return (
                <button
                  key={value}
                  type="button"
                    onClick={() => {
                      if (mode === "ticket") {
                        handleIssueSelect(value);
                      } else {
                        setNetworkIssueType(value as IncidentType);
                      }
                    }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    selected
                      ? "border-[#0057B8] bg-[#EBF2FF] text-[#0057B8]"
                      : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account location */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2">
            Account Location
          </p>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex items-center gap-3">
            <MapPin size={16} className="text-[#0057B8] shrink-0" />

            <div className="flex-1">
              <p className="text-[#0F172A] text-sm font-medium">
                {profile.area}, {profile.district}
              </p>

              <p className="text-[#94A3B8] text-xs">
                {profile.customerNumber} · {profile.routerSerial}
              </p>
            </div>
          </div>

          <input
            type="text"
            value={locationNote}
            onChange={(e) => setLocationNote(e.target.value)}
            placeholder="Optional: add nearby landmark or exact spot"
            className="mt-2 w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
          />
        </div>

        {/* Speed test for slow speed tickets */}
        {isSlowSpeedTicket && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF2FF] flex items-center justify-center shrink-0">
                <Gauge size={20} className="text-[#0057B8]" />
              </div>

              <div className="flex-1">
                <p className="text-[#0F172A] text-sm font-bold">
                  Speed Test Required
                </p>
                <p className="text-[#64748B] text-xs mt-0.5 leading-relaxed">
                  This attaches download speed, upload speed, latency, and
                  connected devices to the ticket so support receives organized
                  evidence.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="text-[#0F172A] text-xs font-semibold">
                Devices currently connected
              </span>
              <div className="mt-2 flex items-center gap-2">
                <Smartphone size={15} className="text-[#94A3B8]" />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={connectedDevices}
                  onChange={(e) => {
                    setConnectedDevices(
                      Math.max(1, Number(e.target.value) || 1),
                    );
                    setSpeedTest(null);
                  }}
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20"
                />
              </div>
            </label>

            <button
              type="button"
              onClick={handleRunSpeedTest}
              disabled={speedTesting}
              className="w-full py-2.5 bg-[#0057B8] disabled:bg-[#0057B8]/60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              {speedTesting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Testing speed...
                </>
              ) : (
                <>
                  <Gauge size={15} />
                  Run Speed Test
                </>
              )}
            </button>

            {speedTest && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                  <Download size={14} className="text-[#0057B8] mb-1" />
                  <p className="text-[#94A3B8] text-[10px]">Download</p>
                  <p className="text-[#0F172A] text-sm font-bold">
                    {speedTest.downloadMbps} Mbps
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                  <Upload size={14} className="text-[#0057B8] mb-1" />
                  <p className="text-[#94A3B8] text-[10px]">Upload</p>
                  <p className="text-[#0F172A] text-sm font-bold">
                    {speedTest.uploadMbps} Mbps
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                  <Timer size={14} className="text-[#0057B8] mb-1" />
                  <p className="text-[#94A3B8] text-[10px]">Latency</p>
                  <p className="text-[#0F172A] text-sm font-bold">
                    {speedTest.latencyMs} ms
                  </p>
                </div>
              </div>
            )}

            {speedTest && (
              <div className="bg-[#EBF2FF] border border-[#BFDBFE] rounded-xl p-3">
                <p className="text-[#1D4ED8] text-xs font-semibold">
                  {qualityLabel(speedTest.quality)}
                </p>
                <p className="text-[#1D4ED8] text-xs mt-0.5">
                  This result will be saved with the support ticket. Production
                  can later connect this to an approved speed-test provider.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Photo upload */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2">
            Attach Photos{" "}
            <span className="text-[#94A3B8] font-normal">(up to 5)</span>
          </p>

          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {photos.map((src, i) => (
                <div
                  key={src}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E2E8F0]"
                >
                  <img
                    src={src}
                    alt="Upload"
                    className="w-full h-full object-cover"
                  />

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
              className="w-full border-2 border-dashed border-[#CBD5E1] rounded-xl py-6 flex flex-col items-center gap-2 hover:border-[#0057B8] hover:bg-[#EBF2FF]/30 transition-colors"
            >
              <Camera size={24} className="text-[#94A3B8]" />
              <p className="text-[#64748B] text-sm font-medium">
                Tap to add photos
              </p>
              <p className="text-[#94A3B8] text-xs">
                Photos preview locally for now; storage upload comes later.
              </p>
            </button>
          )}

          <div className="mt-2 bg-[#EBF2FF] border border-[#BFDBFE] rounded-xl p-3 flex items-start gap-2">
            <Upload size={12} className="text-[#0057B8] mt-0.5 shrink-0" />

            <p className="text-[#1D4ED8] text-xs">
              {mode === "ticket"
                ? "This will create a private support ticket for your account."
                : "This will go to admin for approval before appearing as a public network incident."}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2">
            Description
          </p>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={
              mode === "ticket"
                ? "Describe your connection issue, e.g. LOS light is red or speed is very slow."
                : "Describe what you saw, e.g. pole knocked down near Total station."
            }
            className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition resize-none"
          />
        </div>

        {error && (
          <div className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] disabled:bg-[#0057B8]/60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {loading
            ? "Submitting..."
            : mode === "ticket"
              ? "Submit Support Ticket"
              : "Submit Incident for Review"}
        </button>
      </div>
    </Layout>
  );
}
