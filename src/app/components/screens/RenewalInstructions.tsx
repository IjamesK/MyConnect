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
    color: "bg-[var(--color-warning-soft)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]",
  },
  {
    id: "airtel",
    label: "Airtel Money",
    icon: CreditCard,
    color: "bg-[var(--color-danger-soft)] text-[var(--color-danger-strong)] border-[var(--color-danger-border)]",
  },
  {
    id: "paylink",
    label: "PayLink",
    icon: Link,
    color: "bg-[var(--color-surface-soft)] text-[var(--color-primary-text)] border-[var(--color-border)]",
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
        <div className="px-4 py-10 text-center text-[var(--color-muted)] text-sm">
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
            className="text-[var(--color-text)] text-2xl"
          >
            Renew Package
          </h1>

          <p className="text-[var(--color-muted)] text-sm mt-1">
            {profile.packageName} · {amountDue}
          </p>
        </div>

        {/* Amount due card */}
        <div className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[var(--color-muted)] text-xs uppercase tracking-wide">
              Amount Due
            </p>

            <p
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontWeight: 800,
              }}
              className="text-[var(--color-primary-text)] text-3xl mt-0.5"
            >
              {amountDue}
            </p>

            <p className="text-[var(--color-subtle-text)] text-xs mt-0.5">
              Renew before {profile.expiryDate}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[var(--color-subtle-text)] text-xs">
              Router SN / Phone No.
            </p>

            <div className="flex items-center gap-1.5 mt-1">
              <p
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="text-[var(--color-text)] text-sm font-medium"
              >
                {profile.routerSerial}
              </p>

              <button
                type="button"
                onClick={() => copy(profile.routerSerial)}
                className="text-[var(--color-subtle-text)] hover:text-[var(--color-primary-text)]"
                title="Copy router serial"
              >
                {copied ? (
                  <Check size={13} className="text-[var(--color-success-text)]" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>

            <p className="text-[var(--color-subtle-text)] text-[10px] mt-1">
              {profile.phone}
            </p>
          </div>
        </div>

        {/* Payment method tabs */}
        <div>
          <p className="text-[var(--color-text)] text-sm font-semibold mb-2.5">
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
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]"
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
            <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-2xl p-4">
              <p className="text-[var(--color-primary-text)] text-sm font-semibold mb-1">
                PayLink — Online Payment
              </p>

              <p className="text-[var(--color-primary-text)] text-xs mb-3">
                Confirm your router serial number to link and pay online.
              </p>

              <label className="text-[var(--color-muted)] text-xs font-medium block mb-1.5">
                Router Serial Number
              </label>

              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder={profile.routerSerial}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="w-full px-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-border)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
              />

              <p className="text-[var(--color-subtle-text)] text-[10px] mt-1.5">
                This should match the router assigned to {profile.fullName}.
              </p>
            </div>

            <div className="bg-[var(--color-success-soft)] border border-[var(--color-success-border)] rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-[var(--color-success-text)]" />
              <p className="text-[var(--color-success-strong)] text-xs">
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
                className="block w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm transition-colors active:scale-95 text-center"
              >
                Proceed to PayLink →
              </a>
          </div>
        ) : (
          <div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 space-y-0">
              <p className="text-[var(--color-text)] text-sm font-semibold mb-3">
                {method === "momo" ? "MTN MoMo Steps" : "Airtel Money Steps"}
              </p>

              {steps.map((step, i) => (
                <div
                  key={step}
                  className="flex items-start gap-3 py-2.5 border-b border-[var(--color-hover)] last:border-0"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>

                  <p className="text-[var(--color-muted)] text-sm">{step}</p>
                </div>
              ))}
            </div>

            {method === "momo" && (
              <div className="mt-3 bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] rounded-xl p-3 flex items-start gap-2">
                <span className="text-base">📱</span>

                <p className="text-[var(--color-warning-strong)] text-xs">
                  <span className="font-semibold">Quick dial:</span>{" "}
                  *261# → Existing Customer → {profile.routerSerial}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Auto-renew toggle */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[var(--color-text)] text-sm font-medium">
              Auto-Renewal Reminder
            </p>

            <p className="text-[var(--color-subtle-text)] text-xs mt-0.5">
              Get SMS on {profile.phone} 3 days before expiry
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAutoRenew(!autoRenew)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              autoRenew ? "bg-[var(--color-success-action)]" : "bg-[var(--color-border)]"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-[var(--color-surface)] rounded-full shadow transition-all ${
                autoRenew ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {method !== "paylink" && (
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 bg-[var(--color-success-action)] hover:bg-[var(--color-success-strong)] text-white rounded-xl font-semibold text-sm transition-colors"
          >
            I've Completed Payment ✓
          </button>
        )}
      </div>
    </Layout>
  );
}
