import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Activity,
  AlertCircle,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";
import {
  listenToRelevantIncidents,
  type PublicIncident,
} from "../../../lib/incidents";
import {
  listenToCustomerTickets,
  type CustomerTicket,
  type TicketStatus,
} from "../../../lib/tickets";
import { Layout } from "../isp/Layout";
import { StatusDot } from "../isp/StatusBadge";

function getDaysLeft(expiryDate?: string) {
  if (!expiryDate) return 0;

  const today = new Date();
  const expiry = new Date(expiryDate);
  const difference = expiry.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount?: number) {
  return `UGX ${(amount ?? 0).toLocaleString()}`;
}

function getIncidentDotStatus(incident: PublicIncident) {
  if (incident.status === "scheduled") return "partial";
  if (incident.severity === "high") return "down";
  return "partial";
}

function getIncidentLabel(incident: PublicIncident) {
  if (incident.type === "maintenance") return "Planned Maintenance";
  if (incident.type === "upgrade") return "Scheduled Upgrade";
  if (incident.type === "fiber_cut") return "Fiber Cut";
  if (incident.type === "knocked_pole") return "Knocked Pole";
  if (incident.type === "damaged_cabinet") return "Damaged Cabinet";
  if (incident.type === "area_outage") return "Area Outage";
  if (incident.severity === "high") return "Full Outage";
  return "Network Update";
}

function ticketProgress(status: TicketStatus) {
  if (status === "open") return { value: 20, label: "Submitted" };
  if (status === "assigned") return { value: 40, label: "Assigned" };
  if (status === "in_progress") return { value: 65, label: "In Progress" };
  if (status === "monitoring") return { value: 80, label: "Monitoring" };
  if (status === "resolved") return { value: 100, label: "Resolved" };
  if (status === "closed") return { value: 100, label: "Closed" };
  return { value: 10, label: "Received" };
}

const internetTips = [
  {
    title: "Use 5GHz when close to the router",
    body: "5GHz is usually faster when you are in the same room. Use 2.4GHz when you are farther away or behind walls.",
  },
  {
    title: "Keep the router in an open place",
    body: "Avoid putting the router inside cupboards, behind TVs, or near thick walls. Open space improves Wi-Fi coverage.",
  },
  {
    title: "Check connected devices during slow speeds",
    body: "Many phones, TVs, downloads, and gaming devices can reduce speed. Pause heavy downloads before testing.",
  },
  {
    title: "Avoid suspicious links and fake support calls",
    body: "Do not share OTPs, passwords, or payment details with unknown callers or links claiming to be support.",
  },
  {
    title: "Protect your Wi-Fi password",
    body: "Use a strong password and change it if too many unknown devices are connected to your network.",
  },
];

function pickTip() {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return internetTips[dayIndex % internetTips.length];
}

export function CustomerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (!savedProfile) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const parsedProfile = JSON.parse(savedProfile) as CustomerProfile;
      setProfile(parsedProfile);

      const unsubscribeIncidents = listenToRelevantIncidents(
        parsedProfile,
        setIncidents,
      );

      const unsubscribeTickets = listenToCustomerTickets(
        parsedProfile.uid,
        setTickets,
      );

      return () => {
        unsubscribeIncidents();
        unsubscribeTickets();
      };
    } catch (error) {
      console.error("Failed to load customer profile:", error);
      localStorage.removeItem("customerProfile");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const activeIncidents = useMemo(() => {
    return incidents.filter(
      (incident) =>
        incident.status === "active" ||
        incident.status === "monitoring" ||
        incident.status === "scheduled",
    );
  }, [incidents]);

  const activeTicket = useMemo(() => {
    return tickets.find(
      (ticket) => ticket.status !== "resolved" && ticket.status !== "closed",
    );
  }, [tickets]);

  if (!profile) {
    return (
      <Layout>
        <div className="px-4 py-10 text-center text-[var(--color-muted)] text-sm">
          Loading your account...
        </div>
      </Layout>
    );
  }

  const daysLeft = getDaysLeft(profile.expiryDate);
  const primaryIncident = activeIncidents[0];
  const currentTip = pickTip();
  const progress = activeTicket ? ticketProgress(activeTicket.status) : null;

  const quickActions = [
    {
      icon: RefreshCw,
      label: "Renew",
      sublabel: daysLeft > 0 ? `${daysLeft} Days left` : "Expired",
      color: "bg-[var(--color-surface-soft)] text-[var(--color-primary)]",
      path: "/renewal",
    },
    {
      icon: AlertCircle,
      label: "Report",
      sublabel: "Report a problem",
      color: "bg-[var(--color-surface-soft)] text-[var(--color-primary)]",
      path: "/report-issue",
    },
    {
      icon: Activity,
      label: "Network Status",
      sublabel:
        activeIncidents.length > 0
          ? `${activeIncidents.length} network update${
              activeIncidents.length === 1 ? "" : "s"
            }`
          : "View area status",
      color: "bg-[var(--color-surface-soft)] text-[var(--color-primary)]",
      path: "/service-status",
    },
    {
      icon: Wrench,
      label: "Self Help",
      sublabel: "Simple guides",
      color: "bg-[var(--color-surface-soft)] text-[var(--color-primary)]",
      path: "/self-help",
    },
  ];

  const recentActivity = [
    {
      title: "Package Active",
      desc: `${profile.packageName} — ${formatCurrency(profile.packagePrice)}`,
      time: "Current",
      color: "var(--color-success)",
    },
    {
      title: "Router Linked",
      desc: `${profile.routerModel} — ${profile.routerSerial}`,
      time: "Now",
      color: "var(--color-primary)",
    },
    {
      title: "Service Location",
      desc: `${profile.area}, ${profile.district}`,
      time: "Verified",
      color: "var(--color-warning)",
    },
    {
      title: daysLeft > 0 ? "Subscription Valid" : "Subscription Expired",
      desc:
        daysLeft > 0
          ? `${daysLeft} days remaining — expires ${profile.expiryDate}`
          : `Expired on ${profile.expiryDate}`,
      time: daysLeft > 0 ? "Active" : "Expired",
      color: daysLeft > 0 ? "var(--color-success)" : "var(--color-danger)",
    },
  ];

  return (
    <Layout>
      <div className="px-4 py-5 space-y-4">
        {/* Greeting */}
        <div>
          <p className="text-[var(--color-muted)] text-sm">{greeting},</p>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[var(--color-text)] text-2xl mt-0.5"
          >
            {profile.fullName} 👋
          </h1>
          <p className="text-[var(--color-muted)] text-xs font-medium mt-0.5">
            {profile.customerNumber} • {profile.area}
          </p>
        </div>

        {/* Internet status hero card */}
        <div className="bg-[#E5007D] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 right-8 w-20 h-20 rounded-full bg-white/10 translate-y-8" />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-xs uppercase tracking-wide font-medium">
                  Internet Status
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4ADE80]" />
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter Tight', system-ui, sans-serif",
                      fontWeight: 700,
                    }}
                    className="text-xl text-white"
                  >
                    ONLINE
                  </span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <p className="text-white/80 text-xs mb-1">Router SN</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.routerSerial ?? "");
                    alert("Copied Router SN");
                  }}
                  className="bg-white/20 hover:bg-white/30 transition-colors text-white text-xs px-2 py-1 rounded flex items-center gap-1 active:scale-95"
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {profile.routerSerial}
                  </span>
                </button>
              </div>
            </div>

            <div className="border-t border-white/20 pt-3 flex items-center justify-between">
              <div>
                <p className="text-white/80 text-[10px] uppercase tracking-wide">
                  Package
                </p>
                <p className="text-white text-sm font-semibold">
                  {profile.packageName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-[10px] uppercase tracking-wide">
                  Expires In
                </p>
                <p className="text-[#FCD34D] text-sm font-semibold">
                  {daysLeft > 0 ? `${daysLeft} Days` : "Expired"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Renewal warning */}
        {daysLeft <= 7 && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-[#92400E] text-xs font-semibold">
                Subscription expires soon
              </p>
              <p className="text-[#B45309] text-xs mt-0.5">
                Renew before {profile.expiryDate} to avoid disconnection
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/renewal")}
              className="bg-[#E5007D] hover:bg-[#BE0067] text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors active:scale-95"
            >
              Renew →
            </button>
          </div>
        )}

        {/* Network updates visible on home */}
        {activeIncidents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Network Updates for Your Area
              </p>
              <button
                type="button"
                onClick={() => navigate("/service-status")}
                className="text-[var(--color-primary)] text-xs font-semibold"
              >
                View all
              </button>
            </div>

            {activeIncidents.slice(0, 2).map((incident) => (
              <button
                key={incident.id}
                type="button"
                onClick={() => navigate(`/outage/${incident.id}`)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex items-center gap-3 text-left"
              >
                <StatusDot
                  status={getIncidentDotStatus(incident)}
                  pulse={incident.status !== "scheduled"}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-[var(--color-text)] text-sm font-semibold truncate">
                    {getIncidentLabel(incident)}: {incident.title}
                  </p>
                  <p className="text-[var(--color-muted)] text-xs mt-0.5 truncate">
                    {incident.description}
                  </p>
                  <p className="text-[var(--color-muted)] text-xs mt-1">
                    {incident.status.replace("_", " ")}
                    {incident.estimatedResolution
                      ? ` · ETA: ${incident.estimatedResolution}`
                      : ""}
                  </p>
                </div>

                <ChevronRight size={16} className="text-[#CBD5E1]" />
              </button>
            ))}
          </div>
        )}

        {/* Ticket progress on home */}
        {activeTicket && progress && (
          <button
            type="button"
            onClick={() => navigate(`/ticket/${activeTicket.id}`)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 text-left"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <TicketCheck size={18} className="text-[var(--color-primary)]" />
                <p className="text-[var(--color-text)] text-sm font-semibold">
                  Ticket Progress
                </p>
              </div>
              <span className="text-[var(--color-primary)] text-xs font-semibold">
                {progress.label}
              </span>
            </div>

            <p className="text-[var(--color-muted)] text-xs mb-3">
              {activeTicket.title || activeTicket.category} · #
              {activeTicket.id.slice(0, 8)}
            </p>

            <div className="w-full h-2.5 rounded-full bg-[var(--color-surface-soft)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${progress.value}%` }}
              />
            </div>
          </button>
        )}

        {/* Internet tips banner */}
        <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-2xl p-4 flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0">
            <Lightbulb size={19} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-[var(--color-text)] text-sm font-bold">Internet Tip</p>
            <p className="text-[var(--color-primary)] text-xs font-semibold mt-0.5">
              {currentTip.title}
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
              {currentTip.body}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-[var(--color-text)] text-sm font-semibold mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(
              ({ icon: Icon, label, sublabel, color, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2.5 text-left hover:shadow-md transition-shadow active:scale-95"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-[var(--color-text)] text-sm font-semibold">
                      {label}
                    </p>
                    <p className="text-[var(--color-muted)] text-xs mt-0.5">{sublabel}</p>
                  </div>
                </button>
              ),
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text)] text-sm font-semibold">
              Recent Activity
            </p>
            <TrendingUp size={14} className="text-[var(--color-muted)]" />
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
            {recentActivity.map(({ title, desc, time, color }) => (
              <div key={title} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--color-text)] text-sm font-medium">{title}</p>
                  <p className="text-[var(--color-muted)] text-xs truncate">{desc}</p>
                </div>
                <span className="text-[var(--color-muted)] text-xs whitespace-nowrap">
                  {time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
