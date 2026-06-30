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
        <div className="px-4 py-10 text-center text-[#64748B] text-sm">
          Loading ticket...
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout showBack backTo="/dashboard" title="Ticket Not Found">
        <div className="px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={24} className="text-[#DC2626]" />
          </div>

          <h2 className="text-[#0F172A] text-lg font-bold">Ticket not found</h2>

          <p className="text-[#64748B] text-sm mt-1">
            This ticket may have been removed, or the notification may be
            pointing to an old demo ticket.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-5 px-4 py-2.5 bg-[#0057B8] text-white rounded-xl text-sm font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const isTechnicianTicket =
    ticket.workType === "technician" || Boolean(ticket.assignedTechnicianName);

  const isPasswordReset = ticket.category === "password_reset";

  return (
    <Layout
      showBack
      backTo="/dashboard"
      title={`Ticket ${ticket.id.slice(0, 8)}`}
    >
      <div className="px-4 py-5 space-y-4">
        {/* Ticket header */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-1">
            <p
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              className="text-[#94A3B8] text-xs"
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
            className="text-[#0F172A] text-xl"
          >
            {ticket.title || formatCategory(ticket.category)}
          </h1>

          <p className="text-[#64748B] text-sm mt-2 leading-relaxed">
            {ticket.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <div className="flex items-center gap-1 text-[#64748B]">
              <Clock size={11} />
              <span>Created {formatDate(ticket.createdAt)}</span>
            </div>

            <div className="flex items-center gap-1 text-[#64748B]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  ticket.priority === "high"
                    ? "bg-[#DC2626]"
                    : ticket.priority === "medium"
                      ? "bg-[#F59E0B]"
                      : "bg-[#16A34A]"
                }`}
              />
              <span>Priority: {ticket.priority}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#F1F5F9] grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#64748B]">
              <MapPin size={13} />
              <span>
                {ticket.area}, {ticket.district}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#64748B]">
              <Wifi size={13} />
              <span>{ticket.routerSerial || "Router not set"}</span>
            </div>

            <div className="flex items-center gap-2 text-[#64748B]">
              <User size={13} />
              <span>{ticket.customerName}</span>
            </div>

            <div className="flex items-center gap-2 text-[#64748B]">
              <ShieldCheck size={13} />
              <span>{formatCategory(ticket.category)}</span>
            </div>
          </div>
        </div>

        {/* Attached speed test */}
        {ticket.speedTest && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge size={18} className="text-[#0057B8]" />
              <p className="text-[#0F172A] text-sm font-semibold">
                Attached Speed Test
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-3">
                <Download size={14} className="text-[#0057B8] mb-1" />
                <p className="text-[#94A3B8] text-[10px]">Download</p>
                <p className="text-[#0F172A] text-sm font-bold">
                  {ticket.speedTest.downloadMbps} Mbps
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-3">
                <Upload size={14} className="text-[#0057B8] mb-1" />
                <p className="text-[#94A3B8] text-[10px]">Upload</p>
                <p className="text-[#0F172A] text-sm font-bold">
                  {ticket.speedTest.uploadMbps} Mbps
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-3">
                <Timer size={14} className="text-[#0057B8] mb-1" />
                <p className="text-[#94A3B8] text-[10px]">Latency</p>
                <p className="text-[#0F172A] text-sm font-bold">
                  {ticket.speedTest.latencyMs} ms
                </p>
              </div>
            </div>

            <p className="text-[#64748B] text-xs mt-3">
              Devices connected during test: {ticket.speedTest.connectedDevices}
            </p>
          </div>
        )}

        {ticket.routerLightCheck && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wifi size={18} className="text-[var(--color-primary)]" />
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Router Light Check
              </p>
            </div>

            <div className="space-y-1 text-xs text-[var(--color-muted)]">
              <p>Router: {ticket.routerLightCheck.routerName}</p>
              <p>Pattern: {ticket.routerLightCheck.pattern}</p>
              <p>
                Selected lights: {ticket.routerLightCheck.selectedLights?.length
                  ? ticket.routerLightCheck.selectedLights.join(", ")
                  : "None selected"}
              </p>
            </div>
          </div>
        )}

        {/* Password reset notice */}
        {isPasswordReset && (
          <div className="bg-[#EBF2FF] border border-[#BFDBFE] rounded-2xl p-4">
            <p className="text-[#0F172A] text-sm font-semibold">
              Password reset request received
            </p>

            <p className="text-[#64748B] text-xs mt-1 leading-relaxed">
              Support will verify the account and guide you through the password
              reset process. For security reasons, do not share your new
              password inside the ticket conversation.
            </p>
          </div>
        )}

        {/* Technician card */}
        {isTechnicianTicket && (
          <div className="bg-[#FCE7F3] border border-[#FBCFE8] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E5007D] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(ticket.assignedTechnicianName || "Tech")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="flex-1">
              <p className="text-[#0F172A] text-sm font-semibold">
                {ticket.assignedTechnicianName || "Technician pending"}
              </p>

              <p className="text-[#64748B] text-xs">
                Field Technician · {ticket.area || "Service Area"}
              </p>

              <p className="text-[#E5007D] text-xs mt-0.5 font-medium">
                ETA: {ticket.eta || "Not yet assigned"}
              </p>
            </div>

            {ticket.assignedTechnicianPhone && (
              <a
                href={`tel:${ticket.assignedTechnicianPhone}`}
                className="w-9 h-9 rounded-full bg-[#E5007D] flex items-center justify-center"
              >
                <Phone size={15} className="text-white" />
              </a>
            )}
          </div>
        )}

        {/* Monitoring notice */}
        {ticket.workType === "monitoring" && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4">
            <p className="text-[#0F172A] text-sm font-semibold">
              Ticket under monitoring
            </p>

            <p className="text-[#64748B] text-xs mt-1 leading-relaxed">
              Support is monitoring your service before closing this ticket. If
              the issue continues, reply below with what you are experiencing.
            </p>
          </div>
        )}

        {/* Progress timeline */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <p className="text-[#0F172A] text-sm font-semibold mb-4">Progress</p>

          <div className="relative">
            <div className="absolute left-3.5 top-3 bottom-3 w-px bg-[#E2E8F0]" />

            <div className="space-y-5">
              {timelineSteps.map(({ label, time, done, active }) => (
                <div key={label} className="flex items-start gap-4 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 flex-shrink-0 ${
                      active
                        ? "bg-[#FCE7F3] border-[#E5007D]"
                        : done
                          ? "bg-[#F0FDF4] border-[#16A34A]"
                          : "bg-[#F8FAFC] border-[#E2E8F0]"
                    }`}
                  >
                    {active ? (
                      <Loader2
                        size={12}
                        className="text-[#E5007D] animate-spin"
                      />
                    ) : done ? (
                      <CheckCircle2 size={12} className="text-[#16A34A]" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
                    )}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <p
                      className={`text-sm font-medium ${
                        active
                          ? "text-[#E5007D]"
                          : done
                            ? "text-[#0F172A]"
                            : "text-[#94A3B8]"
                      }`}
                    >
                      {label}
                    </p>

                    <p className="text-[#94A3B8] text-xs mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Updates feed */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <p className="text-[#0F172A] text-sm font-semibold mb-4">Updates</p>

          <div className="space-y-3 mb-4">
            {updates.length === 0 ? (
              <p className="text-[#94A3B8] text-sm">
                No updates have been added yet.
              </p>
            ) : (
              updates.map((update, index) => (
                <div
                  key={`${update.text}-${index}`}
                  className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-3.5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#E5007D] text-xs font-semibold">
                      {update.by}
                    </span>

                    <span className="text-[#94A3B8] text-xs">
                      {formatDate(update.createdAt)}
                    </span>
                  </div>

                  <p className="text-[#475569] text-sm">{update.text}</p>
                </div>
              ))
            )}
          </div>

          {message && <p className="text-[#16A34A] text-xs mb-2">{message}</p>}

          <div className="flex gap-2 pt-3 border-t border-[#F1F5F9]">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Reply to update..."
              className="flex-1 px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm placeholder:text-[#CBD5E1] outline-none focus:border-[#E5007D] focus:ring-2 focus:ring-[#E5007D]/20 transition"
            />

            <button
              type="button"
              onClick={handleSendComment}
              className="w-11 h-11 bg-[#E5007D] rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-[#BE0067] active:scale-95 transition-all"
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
            className="col-span-2 py-3 bg-[#E5007D] text-white rounded-xl text-sm font-semibold hover:bg-[#BE0067] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageSquare size={16} />
            Share Ticket
          </button>

          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={14} />
            Notifications
          </button>

          <button
            type="button"
            onClick={() => navigate("/troubleshoot")}
            className="py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Troubleshoot
          </button>
        </div>
      </div>
    </Layout>
  );
}
