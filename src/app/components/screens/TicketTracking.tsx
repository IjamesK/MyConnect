import { useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { StatusBadge } from "../isp/StatusBadge";
import { CheckCircle2, Loader2, Clock, Send, Phone, MessageSquare } from "lucide-react";

const timelineSteps = [
  { label: "Ticket Submitted", time: "Today 9:15 AM", done: true },
  { label: "Under Review", time: "Today 9:42 AM", done: true },
  { label: "Engineer Assigned", time: "Today 10:30 AM", done: true, active: true },
  { label: "In Progress", time: "Expected 2:00 PM", done: false },
  { label: "Resolved", time: "Expected Tomorrow", done: false },
];

const updates = [
  { time: "10:30 AM", text: "Patrick Muwanga assigned as field engineer. He will contact you before arrival.", by: "System" },
  { time: "9:42 AM", text: "Ticket reviewed and prioritized as High. Area-wide fiber cut confirmed.", by: "NOC Team" },
  { time: "9:15 AM", text: "Ticket received. Diagnostic report attached (Fiber Signal Loss, 95% confidence).", by: "System" },
];

export function TicketTracking() {
  const navigate = useNavigate();
  const [comment, setComment] = useState("");

  return (
    <Layout showBack backTo="/dashboard" title="Ticket #INC-3021">
      <div className="px-4 py-5 space-y-4">
        {/* Ticket header */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-1">
            <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#94A3B8] text-xs">
              #INC-3021
            </p>
            <StatusBadge status="assigned" pulse />
          </div>
          <h1
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
            className="text-[#0F172A] text-xl"
          >
            No Internet — Fiber Signal Loss
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <div className="flex items-center gap-1 text-[#64748B]">
              <Clock size={11} />
              <span>Created today</span>
            </div>
            <div className="flex items-center gap-1 text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              <span>Priority: High</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
            <p className="text-[#64748B] text-xs mb-2">ONT Diagnostic State:</p>
            <div className="flex items-center gap-2">
              <span className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] px-2 py-1 rounded text-[10px] font-semibold tracking-wide">
                LOS: RED
              </span>
              <span className="bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] px-2 py-1 rounded text-[10px] font-semibold tracking-wide">
                INTERNET: OFF
              </span>
              <span className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] px-2 py-1 rounded text-[10px] font-semibold tracking-wide">
                PWR: GREEN
              </span>
            </div>
          </div>
        </div>

        {/* Engineer card */}
        <div className="bg-[#FCE7F3] border border-[#FBCFE8] rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5007D] flex items-center justify-center text-white font-bold text-sm shrink-0">
            PM
          </div>
          <div className="flex-1">
            <p className="text-[#0F172A] text-sm font-semibold">Patrick Muwanga</p>
            <p className="text-[#64748B] text-xs">Field Technician · Ntinda Zone</p>
            <p className="text-[#E5007D] text-xs mt-0.5 font-medium">ETA: Tomorrow 10:00 AM</p>
          </div>
          <button className="w-9 h-9 rounded-full bg-[#E5007D] flex items-center justify-center">
            <Phone size={15} className="text-white" />
          </button>
        </div>

        {/* Progress timeline */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <p className="text-[#0F172A] text-sm font-semibold mb-4">Progress</p>
          <div className="relative">
            <div className="absolute left-3.5 top-3 bottom-3 w-px bg-[#E2E8F0]" />
            <div className="space-y-5">
              {timelineSteps.map(({ label, time, done, active }) => (
                <div key={label} className="flex items-start gap-4 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 flex-shrink-0 ${
                    active ? "bg-[#FCE7F3] border-[#E5007D]" : done ? "bg-[#F0FDF4] border-[#16A34A]" : "bg-[#F8FAFC] border-[#E2E8F0]"
                  }`}>
                    {active ? (
                      <Loader2 size={12} className="text-[#E5007D] animate-spin" />
                    ) : done ? (
                      <CheckCircle2 size={12} className="text-[#16A34A]" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-medium ${active ? "text-[#E5007D]" : done ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                      {label}
                    </p>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Updates feed */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <p className="text-[#0F172A] text-sm font-semibold mb-4">Updates</p>
          <div className="space-y-3 mb-4">
            {updates.map(({ time, text, by }) => (
              <div key={time} className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#E5007D] text-xs font-semibold">{by}</span>
                  <span className="text-[#94A3B8] text-xs">{time}</span>
                </div>
                <p className="text-[#475569] text-sm">{text}</p>
              </div>
            ))}
          </div>
          
          {/* Add comment inline with updates */}
          <div className="flex gap-2 pt-3 border-t border-[#F1F5F9]">
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Reply to update..."
              className="flex-1 px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm placeholder:text-[#CBD5E1] outline-none focus:border-[#E5007D] focus:ring-2 focus:ring-[#E5007D]/20 transition"
            />
            <button className="w-11 h-11 bg-[#E5007D] rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-[#BE0067] active:scale-95 transition-all">
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText("Ticket #INC-3021 - Status: Engineer Assigned");
              alert("Ticket details copied to clipboard!");
            }}
            className="col-span-2 py-3 bg-[#E5007D] text-white rounded-xl text-sm font-semibold hover:bg-[#BE0067] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageSquare size={16} />
            Share Ticket
          </button>
          <button
            onClick={() => navigate("/outage/INC-2026-0045")}
            className="py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={14} />
            View Outage
          </button>
          <button
            onClick={() => navigate("/troubleshoot")}
            className="py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Re-Diagnose
          </button>
        </div>
      </div>
    </Layout>
  );
}
