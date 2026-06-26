import { useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { StatusBadge } from "../isp/StatusBadge";
import { MapPin, Clock, Zap, Bell, Wrench, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

const timeline = [
  { label: "Reported", time: "11:42 AM", done: true },
  { label: "Investigating", time: "11:58 AM", done: true, active: true },
  { label: "Resolving", time: "—", done: false },
  { label: "Resolved", time: "—", done: false },
];

export function OutageDetails() {
  const navigate = useNavigate();
  const [notified, setNotified] = useState(false);

  return (
    <Layout showBack backTo="/service-status" title="Outage Details">
      <div className="px-4 py-5 space-y-4">
        {/* Incident header */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#94A3B8] text-xs">
                INC-2026-0045
              </p>
              <h1
                style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
                className="text-[#0F172A] text-xl mt-1"
              >
                Fiber Signal Loss
              </h1>
            </div>
            <StatusBadge status="investigating" pulse />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-start gap-2">
              <Zap size={14} className="text-[#DC2626] mt-0.5 shrink-0" />
              <div>
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Cause</p>
                <p className="text-[#0F172A] text-sm font-medium mt-0.5">Fiber Cut</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-[#F59E0B] mt-0.5 shrink-0" />
              <div>
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">ETA</p>
                <p className="text-[#0F172A] text-sm font-medium mt-0.5">Today 4:30 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-[#0057B8] mt-0.5 shrink-0" />
              <div>
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Affected Areas</p>
                <p className="text-[#0F172A] text-sm font-medium mt-0.5">Ntinda, Bukoto</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wrench size={14} className="text-[#7C3AED] mt-0.5 shrink-0" />
              <div>
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Team</p>
                <p className="text-[#0F172A] text-sm font-medium mt-0.5">Field Crew A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <p className="text-[#0F172A] text-sm font-semibold mb-4">Incident Timeline</p>
          <div className="relative">
            <div className="absolute left-3.5 top-3 bottom-3 w-px bg-[#E2E8F0]" />
            <div className="space-y-5">
              {timeline.map(({ label, time, done, active }) => (
                <div key={label} className="flex items-center gap-4 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 ${
                    active
                      ? "bg-[#FFFBEB] border-[#F59E0B]"
                      : done
                      ? "bg-[#F0FDF4] border-[#16A34A]"
                      : "bg-[#F8FAFC] border-[#E2E8F0]"
                  }`}>
                    {active ? (
                      <Loader2 size={12} className="text-[#F59E0B] animate-spin" />
                    ) : done ? (
                      <CheckCircle2 size={12} className="text-[#16A34A]" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className={`text-sm font-medium ${active ? "text-[#B45309]" : done ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                      {label}
                    </p>
                    <p className="text-[#94A3B8] text-xs">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engineer update */}
        <div className="bg-[#EBF2FF] border border-[#BFDBFE] rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-[#0057B8] mt-0.5 shrink-0" />
            <div>
              <p className="text-[#1D4ED8] text-xs font-semibold">Latest Update · 12:45 PM</p>
              <p className="text-[#1E40AF] text-sm mt-1">
                "Field crew has located the cut near Ntinda market. Cable replacement underway. ETA confirmed at 4:30 PM."
              </p>
              <p className="text-[#60A5FA] text-xs mt-1.5">— Patrick Muwanga, Field Technician</p>
            </div>
          </div>
        </div>

        {/* Get notified */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF2FF] flex items-center justify-center">
              <Bell size={16} className="text-[#0057B8]" />
            </div>
            <div>
              <p className="text-[#0F172A] text-sm font-medium">Get SMS Updates</p>
              <p className="text-[#94A3B8] text-xs">When service is restored</p>
            </div>
          </div>
          <button
            onClick={() => setNotified(!notified)}
            className={`w-12 h-6 rounded-full transition-colors relative ${notified ? "bg-[#16A34A]" : "bg-[#CBD5E1]"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notified ? "left-7" : "left-1"}`} />
          </button>
        </div>

        {/* CTA buttons */}
        <button
          onClick={() => navigate("/troubleshoot")}
          className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Run Diagnostics
        </button>
        <button
          onClick={() => navigate("/ticket/3021")}
          className="w-full py-3 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl font-semibold text-sm hover:bg-[#F8FAFC] transition-colors"
        >
          View My Ticket
        </button>
      </div>
    </Layout>
  );
}
