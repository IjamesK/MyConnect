import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { StaffLayout } from "../isp/StaffLayout";
import { StatusBadge } from "../isp/StatusBadge";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileWarning,
  Ticket,
  Wrench,
} from "lucide-react";
import {
  listenToPendingIncidentReports,
  listenToPublicIncidents,
  type IncidentReport,
  type PublicIncident,
} from "../../../lib/incidents";
import { listenToAllTickets } from "../../../lib/tickets";

type DashboardTicket = {
  id: string;
  customerName?: string;
  customerNumber?: string;
  phone?: string;
  area?: string;
  district?: string;
  category?: string;
  title?: string;
  type?: string;
  description?: string;
  status?: string;
  priority?: "low" | "medium" | "high";
  createdAt?: {
    toDate?: () => Date;
  } | null;
};

function formatTicketTitle(ticket: DashboardTicket) {
  return ticket.title || ticket.category || ticket.type || "Customer Issue";
}

function formatCustomer(ticket: DashboardTicket) {
  return ticket.customerName || ticket.customerNumber || "Customer";
}

function formatArea(ticket: DashboardTicket) {
  if (ticket.area && ticket.district) return `${ticket.area}, ${ticket.district}`;
  if (ticket.area) return ticket.area;
  if (ticket.district) return ticket.district;
  return "Area not set";
}

function formatTimeAgo(value?: { toDate?: () => Date } | null) {
  const date = value?.toDate?.();

  if (!date) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function ticketStatusBadge(status?: string) {
  const clean = status?.toLowerCase();

  if (clean === "resolved" || clean === "closed") return "resolved";
  if (clean === "assigned" || clean === "in_progress") return "assigned";
  if (clean === "open" || clean === "submitted") return "critical";

  return "investigating";
}

function incidentStatusText(incident: PublicIncident) {
  if (incident.status === "scheduled") return "Scheduled";
  if (incident.status === "monitoring") return "Monitoring";
  if (incident.status === "resolved") return "Resolved";
  if (incident.status === "active") {
    return incident.severity === "high" ? "Full outage" : "Partial outage";
  }

  return incident.status;
}

function incidentTypeLabel(type: PublicIncident["type"]) {
  if (type === "fiber_cut") return "Fiber Cut";
  if (type === "knocked_pole") return "Knocked Pole";
  if (type === "damaged_cabinet") return "Damaged Cabinet";
  if (type === "area_outage") return "Area Outage";
  if (type === "maintenance") return "Maintenance";
  if (type === "upgrade") return "Upgrade";
  if (type === "outage") return "General Outage";
  return "Other";
}

function formatIncidentAreas(incident: PublicIncident) {
  const areas = incident.affectedAreas || [];
  const districts = incident.affectedDistricts || [];

  if (areas.length > 0 && districts.length > 0) {
    return `${areas.join(", ")} · ${districts.join(", ")}`;
  }

  if (areas.length > 0) return areas.join(", ");
  if (districts.length > 0) return districts.join(", ");

  return "No affected area set";
}

export function StaffDashboard() {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [pendingReports, setPendingReports] = useState<IncidentReport[]>([]);
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeIncidents = listenToPublicIncidents((items) => {
      setIncidents(items);
      setLoading(false);
    });

    const unsubscribeReports = listenToPendingIncidentReports(setPendingReports);

    const unsubscribeTickets = listenToAllTickets((items) => {
      setTickets(items as DashboardTicket[]);
    });

    return () => {
      unsubscribeIncidents();
      unsubscribeReports();
      unsubscribeTickets();
    };
  }, []);

  const activeIncidents = useMemo(() => {
    return incidents.filter(
      (incident) =>
        incident.status === "active" ||
        incident.status === "monitoring" ||
        incident.status === "scheduled"
    );
  }, [incidents]);

  const plannedWork = useMemo(() => {
    return incidents.filter(
      (incident) =>
        incident.status === "scheduled" &&
        (incident.type === "maintenance" || incident.type === "upgrade")
    );
  }, [incidents]);

  const resolvedIncidents = useMemo(() => {
    return incidents.filter((incident) => incident.status === "resolved");
  }, [incidents]);

  const openTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const status = ticket.status?.toLowerCase();

      return (
        status !== "resolved" &&
        status !== "closed" &&
        status !== "cancelled"
      );
    });
  }, [tickets]);

  const highPriorityTickets = useMemo(() => {
    return openTickets.filter((ticket) => ticket.priority === "high");
  }, [openTickets]);

  const recentTickets = useMemo(() => {
    return [...tickets].slice(0, 5);
  }, [tickets]);

  const recentIncidents = useMemo(() => {
    return [...activeIncidents].slice(0, 5);
  }, [activeIncidents]);

  const kpis = [
    {
      label: "Open Tickets",
      value: openTickets.length,
      sub:
        highPriorityTickets.length > 0
          ? `${highPriorityTickets.length} high priority`
          : "No high priority tickets",
      icon: Ticket,
      color: "bg-[#EBF2FF] text-[#0057B8]",
    },
    {
      label: "Active Updates",
      value: activeIncidents.length,
      sub: "Outages, monitoring, or scheduled work",
      icon: AlertTriangle,
      color: "bg-[#FEF2F2] text-[#DC2626]",
    },
    {
      label: "Pending Reports",
      value: pendingReports.length,
      sub: "Customer incident reports awaiting review",
      icon: FileWarning,
      color: "bg-[#FFFBEB] text-[#B45309]",
    },
    {
      label: "Planned Work",
      value: plannedWork.length,
      sub: "Maintenance or upgrades",
      icon: Wrench,
      color: "bg-[#F0FDF4] text-[#15803D]",
    },
  ];

  return (
    <StaffLayout
      title="Operations Overview"
      subtitle="Live staff dashboard powered by tickets, incidents, and customer reports"
    >
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[#64748B] text-xs font-medium uppercase tracking-wide">
                    {label}
                  </p>

                  <p
                    style={{
                      fontFamily: "'Inter Tight', system-ui, sans-serif",
                      fontWeight: 800,
                    }}
                    className="text-[#0F172A] text-3xl mt-2"
                  >
                    {value}
                  </p>
                </div>

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <p className="text-[#94A3B8] text-xs mt-2">{sub}</p>
            </div>
          ))}
        </div>

        {/* Main action cards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => navigate("/staff/outages")}
            className="bg-white border border-[#E2E8F0] hover:border-[#0057B8] rounded-2xl p-5 text-left transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-[#EBF2FF] text-[#0057B8] flex items-center justify-center mb-4">
              <AlertTriangle size={22} />
            </div>

            <p className="text-[#0F172A] text-sm font-bold">
              Outage Management
            </p>

            <p className="text-[#64748B] text-xs mt-1 leading-relaxed">
              Create outages, planned maintenance, approve reports, and update
              customer-facing network status.
            </p>

            <div className="flex items-center gap-1 text-[#0057B8] text-xs font-semibold mt-4">
              Open module <ArrowRight size={13} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/staff/analytics")}
            className="bg-white border border-[#E2E8F0] hover:border-[#0057B8] rounded-2xl p-5 text-left transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center mb-4">
              <CheckCircle size={22} />
            </div>

            <p className="text-[#0F172A] text-sm font-bold">
              Analytics Dashboard
            </p>

            <p className="text-[#64748B] text-xs mt-1 leading-relaxed">
              Review network trends, ticket volume, outage frequency, and
              operational performance.
            </p>

            <div className="flex items-center gap-1 text-[#0057B8] text-xs font-semibold mt-4">
              View analytics <ArrowRight size={13} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/staff/outages")}
            className="bg-white border border-[#E2E8F0] hover:border-[#0057B8] rounded-2xl p-5 text-left transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] text-[#B45309] flex items-center justify-center mb-4">
              <FileWarning size={22} />
            </div>

            <p className="text-[#0F172A] text-sm font-bold">
              Pending Incident Reports
            </p>

            <p className="text-[#64748B] text-xs mt-1 leading-relaxed">
              Review customer-reported knocked poles, cable cuts, damaged
              cabinets, and area issues.
            </p>

            <div className="flex items-center gap-1 text-[#0057B8] text-xs font-semibold mt-4">
              Review reports <ArrowRight size={13} />
            </div>
          </button>
        </div>

        {/* Active incidents */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
            <div>
              <p className="text-[#0F172A] text-sm font-semibold">
                Active Network Updates
              </p>

              <p className="text-[#94A3B8] text-xs mt-0.5">
                These are visible to affected customers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/staff/outages")}
              className="flex items-center gap-1 text-[#0057B8] text-xs font-medium"
            >
              Manage <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-center text-[#64748B] text-sm">
              Loading network updates...
            </div>
          ) : recentIncidents.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle size={26} className="text-[#16A34A] mx-auto mb-2" />
              <p className="text-[#64748B] text-sm">
                No active outage or scheduled maintenance at the moment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="px-5 py-3.5 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        className="text-[#94A3B8] text-xs"
                      >
                        {incident.id.slice(0, 8)}
                      </p>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          incident.status === "scheduled"
                            ? "bg-[#EBF2FF] text-[#0057B8]"
                            : incident.status === "monitoring"
                              ? "bg-[#FFFBEB] text-[#B45309]"
                              : incident.severity === "high"
                                ? "bg-[#FEF2F2] text-[#DC2626]"
                                : "bg-[#FFF7ED] text-[#EA580C]"
                        }`}
                      >
                        {incidentStatusText(incident)}
                      </span>
                    </div>

                    <p className="text-[#0F172A] text-sm font-medium mt-0.5">
                      {incident.title}
                    </p>

                    <p className="text-[#64748B] text-xs mt-0.5">
                      {incidentTypeLabel(incident.type)} ·{" "}
                      {formatIncidentAreas(incident)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[#64748B] text-xs">
                      ETA: {incident.estimatedResolution || "Not set"}
                    </p>

                    <p className="text-[#94A3B8] text-xs">
                      {incident.status.replace("_", " ")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/staff/outages")}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC]"
                  >
                    <ArrowRight size={13} className="text-[#94A3B8]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending reports + recent tickets */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
              <div>
                <p className="text-[#0F172A] text-sm font-semibold">
                  Pending Customer Reports
                </p>

                <p className="text-[#94A3B8] text-xs mt-0.5">
                  Public incident reports awaiting review.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/staff/outages")}
                className="flex items-center gap-1 text-[#0057B8] text-xs font-medium"
              >
                Review <ArrowRight size={12} />
              </button>
            </div>

            {pendingReports.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <CheckCircle size={24} className="text-[#16A34A] mx-auto mb-2" />
                <p className="text-[#64748B] text-sm">
                  No customer incident reports pending.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {pendingReports.slice(0, 4).map((report) => (
                  <div key={report.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[#0F172A] text-sm font-medium">
                          {report.title}
                        </p>

                        <p className="text-[#64748B] text-xs mt-0.5">
                          {report.area}, {report.district}
                        </p>
                      </div>

                      <span className="px-2 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] text-[10px] font-semibold">
                        Pending
                      </span>
                    </div>

                    <p className="text-[#94A3B8] text-xs mt-2 line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
              <div>
                <p className="text-[#0F172A] text-sm font-semibold">
                  Recent Tickets
                </p>

                <p className="text-[#94A3B8] text-xs mt-0.5">
                  Latest private customer support issues.
                </p>
              </div>

              <span className="text-[#64748B] text-xs">
                {openTickets.length} open
              </span>
            </div>

            {recentTickets.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <Ticket size={24} className="text-[#94A3B8] mx-auto mb-2" />
                <p className="text-[#64748B] text-sm">
                  No customer tickets submitted yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="px-5 py-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-xs font-bold text-[#475569]">
                      {formatCustomer(ticket)[0]?.toUpperCase() || "C"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[#0F172A] text-sm font-medium truncate">
                          {formatCustomer(ticket)}
                        </p>

                        <p
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          className="text-[#94A3B8] text-xs"
                        >
                          {ticket.id.slice(0, 8)}
                        </p>
                      </div>

                      <p className="text-[#64748B] text-xs truncate">
                        {formatTicketTitle(ticket)} · {formatArea(ticket)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={ticketStatusBadge(ticket.status)} />

                      <span className="text-[#94A3B8] text-xs flex items-center gap-1">
                        <Clock size={11} />
                        {formatTimeAgo(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resolved summary */}
        {resolvedIncidents.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <p className="text-[#0F172A] text-sm font-semibold">
              Recently Resolved
            </p>

            <p className="text-[#64748B] text-xs mt-1">
              {resolvedIncidents.length} incident
              {resolvedIncidents.length === 1 ? "" : "s"} currently marked as
              resolved.
            </p>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
