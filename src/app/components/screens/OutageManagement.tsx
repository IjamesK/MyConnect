import { useState } from "react";
import { useNavigate } from "react-router";
import { StaffLayout } from "../isp/StaffLayout";
import { StatusBadge } from "../isp/StatusBadge";
import { Plus, CheckCircle, Edit, Bell, Trash2 } from "lucide-react";

const areaOptions = ["Kampala East", "Ntinda", "Naalya", "Kisaasi", "Bukoto", "Kireka", "Entebbe", "Mukono"];
const severityOptions = [
  { value: "critical", label: "Critical", color: "text-[#DC2626]" },
  { value: "high", label: "High", color: "text-[#F59E0B]" },
  { value: "medium", label: "Medium", color: "text-[#0057B8]" },
  { value: "low", label: "Low", color: "text-[#16A34A]" },
];

const existingIncidents = [
  { id: "INC-2026-0045", title: "Fiber Cut — Ntinda", areas: ["Ntinda", "Bukoto"], severity: "critical" as const, eta: "4:30 PM", customers: 380, status: "investigating" as const },
  { id: "INC-2026-0041", title: "Equipment Fault — Mukono", areas: ["Mukono"], severity: "partial" as const, eta: "6:00 PM", customers: 120, status: "assigned" as const },
  { id: "INC-2026-0039", title: "Power Outage — Kireka", areas: ["Kireka"], severity: "partial" as const, eta: "Resolved", customers: 0, status: "resolved" as const },
];

export function OutageManagement() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [severity, setSeverity] = useState("high");
  const [cause, setCause] = useState("");
  const [eta, setEta] = useState("");
  const [notifyCustomers, setNotifyCustomers] = useState(true);

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  return (
    <StaffLayout title="Outage Management" subtitle="Create, monitor, and resolve network incidents">
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {["All", "Active", "Investigating", "Resolved"].map(f => (
              <button
                key={f}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${f === "All" ? "bg-[#0057B8] text-white" : "bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={15} />
            Create Incident
          </button>
        </div>

        {/* Create incident form */}
        {showForm && (
          <div className="bg-white border-2 border-[#0057B8] rounded-2xl p-6 space-y-4">
            <h2
              style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }}
              className="text-[#0F172A] text-lg"
            >
              New Incident
            </h2>

            {/* Title */}
            <div>
              <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">Incident Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Fiber Cut on Ntinda-Bukoto route"
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
              />
            </div>

            {/* Affected areas */}
            <div>
              <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">Affected Areas</label>
              <div className="flex flex-wrap gap-2">
                {areaOptions.map(area => (
                  <button
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedAreas.includes(area)
                        ? "bg-[#0057B8] text-white border-transparent"
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#0057B8]"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity + cause row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">Severity</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                >
                  {severityOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">Cause</label>
                <input
                  type="text"
                  value={cause}
                  onChange={e => setCause(e.target.value)}
                  placeholder="e.g. Fiber Cut"
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
                />
              </div>
            </div>

            {/* ETA */}
            <div>
              <label className="text-[#475569] text-xs font-semibold uppercase tracking-wide block mb-1.5">Estimated Resolution (ETA)</label>
              <input
                type="datetime-local"
                value={eta}
                onChange={e => setEta(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
              />
            </div>

            {/* Notify customers */}
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[#64748B]" />
                <div>
                  <p className="text-[#0F172A] text-sm font-medium">Notify Affected Customers</p>
                  <p className="text-[#94A3B8] text-xs">Send SMS to customers in selected areas</p>
                </div>
              </div>
              <button
                onClick={() => setNotifyCustomers(!notifyCustomers)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifyCustomers ? "bg-[#0057B8]" : "bg-[#CBD5E1]"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifyCustomers ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {/* Form actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Publish Incident
              </button>
            </div>
          </div>
        )}

        {/* Incidents table */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <p className="text-[#0F172A] text-sm font-semibold">All Incidents</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {["Incident ID", "Title", "Areas", "Status", "Customers Affected", "ETA", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[#94A3B8] text-xs font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {existingIncidents.map(({ id, title, areas, severity, eta, customers, status }) => (
                <tr key={id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3.5">
                    <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#94A3B8] text-xs">{id}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[#0F172A] text-sm font-medium">{title}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {areas.map(a => (
                        <span key={a} className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] rounded font-medium">{a}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={status} pulse={status !== "resolved"} />
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`text-sm font-semibold ${customers > 0 ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
                      {customers > 0 ? customers : "0"}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[#475569] text-sm">{eta}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {status !== "resolved" && (
                        <button className="p-1.5 rounded-lg hover:bg-[#F0FDF4] text-[#16A34A]">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-[#EBF2FF] text-[#0057B8]">
                        <Edit size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#DC2626]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Admin photo review queue */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
            <div>
              <p className="text-[#0F172A] text-sm font-semibold">Photo Reports — Pending Review</p>
              <p className="text-[#94A3B8] text-xs mt-0.5">Customer-submitted infrastructure photos</p>
            </div>
            <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">3</span>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {[
              { customer: "James Okello", type: "Knocked Pole", area: "Ntinda", time: "10 min ago", preview: "🪵" },
              { customer: "Agnes Nakato", type: "Road Construction Damage", area: "Bukoto", time: "25 min ago", preview: "🚧" },
              { customer: "Brian Ssali", type: "Cable Cut", area: "Kireka", time: "1h ago", preview: "✂️" },
            ].map(({ customer, type, area, time, preview }) => (
              <div key={customer} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-xl flex-shrink-0">
                  {preview}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0F172A] text-sm font-medium">{customer}</p>
                  <p className="text-[#64748B] text-xs">{type} · {area} · {time}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="px-3 py-1.5 bg-[#F0FDF4] text-[#15803D] text-xs font-semibold rounded-lg hover:bg-[#DCFCE7]">
                    Verify
                  </button>
                  <button className="px-3 py-1.5 bg-[#FEF2F2] text-[#B91C1C] text-xs font-semibold rounded-lg hover:bg-[#FEE2E2]">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
