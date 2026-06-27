import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { CheckCircle, Zap, RefreshCw } from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";

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

  const packages = [
    {
      name: currentPlanName,
      speed: currentPlanSpeed,
      price: profile.packagePrice.toLocaleString(),
      features: ["Unlimited Data", "Active Customer Account", "Customer Support"],
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
        <button
          type="button"
          onClick={() => navigate("/renewal")}
          className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Renew Package · {formatCurrency(profile.packagePrice)}
        </button>

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

        {/* Upgrade packages */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-3">
            Available Packages
          </p>

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

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeColor}`}
                      >
                        {badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                      <Zap size={12} className="text-[#F59E0B]" />
                      <span className="text-[#475569] text-sm">{speed}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[#94A3B8] text-xs">UGX / mo</p>
                    <p
                      style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }}
                      className="text-[#0F172A] text-lg"
                    >
                      {price}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-[#16A34A] flex-shrink-0" />
                      <span className="text-[#475569] text-xs">{feature}</span>
                    </div>
                  ))}
                </div>

                {!current && (
                  <button
                    type="button"
                    className="w-full mt-3 py-2 bg-[#E5007D] text-white rounded-xl text-xs font-semibold hover:bg-[#BE0067] transition-colors active:scale-95"
                  >
                    Upgrade to {name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

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
