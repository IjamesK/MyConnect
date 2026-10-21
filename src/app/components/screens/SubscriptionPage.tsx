import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { ArrowRight, Bot, CheckCircle2, ChevronDown, X, Zap, Users, RefreshCw } from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";

type InternetPlan = {
  name: string;
  speedMbps: number;
  monthlyPriceUGX: number;
  deviceRange: string;
  tagline: string;
  features: string[];
};

const INTERNET_PACKAGES: InternetPlan[] = [
  { name: "GO", speedMbps: 50, monthlyPriceUGX: 69000, deviceRange: "3–5", tagline: "Everyday essentials", features: ["Browsing and social media", "Video calls and HD streaming", "Ideal for lighter home use"] },
  { name: "FIT", speedMbps: 100, monthlyPriceUGX: 90000, deviceRange: "5–8", tagline: "For connected families", features: ["Work and online classes", "Multiple HD streams", "Balanced everyday household use"] },
  { name: "START", speedMbps: 200, monthlyPriceUGX: 110000, deviceRange: "8–12", tagline: "More room for everyone", features: ["4K streaming on compatible devices", "Gaming and larger downloads", "Busy homes and small teams"] },
  { name: "PREMIUM", speedMbps: 300, monthlyPriceUGX: 200000, deviceRange: "12–20", tagline: "For heavy internet use", features: ["Many concurrent connected devices", "High-bandwidth streaming and work", "Larger households and workspaces"] },
];

const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString("en-UG")}`;

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [selected, setSelected] = useState<InternetPlan | null>(null);
  const [assistantPending, setAssistantPending] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("customerProfile");
    if (!saved) { navigate("/", { replace: true }); return; }
    try { setProfile(JSON.parse(saved)); }
    catch { localStorage.removeItem("customerProfile"); navigate("/", { replace: true }); }
  }, [navigate]);

  useEffect(() => {
    if (!selected) return;
    const dismissOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", dismissOnEscape);
    return () => document.removeEventListener("keydown", dismissOnEscape);
  }, [selected]);

  function askAssistant(plan: InternetPlan) {
    // Future AI widget contract: listen for "myconnect:open-ai", call
    // event.preventDefault(), then open chat using event.detail.prompt.
    const event = new CustomEvent("myconnect:open-ai", {
      cancelable: true,
      detail: { topic: "package", packageName: plan.name, prompt: `Tell me more about the ${plan.name} package (${plan.speedMbps} Mbps, ${formatCurrency(plan.monthlyPriceUGX)}/month).` },
    });
    window.dispatchEvent(event);
    if (event.defaultPrevented) { setSelected(null); return; }
    setAssistantPending(true);
  }

  if (!profile) return <Layout title="Subscription" showBack backTo="/dashboard"><p className="px-4 py-10 text-sm text-[#64748B]">Loading subscription...</p></Layout>;

  const planName = profile.packageName.split(" ")[0] || profile.packageName;
  const currentPlan = INTERNET_PACKAGES.find((plan) => plan.name.toLowerCase() === planName.toLowerCase());

  return (
    <Layout title="Subscription" showBack backTo="/dashboard">
      <div className="px-4 py-4 space-y-4 pb-24">
        <div className="rounded-2xl bg-[#E5007D] p-4 text-white">
          <p className="text-[11px] uppercase tracking-wide text-white/80">Your current subscription</p>
          <div className="flex items-end justify-between gap-3 mt-1">
            <div><h1 className="text-2xl font-extrabold">{profile.packageName}</h1><p className="text-xs text-white/85 mt-1">{profile.accountStatus} · Expires {profile.expiryDate}</p></div>
            <div className="text-right shrink-0"><p className="text-[10px] text-white/80">Current monthly bill</p><p className="text-lg font-extrabold">{formatCurrency(profile.packagePrice)}</p></div>
          </div>
        </div>

        <button type="button" onClick={() => navigate("/renewal")} className="w-full py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold text-sm flex items-center justify-center gap-2"><RefreshCw size={15}/> Renew current package</button>

        <section aria-labelledby="packages-heading" className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div><p className="text-[10px] uppercase font-bold tracking-wider text-[#E5007D]">Explore plans</p><h2 id="packages-heading" className="font-extrabold text-xl text-[#0F172A]">Available packages</h2></div>
            <span className="text-xs rounded-full bg-[#FCE7F3] px-3 py-1 font-semibold text-[#BE0067]">4 packages</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {INTERNET_PACKAGES.map((plan) => (
              <button type="button" key={plan.name} onClick={() => { setSelected(plan); setAssistantPending(false); }}
                aria-label={`View ${plan.name} package details`}
                className={`min-w-0 text-left bg-white rounded-2xl border p-3 shadow-sm transition hover:border-[#E5007D] focus:outline-none focus:ring-2 focus:ring-[#E5007D] ${currentPlan?.name === plan.name ? "border-[#E5007D]" : "border-[#E2E8F0]"}`}>
                <div className="flex items-center justify-between gap-1"><p className="text-[11px] text-[#E5007D] font-extrabold">{plan.name}</p><ArrowRight size={13} className="text-[#94A3B8]"/></div>
                <p className="mt-1 text-2xl leading-none text-[#0F172A] font-extrabold">{plan.speedMbps}<span className="text-xs font-semibold"> Mbps</span></p>
                <p className="mt-2 text-sm text-[#0F172A] font-bold">{formatCurrency(plan.monthlyPriceUGX)}</p>
                <p className="text-[10px] text-[#64748B]">monthly · ~{plan.deviceRange} devices</p>
                <p className="mt-2 text-[11px] text-[#E5007D] font-semibold">View details →</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#64748B]">Device counts are estimates for mixed usage, not guaranteed limits. Tap a package to learn more.</p>
        </section>

        <details className="rounded-xl bg-white border border-[#E2E8F0] group">
          <summary className="cursor-pointer list-none flex items-center justify-between p-3 text-sm font-semibold text-[#0F172A]">More account details <ChevronDown size={16} className="text-[#64748B] group-open:rotate-180 transition"/></summary>
          <div className="border-t border-[#E2E8F0] px-3 pb-3 pt-2 grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-[#64748B]">Customer No.</p><p className="font-semibold break-all">{profile.customerNumber}</p></div>
            <div><p className="text-[#64748B]">Area</p><p className="font-semibold">{profile.area}</p></div>
            <div><p className="text-[#64748B]">Router model</p><p className="font-semibold">{profile.routerModel}</p></div>
            <div><p className="text-[#64748B]">Router serial</p><p className="font-semibold break-all">{profile.routerSerial}</p></div>
            <div><p className="text-[#64748B]">Customer</p><p className="font-semibold">{profile.fullName}</p></div>
            <div><p className="text-[#64748B]">Phone</p><p className="font-semibold">{profile.phone}</p></div>
          </div>
        </details>
      </div>

      {selected && <div className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center bg-[#0F172A]/55 p-0 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="package-dialog-heading" className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl max-h-[88vh] overflow-y-auto">
          <div className="flex justify-between items-start gap-2"><div><p className="text-[11px] font-bold text-[#E5007D] uppercase">Package details</p><h3 id="package-dialog-heading" className="text-2xl font-extrabold text-[#0F172A]">{selected.name}</h3></div><button type="button" aria-label="Close package details" onClick={() => setSelected(null)} className="rounded-full p-2 bg-[#F1F5F9]"><X size={18}/></button></div>
          <p className="text-xs text-[#64748B] mt-1">{selected.tagline}</p>
          <div className="mt-4 rounded-xl bg-[#FFF1F8] p-3 flex items-center justify-between gap-3"><div className="flex gap-2 items-center text-[#E5007D]"><Zap size={20}/><span className="font-extrabold text-xl text-[#0F172A]">{selected.speedMbps} Mbps</span></div><div className="text-right"><p className="font-bold text-[#0F172A]">{formatCurrency(selected.monthlyPriceUGX)}</p><p className="text-[10px] text-[#64748B]">per month</p></div></div>
          <p className="mt-4 flex gap-2 items-center text-sm font-semibold text-[#0F172A]"><Users size={17} className="text-[#E5007D]"/> Approx. {selected.deviceRange} devices</p>
          <div className="space-y-2 mt-3">{selected.features.map((feature) => <div key={feature} className="flex gap-2 items-start text-sm text-[#475569]"><CheckCircle2 size={16} className="text-[#16A34A] mt-0.5 shrink-0"/>{feature}</div>)}</div>
          <p className="mt-3 text-[11px] text-[#64748B]">Performance and number of devices depend on usage, router and network conditions. Package change requests require staff confirmation.</p>
          <button type="button" onClick={() => askAssistant(selected)} className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#E5007D] py-3 text-white font-semibold text-sm"><Bot size={17}/> Find out more</button>
          {assistantPending && <div className="mt-3 rounded-xl border border-[#FBCFE8] bg-[#FFF1F8] p-3 text-xs text-[#475569]">MyConnect AI is coming soon. In the meantime, you can ask the support team about {selected.name}.
            <button type="button" className="mt-2 w-full rounded-lg border border-[#E5007D] bg-white py-2 font-semibold text-[#BE0067]" onClick={() => navigate(`/report-issue?mode=ticket&type=package_change&package=${encodeURIComponent(selected.name)}`)}>Contact support instead</button>
          </div>}
        </div>
      </div>}
    </Layout>
  );
}
