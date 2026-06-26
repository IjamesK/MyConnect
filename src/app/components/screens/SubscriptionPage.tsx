import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { CheckCircle, Zap, RefreshCw } from "lucide-react";

const packages = [
  {
    name: "FIT",
    speed: "50 Mbps",
    price: "90,000",
    features: ["Unlimited Data", "1 Static IP", "Free Installation"],
    current: true,
    color: "border-[#E5007D] bg-[#FCE7F3]",
    badge: "Your Plan",
    badgeColor: "bg-[#E5007D] text-white",
  },
  {
    name: "Standard",
    speed: "100 Mbps",
    price: "110,000",
    features: ["Unlimited Data", "2 Static IPs", "Free Installation"],
    current: false,
    color: "border-[#E2E8F0] bg-white",
    badge: "Popular",
    badgeColor: "bg-[#F0FDF4] text-[#15803D]",
  },
  {
    name: "Premium",
    speed: "200 Mbps",
    price: "200,000",
    features: ["Unlimited Data", "5 Static IPs", "Priority Support"],
    current: false,
    color: "border-[#E2E8F0] bg-white",
    badge: "Best Value",
    badgeColor: "bg-[#FFFBEB] text-[#B45309]",
  },
];

const billingHistory = [
  { date: "Jun 1, 2026", amount: "90,000", method: "MTN MoMo", status: "Paid" },
  { date: "May 1, 2026", amount: "90,000", method: "MTN MoMo", status: "Paid" },
  { date: "Apr 1, 2026", amount: "90,000", method: "Airtel Money", status: "Paid" },
];

export function SubscriptionPage() {
  const navigate = useNavigate();

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
          <p className="text-white/80 text-xs uppercase tracking-wide">Current Package</p>
          <div className="flex items-end justify-between mt-1 mb-4">
            <div>
              <p
                style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
                className="text-3xl"
              >
                FIT
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Zap size={12} className="text-[#FCD34D]" />
                <span className="text-white/80 text-sm">50 Mbps</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs">Monthly</p>
              <p style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }} className="text-xl">
                UGX 90,000
              </p>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-3 pb-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/80 text-[10px] uppercase tracking-wide">KAM Number</p>
              <p className="font-semibold text-[#FCD34D]">KAM-8924</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-[10px] uppercase tracking-wide">Zone Area</p>
              <p className="font-semibold">Ntinda</p>
            </div>
            <div>
              <p className="text-white/80 text-[10px] uppercase tracking-wide">Router SN</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="font-semibold">ZTEGD1234567</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-[10px] uppercase tracking-wide">Expiry</p>
              <p className="font-semibold">Jun 30, 2026</p>
            </div>
          </div>
        </div>

        {/* Renew CTA */}
        <button
          onClick={() => navigate("/renewal")}
          className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Renew Package · UGX 90,000
        </button>

        {/* Usage meter */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#0F172A] text-sm font-semibold">Data Usage This Month</p>
            <span className="text-[#64748B] text-xs">Unlimited</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full w-[62%] bg-gradient-to-r from-[#E5007D] to-[#F472B6] rounded-full" />
            </div>
            <span className="text-[#0F172A] text-sm font-semibold">248 GB</span>
          </div>
          <p className="text-[#94A3B8] text-xs mt-1.5">Used this billing cycle</p>
        </div>

        {/* Upgrade packages */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-3">Available Packages</p>
          <div className="space-y-3">
            {packages.map(({ name, speed, price, features, current, color, badge, badgeColor }) => (
              <div key={name} className={`border-2 rounded-2xl p-4 ${color}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
                        className="text-[#0F172A] text-lg"
                      >
                        {name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeColor}`}>{badge}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Zap size={12} className="text-[#F59E0B]" />
                      <span className="text-[#475569] text-sm">{speed}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#94A3B8] text-xs">UGX / mo</p>
                    <p style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }} className="text-[#0F172A] text-lg">
                      {price}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-[#16A34A] flex-shrink-0" />
                      <span className="text-[#475569] text-xs">{f}</span>
                    </div>
                  ))}
                </div>
                {!current && (
                  <button className="w-full mt-3 py-2 bg-[#E5007D] text-white rounded-xl text-xs font-semibold hover:bg-[#BE0067] transition-colors active:scale-95">
                    Upgrade to {name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Billing history */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-3">Billing History</p>
          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
            {billingHistory.map(({ date, amount, method, status }) => (
              <div key={date} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[#0F172A] text-sm font-medium">{date}</p>
                  <p className="text-[#94A3B8] text-xs">{method}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#0F172A] text-sm font-semibold">UGX {amount}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#F0FDF4] text-[#15803D] rounded-full font-medium">{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
