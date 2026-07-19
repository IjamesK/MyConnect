import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Construction,
  CreditCard,
  FileText,
  Gauge,
  KeyRound,
  LocateFixed,
  MapPin,
  MapPinned,
  MessageSquare,
  RadioTower,
  RefreshCw,
  Router,
  Scissors,
  Smartphone,
  Send,
  Upload,
  WifiOff,
  Wrench,
  X,
} from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";
import {
  addTicketCustomerComment,
  createTicket,
  findActiveRelatedTicket,
  type RelatedTicketBlock,
  type TicketPriority,
} from "../../../lib/tickets";
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
  createManualEligibilityReview,
  eligibilityStatusTone,
  runMoveEligibilityCheck,
  type MoveEligibilityCheck,
} from "../../../lib/eligibility";
import {
  normalizeRouterType,
  routerName,
  routerPatternLabel,
  type RouterLightCheck,
} from "../../../lib/routerTypes";
import { Layout } from "../isp/Layout";

type ReportMode = "ticket" | "incident";
type NetworkIssueValue = IncidentType | "";
type ConnectedDeviceValue = number | "";

const personalIssueTypes = [
  { icon: WifiOff, label: "No Internet", value: "no_internet", priority: "high" },
  { icon: Gauge, label: "Slow Speed", value: "slow_speed", priority: "medium" },
  { icon: AlertTriangle, label: "LOS Light Red", value: "los_light", priority: "high" },
  { icon: Router, label: "Router / Wi-Fi Issue", value: "router_issue", priority: "medium" },
  {
    icon: CreditCard,
    label: "Payment Not Reflected",
    value: "payment_not_reflected",
    priority: "medium",
  },
  {
    icon: RefreshCw,
    label: "Paid on Wrong Router",
    value: "wrong_router_payment",
    priority: "medium",
  },
  {
    icon: MapPinned,
    label: "Moving / Location Check",
    value: "move_eligibility",
    priority: "medium",
  },
  { icon: KeyRound, label: "Wi-Fi Password Reset", value: "password_reset", priority: "low" },
  { icon: FileText, label: "Other Account Issue", value: "other", priority: "low" },
] as const;

const networkIssueTypes = [
  { icon: RadioTower, label: "Knocked Pole", value: "knocked_pole" },
  { icon: Scissors, label: "Cable Cut / Vandalism", value: "fiber_cut" },
  { icon: Wrench, label: "Damaged Cabinet", value: "damaged_cabinet" },
  { icon: WifiOff, label: "Area Outage", value: "area_outage" },
  { icon: Construction, label: "Road Construction Damage", value: "outage" },
  { icon: AlertTriangle, label: "Other Network Issue", value: "other" },
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

  if (type === "move_eligibility") {
    return "I am moving to a new place and would like CanalBox to confirm if the new location is eligible for service.";
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

function buildRouterLightCheck(
  profile: CustomerProfile | null,
  pattern: string | null,
  lights: string | null,
): RouterLightCheck | null {
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

function eligibilityToneClass(status: MoveEligibilityCheck["status"]) {
  const tone = eligibilityStatusTone(status);

  if (tone === "success") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (tone === "warning") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (tone === "danger") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-[var(--color-surface-soft)] text-[var(--color-muted)] border-[var(--color-border)]";
}

function formatCoordinate(value: number | null) {
  if (typeof value !== "number") return "Not captured";
  return value.toFixed(6);
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
      {children}
    </div>
  );
}

function issueLabel(mode: ReportMode, value: string) {
  if (mode === "ticket") {
    return personalIssueTypes.find((item) => item.value === value)?.label ?? "Customer Issue";
  }

  return networkIssueTypes.find((item) => item.value === value)?.label ?? "Network Incident";
}

export function ReportIssue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const patternParam = searchParams.get("pattern");
  const lightsParam = searchParams.get("lights");
  const sourceParam = searchParams.get("source");
  const cameFromRouterLights = sourceParam === "router_lights";

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [mode, setMode] = useState<ReportMode>("ticket");
  const [personalIssueType, setPersonalIssueType] = useState("");
  const [networkIssueType, setNetworkIssueType] = useState<NetworkIssueValue>("");
  const [description, setDescription] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDeviceValue>("");
  const [newMoveAddress, setNewMoveAddress] = useState("");
  const [newMoveLandmark, setNewMoveLandmark] = useState("");
  const [eligibilityCheck, setEligibilityCheck] =
    useState<MoveEligibilityCheck | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [showPinAdjuster, setShowPinAdjuster] = useState(false);
  const [speedTest, setSpeedTest] = useState<SpeedTestResult | null>(null);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [duplicateBlock, setDuplicateBlock] = useState<RelatedTicketBlock | null>(null);
  const [duplicateUpdateText, setDuplicateUpdateText] = useState("");
  const [addingDuplicateUpdate, setAddingDuplicateUpdate] = useState(false);
  const [duplicateUpdateSent, setDuplicateUpdateSent] = useState(false);
  const [submitted, setSubmitted] = useState<{
    mode: ReportMode;
    id: string;
  } | null>(null);
  const [error, setError] = useState("");

  const routerLightCheck = buildRouterLightCheck(
    profile,
    patternParam,
    lightsParam,
  );

  const hasSelectedIssue =
    mode === "ticket" ? Boolean(personalIssueType) : Boolean(networkIssueType);
  const isSlowSpeedTicket =
    mode === "ticket" && personalIssueType === "slow_speed";
  const isMoveEligibilityTicket =
    mode === "ticket" && personalIssueType === "move_eligibility";
  const shouldShowPhotos =
    mode === "incident" ||
    personalIssueType === "payment_not_reflected" ||
    personalIssueType === "wrong_router_payment" ||
    personalIssueType === "other";
  const shouldShowLocationNote = mode === "incident";

  const handleIssueSelect = (issueType: string) => {
    setError("");
    setDuplicateBlock(null);
    setDuplicateUpdateText("");
    setDuplicateUpdateSent(false);
    setSpeedTest(null);
    setEligibilityCheck(null);
    setShowPinAdjuster(false);

    if (issueNeedsRouterLights(issueType)) {
      navigate(`/troubleshoot/zte?issue=${issueType}`);
      return;
    }

    setMode("ticket");
    setPersonalIssueType(issueType);
    setNetworkIssueType("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetSelection = () => {
    setError("");
    setStatusMessage("");
    setDuplicateBlock(null);
    setDuplicateUpdateText("");
    setDuplicateUpdateSent(false);
    setPersonalIssueType("");
    setNetworkIssueType("");
    setDescription("");
    setLocationNote("");
    setConnectedDevices("");
    setNewMoveAddress("");
    setNewMoveLandmark("");
    setEligibilityCheck(null);
    setShowPinAdjuster(false);
    setPhotos([]);
    setSpeedTest(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setPersonalIssueType("");
    }

    if (typeParam && isPersonalIssueType(typeParam)) {
      setMode("ticket");
      setPersonalIssueType(typeParam);
      setNetworkIssueType("");

      if (source === "self_help" || source === "troubleshooter") {
        const prefilledText = getPrefilledDescription(typeParam);
        if (prefilledText) setDescription((current) => current || prefilledText);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showPinAdjuster || !mapContainerRef.current || !eligibilityCheck?.currentLatitude || !eligibilityCheck.currentLongitude) {
      return;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    const initialLatitude = eligibilityCheck.currentLatitude;
    const initialLongitude = eligibilityCheck.currentLongitude;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [initialLongitude, initialLatitude],
      zoom: 17,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const marker = new maplibregl.Marker({ draggable: true })
      .setLngLat([initialLongitude, initialLatitude])
      .addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLngLat();
      setEligibilityCheck((current) =>
        current
          ? {
              ...current,
              statusLabel: "Location adjusted",
              summary: "Your adjusted location has been captured. Our team will check service availability and update you.",
              currentLatitude: position.lat,
              currentLongitude: position.lng,
              accuracyMeters: null,
              checkedAt: new Date().toISOString(),
              locationSource: "gps_adjusted",
              recommendedAction: "Copy and paste coordinates to Mapbox to test eligibility.",
            }
          : current,
      );
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      if (mapInstanceRef.current === map) {
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showPinAdjuster, eligibilityCheck?.currentLatitude, eligibilityCheck?.currentLongitude]);

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

  const handleRunEligibilityCheck = async () => {
    setError("");
    setEligibilityCheck(null);
    setShowPinAdjuster(false);

    if (!newMoveAddress.trim() && !newMoveLandmark.trim()) {
      setError("Please add the new place, building name, or nearby landmark before capturing coordinates.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setEligibilityCheck(
        createManualEligibilityReview({
          newAddress: newMoveAddress.trim(),
          landmark: newMoveLandmark.trim(),
        }),
      );
      setError("This device cannot share live location. Please use a phone/browser that allows GPS location, or contact support for a manual site survey.");
      return;
    }

    try {
      setCheckingEligibility(true);
      setStatusMessage("Capturing your location...");

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const result = await runMoveEligibilityCheck({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
        newAddress: newMoveAddress.trim(),
        landmark: newMoveLandmark.trim(),
      });

      setEligibilityCheck(result);
      setStatusMessage("");
    } catch (err) {
      console.error("Location capture failed:", err);
      setEligibilityCheck(
        createManualEligibilityReview({
          newAddress: newMoveAddress.trim(),
          landmark: newMoveLandmark.trim(),
        }),
      );
      setError("Location permission was not completed. Please allow location access while you are standing at the new place, then try again.");
    } finally {
      setCheckingEligibility(false);
      setStatusMessage("");
    }
  };


  const formatTicketTime = (value?: { toDate?: () => Date } | null) => {
    const date = value?.toDate?.();

    if (!date) return "Recently";

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buildDefaultDuplicateUpdate = () => {
    const updateParts = [
      `Customer tried to report: ${issueLabel("ticket", personalIssueType)}.`,
    ];

    if (description.trim()) {
      updateParts.push(description.trim());
    }

    if (personalIssueType === "slow_speed" && connectedDevices) {
      updateParts.push(`Reported connected devices: ${connectedDevices}.`);
    }

    if (personalIssueType === "move_eligibility" && (newMoveAddress.trim() || newMoveLandmark.trim())) {
      updateParts.push(`New place: ${newMoveAddress.trim() || "Not provided"}.`);
      updateParts.push(`Landmark: ${newMoveLandmark.trim() || "Not provided"}.`);
    }

    if (eligibilityCheck?.currentLatitude && eligibilityCheck?.currentLongitude) {
      updateParts.push(
        `Coordinates: ${formatCoordinate(eligibilityCheck.currentLatitude)}, ${formatCoordinate(eligibilityCheck.currentLongitude)}.`,
      );
    }

    if (routerLightCheck) {
      updateParts.push(`Router light check: ${routerPatternLabel(routerLightCheck.pattern)}.`);
    }

    return updateParts.join("\n");
  };

  const handleAddDuplicateUpdate = async () => {
    if (!profile || !duplicateBlock) return;

    const cleanUpdate = duplicateUpdateText.trim();

    if (!cleanUpdate) {
      setError("Please add a short update before sending it to support.");
      return;
    }

    try {
      setError("");
      setAddingDuplicateUpdate(true);
      await addTicketCustomerComment({
        ticketId: duplicateBlock.ticket.id,
        by: profile.fullName || "Customer",
        text: cleanUpdate,
      });
      setDuplicateUpdateSent(true);
      setDuplicateUpdateText("");
      setStatusMessage("Update added to the existing ticket.");
    } catch (err) {
      console.error("Add duplicate update failed:", err);
      setError("Failed to add the update. Please check your connection and try again.");
    } finally {
      setAddingDuplicateUpdate(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile) return;

    setError("");
    setStatusMessage("");

    if (mode === "ticket" && !personalIssueType) {
      setError("Please select the problem you are experiencing.");
      return;
    }

    if (mode === "incident" && !networkIssueType) {
      setError("Please select the network incident type.");
      return;
    }

    if (mode === "ticket" && personalIssueType === "slow_speed") {
      const devices = Number(connectedDevices);
      if (!connectedDevices || Number.isNaN(devices) || devices < 1) {
        setError("Please enter the number of devices currently connected to your router.");
        return;
      }
    }

    if (mode === "ticket" && personalIssueType === "move_eligibility") {
      if (!newMoveAddress.trim() && !newMoveLandmark.trim()) {
        setError("Please add the new location, building name, or nearby landmark.");
        return;
      }

      if (!eligibilityCheck?.currentLatitude || !eligibilityCheck?.currentLongitude) {
        setError("Please capture your GPS coordinates while you are standing at the new location before submitting.");
        return;
      }
    }

    if (mode === "incident" && !description.trim()) {
      setError("Please describe the network incident before submitting.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "ticket") {
        const selectedIssue = personalIssueTypes.find(
          (item) => item.value === personalIssueType,
        );

        setStatusMessage("Checking for existing related tickets...");
        const relatedTicket = await findActiveRelatedTicket(profile.uid, personalIssueType);

        if (relatedTicket) {
          setDuplicateBlock(relatedTicket);
          setDuplicateUpdateText((current) => current || buildDefaultDuplicateUpdate());
          setDuplicateUpdateSent(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        let capturedSpeedTest: SpeedTestResult | null = null;

        if (personalIssueType === "slow_speed") {
          const devices = Math.max(1, Number(connectedDevices));
          setSpeedTesting(true);
          setStatusMessage("Checking your connection and attaching the result...");

          try {
            capturedSpeedTest = await runBrowserSpeedTest(devices);
            setSpeedTest(capturedSpeedTest);
          } catch (err) {
            console.error("Speed test failed:", err);
            capturedSpeedTest = null;
          } finally {
            setSpeedTesting(false);
          }
        }

        const moveDescription =
          personalIssueType === "move_eligibility"
            ? `Customer is moving and wants CanalBox to check service eligibility for a new location.\nNew place: ${newMoveAddress.trim() || "Not provided"}\nNearby landmark: ${newMoveLandmark.trim() || "Not provided"}`
            : "";

        const baseDescription =
          description.trim() ||
          moveDescription ||
          getPrefilledDescription(personalIssueType) ||
          selectedIssue?.label ||
          "Customer issue";

        const speedNote =
          personalIssueType === "slow_speed"
            ? capturedSpeedTest
              ? `\n\nAutomatic connection check attached:\nDownload: ${capturedSpeedTest.downloadMbps} Mbps\nUpload: ${capturedSpeedTest.uploadMbps} Mbps\nLatency: ${capturedSpeedTest.latencyMs} ms\nDevices connected: ${capturedSpeedTest.connectedDevices}\nResult: ${qualityLabel(capturedSpeedTest.quality)}.`
              : `\n\nAutomatic connection check was attempted but could not be completed. Customer was asked to stay connected to CanalBox Wi-Fi. Reported connected devices: ${connectedDevices}.`
            : "";

        const routerLightNote = routerLightCheck
          ? `\n\nRouter light check:\nRouter type: ${routerLightCheck.routerName}\nIssue detected: ${routerPatternLabel(routerLightCheck.pattern)}\nSelected lights: ${
              routerLightCheck.selectedLights.length > 0
                ? routerLightCheck.selectedLights.join(", ")
                : "None selected"
            }`
          : "";

        const eligibilityNote = eligibilityCheck
          ? `\n\nMove location check:\nStatus: ${eligibilityCheck.statusLabel}\nNew place: ${eligibilityCheck.newAddress || "Not provided"}\nLandmark: ${eligibilityCheck.landmark || "Not provided"}\nCoordinates: ${formatCoordinate(eligibilityCheck.currentLatitude)}, ${formatCoordinate(eligibilityCheck.currentLongitude)}.`
          : "";

        setStatusMessage("Creating your support ticket...");

        const ticketId = await createTicket(profile, {
          category: personalIssueType,
          title: selectedIssue?.label ?? "Customer Issue",
          description: `${baseDescription}${speedNote}${routerLightNote}${eligibilityNote}`,
          priority: (selectedIssue?.priority ?? "medium") as TicketPriority,
          workType:
            personalIssueType === "password_reset" ||
            personalIssueType === "payment_not_reflected" ||
            personalIssueType === "wrong_router_payment"
              ? "remote_support"
              : personalIssueType === "slow_speed"
                ? "monitoring"
                : personalIssueType === "move_eligibility"
                  ? "site_survey"
                  : "technician",
          photoCount: photos.length,
          locationNote: locationNote.trim(),
          speedTest: personalIssueType === "slow_speed" ? capturedSpeedTest : null,
          routerLightCheck,
          eligibilityCheck:
            personalIssueType === "move_eligibility" ? eligibilityCheck : null,
        });

        setSubmitted({ mode: "ticket", id: ticketId });
        return;
      }

      const selectedIncident = networkIssueTypes.find(
        (item) => item.value === networkIssueType,
      );

      const reportId = await createIncidentReport(profile, {
        type: networkIssueType as IncidentType,
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

  const renderAccountLocation = () => (
    <SectionCard>
      <div className="flex items-center gap-3">
        <MapPin size={16} className="text-[var(--color-primary)] shrink-0" />

        <div className="flex-1">
          <p className="text-[var(--color-text)] text-sm font-medium">
            {profile?.area}, {profile?.district}
          </p>

          <p className="text-[var(--color-muted)] text-xs">
            {profile?.customerNumber} · {profile?.routerSerial}
          </p>
        </div>
      </div>
    </SectionCard>
  );

  const renderPhotoPicker = () => (
    <SectionCard>
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
          className="w-full border-2 border-dashed border-[var(--color-border)] rounded-xl py-5 flex flex-col items-center gap-2 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] transition-colors"
        >
          <Camera size={22} className="text-[var(--color-muted)]" />
          <p className="text-[var(--color-muted)] text-sm font-medium">
            Tap to add photos
          </p>
          <p className="text-[var(--color-muted)] text-xs">
            Photos will be attached to your ticket.
          </p>
        </button>
      )}
    </SectionCard>
  );

  const renderTextArea = (label: string, placeholder: string, required = false) => (
    <SectionCard>
      <p className="text-[var(--color-text)] text-sm font-semibold mb-2">
        {label} {!required && <span className="text-[var(--color-muted)] font-normal">(optional)</span>}
      </p>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition resize-none"
      />
    </SectionCard>
  );

  if (!profile) {
    return (
      <Layout showBack backTo="/dashboard" title="Report">
        <div className="px-4 py-10 text-center text-[var(--color-muted)] text-sm">
          Loading account details...
        </div>
      </Layout>
    );
  }

  if (duplicateBlock) {
    return (
      <Layout showBack backTo="/report-issue" title="Report">
        <div className="px-4 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>

              <div className="flex-1">
                <h1
                  style={{
                    fontFamily: "'Inter Tight', system-ui, sans-serif",
                    fontWeight: 800,
                  }}
                  className="text-amber-800 text-xl"
                >
                  {duplicateBlock.title}
                </h1>

                <p className="text-amber-700 text-sm mt-2 leading-relaxed">
                  {duplicateBlock.message}
                </p>
              </div>
            </div>
          </div>

          <SectionCard>
            <p className="text-[var(--color-muted)] text-xs font-semibold uppercase tracking-wide">
              Existing ticket
            </p>
            <p className="text-[var(--color-text)] text-base font-bold mt-1">
              {duplicateBlock.ticket.title}
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-1">
              Status: {duplicateBlock.ticket.status.replace("_", " ")} · Opened {formatTicketTime(duplicateBlock.ticket.createdAt)}
            </p>
            <p
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              className="text-[var(--color-muted)] text-xs mt-2"
            >
              Reference: {duplicateBlock.ticket.id}
            </p>

            <button
              type="button"
              onClick={() => navigate(`/ticket/${duplicateBlock.ticket.id}`)}
              className="mt-4 w-full py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold"
            >
              View Existing Ticket
            </button>
          </SectionCard>

          <SectionCard>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
                <MessageSquare size={18} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-[var(--color-text)] text-sm font-bold">
                  Add update instead
                </p>
                <p className="text-[var(--color-muted)] text-xs mt-0.5">
                  This will be added to the existing ticket. No new duplicate ticket will be created.
                </p>
              </div>
            </div>

            <textarea
              value={duplicateUpdateText}
              onChange={(e) => {
                setDuplicateUpdateText(e.target.value);
                setDuplicateUpdateSent(false);
              }}
              rows={4}
              placeholder={duplicateBlock.suggestedUpdate}
              className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition resize-none"
            />

            <button
              type="button"
              onClick={handleAddDuplicateUpdate}
              disabled={addingDuplicateUpdate}
              className="mt-3 w-full py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-primary)]/60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              {addingDuplicateUpdate ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {addingDuplicateUpdate ? "Adding update..." : "Add Update"}
            </button>
          </SectionCard>

          {(error || statusMessage || duplicateUpdateSent) && (
            <div
              className={`text-xs rounded-lg px-3 py-2 border ${
                error
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {error || statusMessage || "Update added to the existing ticket."}
            </div>
          )}

          <button
            type="button"
            onClick={resetSelection}
            className="w-full py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-semibold"
          >
            Choose Different Problem
          </button>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    const isTicket = submitted.mode === "ticket";
    const isMoveRequest = isTicket && personalIssueType === "move_eligibility";

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
            {isMoveRequest
              ? "Move Request Created"
              : isTicket
                ? "Ticket Created"
                : "Incident Sent for Review"}
          </h2>

          <p className="text-[var(--color-muted)] text-sm mb-4">
            {isMoveRequest
              ? "Your move request has been sent with location details. Staff will confirm availability and update you."
              : isTicket
                ? "Your request has been sent to support. You will receive updates as the ticket progresses."
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

  if (!hasSelectedIssue) {
    const activeIssueTypes = mode === "ticket" ? personalIssueTypes : networkIssueTypes;

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
              Choose the problem first. The next page will only show what is needed.
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
              {mode === "ticket" ? "What is the problem?" : "What did you see?"}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {activeIssueTypes.map(({ icon: Icon, label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    if (mode === "ticket") handleIssueSelect(value);
                    else {
                      setNetworkIssueType(value as IncidentType);
                      setPersonalIssueType("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="px-3 py-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center gap-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
                    <Icon size={16} strokeWidth={2.3} />
                  </span>
                  <span className="leading-snug text-[var(--color-text)]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedTitle = issueLabel(mode, mode === "ticket" ? personalIssueType : networkIssueType);

  return (
    <Layout showBack backTo="/dashboard" title="Report">
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[var(--color-muted)] text-xs font-semibold uppercase tracking-wide">
              {mode === "ticket" ? "My Connection" : "Network Incident"}
            </p>
            <h1
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontWeight: 800,
              }}
              className="text-[var(--color-text)] text-2xl mt-1"
            >
              {selectedTitle}
            </h1>
          </div>

          <button
            type="button"
            onClick={resetSelection}
            className="px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] text-xs font-semibold flex items-center gap-1 shrink-0"
          >
            <ArrowLeft size={13} />
            Change
          </button>
        </div>

        {cameFromRouterLights && routerLightCheck && (
          <SectionCard>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
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
          </SectionCard>
        )}

        {isSlowSpeedTicket && (
          <SectionCard>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
                <Gauge size={20} className="text-[var(--color-primary)]" />
              </div>

              <div className="flex-1">
                <p className="text-[var(--color-text)] text-sm font-bold">
                  Connection check will run automatically
                </p>
                <p className="text-[var(--color-muted)] text-xs mt-0.5 leading-relaxed">
                  Make sure you are connected to your CanalBox Wi-Fi. When you submit, we’ll check the connection and attach the result.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="text-[var(--color-text)] text-xs font-semibold">
                Devices currently connected to your router
              </span>

              <div className="mt-2 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setConnectedDevices(count);
                      setSpeedTest(null);
                    }}
                    className={`py-2 rounded-xl border text-xs font-semibold ${
                      connectedDevices === count
                        ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]"
                    }`}
                  >
                    {count}{count === 5 ? "+" : ""}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <Smartphone size={15} className="text-[var(--color-muted)]" />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={connectedDevices}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConnectedDevices(value === "" ? "" : Math.max(1, Number(value)));
                    setSpeedTest(null);
                  }}
                  placeholder="Type number if more than 5"
                  className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </label>

            {speedTesting && (
              <div className="mt-4 bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-3">
                <div className="flex items-center gap-2 text-[var(--color-primary)] text-xs font-semibold mb-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Checking connection...
                </div>
                <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-[var(--color-primary)] animate-pulse" />
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {isMoveEligibilityTicket && (
          <SectionCard>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
                <MapPinned size={20} className="text-[var(--color-primary)]" />
              </div>

              <div className="flex-1">
                <p className="text-[var(--color-text)] text-sm font-bold">
                  Capture new-location coordinates
                </p>
                <p className="text-[var(--color-muted)] text-xs mt-0.5 leading-relaxed">
                  Stand at the place you are moving to. We’ll capture the coordinates and staff will confirm availability.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="text-[var(--color-text)] text-xs font-semibold">
                New place / area
              </span>
              <input
                type="text"
                value={newMoveAddress}
                onChange={(e) => {
                  setNewMoveAddress(e.target.value);
                  setEligibilityCheck(null);
                  setShowPinAdjuster(false);
                }}
                placeholder="e.g. Kiwatule, Najjera, Kira, Seeta..."
                className="mt-2 w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
              />
            </label>

            <label className="block mt-3">
              <span className="text-[var(--color-text)] text-xs font-semibold">
                Nearby landmark or building name
              </span>
              <input
                type="text"
                value={newMoveLandmark}
                onChange={(e) => {
                  setNewMoveLandmark(e.target.value);
                  setEligibilityCheck(null);
                  setShowPinAdjuster(false);
                }}
                placeholder="e.g. near Total, opposite school, apartment name"
                className="mt-2 w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
              />
            </label>

            <button
              type="button"
              onClick={handleRunEligibilityCheck}
              disabled={checkingEligibility}
              className="mt-4 w-full py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-primary)]/60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              {checkingEligibility ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <LocateFixed size={15} />
              )}
              {checkingEligibility ? "Capturing location..." : "Capture my location"}
            </button>

            {eligibilityCheck && (
              <div className={`mt-4 rounded-xl border px-3 py-3 text-xs ${eligibilityToneClass(eligibilityCheck.status)}`}>
                <p className="font-bold text-sm">{eligibilityCheck.statusLabel}</p>
                <p className="mt-1 leading-relaxed">{eligibilityCheck.summary}</p>
                <div className="mt-2 space-y-1 opacity-90">
                  <p>Coordinates: {formatCoordinate(eligibilityCheck.currentLatitude)}, {formatCoordinate(eligibilityCheck.currentLongitude)}</p>
                  {typeof eligibilityCheck.accuracyMeters === "number" && (
                    <p>Accuracy: about {Math.round(eligibilityCheck.accuracyMeters)} m</p>
                  )}
                </div>

                {eligibilityCheck.currentLatitude && eligibilityCheck.currentLongitude && (
                  <button
                    type="button"
                    onClick={() => setShowPinAdjuster((current) => !current)}
                    className="mt-3 text-xs font-semibold underline underline-offset-4"
                  >
                    {showPinAdjuster ? "Hide map" : "Adjust pin manually"}
                  </button>
                )}
              </div>
            )}

            {showPinAdjuster && eligibilityCheck?.currentLatitude && eligibilityCheck.currentLongitude && (
              <div className="mt-4 space-y-2">
                <div ref={mapContainerRef} className="h-64 w-full rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]" />
                <p className="text-[var(--color-muted)] text-xs leading-relaxed">
                  Drag the pin only if the captured point is clearly wrong. You can also submit without adjusting.
                </p>
              </div>
            )}
          </SectionCard>
        )}

        {mode === "ticket" && !isMoveEligibilityTicket && renderAccountLocation()}

        {mode === "incident" && (
          <>
            <SectionCard>
              <p className="text-[var(--color-text)] text-sm font-semibold mb-2">
                Location details
              </p>
              <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-3 flex items-center gap-3 mb-2">
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
                placeholder="Add nearby landmark or exact spot"
                className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
              />
            </SectionCard>
            {renderPhotoPicker()}
            {renderTextArea("What happened?", "Describe what you saw, e.g. pole knocked down near Total station.", true)}
          </>
        )}

        {mode === "ticket" && personalIssueType === "payment_not_reflected" && (
          <>
            {renderTextArea("Payment details", "Add transaction ID, amount paid, payment method, and date.", false)}
            {renderPhotoPicker()}
          </>
        )}

        {mode === "ticket" && personalIssueType === "wrong_router_payment" && (
          <>
            {renderTextArea("Payment details", "Add correct customer/router number, wrong customer/router number, transaction ID, and amount paid.", false)}
            {renderPhotoPicker()}
          </>
        )}

        {mode === "ticket" && personalIssueType === "password_reset" && (
          renderTextArea("Extra note", "Optional: add anything support should know before helping with the password reset.", false)
        )}

        {mode === "ticket" && personalIssueType === "other" && (
          <>
            {renderTextArea("What do you need help with?", "Explain the account issue so support can understand it quickly.", true)}
            {renderPhotoPicker()}
          </>
        )}

        {mode === "ticket" && personalIssueType !== "payment_not_reflected" && personalIssueType !== "wrong_router_payment" && personalIssueType !== "password_reset" && personalIssueType !== "other" && !isSlowSpeedTicket && !isMoveEligibilityTicket && (
          renderTextArea("Extra details", "Optional: add anything else support should know.", false)
        )}

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
            : isMoveEligibilityTicket
              ? "Submit Move Request"
              : mode === "ticket"
                ? "Submit Ticket"
                : "Submit Incident for Review"}
        </button>
      </div>
    </Layout>
  );
}
