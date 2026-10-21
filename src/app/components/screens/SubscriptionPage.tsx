import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { CheckCircle, MapPinned, Zap, RefreshCw, Users, Sparkles } from "lucide-react";

import type { CustomerProfile } from "../../../lib/auth";


const INTERNET_PACKAGES = [
  {
    name: "GO", speedMbps: 50, monthlyPriceUGX: 69000, deviceRange: "3–5",
    tagline: "Everyday browsing and streaming",
    features: ["Browsing, social media and video calls", "HD streaming and home Wi-Fi", "Great for individuals and smaller households"],
  },
  {
    name: "FIT", speedMbps: 100, monthlyPriceUGX: 90000, deviceRange: "5–8",
    tagline: "Balanced speed for a busy home",
    features: ["Work-from-home and video calls", "Streaming across multiple screens", "Ideal for families and shared spaces"],
    highlight: true,
  },
  {
    name: "START", speedMbps: 200, monthlyPriceUGX: 110000, deviceRange: "8–12",
    tagline: "Power up connected households",
    features: ["Multiple HD or 4K streams", "Online gaming and large downloads", "Great for larger homes and teams"],
  },
  {
    name: "PREMIUM", speedMbps: 300, monthlyPriceUGX: 200000, deviceRange: "12–20",
    tagline: "Top-tier connectivity for heavy use",
    features: ["High-bandwidth use across many devices", "4K streaming, calls and gaming", "For large families and busy workspaces"],
  },
];


function formatCurrency(amount: number) {
  return `UGX ${amount.toLocaleString()}`;
}

function getPlanName(packageName: string) {
  return packageName.split(" ")[0] || packageName;
}

function getPlanSpeed(packageName: string) {
  const planName = getPlanName(packageName);
  return packageName.replace(planName, "").trim() || "Active Plan";
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (!savedProfile) {
      navigate("/", { replace: true });
      return;
    }

    try {
      setProfile(JSON.parse(savedProfile));
    } catch (error) {
      console.error("Failed to load customer profile:", error);
      localStorage.removeItem("customerProfile");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (!profile) {
    return (
      <Layout title="Subscription" showBack backTo="/dashboard">
        <div className="px-4 py-10 text-center text-[#64748B] text-sm">
          Loading subscription details...
        </div>
      </Layout>
    );
  }

  const currentPlanName = getPlanName(profile.packageName);
  const currentPlanSpeed = getPlanSpeed(profile.packageName);

  const listedCurrentPlan = INTERNET_PACKAGES.find(
    (plan) => plan.name.toLowerCase() === currentPlanName.toLowerCase()
  );
  // Display the saved subscription as-is until the customer record is updated.
  // Published package prices do not automatically change a customer's bill.
  const packages = INTERNET_PACKAGES;

  const billingHistory = [
    {
      date: "Current Cycle",
      amount: profile.packagePrice.toLocaleString(),
      method: "Pending / Latest",
      status: profile.accountStatus === "active" ? "Active" : profile.accountStatus,
    },
  ];

  return (
    <Layout title="Subscription" showBack backTo="/dashboard">
      <div className="px-4 py-5 space-y-5">
        <h1
          style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
          className="text-[#0F172A] text-2xl"
        >
          Subscription
        </h1>

        {/* Current plan hero */}
        <div className="bg-[#E5007D] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-6 translate-x-6" />

          <p className="text-white/80 text-xs uppercase tracking-wide">
            Current Package
          </p>

          <div className="flex items-end justify-between mt-1 mb-4">
            <div>
              <p
                style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
                className="text-3xl"
              >
                {currentPlanName}
              </p>

              <div className="flex items-center gap-1.5 mt-1">
                <Zap size={12} className="text-[#FCD34D]" />
                <span className="text-white/80 text-sm">
                  {currentPlanSpeed}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-white/80 text-xs">Monthly</p>
              <p
                style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }}
                className="text-xl"
              >
                {formatCurrency(profile.packagePrice)}
              </p>
            </div>
          </div>

          <div className="border-t border-white/20 pt-3 pb-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/80 text-[10px] uppercase tracking-wide">
                Customer No.
              </p>
              <p className="font-semibold text-[#FCD34D]">
                {profile.customerNumber}
              </p>
            </div>

            <div className="text-right">
              <p className="text-white/80 text-[10px] uppercase tracking-wide">
                Area
              </p>
              <p className="font-semibold">{profile.area}</p>
            </div>

            <div>
              <p className="text-white/80 text-[10px] uppercase tracking-wide">
                Router SN
              </p>
              <p
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="font-semibold"
              >
                {profile.routerSerial}
              </p>
            </div>

            <div className="text-right">
              <p className="text-white/80 text-[10px] uppercase tracking-wide">
                Expiry
              </p>
              <p className="font-semibold">{profile.expiryDate}</p>
            </div>

            <div>
              <p className="text-white/80 text-[10px] uppercase tracking-wide">
                Router Model
              </p>
              <p className="font-semibold">{profile.routerModel}</p>
            </div>

            <div className="text-right">
              <p className="text-white/80 text-[10px] uppercase tracking-wide">
                Status
              </p>
              <p className="font-semibold capitalize">{profile.accountStatus}</p>
            </div>
          </div>
        </div>

        {/* Renew CTA */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate("/renewal")}
            className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Renew Package · {formatCurrency(profile.packagePrice)}
          </button>

          <div className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <span className="font-semibold text-[#0F172A]">Pay with:</span>
            <span className="px-2 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] font-semibold">MTN MoMo</span>
            <span className="px-2 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] font-semibold">Airtel Money</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EBF2FF] flex items-center justify-center shrink-0">
            <MapPinned size={18} className="text-[#0057B8]" />
          </div>
          <div className="flex-1">
            <p className="text-[#0F172A] text-sm font-semibold">
              Moving to a new place?
            </p>
            <p className="text-[#64748B] text-xs mt-1 leading-relaxed">
              Send your new-location coordinates so staff can confirm service availability.
            </p>
            <button
              type="button"
              onClick={() => navigate("/report-issue?mode=ticket&type=move_eligibility")}
              className="mt-3 px-3 py-2 bg-[#E5007D] text-white rounded-xl text-xs font-semibold"
            >
              Send move location
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
          <p className="text-[#0F172A] text-sm font-semibold">
            Account Information
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[#94A3B8] text-xs">Customer</p>
              <p className="text-[#0F172A] font-medium">{profile.fullName}</p>
            </div>

            <div>
              <p className="text-[#94A3B8] text-xs">Phone</p>
              <p className="text-[#0F172A] font-medium">{profile.phone}</p>
            </div>

            <div>
              <p className="text-[#94A3B8] text-xs">District</p>
              <p className="text-[#0F172A] font-medium">{profile.district}</p>
            </div>

            <div>
              <p className="text-[#94A3B8] text-xs">Address</p>
              <p className="text-[#0F172A] font-medium">{profile.address}</p>
            </div>
          </div>
        </div>

        {/* Usage meter */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#0F172A] text-sm font-semibold">
              Data Usage This Month
            </p>
            <span className="text-[#64748B] text-xs">Unlimited</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full w-[62%] bg-gradient-to-r from-[#E5007D] to-[#F472B6] rounded-full" />
            </div>

            <span className="text-[#0F172A] text-sm font-semibold">
              248 GB
            </span>
          </div>

          <p className="text-[#94A3B8] text-xs mt-1.5">
            Used this billing cycle
          </p>
        </div>

        {/* Updated package catalogue */}
        <section aria-labelledby="packages-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[#E5007D] text-[11px] uppercase tracking-wider font-bold">Find your fit</p>
              <h2 id="packages-heading" className="text-[#0F172A] text-xl font-extrabold">Available Packages</h2>
            </div>
            <span className="rounded-full bg-[#FCE7F3] px-3 py-1 text-[11px] font-semibold text-[#BE0067]">4 plans</span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">Choose the speed that suits your household or workspace. Device estimates assume everyday mixed use; actual performance depends on activity and network conditions.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {packages.map((plan) => {
              const isCurrent = listedCurrentPlan?.name === plan.name;
              return (
                <article key={plan.name} className={`relative overflow-hidden rounded-2xl border-2 p-4 ${isCurrent ? "border-[#E5007D] bg-[#FFF1F8]" : "border-[#E2E8F0] bg-white"}`}>
                  {plan.highlight && <span className="absolute right-0 top-0 rounded-bl-xl bg-[#E5007D] px-3 py-1 text-[10px] font-bold text-white">Most popular</span>}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#0F172A] text-xl font-extrabold">{plan.name}</h3>
                        {isCurrent && <span className="rounded-full bg-[#E5007D] px-2 py-0.5 text-[10px] font-bold text-white">Your plan</span>}
                      </div>
                      <p className="text-[#64748B] text-xs mt-1">{plan.tagline}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] p-3 mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[#E5007D]">
                      <Zap size={18} />
                      <span className="font-extrabold text-xl text-[#0F172A]">{plan.speedMbps} <span className="text-sm">Mbps</span></span>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#0F172A]">{formatCurrency(plan.monthlyPriceUGX)}</p>
                      <p className="text-[10px] text-[#64748B]">per month</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center rounded-lg bg-[#F0FDF4] p-2.5 mb-3 text-[#166534]">
                    <Users size={16} className="shrink-0" />
                    <span className="text-xs font-semibold">Around {plan.deviceRange} devices (estimate)</span>
                  </div>
                  <div className="space-y-2">
                    {plan.features.map((feature) => <div key={feature} className="flex items-start gap-2 text-[#475569] text-xs"><CheckCircle size={14} className="text-[#16A34A] shrink-0 mt-0.5" />{feature}</div>)}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/report-issue?mode=ticket&type=package_change&package=${encodeURIComponent(plan.name)}`)}
                    className={`mt-4 w-full rounded-xl py-2.5 text-xs font-semibold transition-colors ${isCurrent ? "border border-[#E5007D] text-[#BE0067] bg-white" : "bg-[#E5007D] text-white hover:bg-[#BE0067]"}`}
                  >
                    {isCurrent ? "Ask about this package" : `Enquire about ${plan.name}`}
                  </button>
                </article>
              );
            })}
          </div>
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#64748B]"><Sparkles size={14} className="shrink-0 text-[#E5007D]" /> Published plans are for enquiries. Your current subscription and renewal amount are based on your account record until staff updates them.</p>
        </section>

        {/* Billing history */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-3">
            Billing History
          </p>

          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
            {billingHistory.map(({ date, amount, method, status }) => (
              <div key={date} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[#0F172A] text-sm font-medium">{date}</p>
                  <p className="text-[#94A3B8] text-xs">{method}</p>
                </div>

                <div className="text-right">
                  <p className="text-[#0F172A] text-sm font-semibold">
                    UGX {amount}
                  </p>

                  <span className="text-[10px] px-1.5 py-0.5 bg-[#F0FDF4] text-[#15803D] rounded-full font-medium capitalize">
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
