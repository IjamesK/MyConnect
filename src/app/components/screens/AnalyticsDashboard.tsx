import { StaffLayout } from "../isp/StaffLayout";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingDown, TrendingUp, Star } from "lucide-react";

const callVolumeData = [
  { month: "Jan", calls: 4200, selfServe: 1100 },
  { month: "Feb", calls: 3900, selfServe: 1400 },
  { month: "Mar", calls: 3600, selfServe: 1700 },
  { month: "Apr", calls: 3100, selfServe: 2100 },
  { month: "May", calls: 2800, selfServe: 2500 },
  { month: "Jun", calls: 2400, selfServe: 2900 },
];

const renewalData = [
  { month: "Jan", momo: 820, airtel: 310, paylink: 90, bank: 140 },
  { month: "Feb", momo: 900, airtel: 340, paylink: 140, bank: 120 },
  { month: "Mar", momo: 1050, airtel: 380, paylink: 210, bank: 110 },
  { month: "Apr", momo: 1100, airtel: 420, paylink: 290, bank: 100 },
  { month: "May", momo: 1240, airtel: 450, paylink: 360, bank: 95 },
  { month: "Jun", momo: 1380, airtel: 480, paylink: 440, bank: 88 },
];

const ticketCategoryData = [
  { name: "No Internet", value: 38, color: "#DC2626" },
  { name: "Slow Speed", value: 24, color: "#F59E0B" },
  { name: "WiFi Issues", value: 18, color: "#0057B8" },
  { name: "Billing", value: 11, color: "#16A34A" },
  { name: "Other", value: 9, color: "#94A3B8" },
];

const topIssues = [
  { issue: "Fiber signal loss (LOS red)", count: 142, pct: "32%" },
  { issue: "ONT rebooting frequently", count: 87, pct: "19%" },
  { issue: "Slow speeds at peak hours", count: 73, pct: "16%" },
  { issue: "WiFi not broadcasting", count: 61, pct: "14%" },
  { issue: "Billing / payment not reflected", count: 48, pct: "11%" },
];

const metrics = [
  { label: "Support Calls Reduced", value: "−34%", sub: "vs. same period last year", up: false },
  { label: "Online Renewals", value: "67%", sub: "of all renewals self-served", up: true },
  { label: "Avg. Resolution Time", value: "4.2h", sub: "down from 6.8h last quarter", up: false },
  { label: "Customer Satisfaction", value: "4.6 / 5", sub: "based on 1,240 ratings", up: true },
];

export function AnalyticsDashboard() {
  return (
    <StaffLayout title="Analytics" subtitle="Portal impact and customer experience metrics">
      <div className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map(({ label, value, sub, up }) => (
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
                  ? <TrendingUp size={12} className="text-[#16A34A]" />
                  : <TrendingDown size={12} className="text-[#16A34A]" />
                }
                <span className="text-[#94A3B8] text-xs">{sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CSAT stars */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#0F172A] text-sm font-semibold">Customer Satisfaction Score</p>
              <p className="text-[#94A3B8] text-xs mt-0.5">Based on post-resolution surveys</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map(i => <Star key={i} size={18} className="text-[#F59E0B] fill-[#F59E0B]" />)}
              <Star size={18} className="text-[#F59E0B] fill-[#F59E0B] opacity-60" />
              <span
                style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }}
                className="text-[#0F172A] text-lg ml-2"
              >
                4.6
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const pct = star === 5 ? 62 : star === 4 ? 24 : star === 3 ? 8 : star === 2 ? 4 : 2;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-[#94A3B8] text-xs w-6 text-right">{star}★</span>
                  <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F59E0B] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[#64748B] text-xs w-8">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Call volume */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="mb-4">
              <p className="text-[#0F172A] text-sm font-semibold">Support Calls vs. Self-Service</p>
              <p className="text-[#94A3B8] text-xs mt-0.5">Calls dropping as portal adoption grows</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={callVolumeData}>
                <defs>
                  <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="selfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#94A3B8" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="calls" name="Support Calls" stroke="#DC2626" strokeWidth={2} fill="url(#callGrad)" dot={false} />
                <Area type="monotone" dataKey="selfServe" name="Self-Service" stroke="#16A34A" strokeWidth={2} fill="url(#selfGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Renewals by channel */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="mb-4">
              <p className="text-[#0F172A] text-sm font-semibold">Renewals by Channel</p>
              <p className="text-[#94A3B8] text-xs mt-0.5">PayLink growing month-over-month</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={renewalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#94A3B8" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="momo" name="MTN MoMo" fill="#F59E0B" radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="airtel" name="Airtel Money" fill="#DC2626" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="paylink" name="PayLink" fill="#0057B8" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="bank" name="Bank" fill="#94A3B8" radius={[2, 2, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket categories + issue table */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Pie chart */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <p className="text-[#0F172A] text-sm font-semibold mb-4">Ticket Categories</p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={ticketCategoryData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {ticketCategoryData.map(({ name, color }) => (
                      <Cell key={name} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {ticketCategoryData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[#475569] text-xs flex-1">{name}</span>
                    <span className="text-[#0F172A] text-xs font-semibold">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top issues */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <p className="text-[#0F172A] text-sm font-semibold mb-4">Top Issue Types</p>
            <div className="space-y-3">
              {topIssues.map(({ issue, count, pct }, i) => (
                <div key={issue}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#94A3B8] text-xs font-mono w-4">{i + 1}.</span>
                      <span className="text-[#475569] text-xs">{issue}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[#0F172A] text-xs font-semibold">{count}</span>
                      <span className="text-[#94A3B8] text-xs">{pct}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0057B8] rounded-full"
                      style={{ width: pct }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
