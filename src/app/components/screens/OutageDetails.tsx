import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  MapPin,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { Layout } from "../isp/Layout";
import {
  formatIncidentReference,
  listenToPublicIncident,
  type PublicIncident,
} from "../../../lib/incidents";

function formatAreas(incident: PublicIncident) {
  const areas = incident.affectedAreas || [];
  const districts = incident.affectedDistricts || [];

  if (areas.length > 0 && districts.length > 0) {
    return `${areas.join(", ")} · ${districts.join(", ")}`;
  }

  if (areas.length > 0) return areas.join(", ");
  if (districts.length > 0) return districts.join(", ");

  return "Affected area not specified";
}

function statusText(status: string) {
  if (status === "active") return "Active Incident";
  if (status === "scheduled") return "Scheduled Maintenance";
  if (status === "monitoring") return "Under Monitoring";
  if (status === "resolved") return "Resolved";
  if (status === "cancelled") return "Cancelled";
  return status;
}

function typeText(type: string) {
  if (type === "fiber_cut") return "Fiber Cut";
  if (type === "knocked_pole") return "Knocked Pole";
  if (type === "damaged_cabinet") return "Damaged Cabinet";
  if (type === "area_outage") return "Area Outage";
  if (type === "maintenance") return "Maintenance";
  if (type === "upgrade") return "Network Upgrade";
  if (type === "outage") return "General Outage";
  return "Other";
}

export function OutageDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [incident, setIncident] = useState<PublicIncident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToPublicIncident(id, (incidentData) => {
      setIncident(incidentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <Layout showBack backTo="/service-status" title="Outage Details">
        <div className="px-4 py-8 text-center text-[var(--color-muted)] text-sm">
          Loading outage details...
        </div>
      </Layout>
    );
  }

  if (!incident) {
    return (
      <Layout showBack backTo="/service-status" title="Outage Details">
        <div className="px-4 py-8 text-center">
          <AlertTriangle size={32} className="text-[var(--color-danger-text)] mx-auto mb-3" />
          <p className="text-[var(--color-text)] font-semibold">Outage not found</p>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            This incident may have been removed or is no longer available.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBack backTo="/service-status" title="Outage Details">
      <div className="px-4 py-5 space-y-5">
        <button
          type="button"
          onClick={() => navigate("/service-status")}
          className="flex items-center gap-2 text-[var(--color-muted)] text-sm"
        >
          <ArrowLeft size={16} />
          Back to Network Status
        </button>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-danger-soft)] flex items-center justify-center">
              <AlertTriangle size={22} className="text-[var(--color-danger-text)]" />
            </div>

            <div className="flex-1">
              <p className="text-[var(--color-text)] text-lg font-bold">
                {incident.title}
              </p>

              <p className="text-[var(--color-muted)] text-sm mt-1">
                {incident.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-2.5 py-1 rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger-text)] text-xs font-semibold">
                  {statusText(incident.status)}
                </span>

                <span className="px-2.5 py-1 rounded-full bg-[var(--color-surface-soft)] text-[var(--color-primary-text)] text-xs font-semibold">
                  {typeText(incident.type)}
                </span>

                <span className="px-2.5 py-1 rounded-full bg-[var(--color-warning-soft)] text-[var(--color-warning-text)] text-xs font-semibold">
                  {incident.severity} severity
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-[var(--color-primary-text)] mt-0.5" />
            <div>
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Affected Area
              </p>
              <p className="text-[var(--color-muted)] text-sm mt-0.5">
                {formatAreas(incident)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={18} className="text-[var(--color-primary-text)] mt-0.5" />
            <div>
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Estimated Resolution
              </p>
              <p className="text-[var(--color-muted)] text-sm mt-0.5">
                {incident.estimatedResolution || "Not yet provided"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Radio size={18} className="text-[var(--color-primary-text)] mt-0.5" />
            <div>
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Current Status
              </p>
              <p className="text-[var(--color-muted)] text-sm mt-0.5">
                {incident.statusNote || statusText(incident.status)}
              </p>
            </div>
          </div>

          {incident.status === "resolved" && (
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-[var(--color-success-text)] mt-0.5" />
              <div>
                <p className="text-[var(--color-text)] text-sm font-semibold">
                  Service Restored
                </p>
                <p className="text-[var(--color-muted)] text-sm mt-0.5">
                  This incident has been marked as resolved.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4">
          <p className="text-[var(--color-subtle-text)] text-xs">Incident Reference</p>
          <p
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[var(--color-muted)] text-xs mt-1"
          >
            {formatIncidentReference(incident)}
          </p>
        </div>

        {incident.status !== "resolved" && incident.status !== "cancelled" && (
          <button
            type="button"
            onClick={() =>
              navigate(
                `/report-issue?mode=incident&type=area_outage&source=outage_details&incident=${incident.id}`
              )
            }
            className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary)] active:scale-95 transition-all"
          >
            Report this is still ongoing
          </button>
        )}
      </div>
    </Layout>
  );
}
