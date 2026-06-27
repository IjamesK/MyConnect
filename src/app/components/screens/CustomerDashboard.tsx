import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { CustomerProfile } from "../../../lib/auth";
import { Layout } from "../isp/Layout";
import { StatusDot } from "../isp/StatusBadge";
import { RefreshCw, Wrench, AlertCircle, Activity, ChevronRight, TrendingUp } from "lucide-react";

const quickActions = [
  { icon: RefreshCw, label: "Renew", sublabel: "14 days left", color: "bg-[#FCE7F3] text-[#E5007D]", path: "/renewal" },
  { icon: Wrench, label: "Troubleshoot", sublabel: "Diagnose issues", color: "bg-[#F0FDF4] text-[#15803D]", path: "/troubleshoot" },
  { icon: AlertCircle, label: "Report Issue", sublabel: "Photo reports", color: "bg-[#FFFBEB] text-[#B45309]", path: "/report-issue" },
  { icon: Activity, label: "Network Status", sublabel: "View all areas", color: "bg-[#FEF2F2] text-[#B91C1C]", path: "/service-status" },
];

const recentActivity = [
  { title: "Subscription Renewed", desc: "FIT 50Mbps — UGX 90,000", time: "Jun 1", color: "text-[#16A34A]" },
  { title: "Support Ticket Opened", desc: "#INC-3021 — Slow speed", time: "Jun 18", color: "text-[#E5007D]" },
  { title: "Engineer Visit", desc: "Patrick M. — Cable check", time: "Jun 19", color: "text-[#F59E0B]" },
];

export function CustomerDashboard() {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <Layout>
      <div className="px-4 py-5 space-y-4">
        {/* Greeting */}
        <div>
          <p className="text-[#64748B] text-sm">{greeting},</p>
          <h1
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
            className="text-[#0F172A] text-2xl mt-0.5"
          >
            James Okello 👋
          </h1>
          <p className="text-[#64748B] text-xs font-medium mt-0.5">KAM-8924 • Ntinda Zone</p>
        </div>

        {/* Internet status hero card */}
        <div className="bg-[#E5007D] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 right-8 w-20 h-20 rounded-full bg-white/10 translate-y-8" />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-xs uppercase tracking-wide font-medium">Internet Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4ADE80]" />
                  </span>
                  <span
                    style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }}
                    className="text-xl text-white"
                  >
                    ONLINE
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-white/80 text-xs mb-1">Router SN</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('ZTEGD1234567');
                    alert('Copied Router SN');
                  }}
                  className="bg-white/20 hover:bg-white/30 transition-colors text-white text-xs px-2 py-1 rounded flex items-center gap-1 active:scale-95"
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>ZTEGD1234567</span>
                </button>
              </div>
            </div>

            <div className="border-t border-white/20 pt-3 flex items-center justify-between">
              <div>
                <p className="text-white/80 text-[10px] uppercase tracking-wide">Package</p>
                <p className="text-white text-sm font-semibold">FIT 50Mbps</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-[10px] uppercase tracking-wide">Expires In</p>
                <p className="text-[#FCD34D] text-sm font-semibold">14 Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Renewal warning */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-[#92400E] text-xs font-semibold">Subscription expires soon</p>
            <p className="text-[#B45309] text-xs mt-0.5">Renew before Jun 30 to avoid disconnection</p>
          </div>
          <button
            onClick={() => navigate("/renewal")}
            className="bg-[#E5007D] hover:bg-[#BE0067] text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors active:scale-95"
          >
            Renew →
          </button>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, sublabel, color, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-2.5 text-left hover:shadow-md transition-shadow active:scale-95"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-[#0F172A] text-sm font-semibold">{label}</p>
                  <p className="text-[#94A3B8] text-xs mt-0.5">{sublabel}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Area status banner */}
        <button
          onClick={() => navigate("/service-status")}
          className="w-full bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3"
        >
          <div className="flex items-center gap-2 flex-1">
            <StatusDot status="partial" pulse />
            <div className="text-left">
              <p className="text-[#0F172A] text-sm font-semibold">Partial outage in Ntinda</p>
              <p className="text-[#94A3B8] text-xs">1 active incident · Investigating</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#CBD5E1]" />
        </button>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#0F172A] text-sm font-semibold">Recent Activity</p>
            <TrendingUp size={14} className="text-[#94A3B8]" />
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
            {recentActivity.map(({ title, desc, time, color }) => (
              <div key={title} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.replace("text-", "bg-")}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[#0F172A] text-sm font-medium">{title}</p>
                  <p className="text-[#94A3B8] text-xs truncate">{desc}</p>
                </div>
                <span className="text-[#CBD5E1] text-xs whitespace-nowrap">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
