import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bot, X, Send, RotateCcw, Router } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { getUserProfile, type CustomerProfile } from "../../../lib/auth";
import type { CustomerTicket } from "../../../lib/tickets";
import { diagnoseRouterLights, normalizeRouterType, routerLightsFor, routerName, ticketTypeFromRouterPattern, type RouterType } from "../../../lib/routerTypes";

type Message = { role: "assistant" | "user"; text: string };
type Step = "start" | "scope" | "connection" | "device" | "lights" | "restart" | "speed" | "website" | "website_detail" | "password_kind" | "connected" | "packages" | "ticket" | "resolved";
type SupportSession = {
  messages: Message[];
  issue: string;
  symptom: string;
  step: Step;
  scope: string;
  connection: string;
  checks: string[];
  speed: string;
  lights: string;
  selectedLights: string[];
  router: RouterType | null;
  escalate: boolean;
};
type SupportContext = { profile: CustomerProfile | null; tickets: CustomerTicket[]; historyReady: boolean };
const INTRO = "Hello. I can help with your connection, Wi-Fi settings, packages, or a support report. I can read your MyConnect records, but I cannot test your line remotely. What would you like help with?";
const PLANS = [
  { name: "GO", speed: 50, price: 69000 },
  { name: "FIT", speed: 100, price: 90000 },
  { name: "START", speed: 200, price: 110000 },
  { name: "PREMIUM", speed: 300, price: 200000 },
];
const ISSUE_NAMES: Record<string, string> = {
  slow_speed: "Slow internet", no_internet: "Connection unavailable", los_light: "Red LOS / possible fibre signal problem",
  router_issue: "Router or Wi-Fi problem", password_reset: "Wi-Fi password reset request",
  payment_not_reflected: "Payment not reflected", other: "Other support request",
};
const RESTART = "Turn the router off using its power switch or power adapter. Wait 5 minutes, turn it on, and let the lights settle. Do not press RESET or touch the fibre connector.\n\nHas your connection returned to normal?";

function newSupportSession(): SupportSession {
  return { messages: [{ role: "assistant", text: INTRO }], issue: "other", symptom: "", step: "start", scope: "", connection: "", checks: [], speed: "", lights: "", selectedLights: [], router: null, escalate: false };
}

// Reject likely credential disclosures before they enter either the chat or report.
// This is a conservative safeguard, not a guarantee that arbitrary text is secret-free.
function containsCredential(value: string): boolean {
  return /(?:password|passphrase|pin|otp|verification code|recovery code|secret|api.?key|token)\s*(?:is\b|was\b|=|:)|\b(?:my|the) (?:password|passphrase|pin|otp)\s+\S*\d\S*|\bBearer\s+\S+|-----BEGIN .*PRIVATE KEY-----|\b\d{6}\b|\b\d{12,19}\b/i.test(value);
}

function reportSafe(value: string): string {
  if (containsCredential(value)) return "[Sensitive details omitted]";
  return value.replace(/https?:\/\/\S+/gi, "[link omitted]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email omitted]")
    .replace(/\b[A-Za-z0-9_=-]{32,}\b/g, "[long value omitted]").slice(0, 500);
}

function reply(state: SupportSession, text: string, patch: Partial<SupportSession> = {}): SupportSession {
  return { ...state, ...patch, messages: [...state.messages, { role: "assistant", text }] };
}

function escalateCase(state: SupportSession, reason: string): SupportSession {
  return reply(state, reason + "\n\nChoose “Review support report” below. You can check the details before submitting; no ticket has been sent yet.", { step: "ticket", escalate: true });
}

function planResponse(plan: typeof PLANS[number]): string {
  return `${plan.name}: ${plan.speed} Mbps at UGX ${plan.price.toLocaleString("en-UG")} per month. Support must confirm availability and any package change.`;
}

function supportTurn(previous: SupportSession, input: string, context: SupportContext): SupportSession {
  const raw = input.trim().slice(0, 500);
  if (!raw) return previous;
  if (containsCredential(raw)) return reply(previous, "That message appears to contain a password, code, or other sensitive value, so I have not added it to the conversation or report. Describe the problem without sharing credentials.");
  const text = raw.toLowerCase().replace(/[’‘]/g, "'");
  let state: SupportSession = { ...previous, messages: [...previous.messages, { role: "user", text: raw }] };
  const yes = /^(yes|yes please|yeah|yep|it works|working now|resolved|fixed|it's working|it is working)[.! ]*$/.test(text);
  const no = /^(no|nope|not yet|not working|still not working|still slow|still offline|same problem|no change|didn't work|did not work|not better|unresolved)[.! ]*$/.test(text);
  const unresolved = no || /\bstill\b|didn't (?:work|help)|did not (?:work|help)|not better|no change/.test(text);
  const isWifi = /wi[ -]?fi|wireless|wlan/.test(text);
  const isPassword = /password|passphrase|ssid|network name/.test(text);
  const passwordRequest = isPassword && /forgot|forgotten|lost|reset|change|update|rename|don't know|cannot remember|can't remember/.test(text);
  const los = /\bred (?:los|light)|\blos (?:is )?red|\blos light|fibre cut|fiber cut/.test(text) && !/los.{0,12}(?:not red|off)/.test(text);
  const slow = /\bslow\b|buffer|\blag\b|\bspeed\b/.test(text);
  const offline = /offline|no internet|disconnected|disconnects|can't (?:connect|go online)|cannot (?:connect|go online)|(?:internet|wi[ -]?fi|my router).*not working|connection.*down/.test(text);
  const website = /websites?|\bsites?\b|\bdns\b|err_name_not_resolved|access denied|\b403\b/.test(text);
  const missingWifi = /(?:wi[ -]?fi|wlan|network name).*(?:missing|gone|not showing|off)|can't see.*wi[ -]?fi/.test(text);

  // A new, explicit issue replaces old evidence. Follow-ups keep the active case.
  let detected = los ? "los_light" : passwordRequest ? (isWifi ? "password_reset" : "other")
    : /missing payment|payment not reflected|paid but/.test(text) ? "payment_not_reflected"
    : website ? "other" : slow ? "slow_speed" : offline ? "no_internet" : missingWifi ? "router_issue" : "";
  const newIssue = !!detected && (!previous.symptom || previous.step === "resolved" || (!unresolved && detected !== previous.issue));
  if (newIssue) state = { ...newSupportSession(), messages: state.messages, issue: detected, symptom: reportSafe(raw) };

  // Explicit requests can interrupt a diagnostic question without reinterpreting short answers.
  if (los) return escalateCase({ ...state, issue: "los_light", symptom: state.symptom || "Red LOS light reported", checks: [...state.checks, "Customer reports a red LOS light."] }, "A red LOS light can indicate loss of fibre signal; I cannot confirm a fibre cut remotely. Do not disconnect or bend the fibre cable. Use “Check router lights” to record the indicators, then report this to support.");
  if (passwordRequest) {
    if (!isWifi && !/login|myconnect|account/.test(text)) return reply(state, "Do you mean your Wi-Fi password or your MyConnect sign-in password? Do not type the password here.", { step: "password_kind" });
    if (!isWifi) return reply(state, "For your MyConnect sign-in password, use “Forgot password?” on the sign-in page and follow the email instructions. Never share the reset link or verification code here.", { step: "start" });
    if (/forgot|forgotten|lost|reset|don't know|can't remember|cannot remember/.test(text)) return escalateCase({ ...state, issue: "password_reset", symptom: "Customer needs a Wi-Fi password reset" }, "Support can help you recover access to your Wi-Fi. Do not press the router's RESET button or share your password here.");
    return reply(state, "Are you currently connected to your CanalBox Wi-Fi?", { issue: "router_issue", step: "connected", symptom: "Customer wants to change Wi-Fi settings" });
  }
  if (/\b(?:history|previous tickets|my tickets|my reports|past issues)\b/.test(text)) {
    if (!context.historyReady) return reply(state, "Your ticket history is not available yet. You can check it on the Support tickets page; I can still help troubleshoot.");
    if (!context.tickets.length) return reply(state, "There are no support tickets in the MyConnect records I loaded for your account. Reports made elsewhere may not appear here.");
    const recent = context.tickets[0];
    return reply(state, `Your latest recorded ticket is “${reportSafe(recent.title || "Support request")}” (${String(recent.status || "unknown").replace(/_/g, " ")}). Use “View my tickets” below to check its progress.`);
  }
  if (/\bmy (?:account|package|plan|subscription)\b|\bexpiry\b|\bexpire\b/.test(text) && !slow && !offline && !website) {
    const p = context.profile;
    return reply(state, p ? `Your recorded package: ${p.packageName || "not listed"}.\nAccount status: ${p.accountStatus || "not listed"}.\nExpiry: ${p.expiryDate || "not listed"}.\nThese are your saved MyConnect details, not a live line test.` : "Your customer profile is not available. I can still guide you, but support needs to confirm your account details.");
  }
  const plan = PLANS.find(p => new RegExp(`\\b${p.name.toLowerCase()}\\b`).test(text));
  const planIntent = /package|\bplans?\b|price|cost|upgrade|bundle/.test(text) || PLANS.some(p => text === p.name.toLowerCase());
  if (planIntent && !slow && !offline && !website) return reply(state, plan ? planResponse(plan) : PLANS.map(planResponse).join("\n\n") + "\n\nWhich package would you like to discuss?", { step: "packages" });
  if (/\b(?:human|agent|whatsapp|support person)\b|(?:create|open|report|submit).{0,20}(?:ticket|case|issue)/.test(text)) return escalateCase(state, "You can send this issue to the support team through MyConnect.");
  if (/\bpayment\b|\bbilling\b|\binvoice\b|\brenew/.test(text) && !website) return escalateCase({ ...state, issue: /missing|not reflected|paid but/.test(text) ? "payment_not_reflected" : "other", symptom: /missing|not reflected|paid but/.test(text) ? "Customer reports a payment not reflected" : "Customer has a billing or renewal question" }, "Finance needs to verify payment or renewal details. I cannot confirm receipt here. Keep your transaction reference for the report form; do not share a PIN or password.");

  if (state.step === "password_kind" && /wi[ -]?fi|wireless|login|myconnect|sign.?in/.test(text)) {
    if (isWifi) return escalateCase({ ...state, issue: "password_reset", symptom: "Customer needs a Wi-Fi password reset" }, "For a forgotten Wi-Fi password, request a support-assisted reset. Do not press the physical RESET button.");
    return reply(state, "Use “Forgot password?” on the MyConnect sign-in page. Follow the email instructions and keep the reset link private.", { step: "start" });
  }
  if (state.step === "connected" && (yes || no || /^(i am connected|connected)$/.test(text))) {
    if (no) return escalateCase({ ...state, issue: "password_reset" }, "You need access to your CanalBox connection to use its Wi-Fi settings portal. Support can help you regain access.");
    return reply(state, "While connected to CanalBox:\n1. Open https://my.canalbox.africa/login.\n2. Enter your router serial number, then choose ☰ → My Box → WiFi.\n3. Follow the portal's requirements for your network name and password, then save.\n4. Reconnect your devices using the new details.\n\nDo not share the password here. Did the change work?", { step: "device", checks: [...state.checks, "Customer was guided to the CanalBox Wi-Fi settings portal."] });
  }
  if ((state.step === "restart" || state.step === "device") && yes) return reply(state, "Good—your connection or Wi-Fi settings are working now. You do not need to create a ticket. If the problem returns, tell me what changed.", { step: "resolved", escalate: false, checks: [...state.checks, "Customer confirmed the problem was resolved."] });
  if ((state.step === "restart" || state.step === "device") && unresolved) return escalateCase({ ...state, checks: [...state.checks, state.step === "restart" ? "Customer says the power restart did not resolve the issue." : "Customer says the suggested device or Wi-Fi check did not resolve the issue."] }, "The problem is still present after that check. Support should investigate next.");
  if (state.step === "ticket" && (yes || unresolved)) return reply(state, "The report is ready to review. Choose “Review support report” below to check the details and submit it. If you already have a ticket, choose “View my tickets” instead.");

  if (state.step === "scope" && /all|every|one|only|single/.test(text)) {
    const one = /\bone\b|only|single/.test(text) && !/all|every/.test(text);
    state = { ...state, scope: one ? "One device" : "All tested devices" };
    if (one) return reply(state, "Move that device closer to the router and reconnect its Wi-Fi. Leave the router settings unchanged.\n\nDoes that device work normally now?", { step: "device", checks: [...state.checks, "Suggested moving the affected device closer and reconnecting Wi-Fi."] });
    return reply(state, "Are the affected devices connected by Wi-Fi, Ethernet cable, or both?", { step: "connection" });
  }
  if (state.step === "connection" && /wi[ -]?fi|ethernet|wired|cable|both/.test(text)) {
    const connection = /both/.test(text) ? "Wi-Fi and Ethernet" : /ethernet|wired|cable/.test(text) ? "Ethernet" : "Wi-Fi";
    return reply(state, "Run a test at https://www.speedtest.net/ with other downloads paused. For Wi-Fi, stay near the router. Enter download, upload and ping in the form below. If you cannot run a test, say “Can't run a test”.", { step: "speed", connection });
  }
  if (state.step === "speed" && /can't|cannot|unable|skip|no internet|offline/.test(text)) return reply(state, "We can continue without a speed test.\n\n" + RESTART, { step: "restart", checks: [...state.checks, "Customer could not provide a speed test."] });
  if (state.step === "website" && (yes || no)) return reply(state, yes ? "That suggests the problem may depend on the connection, but it does not prove an ISP fault. Try a private browser tab and another device.\n\nWhat website domain and error message do you see? Do not send a login link." : "If it also fails on mobile data, the website itself may be unavailable. Try a private browser tab.\n\nWhat website domain and error message do you see? Do not send a login link.", { step: "website_detail", checks: [...state.checks, yes ? "Customer says the website works on mobile data." : "Customer says the website also fails on mobile data."] });
  if (state.step === "website_detail" && !newIssue) return escalateCase({ ...state, checks: [...state.checks, "Website/error reported: " + reportSafe(raw)] }, "I have added those details. If the website still fails after the browser and device checks, support can investigate.");

  if (/\brestart\b|\breboot\b/.test(text)) return reply({ ...state, symptom: state.symptom || "Customer requested connection troubleshooting", issue: state.issue === "other" ? "no_internet" : state.issue }, RESTART, { step: "restart", checks: [...state.checks, "Suggested a safe power restart; awaiting customer outcome."] });
  if (unresolved && state.symptom) {
    if (state.step === "lights") return reply(state, "Please use “Check router lights” below to select the lights currently on. This will help decide the next step. If you cannot check, you can review a support report now.");
    return reply(state, RESTART, { step: "restart", checks: [...state.checks, "Customer reports the issue is still present."] });
  }
  if (website) return reply(state, "Does the affected website open using mobile data when it fails on CanalBox Wi-Fi?", { issue: "other", symptom: state.symptom || reportSafe(raw), step: "website" });
  if (slow) return reply(state, "Is the connection slow on all devices, or only one device?", { issue: "slow_speed", symptom: state.symptom || reportSafe(raw), step: "scope" });
  if (offline || missingWifi || /my router.*(?:not working|problem)|wi[ -]?fi.*not working/.test(text)) return reply(state, "Let's check the router indicators first. Open “Check router lights” below, confirm the router model, and select the lights that are on. Do not touch the fibre connector or press RESET.", { issue: missingWifi ? "router_issue" : "no_internet", symptom: state.symptom || reportSafe(raw), step: "lights" });
  if (yes || no) return reply(state, "I need a little more context. Is your internet slow, completely offline, or are you asking about Wi-Fi settings?");
  if (/^(hi|hello|hey|help)[!. ]*$/.test(text)) return reply(state, "Tell me what's wrong: slow internet, no connection, a website that won't open, or Wi-Fi settings. You can also ask about packages or your tickets.");
  if (state.step === "scope") return reply(state, "Is this happening on all devices or only one? You can choose an answer below.");
  if (state.step === "connection") return reply(state, "Are you using Wi-Fi, an Ethernet cable, or both?");
  if (state.step === "speed") return reply(state, "Please enter the measured download, upload and ping in the speed-test form, or say “Can't run a test”.");
  return reply(state, "I haven't understood that yet. Please describe what isn't working in one sentence—for example, “The internet disconnects every evening”. You can also choose a topic below.");
}

function recordSupportSpeed(state: SupportSession, values: string[], connection: string): SupportSession {
  const numbers = values.map(v => v.trim() === "" ? NaN : Number(v));
  if (numbers.length !== 3 || numbers.some(n => !Number.isFinite(n) || n < 0 || n > 100000)) return reply(state, "Enter valid numbers for download, upload and ping. Zero is allowed; leave no field blank.");
  const speed = `Customer-provided Speedtest.net result (not independently verified): download ${numbers[0]} Mbps, upload ${numbers[1]} Mbps, ping ${numbers[2]} ms, via ${connection === "Ethernet" ? "Ethernet" : "Wi-Fi"}.`;
  return reply(state, "I've added your results to the report. One test cannot establish the cause.\n\n" + RESTART, { speed, issue: "slow_speed", symptom: state.symptom || "Slow internet", step: "restart" });
}

function buildSupportReport(state: SupportSession): string {
  return [
    "Issue reported through MyConnect guided support",
    `Category: ${ISSUE_NAMES[state.issue] || ISSUE_NAMES.other}`,
    `Initial problem: ${reportSafe(state.symptom || "Customer requested support; add the problem description before submitting.")}`,
    state.scope && `Affected devices: ${state.scope}`,
    state.connection && `Connection: ${state.connection}`,
    state.lights && `Router indicators: ${state.lights}`,
    state.speed,
    ...state.checks.slice(-8).map(check => `Check: ${reportSafe(check)}`),
    "The assistant has not performed a live line test. Customer should review these details before submitting.",
  ].filter(Boolean).join("\n");
}

function supportChoices(step: Step): string[] {
  if (step === "scope") return ["All devices", "Only one device"];
  if (step === "connection") return ["Wi-Fi", "Ethernet", "Both"];
  if (["connected", "restart", "device", "website"].includes(step)) return ["Yes", "No"];
  if (step === "password_kind") return ["Wi-Fi password", "MyConnect login"];
  if (step === "speed") return ["Can't run a test"];
  if (step === "packages") return PLANS.map(p => p.name);
  return ["My internet is slow", "No internet", "Some websites won't open", "Change Wi-Fi password", "Packages & prices"];
}

export function AIChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SupportSession>(newSupportSession);
  const [draft, setDraft] = useState("");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [recordStatus, setRecordStatus] = useState("Loading your account…");
  const [lightsOpen, setLightsOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [speedValues, setSpeedValues] = useState(["", "", ""]);
  const [speedConnection, setSpeedConnection] = useState("Wi-Fi");
  const [handoffError, setHandoffError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const contextRef = useRef<SupportContext>({ profile, tickets, historyReady });
  contextRef.current = { profile, tickets, historyReady };
  const routerType = session.router ?? normalizeRouterType(profile?.routerType);
  const visibleLights = routerLightsFor(routerType);
  const buttonClass = "rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]";

  useEffect(() => {
    setSpeedValues(["", "", ""]); setSpeedConnection("Wi-Fi");
    setLightsOpen(false); setPreviewOpen(false);
  }, [session.symptom]);
  useEffect(() => {
    if (session.step === "speed") setSpeedConnection(session.connection === "Ethernet" ? "Ethernet" : "Wi-Fi");
  }, [session.step, session.connection]);

  function resetConversation() {
    setSession(newSupportSession());
    setDraft(""); setSpeedValues(["", "", ""]); setSpeedConnection("Wi-Fi");
    setLightsOpen(false); setTicketsOpen(false); setPreviewOpen(false); setHandoffError("");
  }

  useEffect(() => {
    let generation = 0;
    const stop = onAuthStateChanged(auth, async user => {
      const current = ++generation;
      resetConversation(); setProfile(null); setTickets([]); setHistoryReady(false);
      contextRef.current = { profile: null, tickets: [], historyReady: false };
      if (!user) { setRecordStatus("Sign in to read your account records"); return; }
      setRecordStatus("Loading your account…");
      try {
        const info = await getUserProfile(user.uid);
        if (generation !== current) return;
        setProfile(info);
        setRecordStatus(info ? "Account loaded; checking tickets…" : "Customer profile unavailable; general guidance available");
        const result = await getDocs(query(collection(db, "tickets"), where("customerUid", "==", user.uid)));
        if (generation !== current) return;
        const items = result.docs.map(d => ({ ...d.data(), id: d.id } as CustomerTicket));
        items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setTickets(items); setHistoryReady(true);
        setRecordStatus(`${info ? "Account linked" : "Profile unavailable"} · ${items.length} recorded ticket${items.length === 1 ? "" : "s"}`);
      } catch {
        if (generation === current) setRecordStatus("Some account records are unavailable; general guidance still works");
      }
    });
    return () => { generation++; stop(); };
  }, []);

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      setOpen(true);
      if (detail?.prompt) setSession(current => supportTurn(current, detail.prompt!, contextRef.current));
    }
    window.addEventListener("myconnect:open-ai", onOpen);
    return () => window.removeEventListener("myconnect:open-ai", onOpen);
  }, []);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [open, session.messages.length, lightsOpen, ticketsOpen, previewOpen]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select, a[href], [tabindex="0"]') || []).filter(el => el.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); launcherRef.current?.focus(); };
  }, [open]);

  function send(value = draft) {
    if (!value.trim()) return;
    setSession(current => supportTurn(current, value, contextRef.current));
    setDraft(""); setPreviewOpen(false); setHandoffError("");
  }

  function checkLights() {
    const pattern = diagnoseRouterLights(routerType, session.selectedLights, session.issue);
    const lights = `${routerName(routerType)}: ${visibleLights.filter(light => session.selectedLights.includes(light.id)).map(light => light.label).join(", ") || "no indicators selected"}`;
    const next = { ...session, lights, issue: ticketTypeFromRouterPattern(session.issue, pattern), symptom: session.symptom || "Customer requested router-light troubleshooting" };
    const signalProblem = ["zte_los_red", "zte_fiber_unclear", "zte_internet_off_noc", "alc_link_issue", "alc_auth_issue", "alc_internet_down"].includes(pattern);
    if (signalProblem) setSession(escalateCase(next, "The selected indicators may need a network-team check. I cannot confirm a line fault remotely. Do not handle the fibre connector."));
    else if (pattern.endsWith("no_power")) setSession(reply(next, "Check the wall socket and power adapter safely. Do not open the router.\n\nAre the power light and connection working now?", { step: "device", checks: [...next.checks, "Suggested checking the router power supply."] }));
    else if (pattern.endsWith("wifi_disabled")) setSession(reply(next, `The selected lights suggest Wi-Fi may be off. Briefly press the ${routerType === "zte_white" ? "Wi-Fi button on the wide side" : "WLAN button on the back"}. Do not press RESET or hold buttons down.\n\nHas the Wi-Fi network returned?`, { step: "device", checks: [...next.checks, "Suggested enabling Wi-Fi using the Wi-Fi/WLAN button."] }));
    else setSession(reply(next, "I've recorded the selected indicators. Lights alone cannot confirm the connection is healthy.\n\n" + RESTART, { step: "restart", checks: [...next.checks, "Suggested a power restart after recording router indicators."] }));
    setLightsOpen(false); setPreviewOpen(false);
  }

  function continueToReport() {
    const user = auth.currentUser;
    if (!user) { setHandoffError("Please sign in before preparing a support ticket."); return; }
    try {
      // This envelope is checked against the signed-in UID by ReportIssue.
      sessionStorage.setItem("myconnect:assistant-ticket-description", JSON.stringify({ version: 1, uid: user.uid, createdAt: Date.now(), description: buildSupportReport(session) }));
    } catch { setHandoffError("Your browser could not prepare the report. Please allow session storage and try again."); return; }
    setOpen(false);
    navigate(`/report-issue?mode=ticket&type=${encodeURIComponent(session.issue)}&source=assistant`);
  }

  return <>
    {!open && <button ref={launcherRef} type="button" aria-label="Open MyConnect support assistant" onClick={() => setOpen(true)} className="fixed z-[10000] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white shadow-xl lg:bottom-7 lg:right-7"><Bot size={20}/>Ask MyConnect</button>}
    {open && <div className="fixed inset-0 z-[10060] flex items-end justify-center bg-black/40 sm:items-center lg:items-end lg:justify-end lg:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="myconnect-assistant-title" className="flex h-[min(90dvh,740px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xl sm:rounded-3xl">
        <header className="flex shrink-0 items-center gap-2 bg-[var(--color-primary)] p-4 text-white">
          <Bot size={22}/><div className="flex-1"><h2 id="myconnect-assistant-title" className="font-bold">MyConnect Assistant</h2><p className="text-xs">Guided CanalBox support</p></div>
          <button type="button" aria-label="Start new conversation" onClick={resetConversation} className="rounded p-2"><RotateCcw size={18}/></button>
          <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)} className="rounded p-2"><X size={20}/></button>
        </header>
        <p className="shrink-0 border-b border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)]">{recordStatus}</p>
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--color-bg)] p-4">
          <div role="log" aria-label="Support conversation" aria-live="polite" aria-relevant="additions" className="space-y-3">
            {session.messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><p className={`max-w-[92%] whitespace-pre-line break-words rounded-2xl px-3 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] bg-[var(--color-surface)]"}`}>{message.text}</p></div>)}
          </div>
          {session.step === "connected" || (session.issue === "router_issue" && session.step === "device") ? <div className="flex flex-wrap gap-2">
            <a href="https://my.canalbox.africa/login" target="_blank" rel="noopener noreferrer" className={buttonClass}>Open CanalBox Wi-Fi settings ↗</a>
            {profile?.routerSerial && <button type="button" className={buttonClass} onClick={() => navigator.clipboard.writeText(profile.routerSerial).then(() => setSession(current => reply(current, "Router serial number copied."))).catch(() => setSession(current => reply(current, "Could not copy the serial number. You can find it in your account details.")))}>Copy router serial number</button>}
          </div> : null}
          {session.step === "speed" && <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <a href="https://www.speedtest.net/" target="_blank" rel="noopener noreferrer" className="text-sm font-bold underline">Open Speedtest.net ↗</a>
            <p className="text-xs text-[var(--color-muted)]">Enter your measured results. MyConnect cannot verify this test.</p>
            <div className="grid grid-cols-3 gap-2">{["Download Mbps", "Upload Mbps", "Ping ms"].map((label, index) => <label key={label} className="text-xs">{label}<input type="number" min="0" max="100000" step="any" value={speedValues[index]} onChange={event => setSpeedValues(current => current.map((value, i) => i === index ? event.target.value : value))} className="mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-input)] p-2"/></label>)}</div>
            <label className="block text-sm">Test connection <select value={speedConnection} onChange={event => setSpeedConnection(event.target.value)} className="ml-2 rounded border bg-[var(--color-input)] p-1"><option>Wi-Fi</option><option>Ethernet</option></select></label>
            <button type="button" className={buttonClass} onClick={() => setSession(current => recordSupportSpeed(current, speedValues, speedConnection))}>Use these test results</button>
          </div>}
          <div className="flex flex-wrap gap-2">{supportChoices(session.step).map(choice => <button type="button" key={choice} className={buttonClass} onClick={() => send(choice)}>{choice}</button>)}</div>
          <button type="button" className={buttonClass + " flex w-full items-center justify-center gap-2"} aria-expanded={lightsOpen} onClick={() => setLightsOpen(value => !value)}><Router size={16}/>{lightsOpen ? "Hide router lights" : "Check router lights"}</button>
          {lightsOpen && <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <label className="text-sm">Router model <select value={routerType === "alc_black" ? "alcl_black" : routerType} onChange={event => setSession(current => ({ ...current, router: event.target.value as RouterType, selectedLights: [], lights: "" }))} className="rounded border bg-[var(--color-input)] p-1"><option value="zte_white">White ZTE</option><option value="alcl_black">Black ALCL</option></select></label>
            <p className="text-xs">Confirm the model, then select every light that is currently on. Include LOS if it is red. Leave all unselected only if all lights are off.</p>
            <div className="flex flex-wrap gap-2">{visibleLights.map(light => <button key={light.id} type="button" aria-pressed={session.selectedLights.includes(light.id)} onClick={() => setSession(current => ({ ...current, selectedLights: current.selectedLights.includes(light.id) ? current.selectedLights.filter(id => id !== light.id) : [...current.selectedLights, light.id] }))} className={buttonClass + (session.selectedLights.includes(light.id) ? " bg-[var(--color-primary)] text-white" : "")}>{light.label}{session.selectedLights.includes(light.id) ? " ✓" : ""}</button>)}</div>
            <button type="button" className={buttonClass} onClick={checkLights}>Use selected lights</button>
          </div>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => { setPreviewOpen(value => !value); setHandoffError(""); }}>Review support report</button>
            <button type="button" className={buttonClass} onClick={() => setTicketsOpen(value => !value)}>View my tickets</button>
          </div>
          {ticketsOpen && <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><h3 className="font-semibold">Your recorded tickets</h3>{!historyReady ? <p className="text-sm">Ticket records are unavailable or still loading.</p> : !tickets.length ? <p className="text-sm">No tickets found for your account.</p> : tickets.slice(0, 15).map(ticket => <button key={ticket.id} type="button" className={buttonClass + " block w-full text-left"} onClick={() => { setOpen(false); navigate(`/ticket/${encodeURIComponent(ticket.id)}`); }}>{ticket.title || "Support request"} · {String(ticket.status || "unknown").replace(/_/g, " ")}</button>)}{tickets.length > 15 && <p className="text-xs">Showing your 15 most recent tickets.</p>}</div>}
          {previewOpen && <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><h3 className="font-semibold">Report preview</h3><p className="whitespace-pre-line break-words text-sm">{buildSupportReport(session)}</p><p className="text-xs">No ticket has been submitted. On the next page you can edit this description and add any missing details. Remove passwords or codes before submitting.</p>{handoffError && <p role="alert" className="text-sm text-[var(--color-danger-text)]">{handoffError}</p>}<button type="button" className={buttonClass} onClick={continueToReport}>Continue to report form</button></div>}
        </div>
        <form onSubmit={event => { event.preventDefault(); send(); }} className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="mb-2 text-xs text-[var(--color-muted)]">Keep passwords, PINs and verification codes private.</p>
          <div className="flex gap-2"><input ref={inputRef} aria-label="Message" autoComplete="off" value={draft} maxLength={500} onChange={event => setDraft(event.target.value)} placeholder="Describe the problem…" className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm"/><button type="submit" aria-label="Send message" disabled={!draft.trim()} className="rounded-xl bg-[var(--color-primary)] px-3 text-white disabled:opacity-50"><Send size={18}/></button></div>
        </form>
      </section>
    </div>}
  </>;
}

