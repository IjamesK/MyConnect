import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  MapPin,
  Wrench,
  WifiOff,
} from "lucide-react";
import { Layout } from "../isp/Layout";
import type { CustomerProfile } from "../../../lib/auth";
import {
  listenToPublicIncidents,
  type PublicIncident,
} from "../../../lib/incidents";

function makeAreaKey(district: string, area: string) {
  return `${district.trim().toLowerCase()}/${area.trim().toLowerCase()}`;
}

function isCustomerAffected(profile: CustomerProfile, incident: PublicIncident) {
  const customerAreaKey = makeAreaKey(profile.district, profile.area);

  return (
    incident.affectedAreaKeys?.includes(customerAreaKey) ||
    incident.affectedAreaKeys?.includes("all/all") ||
    incident.affectedAreaKeys?.includes("network/all")
  );
}

function getIncidentLabel(incident: PublicIncident) {
  if (incident.type === "maintenance") return "Planned Maintenance";
  if (incident.type === "upgrade") return "Scheduled Upgrade";
  if (incident.type === "fiber_cut") return "Fiber Cut";
  if (incident.type === "knocked_pole") return "Knocked Pole";
  if (incident.type === "damaged_cabinet") return "Damaged Cabinet";
  if (incident.type === "area_outage") return "Area Outage";
  if (incident.type === "outage") return "Network Outage";
  return "Network Update";
}

function getStatusText(incident: PublicIncident) {
  if (incident.status === "scheduled") return "Scheduled";
  if (incident.status === "active") {
    return incident.severity === "high" ? "Full Outage" : "Partial Outage";
  }
  if (incident.status === "monitoring") return "Monitoring";
  if (incident.status === "resolved") return "Resolved";
  if (incident.status === "cancelled") return "Cancelled";
  return "Unknown";
}

function getStatusClasses(incident: PublicIncident) {
  if (incident.status === "resolved") {
    return "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]";
  }

  if (incident.status === "scheduled") {
    return "bg-[#EBF2FF] text-[#0057B8] border-[#BFDBFE]";
  }

  if (incident.status === "monitoring") {
    return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  }

  if (incident.severity === "high") {
    return "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
  }

  return "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]";
}

function getIcon(incident: PublicIncident) {
  if (incident.type === "maintenance" || incident.type === "upgrade") {
    return Wrench;
  }

  if (incident.status === "resolved") {
    return CheckCircle;
  }

  if (incident.severity === "high") {
    return WifiOff;
  }

  return AlertTriangle;
}

function formatIncidentAreas(incident: PublicIncident) {
  const areas = incident.affectedAreas || [];
  const districts = incident.affectedDistricts || [];

  if (areas.length === 0 && districts.length === 0) {
    return "Affected areas not specified";
  }

  if (areas.length > 0 && districts.length > 0) {
    return `${areas.join(", ")} · ${districts.join(", ")}`;
  }

  if (areas.length > 0) return areas.join(", ");
  return districts.join(", ");
}

function formatTimeAgo(incident: PublicIncident) {
  const date = incident.updatedAt?.toDate?.() || incident.createdAt?.toDate?.();

  if (!date) return "Recently updated";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function IncidentCard({
  incident,
  highlighted = false,
  onClick,
}: {
  incident: PublicIncident;
  highlighted?: boolean;
  onClick: () => void;
}) {
  const Icon = getIcon(incident);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-2xl p-4 transition-all ${
        highlighted
          ? "border-[#0057B8] shadow-sm"
          : "border-[#E2E8F0] hover:border-[#CBD5E1]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            incident.status === "resolved"
              ? "bg-[#F0FDF4]"
              : incident.status === "scheduled"
                ? "bg-[#EBF2FF]"
                : incident.severity === "high"
                  ? "bg-[#FEF2F2]"
                  : "bg-[#FFFBEB]"
          }`}
        >
          <Icon
            size={20}
            className={
              incident.status === "resolved"
                ? "text-[#15803D]"
                : incident.status === "scheduled"
                  ? "text-[#0057B8]"
                  : incident.severity === "high"
                    ? "text-[#DC2626]"
                    : "text-[#B45309]"
            }
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[#0F172A] text-sm font-semibold">
                {incident.title}
              </p>

              <p className="text-[#64748B] text-xs mt-0.5">
                {getIncidentLabel(incident)}
              </p>
            </div>

            <span
              className={`text-[10px] px-2 py-1 rounded-full border font-semibold whitespace-nowrap ${getStatusClasses(
                incident
              )}`}
            >
              {getStatusText(incident)}
            </span>
          </div>

          <p className="text-[#64748B] text-xs mt-3 leading-relaxed">
            {incident.description}
          </p>

          <div className="mt-3 flex items-center gap-2 text-[#94A3B8] text-xs">
            <MapPin size={12} />
            <span>{formatIncidentAreas(incident)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#94A3B8] text-xs">
              <Clock size={12} />
              <span>{formatTimeAgo(incident)}</span>
            </div>

            {incident.estimatedResolution && (
              <span className="text-[#64748B] text-xs">
                ETA: {incident.estimatedResolution}
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={16} className="text-[#CBD5E1] shrink-0 mt-1" />
      </div>
    </button>
  );
}

export function ServiceStatus() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (!savedProfile) {
      navigate("/", { replace: true });
      return;
    }

    try {
      setProfile(JSON.parse(savedProfile) as CustomerProfile);
    } catch (error) {
      console.error("Failed to load customer profile:", error);
      localStorage.removeItem("customerProfile");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = listenToPublicIncidents((items) => {
      setIncidents(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const visibleIncidents = useMemo(() => {
    return incidents.filter((incident) => incident.status !== "cancelled");
  }, [incidents]);

  const activeOutages = useMemo(() => {
    return visibleIncidents.filter(
      (incident) =>
        incident.status === "active" ||
        incident.status === "monitoring"
    );
  }, [visibleIncidents]);

  const plannedWork = useMemo(() => {
    return visibleIncidents.filter(
      (incident) =>
        incident.status === "scheduled" &&
        (incident.type === "maintenance" || incident.type === "upgrade")
    );
  }, [visibleIncidents]);

  const resolvedIncidents = useMemo(() => {
    return visibleIncidents.filter((incident) => incident.status === "resolved");
  }, [visibleIncidents]);

  const customerIncidents = useMemo(() => {
    if (!profile) return [];

    return visibleIncidents.filter((incident) =>
      isCustomerAffected(profile, incident)
    );
  }, [visibleIncidents, profile]);

  const customerActiveIncidents = useMemo(() => {
    return customerIncidents.filter(
      (incident) =>
        incident.status === "active" ||
        incident.status === "monitoring" ||
        incident.status === "scheduled"
    );
  }, [customerIncidents]);

  const customerActiveIncidentIds = useMemo(() => {
    return new Set(customerActiveIncidents.map((incident) => incident.id));
  }, [customerActiveIncidents]);

  const otherActiveOutages = useMemo(() => {
    return activeOutages.filter(
      (incident) => !customerActiveIncidentIds.has(incident.id)
    );
  }, [activeOutages, customerActiveIncidentIds]);

  const otherPlannedWork = useMemo(() => {
    return plannedWork.filter(
      (incident) => !customerActiveIncidentIds.has(incident.id)
    );
  }, [plannedWork, customerActiveIncidentIds]);

  const areaStatus = useMemo(() => {
    const highSeverity = customerActiveIncidents.some(
      (incident) => incident.status === "active" && incident.severity === "high"
    );

    const activeIssue = customerActiveIncidents.some(
      (incident) =>
        incident.status === "active" || incident.status === "monitoring"
    );

    const scheduledWork = customerActiveIncidents.some(
      (incident) => incident.status === "scheduled"
    );

    if (highSeverity) return "Full outage";
    if (activeIssue) return "Partial outage";
    if (scheduledWork) return "Scheduled maintenance";
    return "Operational";
  }, [customerActiveIncidents]);

  if (!profile) {
    return (
      <Layout showBack backTo="/dashboard" title="Network Status">
        <div className="px-4 py-10 text-center text-[#64748B] text-sm">
          Loading account details...
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBack backTo="/dashboard" title="Network Status">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[#0F172A] text-2xl"
          >
            Network Status
          </h1>

          <p className="text-[#64748B] text-sm mt-1">
            Live network updates for your area and other affected service zones.
          </p>
        </div>

        {/* Customer area first */}
        <div className="bg-gradient-to-br from-[#0057B8] to-[#003D82] rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white/70 text-xs">Your Area</p>

              <h2 className="text-lg font-bold mt-0.5">
                {profile.area}, {profile.district}
              </h2>

              <div className="flex items-center gap-2 mt-3">
                {areaStatus === "Operational" ? (
                  <CheckCircle size={16} className="text-[#86EFAC]" />
                ) : areaStatus === "Full outage" ? (
                  <WifiOff size={16} className="text-[#FCA5A5]" />
                ) : areaStatus === "Scheduled maintenance" ? (
                  <Wrench size={16} className="text-[#BFDBFE]" />
                ) : (
                  <AlertTriangle size={16} className="text-[#FDE68A]" />
                )}

                <span className="text-sm font-semibold">{areaStatus}</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Activity size={24} />
            </div>
          </div>

          <p className="text-white/70 text-xs mt-4">
            {customerActiveIncidents.length > 0
              ? `${customerActiveIncidents.length} network update${
                  customerActiveIncidents.length === 1 ? "" : "s"
                } affecting your area.`
              : "No active outage or planned maintenance affecting your area."}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
            <p className="text-[#94A3B8] text-xs">Active</p>
            <p className="text-[#0F172A] text-xl font-bold mt-1">
              {activeOutages.length}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
            <p className="text-[#94A3B8] text-xs">Planned</p>
            <p className="text-[#0F172A] text-xl font-bold mt-1">
              {plannedWork.length}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
            <p className="text-[#94A3B8] text-xs">Your Area</p>
            <p className="text-[#0F172A] text-xl font-bold mt-1">
              {customerActiveIncidents.length}
            </p>
          </div>
        </div>

        {loading && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center">
            <p className="text-[#64748B] text-sm">Loading network updates...</p>
          </div>
        )}

        {!loading && customerActiveIncidents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#0F172A] text-sm font-semibold">
                Affecting Your Area
              </h3>

              <span className="text-[#0057B8] text-xs font-medium">
                Priority
              </span>
            </div>

            <div className="space-y-3">
              {customerActiveIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  highlighted
                  onClick={() => navigate(`/outage/${incident.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && otherActiveOutages.length > 0 && (
          <div>
            <h3 className="text-[#0F172A] text-sm font-semibold mb-1">
              Other Active Outages & Incidents
            </h3>
            <p className="text-[#94A3B8] text-xs mb-3">
              These are active network updates outside your main area section.
            </p>

            <div className="space-y-3">
              {otherActiveOutages.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={() => navigate(`/outage/${incident.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && otherPlannedWork.length > 0 && (
          <div>
            <h3 className="text-[#0F172A] text-sm font-semibold mb-3">
              Planned Maintenance & Upgrades
            </h3>

            <div className="space-y-3">
              {otherPlannedWork.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={() => navigate(`/outage/${incident.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading &&
          otherActiveOutages.length === 0 &&
          otherPlannedWork.length === 0 &&
          customerActiveIncidents.length === 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={26} className="text-[#16A34A]" />
              </div>

              <h3 className="text-[#0F172A] text-base font-bold">
                All Systems Operational
              </h3>

              <p className="text-[#64748B] text-sm mt-1">
                There are no active outages or planned maintenance updates at
                the moment.
              </p>
            </div>
          )}

        {!loading && resolvedIncidents.length > 0 && (
          <div>
            <h3 className="text-[#0F172A] text-sm font-semibold mb-3">
              Recently Resolved
            </h3>

            <div className="space-y-3">
              {resolvedIncidents.slice(0, 3).map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={() => navigate(`/outage/${incident.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
