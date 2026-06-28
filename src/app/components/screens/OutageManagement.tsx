import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { StaffLayout } from "../isp/StaffLayout";
import {
  approveIncidentReport,
  createActiveIncident,
  createPlannedIncident,
  listenToPendingIncidentReports,
  markIncidentReportSeen,
  listenToPublicIncidents,
  rejectIncidentReport,
  updateIncidentStatus,
  type IncidentReport,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentType,
  type PublicIncident,
} from "../../../lib/incidents";

type StaffProfile = {
  uid?: string;
  email?: string;
  fullName?: string;
  role?: "customer" | "staff" | "admin";
};

type FormMode = "active" | "planned";

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatAreas(incident: PublicIncident) {
  const areas = incident.affectedAreas || [];
  const districts = incident.affectedDistricts || [];

  if (areas.length > 0 && districts.length > 0) {
    return `${areas.join(", ")} · ${districts.join(", ")}`;
  }

  if (areas.length > 0) return areas.join(", ");
  if (districts.length > 0) return districts.join(", ");

  return "No affected area set";
}

function statusBadgeClass(status: IncidentStatus) {
  if (status === "active") {
    return "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
  }

  if (status === "scheduled") {
    return "bg-[#EBF2FF] text-[#0057B8] border-[#BFDBFE]";
  }

  if (status === "monitoring") {
    return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  }

  if (status === "resolved") {
    return "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]";
  }

  return "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]";
}

function severityBadgeClass(severity: IncidentSeverity) {
  if (severity === "high") return "bg-[#FEF2F2] text-[#DC2626]";
  if (severity === "medium") return "bg-[#FFF7ED] text-[#EA580C]";
  return "bg-[#F0FDF4] text-[#15803D]";
}

function incidentTypeLabel(type: IncidentType) {
  if (type === "fiber_cut") return "Fiber Cut";
  if (type === "knocked_pole") return "Knocked Pole";
  if (type === "damaged_cabinet") return "Damaged Cabinet";
  if (type === "area_outage") return "Area Outage";
  if (type === "maintenance") return "Maintenance";
  if (type === "upgrade") return "Upgrade";
  if (type === "outage") return "General Outage";
  return "Other";
}

export function OutageManagement() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);

  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [pendingReports, setPendingReports] = useState<IncidentReport[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<FormMode>("active");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState<IncidentType>("fiber_cut");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [plannedStatus, setPlannedStatus] = useState<"scheduled" | "active">(
    "scheduled"
  );
  const [areas, setAreas] = useState("");
  const [districts, setDistricts] = useState("");
  const [eta, setEta] = useState("");
  const [notifyCustomers, setNotifyCustomers] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (!savedProfile) return;

    try {
      setProfile(JSON.parse(savedProfile) as StaffProfile);
    } catch (error) {
      console.error("Failed to load staff profile:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribeIncidents = listenToPublicIncidents(setIncidents);
    const unsubscribeReports = listenToPendingIncidentReports(setPendingReports);

    return () => {
      unsubscribeIncidents();
      unsubscribeReports();
    };
  }, []);

  const createdBy = profile?.uid || profile?.email || "staff";

  const activeIncidents = useMemo(() => {
    return incidents.filter(
      (incident) =>
        incident.status === "active" ||
        incident.status === "monitoring" ||
        incident.status === "scheduled"
    );
  }, [incidents]);

  const resolvedIncidents = useMemo(() => {
    return incidents.filter((incident) => incident.status === "resolved");
  }, [incidents]);

  const handleCreateIncident = async () => {
    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter the incident title.");
      return;
    }

    if (!description.trim()) {
      setMessage("Please describe the incident or planned work.");
      return;
    }

    const affectedAreas = splitCsv(areas);
    const affectedDistricts = splitCsv(districts);

    if (affectedAreas.length === 0) {
      setMessage("Please enter at least one affected area.");
      return;
    }

    if (affectedDistricts.length === 0) {
      setMessage("Please enter at least one affected district.");
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "planned") {
        await createPlannedIncident({
          title: title.trim(),
          description: description.trim(),
          type: incidentType as "maintenance" | "upgrade",
          severity,
          status: plannedStatus,
          affectedAreas,
          affectedDistricts,
          estimatedResolution: eta.trim(),
          createdBy,
        });

        setMessage(
          notifyCustomers
            ? "Planned network update created. Affected customers will be notified."
            : "Planned network update created."
        );
      } else {
        await createActiveIncident({
          title: title.trim(),
          description: description.trim(),
          type: incidentType as Exclude<IncidentType, "maintenance" | "upgrade">,
          severity,
          affectedAreas,
          affectedDistricts,
          estimatedResolution: eta.trim(),
          createdBy,
        });

        setMessage(
          notifyCustomers
            ? "Active incident created. Affected customers will be notified."
            : "Active incident created."
        );
      }

      setTitle("");
      setDescription("");
      setAreas("");
      setDistricts("");
      setEta("");
      setSeverity("medium");
      setIncidentType(mode === "planned" ? "maintenance" : "fiber_cut");
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create incident:", error);
      setMessage("Failed to create network update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReport = async (report: IncidentReport) => {
    try {
      await approveIncidentReport({
        reportId: report.id,
        reviewedBy: createdBy,
        title: report.title,
        description: report.description,
        type: report.type,
        severity: "medium",
        affectedAreas: [report.area],
        affectedDistricts: [report.district],
      });

      setMessage("Customer incident report approved and published.");
    } catch (error) {
      console.error("Failed to approve incident report:", error);
      setMessage("Failed to approve report.");
    }
  };

const handleMarkReportSeen = async (report: IncidentReport) => {
  if (report.seenAt) return;

  try {
    await markIncidentReportSeen({
      reportId: report.id,
      seenBy: createdBy,
      seenByName: profile?.fullName || profile?.email || "Staff",
    });

    setMessage("Report marked as seen.");
  } catch (error) {
    console.error("Failed to mark report as seen:", error);
    setMessage("Failed to mark report as seen.");
  }
};
  
  const handleRejectReport = async (report: IncidentReport) => {
    const reason = window.prompt("Reason for rejecting this report?");

    try {
      await rejectIncidentReport({
        reportId: report.id,
        reviewedBy: createdBy,
        reason: reason ?? "",
      });

      setMessage("Customer incident report rejected.");
    } catch (error) {
      console.error("Failed to reject incident report:", error);
      setMessage("Failed to reject report.");
    }
  };

  const handleStatusChange = async (
    incident: PublicIncident,
    status: IncidentStatus
  ) => {
    const note = window.prompt(
      `Optional customer note for changing status to ${status}:`
    );

    try {
      await updateIncidentStatus({
        incidentId: incident.id,
        status,
        updatedBy: createdBy,
        note: note ?? "",
        estimatedResolution: incident.estimatedResolution ?? "",
      });

      setMessage(`Incident marked as ${status}.`);
    } catch (error) {
      console.error("Failed to update incident status:", error);
      setMessage("Failed to update incident status.");
    }
  };

  return (
    <StaffLayout
      title="Outage Management"
      subtitle="Create, approve, monitor, and resolve customer-facing network incidents"
    >
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Active / Scheduled</p>
            <p className="text-[#0F172A] text-2xl font-bold mt-1">
              {activeIncidents.length}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Pending Reports</p>
            <p className="text-[#0F172A] text-2xl font-bold mt-1">
              {pendingReports.length}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Resolved</p>
            <p className="text-[#0F172A] text-2xl font-bold mt-1">
              {resolvedIncidents.length}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Live Source</p>
            <p className="text-[#16A34A] text-sm font-bold mt-2">
              Firestore
            </p>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontWeight: 800,
              }}
              className="text-[#0F172A] text-lg"
            >
              Network Operations
            </h2>
            <p className="text-[#64748B] text-sm">
              These updates are reflected on the customer dashboard and Network Status page.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={15} />
            Create Network Update
          </button>
        </div>

        {message && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#475569]">
            {message}
          </div>
        )}

        {/* Create incident form */}
        {showForm && (
          <div className="bg-white border-2 border-[#0057B8] rounded-2xl p-6 space-y-4">
            <div>
              <h2
                style={{
                  fontFamily: "'Inter Tight', system-ui, sans-serif",
                  fontWeight: 700,
                }}
                className="text-[#0F172A] text-lg"
              >
                Create Network Update
              </h2>
              <p className="text-[#64748B] text-sm mt-1">
                Choose whether this is an active outage or planned maintenance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("active");
                  setIncidentType("fiber_cut");
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  mode === "active"
                    ? "border-[#DC2626] bg-[#FEF2F2]"
                    : "border-[#E2E8F0] bg-white"
                }`}
              >
                <AlertTriangle
                  size={20}
                  className={
                    mode === "active" ? "text-[#DC2626]" : "text-[#94A3B8]"
                  }
                />
                <p className="text-[#0F172A] text-sm font-bold mt-2">
                  Active Incident
                </p>
                <p className="text-[#64748B] text-xs mt-0.5">
                  Fiber cut, knocked pole, damaged cabinet, area outage
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("planned");
                  setIncidentType("maintenance");
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  mode === "planned"
                    ? "border-[#0057B8] bg-[#EBF2FF]"
                    : "border-[#E2E8F0] bg-white"
                }`}
              >
                <Wrench
                  size={20}
                  className={
                    mode === "planned" ? "text-[#0057B8]" : "text-[#94A3B8]"
                  }
                />
                <p className="text-[#0F172A] text-sm font-bold mt-2">
                  Planned Work
                </p>
                <p className="text-[#64748B] text-xs mt-0.5">
                  Maintenance, upgrades, scheduled operations
                </p>
              </button>
            </div>

            <div>
              <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  mode === "active"
                    ? "e.g. Fiber cut affecting Ntinda"
                    : "e.g. Scheduled maintenance in Seeta"
                }
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
              />
            </div>

            <div>
              <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what is happening, affected service, and what customers should expect."
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                  Type
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                >
                  {mode === "active" ? (
                    <>
                      <option value="fiber_cut">Fiber Cut</option>
                      <option value="knocked_pole">Knocked Pole</option>
                      <option value="damaged_cabinet">Damaged Cabinet</option>
                      <option value="area_outage">Area Outage</option>
                      <option value="outage">General Outage</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="maintenance">Maintenance</option>
                      <option value="upgrade">Upgrade</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as IncidentSeverity)
                  }
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium / Partial Outage</option>
                  <option value="high">High / Full Outage</option>
                </select>
              </div>

              {mode === "planned" ? (
                <div>
                  <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                    Status
                  </label>
                  <select
                    value={plannedStatus}
                    onChange={(e) =>
                      setPlannedStatus(e.target.value as "scheduled" | "active")
                    }
                    className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Currently Ongoing</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                    ETA
                  </label>
                  <input
                    type="text"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    placeholder="e.g. 2 hours"
                    className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                  />
                </div>
              )}
            </div>

            {mode === "planned" && (
              <div>
                <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                  Schedule / ETA
                </label>
                <input
                  type="text"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  placeholder="e.g. Tonight 11 PM - 2 AM"
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                  Affected Areas
                </label>
                <input
                  type="text"
                  value={areas}
                  onChange={(e) => setAreas(e.target.value)}
                  placeholder="e.g. Ntinda, Bukoto"
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                />
              </div>

              <div>
                <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">
                  Districts
                </label>
                <input
                  type="text"
                  value={districts}
                  onChange={(e) => setDistricts(e.target.value)}
                  placeholder="e.g. Kampala, Wakiso"
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[#64748B]" />
                <div>
                  <p className="text-[#0F172A] text-sm font-medium">
                    Notify affected customers
                  </p>
                  <p className="text-[#94A3B8] text-xs">
                    Notifications are created for customers in selected areas.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotifyCustomers((prev) => !prev)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifyCustomers ? "bg-[#0057B8]" : "bg-[#CBD5E1]"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    notifyCustomers ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateIncident}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-[#DC2626]/60 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {submitting ? "Publishing..." : "Publish Network Update"}
              </button>
            </div>
          </div>
        )}

        {/* Pending customer incident reports */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
            <div>
              <p className="text-[#0F172A] text-sm font-semibold">
                Customer Incident Reports — Pending Review
              </p>
              <p className="text-[#94A3B8] text-xs mt-0.5">
                Reports submitted from the customer app, awaiting approval.
              </p>
            </div>

            <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
              {pendingReports.length}
            </span>
          </div>

          {pendingReports.length === 0 ? (
            <div className="p-6 text-center">
              <ShieldCheck size={28} className="text-[#16A34A] mx-auto mb-2" />
              <p className="text-[#64748B] text-sm">
                No customer incident reports pending review.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {pendingReports.map((report) => (
                <div key={report.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[#0F172A] text-sm font-semibold">
                          {report.title}
                        </p>

                        <span className="px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] text-[10px] font-semibold">
                          Pending
                        </span>
                      </div>

                      <p className="text-[#94A3B8] text-xs mt-0.5">
                        {incidentTypeLabel(report.type)} · Reported by{" "}
                        {report.reporterName}
                      </p>
                    </div>

                    <p
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="text-[#CBD5E1] text-xs"
                    >
                      {report.id.slice(0, 8)}
                    </p>
                  </div>

                  <p className="text-[#64748B] text-xs mt-3 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-2 text-[#94A3B8] text-xs mt-3">
                    <MapPin size={12} />
                    <span>
                      {report.area}, {report.district}
                    </span>
                  </div>

                  {report.locationNote && (
                    <p className="text-[#94A3B8] text-xs mt-1">
                      Landmark: {report.locationNote}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleApproveReport(report)}
                      className="py-2.5 bg-[#F0FDF4] text-[#15803D] rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} />
                      Approve & Publish
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleRejectReport(report)}
                      className="py-2.5 bg-[#FEF2F2] text-[#DC2626] rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                    {!report.seenAt && (
                    <button
                  type="button"
                  onClick={() => handleMarkReportSeen(report)}
                  className="px-3 py-2 bg-[#EBF2FF] text-[#0057B8] rounded-xl text-xs font-semibold"
                    >
                      Mark Seen
                    </button>
                  )}

                                   {report.seenAt ? (
                  <span className="text-[#16A34A] text-xs">
                    Seen by {report.seenByName || report.seenBy || "staff"}
                  </span>
                ) : (
                  <span className="text-[#DC2626] text-xs">
                    Not yet seen
                  </span>
                )} 
                                  
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incidents table */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <p className="text-[#0F172A] text-sm font-semibold">
              All Network Incidents
            </p>
            <p className="text-[#94A3B8] text-xs mt-0.5">
              These are visible to customers through Network Status when relevant.
            </p>
          </div>

          {incidents.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={30} className="text-[#16A34A] mx-auto mb-2" />
              <p className="text-[#64748B] text-sm">
                No network incidents have been created yet.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  {[
                    "Incident ID",
                    "Title",
                    "Areas",
                    "Status",
                    "Severity",
                    "ETA",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[#94A3B8] text-xs font-semibold uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        className="text-[#94A3B8] text-xs"
                      >
                        {incident.id.slice(0, 8)}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-[#0F172A] text-sm font-medium">
                        {incident.title}
                      </p>
                      <p className="text-[#94A3B8] text-xs mt-0.5">
                        {incidentTypeLabel(incident.type)}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-[#475569] text-xs">
                        {formatAreas(incident)}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-1 rounded-full border text-[10px] font-semibold ${statusBadgeClass(
                          incident.status
                        )}`}
                      >
                        {incident.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold ${severityBadgeClass(
                          incident.severity
                        )}`}
                      >
                        {incident.severity}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-[#475569] text-xs">
                        <Clock size={12} />
                        <span>{incident.estimatedResolution || "Not set"}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {incident.status !== "active" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(incident, "active")}
                            className="px-2 py-1 rounded-lg bg-[#FEF2F2] text-[#DC2626] text-[10px] font-semibold"
                          >
                            Active
                          </button>
                        )}

                        {incident.status !== "monitoring" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(incident, "monitoring")
                            }
                            className="px-2 py-1 rounded-lg bg-[#FFFBEB] text-[#B45309] text-[10px] font-semibold"
                          >
                            Monitoring
                          </button>
                        )}

                        {incident.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(incident, "resolved")
                            }
                            className="px-2 py-1 rounded-lg bg-[#F0FDF4] text-[#15803D] text-[10px] font-semibold"
                          >
                            Resolve
                          </button>
                        )}

                        {incident.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(incident, "cancelled")
                            }
                            className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#DC2626]"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
