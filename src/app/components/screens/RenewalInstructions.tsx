import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { getCanalBoxPaymentLink } from "../../../lib/payments";
import {
  CheckCircle,
  Copy,
  Check,
  Smartphone,
  CreditCard,
  Link,
} from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";

type Method = "momo" | "airtel" | "paylink";

const methods: {
  id: Method;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: "momo",
    label: "MTN MoMo",
    icon: Smartphone,
    color: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  },
  {
    id: "airtel",
    label: "Airtel Money",
    icon: CreditCard,
    color: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
  },
  {
    id: "paylink",
    label: "PayLink",
    icon: Link,
    color: "bg-[#FCE7F3] text-[#E5007D] border-[#FBCFE8]",
  },
];

const momoSteps = [
  "Dial *261# and press call",
  "Select option 1 – Existing customer",
  "Enter your router serial number or registered phone number",
  "Choose your desired package",
  "Enter the number with money to pay or continue with the one being used",
  "Wait for confirmation message",
  "Confirm with your PIN",
];

const airtelSteps = [
  "Dial *261# and press call",
  "Select option 1 – Existing customer",
  "Enter your router serial number or registered phone number",
  "Choose your desired package",
  "Enter the number with money to pay or continue with the one being used",
  "Wait for confirmation message",
  "Confirm with your PIN",
];

function formatCurrency(amount: number) {
  return `UGX ${amount.toLocaleString()}`;
}

export function RenewalInstructions() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [method, setMethod] = useState<Method>("momo");
  const [copied, setCopied] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (!savedProfile) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const parsedProfile = JSON.parse(savedProfile) as CustomerProfile;
      setProfile(parsedProfile);
      setSerialNumber(parsedProfile.routerSerial ?? "");
    } catch (error) {
      console.error("Failed to load customer profile:", error);
      localStorage.removeItem("customerProfile");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile) {
    return (
      <Layout showBack backTo="/subscription" title="Renew Package">
        <div className="px-4 py-10 text-center text-[#64748B] text-sm">
          Loading renewal details...
        </div>
      </Layout>
    );
  }

  const steps = method === "momo" ? momoSteps : airtelSteps;
  const amountDue = formatCurrency(profile.packagePrice);
  const paymentLink = getCanalBoxPaymentLink(serialNumber || profile.routerSerial);

  return (
    <Layout showBack backTo="/subscription" title="Renew Package">
      <div className="px-4 py-5 space-y-4">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[#0F172A] text-2xl"
          >
            Renew Package
          </h1>

          <p className="text-[#64748B] text-sm mt-1">
            {profile.packageName} · {amountDue}
          </p>
        </div>

        {/* Amount due card */}
        <div className="bg-white border-2 border-[#E5007D] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[#64748B] text-xs uppercase tracking-wide">
              Amount Due
            </p>

            <p
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontWeight: 800,
              }}
              className="text-[#E5007D] text-3xl mt-0.5"
            >
              {amountDue}
            </p>

            <p className="text-[#94A3B8] text-xs mt-0.5">
              Renew before {profile.expiryDate}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[#94A3B8] text-xs">
              Router SN / Phone No.
            </p>

            <div className="flex items-center gap-1.5 mt-1">
              <p
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="text-[#0F172A] text-sm font-medium"
              >
                {profile.routerSerial}
              </p>

              <button
                type="button"
                onClick={() => copy(profile.routerSerial)}
                className="text-[#94A3B8] hover:text-[#E5007D]"
                title="Copy router serial"
              >
                {copied ? (
                  <Check size={13} className="text-[#16A34A]" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>

            <p className="text-[#94A3B8] text-[10px] mt-1">
              {profile.phone}
            </p>
          </div>
        </div>

        {/* Payment method tabs */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2.5">
            Pay Using
          </p>

          <div className="grid grid-cols-3 gap-2">
            {methods.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  method === id
                    ? color
                    : "border-[#E2E8F0] bg-white text-[#64748B]"
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] font-semibold text-center leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Steps or PayLink */}
        {method === "paylink" ? (
          <div className="space-y-3">
            <div className="bg-[#FCE7F3] border border-[#FBCFE8] rounded-2xl p-4">
              <p className="text-[#E5007D] text-sm font-semibold mb-1">
                PayLink — Online Payment
              </p>

              <p className="text-[#BE0067] text-xs mb-3">
                Confirm your router serial number to link and pay online.
              </p>

              <label className="text-[#475569] text-xs font-medium block mb-1.5">
                Router Serial Number
              </label>

              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder={profile.routerSerial}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="w-full px-3 py-2.5 bg-white border border-[#FBCFE8] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#E5007D] focus:ring-2 focus:ring-[#E5007D]/20 transition"
              />

              <p className="text-[#94A3B8] text-[10px] mt-1.5">
                This should match the router assigned to {profile.fullName}.
              </p>
            </div>

            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-[#16A34A]" />
              <p className="text-[#15803D] text-xs">
                Secure payment for {profile.packageName} — {amountDue}
              </p>
            </div>
              <a
                href={paymentLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!paymentLink) {
                    e.preventDefault();
                    alert("Payment link is not available for this router serial number.");
                  }
                }}
                className="block w-full py-3 bg-[#E5007D] hover:bg-[#BE0067] text-white rounded-xl font-semibold text-sm transition-colors active:scale-95 text-center"
              >
                Proceed to PayLink →
              </a>
          </div>
        ) : (
          <div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-0">
              <p className="text-[#0F172A] text-sm font-semibold mb-3">
                {method === "momo" ? "MTN MoMo Steps" : "Airtel Money Steps"}
              </p>

              {steps.map((step, i) => (
                <div
                  key={step}
                  className="flex items-start gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0"
                >
                  <div className="w-6 h-6 rounded-full bg-[#E5007D] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>

                  <p className="text-[#475569] text-sm">{step}</p>
                </div>
              ))}
            </div>

            {method === "momo" && (
              <div className="mt-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 flex items-start gap-2">
                <span className="text-base">📱</span>

                <p className="text-[#92400E] text-xs">
                  <span className="font-semibold">Quick dial:</span>{" "}
                  *261# → Existing Customer → {profile.routerSerial}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Auto-renew toggle */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[#0F172A] text-sm font-medium">
              Auto-Renewal Reminder
            </p>

            <p className="text-[#94A3B8] text-xs mt-0.5">
              Get SMS on {profile.phone} 3 days before expiry
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAutoRenew(!autoRenew)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              autoRenew ? "bg-[#16A34A]" : "bg-[#CBD5E1]"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                autoRenew ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {method !== "paylink" && (
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-semibold text-sm transition-colors"
          >
            I've Completed Payment ✓
          </button>
        )}
      </div>
    </Layout>
  );
}
