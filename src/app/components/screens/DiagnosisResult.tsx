import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { AlertTriangle, CheckCircle, ExternalLink, Ticket } from "lucide-react";

const steps = [
  { done: true, text: "Connected to diagnostic server" },
  { done: true, text: "Read LED pattern (PWR on, LOS red, PON off)" },
  { done: true, text: "Cross-referenced with area outage database" },
  { done: true, text: "Matched known fiber-cut signature" },
];

export function DiagnosisResult() {
  const navigate = useNavigate();

  return (
    <Layout showBack backTo="/troubleshoot/zte" title="Diagnosis">
      <div className="px-4 py-5 space-y-4">
        {/* Result header */}
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] border-2 border-[#FECACA] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-[#DC2626]" />
          </div>
          <h1
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
            className="text-[#0F172A] text-2xl"
          >
            Fiber Signal Loss
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Issue identified with high confidence</p>
        </div>

        {/* Confidence card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#0F172A] text-sm font-semibold">Confidence Score</span>
            <span
              style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
              className="text-[#16A34A] text-xl"
            >
              95%
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#16A34A] to-[#4ADE80] transition-all"
              style={{ width: "95%" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#FEF2F2] rounded-xl p-3">
              <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Possible Cause</p>
              <p className="text-[#0F172A] text-sm font-semibold mt-1">Fiber Cut</p>
              <p className="text-[#DC2626] text-xs mt-0.5">PON line disruption</p>
            </div>
            <div className="bg-[#FFFBEB] rounded-xl p-3">
              <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Your Device</p>
              <p className="text-[#0F172A] text-sm font-semibold mt-1">Working OK</p>
              <p className="text-[#16A34A] text-xs mt-0.5">ONT hardware fine</p>
            </div>
          </div>
        </div>

        {/* Diagnosis steps */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <p className="text-[#0F172A] text-xs font-semibold mb-3 uppercase tracking-wide">Diagnostic Steps</p>
          <div className="space-y-2.5">
            {steps.map(({ done, text }) => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle size={14} className={done ? "text-[#16A34A]" : "text-[#CBD5E1]"} />
                <p className="text-[#475569] text-xs">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-[#EBF2FF] border border-[#BFDBFE] rounded-2xl p-4">
          <p className="text-[#1D4ED8] text-xs font-semibold uppercase tracking-wide mb-1">Recommended Action</p>
          <p className="text-[#1E40AF] text-sm font-medium">
            This is an infrastructure issue — not your equipment. Check the active outage in Ntinda for restoration ETA.
          </p>
        </div>

        {/* Action buttons */}
        <button
          onClick={() => navigate("/outage/INC-2026-0045")}
          className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={15} />
          View Outage Status
        </button>
        <button
          onClick={() => navigate("/ticket/3021")}
          className="w-full py-3 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl font-semibold text-sm hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2"
        >
          <Ticket size={15} />
          Open Support Ticket
        </button>
      </div>
    </Layout>
  );
}
