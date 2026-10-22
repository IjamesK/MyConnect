import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CheckCircle2,
  Clock,
  Gauge,
  Download,
  Upload,
  Timer,
  Loader2,
  MapPin,
  MapPinned,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  User,
  Wifi,
} from "lucide-react";
import { Layout } from "../isp/Layout";
import { StatusBadge } from "../isp/StatusBadge";
import type { CustomerProfile } from "../../../lib/auth";
import {
  addTicketCustomerComment,
  listenToTicket,
  type CustomerTicket,
  type TicketStatus,
} from "../../../lib/tickets";
import { routerPatternLabel } from "../../../lib/routerTypes";

function statusForBadge(status: TicketStatus) {
  if (status === "resolved" || status === "closed") return "resolved";
  if (status === "assigned") return "assigned";
  if (status === "open") return "critical";
  return "investigating";
}

function formatDate(value?: { toDate?: () => Date } | null) {
  const date = value?.toDate?.();

  if (!date) return "Recently";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCategory(category: string) {
  if (category === "password_reset") return "Password Reset";
  if (category === "no_internet") return "No Internet";
  if (category === "slow_speed") return "Slow Speed";
  if (category === "los_light") return "LOS Light Red";
  if (category === "payment_not_reflected") return "Payment Not Reflected";
  if (category === "router_issue") return "Router Issue";
  if (category === "wrong_router_payment") return "Wrong Router Payment";
  if (category === "move_eligibility") return "Move / Location Check";
  return "Customer Issue";
}

function buildTimeline(ticket: CustomerTicket) {
  const status = ticket.status;

  const assignedDone = [
    "assigned",
    "in_progress",
    "monitoring",
    "resolved",
    "closed",
  ].includes(status);

  const progressDone = [
    "in_progress",
    "monitoring",
    "resolved",
    "closed",
  ].includes(status);

  const resolvedDone = ["resolved", "closed"].includes(status);

  const progressLabel =
    ticket.workType === "technician"
      ? "Technician Working"
      : ticket.workType === "site_survey"
        ? "Site Survey Review"
        : ticket.workType === "monitoring"
          ? "Under Monitoring"
          : "Remote Support";

  return [
    {
      label: "Ticket Submitted",
      time: formatDate(ticket.createdAt),
      done: true,
      active: status === "open",
    },
    {
      label: "Support Assigned",
      time: ticket.assignedTechnicianName || ticket.assignedTo || "Pending",
      done: assignedDone,
      active: status === "assigned",
    },
    {
      label: progressLabel,
      time: ticket.eta ? `ETA: ${ticket.eta}` : "In progress",
      done: progressDone,
      active: status === "in_progress" || status === "monitoring",
    },
    {
      label: "Resolved",
      time: resolvedDone ? formatDate(ticket.updatedAt) : "Pending",
      done: resolvedDone,
      active: false,
    },
  ];
}

function formatCoordinate(value: number | null | undefined) {
  if (typeof value !== "number") return "Not captured";
  return value.toFixed(6);
}

export function TicketTracking() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [ticket, setTicket] = useState<CustomerTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile) as CustomerProfile);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToTicket(id, (item) => {
      setTicket(item);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const timelineSteps = useMemo(() => {
    if (!ticket) return [];
    return buildTimeline(ticket);
  }, [ticket]);

  const updates = useMemo(() => {
    return [...(ticket?.updates ?? [])].reverse();
  }, [ticket]);

  const handleSendComment = async () => {
    if (!ticket || !comment.trim()) return;

    try {
      await addTicketCustomerComment({
        ticketId: ticket.id,
        by: profile?.fullName || "Customer",
        text: comment.trim(),
      });

      setComment("");
      setMessage("Reply added.");
    } catch (error) {
      console.error("Failed to add comment:", error);
      setMessage("Failed to add reply. Please try again.");
    }
  };

  if (loading) {
    return (
      <Layout showBack backTo="/dashboard" title="Ticket">
        <div className="px-4 py-10 text-center text-[var(--color-muted)] text-sm">
          Loading ticket...
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout showBack backTo="/dashboard" title="Ticket Not Found">
        <div className="px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-danger-soft)] border border-[var(--color-danger-border)] flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={24} className="text-[var(--color-danger-text)]" />
          </div>

          <h2 className="text-[var(--color-text)] text-lg font-bold">Ticket not found</h2>

          <p className="text-[var(--color-muted)] text-sm mt-1">
            This ticket may have been removed, or the notification may be
            pointing to an old demo ticket.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-5 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const isTechnicianTicket =
    ticket.workType === "technician" ||
    ticket.workType === "site_survey" ||
    Boolean(ticket.assignedTechnicianName);
  const isSiteSurveyTicket =
    ticket.workType === "site_survey" || ticket.category === "move_eligibility";

  const isPasswordReset = ticket.category === "password_reset";

  return (
    <Layout
      showBack
      backTo="/dashboard"
      title={`Ticket ${ticket.id.slice(0, 8)}`}
    >
      <div className="px-4 py-5 space-y-4">
        {/* Ticket header */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-1">
            <p
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              className="text-[var(--color-subtle-text)] text-xs"
            >
              #{ticket.id}
            </p>

            <StatusBadge
              status={statusForBadge(ticket.status)}
              pulse={
                ticket.status === "open" ||
                ticket.status === "assigned" ||
                ticket.status === "in_progress" ||
                ticket.status === "monitoring"
              }
            />
          </div>

          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[var(--color-text)] text-xl"
          >
            {ticket.title || formatCategory(ticket.category)}
          </h1>

          <p className="text-[var(--color-muted)] text-sm mt-2 leading-relaxed whitespace-pre-line">
            {ticket.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <div className="flex items-center gap-1 text-[var(--color-muted)]">
              <Clock size={11} />
              <span>Created {formatDate(ticket.createdAt)}</span>
            </div>

            <div className="flex items-center gap-1 text-[var(--color-muted)]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  ticket.priority === "high"
                    ? "bg-[var(--color-danger-action)]"
                    : ticket.priority === "medium"
                      ? "bg-[var(--color-warning-action)]"
                      : "bg-[var(--color-success-action)]"
                }`}
              />
              <span>Priority: {ticket.priority}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--color-hover)] grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-[var(--color-muted)]">
              <MapPin size={13} />
              <span>
                {ticket.area}, {ticket.district}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[var(--color-muted)]">
              <Wifi size={13} />
              <span>{ticket.routerSerial || "Router not set"}</span>
            </div>

            <div className="flex items-center gap-2 text-[var(--color-muted)]">
              <User size={13} />
              <span>{ticket.customerName}</span>
            </div>

            <div className="flex items-center gap-2 text-[var(--color-muted)]">
              <ShieldCheck size={13} />
              <span>{formatCategory(ticket.category)}</span>
            </div>
          </div>
        </div>

        {/* Attached speed test */}
        {ticket.speedTest && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge size={18} className="text-[var(--color-primary-text)]" />
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Attached Speed Test
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[var(--color-bg)] border border-[var(--color-hover)] rounded-xl p-3">
                <Download size={14} className="text-[var(--color-primary-text)] mb-1" />
                <p className="text-[var(--color-subtle-text)] text-[10px]">Download</p>
                <p className="text-[var(--color-text)] text-sm font-bold">
                  {ticket.speedTest.downloadMbps} Mbps
                </p>
              </div>

              <div className="bg-[var(--color-bg)] border border-[var(--color-hover)] rounded-xl p-3">
                <Upload size={14} className="text-[var(--color-primary-text)] mb-1" />
                <p className="text-[var(--color-subtle-text)] text-[10px]">Upload</p>
                <p className="text-[var(--color-text)] text-sm font-bold">
                  {ticket.speedTest.uploadMbps} Mbps
                </p>
              </div>

              <div className="bg-[var(--color-bg)] border border-[var(--color-hover)] rounded-xl p-3">
                <Timer size={14} className="text-[var(--color-primary-text)] mb-1" />
                <p className="text-[var(--color-subtle-text)] text-[10px]">Latency</p>
                <p className="text-[var(--color-text)] text-sm font-bold">
                  {ticket.speedTest.latencyMs} ms
                </p>
              </div>
            </div>

            <p className="text-[var(--color-muted)] text-xs mt-3">
              Devices connected during test: {ticket.speedTest.connectedDevices}
            </p>
          </div>
        )}

        {ticket.routerLightCheck && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wifi size={18} className="text-[var(--color-primary-text)]" />
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Router Light Check
              </p>
            </div>

            <div className="space-y-1 text-xs text-[var(--color-muted)]">
              <p>Router: {ticket.routerLightCheck.routerName}</p>
              <p>Issue detected: {routerPatternLabel(ticket.routerLightCheck.pattern)}</p>
              <p>
                Selected lights: {ticket.routerLightCheck.selectedLights?.length
                  ? ticket.routerLightCheck.selectedLights.join(", ")
                  : "None selected"}
              </p>
            </div>
          </div>
        )}

        {ticket.eligibilityCheck && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPinned size={18} className="text-[var(--color-primary-text)]" />
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Move Location Check
              </p>
            </div>

            <div className="space-y-2 text-xs text-[var(--color-muted)]">
              <p className="text-[var(--color-text)] text-sm font-bold">
                {ticket.eligibilityCheck.statusLabel}
              </p>
              <p className="leading-relaxed">{ticket.eligibilityCheck.summary}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-hover)]">
                <p>New place: {ticket.eligibilityCheck.newAddress || "Not provided"}</p>
                <p>Landmark: {ticket.eligibilityCheck.landmark || "Not provided"}</p>
                <p>Coordinates: {formatCoordinate(ticket.eligibilityCheck.currentLatitude)}, {formatCoordinate(ticket.eligibilityCheck.currentLongitude)}</p>
                <p>Accuracy: {ticket.eligibilityCheck.accuracyMeters ? `${Math.round(ticket.eligibilityCheck.accuracyMeters)} m` : "Manual review"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Password reset notice */}
        {isPasswordReset && (
          <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-2xl p-4">
            <p className="text-[var(--color-text)] text-sm font-semibold">
              Password reset request received
            </p>

            <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
              Support will verify the account and guide you through the password
              reset process. For security reasons, do not share your new
              password inside the ticket conversation.
            </p>
          </div>
        )}

        {/* Technician card */}
        {isTechnicianTicket && (
          <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(ticket.assignedTechnicianName || "Tech")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="flex-1">
              <p className="text-[var(--color-text)] text-sm font-semibold">
                {ticket.assignedTechnicianName || (isSiteSurveyTicket ? "Site survey pending" : "Technician pending")}
              </p>

              <p className="text-[var(--color-muted)] text-xs">
                {isSiteSurveyTicket ? "Coverage / Move Review" : "Field Technician"} · {ticket.area || "Service Area"}
              </p>

              <p
                className={`text-xs mt-0.5 font-medium ${
                  ticket.eta ? "text-[var(--color-primary-text)]" : "text-[var(--color-muted)]"
                }`}
              >
                {ticket.eta
                  ? `ETA: ${ticket.eta}`
                  : "Our team is working on this — ETA will be updated shortly."}
              </p>
            </div>

            {ticket.assignedTechnicianPhone && (
              <a
                href={`tel:${ticket.assignedTechnicianPhone}`}
                className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center"
              >
                <Phone size={15} className="text-white" />
              </a>
            )}
          </div>
        )}

        {/* Monitoring notice */}
        {ticket.workType === "monitoring" && (
          <div className="bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] rounded-2xl p-4">
            <p className="text-[var(--color-text)] text-sm font-semibold">
              Ticket under monitoring
            </p>

            <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
              Support is monitoring your service before closing this ticket. If
              the issue continues, reply below with what you are experiencing.
            </p>
          </div>
        )}

        {/* Progress timeline */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <p className="text-[var(--color-text)] text-sm font-semibold mb-4">Progress</p>

          <div className="relative">
            <div className="absolute left-3.5 top-3 bottom-3 w-px bg-[var(--color-border)]" />

            <div className="space-y-5">
              {timelineSteps.map(({ label, time, done, active }) => (
                <div key={label} className="flex items-start gap-4 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 flex-shrink-0 ${
                      active
                        ? "bg-[var(--color-surface-soft)] border-[var(--color-primary)]"
                        : done
                          ? "bg-[var(--color-success-soft)] border-[var(--color-success)]"
                          : "bg-[var(--color-bg)] border-[var(--color-border)]"
                    }`}
                  >
                    {active ? (
                      <Loader2
                        size={12}
                        className="text-[var(--color-primary-text)] animate-spin"
                      />
                    ) : done ? (
                      <CheckCircle2 size={12} className="text-[var(--color-success-text)]" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-border)]" />
                    )}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <p
                      className={`text-sm font-medium ${
                        active
                          ? "text-[var(--color-primary-text)]"
                          : done
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-subtle-text)]"
                      }`}
                    >
                      {label}
                    </p>

                    <p className="text-[var(--color-subtle-text)] text-xs mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Updates feed */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <p className="text-[var(--color-text)] text-sm font-semibold mb-4">Updates</p>

          <div className="space-y-3 mb-4">
            {updates.length === 0 ? (
              <p className="text-[var(--color-subtle-text)] text-sm">
                No updates have been added yet.
              </p>
            ) : (
              updates.map((update, index) => (
                <div
                  key={`${update.text}-${index}`}
                  className="bg-[var(--color-bg)] border border-[var(--color-hover)] rounded-xl p-3.5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[var(--color-primary-text)] text-xs font-semibold">
                      {update.by}
                    </span>

                    <span className="text-[var(--color-subtle-text)] text-xs">
                      {formatDate(update.createdAt)}
                    </span>
                  </div>

                  <p className="text-[var(--color-muted)] text-sm whitespace-pre-line">{update.text}</p>
                </div>
              ))
            )}
          </div>

          {message && <p className="text-[var(--color-success-text)] text-xs mb-2">{message}</p>}

          <div className="flex gap-2 pt-3 border-t border-[var(--color-hover)]">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Reply to update..."
              className="flex-1 px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm placeholder:text-[var(--color-border)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
            />

            <button
              type="button"
              onClick={handleSendComment}
              className="w-11 h-11 bg-[var(--color-primary)] rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-[var(--color-primary)] active:scale-95 transition-all"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(
                `Ticket #${ticket.id} - Status: ${ticket.status}`,
              );
              alert("Ticket details copied to clipboard!");
            }}
            className="col-span-2 py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary)] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageSquare size={16} />
            Share Ticket
          </button>

          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={14} />
            Notifications
          </button>

          <button
            type="button"
            onClick={() => navigate("/troubleshoot")}
            className="py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Troubleshoot
          </button>
        </div>
      </div>
    </Layout>
  );
}
