import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { ChevronRight, Bot, CheckCircle2, ChevronDown, X, Zap, Users, RefreshCw } from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";
import { INTERNET_PACKAGES, type InternetPlan } from "../../../lib/packages";

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

  if (!profile) return <Layout title="Subscription" showBack backTo="/dashboard"><p className="px-4 py-10 text-sm text-[var(--color-muted)]">Loading subscription...</p></Layout>;

  const planName = profile.packageName.split(" ")[0] || profile.packageName;
  const currentPlan = INTERNET_PACKAGES.find((plan) => plan.name.toLowerCase() === planName.toLowerCase());

  return (
    <Layout title="Subscription" showBack backTo="/dashboard">
      <div className="px-4 py-5 space-y-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch">
        <div className="min-w-0 rounded-2xl bg-[var(--color-primary)] p-4 text-white sm:p-5">
          <p className="text-[11px] uppercase tracking-wide text-white/80">Your current subscription</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0"><h1 className="break-words text-2xl font-extrabold">{profile.packageName}</h1><p className="mt-1 text-xs text-white/85">{profile.accountStatus} · Expires {profile.expiryDate}</p></div>
            <div className="shrink-0 lg:text-right"><p className="text-[10px] text-white/80">Current monthly bill</p><p className="text-lg font-extrabold">{formatCurrency(profile.packagePrice)}</p></div>
          </div>
        </div>

        <button type="button" onClick={() => navigate("/renewal")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-success-action)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-success-strong)] lg:w-48 lg:flex-col lg:gap-2 lg:rounded-2xl"><RefreshCw size={18}/> Renew package</button>
        </div>

        <section aria-labelledby="packages-heading" className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div><p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-primary-text)]">Explore plans</p><h2 id="packages-heading" className="font-extrabold text-xl text-[var(--color-text)]">Available packages</h2></div>
            <span className="text-xs rounded-full bg-[var(--color-surface-soft)] px-3 py-1 font-semibold text-[var(--color-primary-text)]">4 packages</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
            {INTERNET_PACKAGES.map((plan) => (
              <button type="button" key={plan.name} onClick={() => { setSelected(plan); setAssistantPending(false); }}
                aria-label={`View ${plan.name} package details`}
                className={`group flex min-w-0 flex-col rounded-2xl border bg-[var(--color-surface)] p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] sm:p-4 ${currentPlan?.name === plan.name ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"}`}>
                <div className="flex min-w-0 items-center justify-between gap-1"><p className="text-xs font-extrabold tracking-wide text-[var(--color-primary-text)]">{plan.name}</p>{currentPlan?.name === plan.name && <span className="rounded-full bg-[var(--color-surface-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--color-primary-text)]">Current</span>}</div>
                <p className="mt-2 text-2xl font-extrabold leading-none text-[var(--color-text)] sm:text-[28px]">{plan.speedMbps}<span className="ml-1 text-xs font-semibold">Mbps</span></p>
                <p className="mt-3 break-words text-[13px] font-bold text-[var(--color-text)] sm:text-sm">{formatCurrency(plan.monthlyPriceUGX)}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-[var(--color-muted)] sm:text-xs">Monthly · ~{plan.deviceRange} devices</p>
                <div className="mt-auto flex min-w-0 items-center gap-1 pt-4 text-xs font-bold text-[var(--color-primary-text)] sm:text-sm"><span className="sm:hidden">Details</span><span className="hidden sm:inline">View details</span><ChevronRight aria-hidden="true" size={17} className="shrink-0 transition-transform group-hover:translate-x-0.5"/></div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-muted)]">Device counts are estimates for mixed usage, not guaranteed limits. Tap a package to learn more.</p>
        </section>

        <details className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] group">
          <summary className="cursor-pointer list-none flex items-center justify-between p-3 text-sm font-semibold text-[var(--color-text)]">More account details <ChevronDown size={16} className="text-[var(--color-muted)] group-open:rotate-180 transition"/></summary>
          <div className="border-t border-[var(--color-border)] px-3 pb-3 pt-2 grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-[var(--color-muted)]">Customer No.</p><p className="font-semibold break-all">{profile.customerNumber}</p></div>
            <div><p className="text-[var(--color-muted)]">Area</p><p className="font-semibold">{profile.area}</p></div>
            <div><p className="text-[var(--color-muted)]">Router model</p><p className="font-semibold">{profile.routerModel}</p></div>
            <div><p className="text-[var(--color-muted)]">Router serial</p><p className="font-semibold break-all">{profile.routerSerial}</p></div>
            <div><p className="text-[var(--color-muted)]">Customer</p><p className="font-semibold">{profile.fullName}</p></div>
            <div><p className="text-[var(--color-muted)]">Phone</p><p className="font-semibold">{profile.phone}</p></div>
          </div>
        </details>
      </div>

      {selected && <div className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center bg-[var(--color-text)]/55 p-0 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="package-dialog-heading" className="w-full max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-[var(--color-surface)] p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
          <div className="flex justify-between items-start gap-2"><div><p className="text-[11px] font-bold text-[var(--color-primary-text)] uppercase">Package details</p><h3 id="package-dialog-heading" className="text-2xl font-extrabold text-[var(--color-text)]">{selected.name}</h3></div><button type="button" aria-label="Close package details" onClick={() => setSelected(null)} className="rounded-full p-2 bg-[var(--color-hover)]"><X size={18}/></button></div>
          <p className="text-xs text-[var(--color-muted)] mt-1">{selected.tagline}</p>
          <div className="mt-4 rounded-xl bg-[var(--color-surface-soft)] p-3 flex items-center justify-between gap-3"><div className="flex gap-2 items-center text-[var(--color-primary-text)]"><Zap size={20}/><span className="font-extrabold text-xl text-[var(--color-text)]">{selected.speedMbps} Mbps</span></div><div className="text-right"><p className="font-bold text-[var(--color-text)]">{formatCurrency(selected.monthlyPriceUGX)}</p><p className="text-[10px] text-[var(--color-muted)]">per month</p></div></div>
          <p className="mt-4 flex gap-2 items-center text-sm font-semibold text-[var(--color-text)]"><Users size={17} className="text-[var(--color-primary-text)]"/> Approx. {selected.deviceRange} devices</p>
          <div className="space-y-2 mt-3">{selected.features.map((feature) => <div key={feature} className="flex gap-2 items-start text-sm text-[var(--color-muted)]"><CheckCircle2 size={16} className="text-[var(--color-success-text)] mt-0.5 shrink-0"/>{feature}</div>)}</div>
          <p className="mt-3 text-[11px] text-[var(--color-muted)]">Performance and number of devices depend on usage, router and network conditions. Package change requests require staff confirmation.</p>
          <button type="button" onClick={() => askAssistant(selected)} className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-white font-semibold text-sm"><Bot size={17}/> Find out more</button>
          {assistantPending && <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3 text-xs text-[var(--color-muted)]">MyConnect AI is coming soon. In the meantime, you can ask the support team about {selected.name}.
            <button type="button" className="mt-2 w-full rounded-lg border border-[var(--color-primary)] bg-[var(--color-surface)] py-2 font-semibold text-[var(--color-primary-text)]" onClick={() => navigate(`/report-issue?mode=ticket&type=package_change&package=${encodeURIComponent(selected.name)}`)}>Contact support instead</button>
          </div>}
        </div>
      </div>}
    </Layout>
  );
}
