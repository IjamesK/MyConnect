import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ChevronRight,
  CreditCard,
  KeyRound,
  Power,
  Router,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { Layout } from "../isp/Layout";

const selfHelpItems = [
  {
    icon: KeyRound,
    title: "How to change Wi-Fi password",
    body: "Approved step-by-step router instructions will appear here once you provide them.",
    action: "Request password reset",
    path: "/report-issue?mode=ticket&type=password_reset&source=self_help",
  },
  {
    icon: Router,
    title: "Understand router lights",
    body: "See what POWER, PON, LOS, INTERNET, WiFi, WLAN, AUTH, LINK, and LAN lights usually mean.",
    action: "Check router lights",
    path: "/troubleshoot/zte?issue=router_issue",
  },
  {
    icon: Power,
    title: "Restart router safely",
    body: "Turn the router off for about 5 minutes, then turn it back on and wait for the lights to stabilize.",
    action: "Report if still failing",
    path: "/report-issue",
  },
  {
    icon: CreditCard,
    title: "Payment and renewal help",
    body: "View renewal instructions and payment details for your account.",
    action: "Open renewal",
    path: "/renewal",
  },
];

const safetyTips = [
  "Do not share your Wi-Fi password with too many people.",
  "Keep your router in an open place, not inside a cupboard.",
  "Avoid sharing OTPs or payment details with unknown callers.",
  "Use 5GHz Wi-Fi when close to the router and 2.4GHz when farther away.",
];

export function Troubleshooter() {
  const navigate = useNavigate();

  const currentTip = useMemo(() => {
    const index = Math.floor(Date.now() / 86_400_000) % safetyTips.length;
    return safetyTips[index];
  }, []);

  return (
    <Layout showBack backTo="/dashboard" title="Self Help">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[var(--color-text)] text-2xl"
          >
            Self Help
          </h1>

          <p className="text-[var(--color-muted)] text-sm mt-1">
            Simple guides for common Wi-Fi, router, payment, and account questions.
          </p>
        </div>

        <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-2xl p-4 flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0">
            <ShieldCheck size={19} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-[var(--color-text)] text-sm font-bold">
              Quick tip
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
              {currentTip}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {selfHelpItems.map(({ icon: Icon, title, body, action, path }) => (
            <div
              key={title}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
                  <Icon size={19} className="text-[var(--color-primary)]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[var(--color-text)] text-sm font-bold">
                    {title}
                  </p>
                  <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(path)}
                className="mt-3 w-full py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {action}
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
              <Wifi size={19} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-[var(--color-text)] text-sm font-bold">
                Need support instead?
              </p>
              <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
                Use Report a Problem when you want support to create or track a ticket.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/report-issue")}
            className="mt-3 w-full py-2.5 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <AlertCircle size={14} />
            Report a Problem
          </button>
        </div>
      </div>
    </Layout>
  );
}
