import { useNavigate } from "react-router";
import { StaffLayout } from "../isp/StaffLayout";
import { StatusBadge } from "../isp/StatusBadge";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";

const onlineData = [
  { time: "00:00", customers: 9200 }, { time: "03:00", customers: 7800 }, { time: "06:00", customers: 8500 },
  { time: "09:00", customers: 10200 }, { time: "12:00", customers: 11800 }, { time: "15:00", customers: 12458 },
  { time: "18:00", customers: 12100 }, { time: "21:00", customers: 11200 }, { time: "Now", customers: 12458 },
];

const ticketsByArea = [
  { area: "Ntinda", tickets: 42 }, { area: "Bukoto", tickets: 28 }, { area: "Kisaasi", tickets: 19 },
  { area: "Naalya", tickets: 15 }, { area: "Kireka", tickets: 12 }, { area: "Entebbe", tickets: 8 },
];

const incidents = [
  { id: "INC-2026-0045", area: "Ntinda", cause: "Fiber Cut", severity: "critical" as const, eta: "4:30 PM", duration: "2h 15m" },
  { id: "INC-2026-0041", area: "Mukono", cause: "Equipment Fault", severity: "partial" as const, eta: "6:00 PM", duration: "45m" },
  { id: "INC-2026-0039", area: "Kireka", cause: "Power Outage", severity: "partial" as const, eta: "Resolved", duration: "1h 30m" },
];

const kpis = [
  { label: "Customers Online", value: "12,458", trend: "+234", up: true, sub: "of 14,820 total" },
  { label: "Open Tickets", value: "148", trend: "-12", up: false, sub: "from yesterday" },
  { label: "Active Outages", value: "3", trend: "+1", up: true, sub: "in 2 areas" },
  { label: "Expiring This Week", value: "892", trend: "+67", up: true, sub: "need renewal" },
];

export function StaffDashboard() {
  const navigate = useNavigate();

  return (
    <StaffLayout title="Operations Overview" subtitle="Real-time network and customer metrics">
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(({ label, value, trend, up, sub }) => (
            <div key={label} className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <p className="text-[#64748B] text-xs font-medium uppercase tracking-wide">{label}</p>
              <p
                style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
                className="text-[#0F172A] text-3xl mt-2"
              >
                {value}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {up
                  ? <TrendingUp size={12} className="text-[#DC2626]" />
                  : <TrendingDown size={12} className="text-[#16A34A]" />
                }
                <span className={`text-xs font-medium ${up ? "text-[#DC2626]" : "text-[#16A34A]"}`}>{trend}</span>
                <span className="text-[#94A3B8] text-xs">{sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Online customers chart */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#0F172A] text-sm font-semibold">Customers Online — 24h</p>
                <p className="text-[#94A3B8] text-xs mt-0.5">Live session count</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0057B8] animate-pulse" />
                <span style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }} className="text-[#0057B8] text-sm">12,458</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={onlineData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0057B8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0057B8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94A3B8" }}
                  itemStyle={{ color: "#60A5FA" }}
                />
                <Area type="monotone" dataKey="customers" stroke="#0057B8" strokeWidth={2} fill="url(#blueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tickets by area */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#0F172A] text-sm font-semibold">Open Tickets by Area</p>
                <p className="text-[#94A3B8] text-xs mt-0.5">Current backlog</p>
              </div>
              <span className="text-[#0F172A] text-sm font-semibold">148 total</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ticketsByArea} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94A3B8" }}
                  itemStyle={{ color: "#60A5FA" }}
                />
                <Bar dataKey="tickets" fill="#0057B8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active incidents */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
            <p className="text-[#0F172A] text-sm font-semibold">Active Incidents</p>
            <button
              onClick={() => navigate("/staff/outages")}
              className="flex items-center gap-1 text-[#0057B8] text-xs font-medium"
            >
              Manage <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {incidents.map(({ id, area, cause, severity, eta, duration }) => (
              <div key={id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#94A3B8] text-xs">{id}</p>
                    <StatusBadge status={severity === "critical" ? "critical" : "investigating"} />
                  </div>
                  <p className="text-[#0F172A] text-sm font-medium mt-0.5">{area} — {cause}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#64748B] text-xs">ETA: {eta}</p>
                  <p className="text-[#94A3B8] text-xs">{duration}</p>
                </div>
                <button
                  onClick={() => navigate("/staff/outages")}
                  className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC]"
                >
                  <ArrowRight size={13} className="text-[#94A3B8]" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent tickets feed */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <p className="text-[#0F172A] text-sm font-semibold">Recent Tickets</p>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {[
              { id: "#INC-3024", customer: "David Kato", issue: "No internet", area: "Bukoto", time: "5m ago", status: "critical" as const },
              { id: "#INC-3023", customer: "Mary Namutebi", issue: "Slow speed", area: "Naalya", time: "12m ago", status: "assigned" as const },
              { id: "#INC-3022", customer: "Robert Ssempa", issue: "WiFi not broadcasting", area: "Kisaasi", time: "28m ago", status: "resolved" as const },
            ].map(({ id, customer, issue, area, time, status }) => (
              <div key={id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-xs font-bold text-[#475569]">
                  {customer[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[#0F172A] text-sm font-medium">{customer}</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#94A3B8] text-xs">{id}</p>
                  </div>
                  <p className="text-[#64748B] text-xs">{issue} · {area}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={status} />
                  <span className="text-[#94A3B8] text-xs">{time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
