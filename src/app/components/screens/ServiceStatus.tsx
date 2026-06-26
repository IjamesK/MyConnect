import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { StatusDot, StatusBadge } from "../isp/StatusBadge";
import { ChevronRight, X, Clock, Wrench, HardHat, ChevronDown } from "lucide-react";

const areas = [
  { name: "Kampala East", status: "operational" as const, detail: "All services running normally" },
  { name: "Ntinda", status: "partial" as const, detail: "Fiber cut · 3 blocks affected", incident: "INC-2026-0045" },
  { name: "Naalya", status: "operational" as const, detail: "All services running normally" },
  { name: "Kisaasi", status: "operational" as const, detail: "All services running normally" },
  { name: "Bukoto", status: "operational" as const, detail: "Monitoring elevated latency" },
  { name: "Kireka", status: "operational" as const, detail: "All services running normally" },
  { name: "Entebbe", status: "operational" as const, detail: "All services running normally" },
  { name: "Mukono", status: "operational" as const, detail: "All services running normally" },
];

const constructionZones = [
  { area: "Kira Road", detail: "Road expansion affecting underground cables. Expected completion: Jul 15", status: "active" },
  { area: "Lugogo Bypass", detail: "Relocating utility poles. Sporadic micro-outages possible.", status: "scheduled" }
];

export function ServiceStatus() {
  const navigate = useNavigate();
  const [maintenanceDismissed, setMaintenanceDismissed] = useState(false);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesAgo(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout title="Network Status">
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <h1
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
            className="text-[#0F172A] text-2xl"
          >
            Network Status
          </h1>
          <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
            <Clock size={12} />
            <span>Updated {minutesAgo === 0 ? "just now" : `${minutesAgo} min ago`}</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Incidents", value: "1", color: "text-[#DC2626]" },
            { label: "Areas Affected", value: "1", color: "text-[#F59E0B]" },
            { label: "Maintenance", value: "1", color: "text-[#7C3AED]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center">
              <p style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }} className={`text-2xl ${color}`}>{value}</p>
              <p className="text-[#64748B] text-[10px] mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Maintenance banner */}
        {!maintenanceDismissed && (
          <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl px-4 py-3">
            <div className="flex items-start gap-3">
              <Wrench size={16} className="text-[#7C3AED] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[#6D28D9] text-xs font-semibold">Planned Maintenance</p>
                <p className="text-[#7C3AED] text-xs mt-0.5">Naalya fiber upgrade · Tomorrow 2:00 AM – 5:00 AM</p>
                <p className="text-[#9B8ECF] text-[10px] mt-1">Expect brief interruptions during this window</p>
              </div>
              <button onClick={() => setMaintenanceDismissed(true)} className="text-[#9B8ECF] hover:text-[#6D28D9]">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Area list */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-3">Coverage Areas</p>
          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
            {areas.map(({ name, status, detail, incident }) => {
              const isExpanded = expandedArea === name;
              return (
                <div key={name}>
                  <button
                    onClick={() => incident ? setExpandedArea(isExpanded ? null : name) : undefined}
                    className={`w-full px-4 py-3.5 flex items-center gap-3 text-left ${incident ? "hover:bg-[#F8FAFC] active:bg-[#F1F5F9]" : ""}`}
                  >
                    <StatusDot status={status} pulse={status !== "operational"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#0F172A] text-sm font-medium">{name}</p>
                      <p className="text-[#94A3B8] text-xs truncate mt-0.5">{detail}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={status === "operational" ? "operational" : "investigating"} />
                      {incident && (isExpanded ? <ChevronDown size={14} className="text-[#CBD5E1]" /> : <ChevronRight size={14} className="text-[#CBD5E1]" />)}
                    </div>
                  </button>
                  {isExpanded && incident && (
                    <div className="px-4 pb-4 pt-1 bg-[#F8FAFC]">
                      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3">
                        <p className="text-[#0F172A] text-xs font-semibold mb-1">Incident: {incident}</p>
                        <p className="text-[#64748B] text-xs leading-relaxed mb-3">
                          Our field engineers are currently on-site investigating a suspected fiber cut affecting approximately 3 blocks in the Ntinda area. We are working to reroute traffic where possible.
                        </p>
                        <button
                          onClick={() => navigate(`/outage/${incident}`)}
                          className="w-full bg-[#E5007D] text-white py-1.5 rounded-md text-xs font-semibold hover:bg-[#BE0067] transition-colors"
                        >
                          View Live Updates
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Construction Zones */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-3">Construction Zones</p>
          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
            {constructionZones.map(({ area, detail, status }) => (
              <div key={area} className="p-4 flex gap-3 items-start">
                <div className="mt-0.5">
                  <HardHat size={16} className={status === 'active' ? "text-[#F59E0B]" : "text-[#94A3B8]"} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[#0F172A] text-sm font-medium">{area}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${status === 'active' ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-[#64748B] text-xs mt-1 leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall status */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">🔶</span>
          <div>
            <p className="text-[#92400E] text-sm font-semibold">Partial Service Degradation</p>
            <p className="text-[#B45309] text-xs mt-0.5">1 area experiencing issues · Engineers deployed</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
