import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bot, X, Send, Headphones, RotateCcw, Router } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { getUserProfile, type CustomerProfile } from "../../../lib/auth";
import type { CustomerTicket } from "../../../lib/tickets";
import { RE, classifyIssueType, maskPersonalData, redactSecrets } from "../../../lib/assistantRules";
import { askAssistant } from "../../../lib/assistantClient";
import { diagnoseRouterLights, normalizeRouterType, routerLightsFor, routerName, routerPatternLabel, ticketTypeFromRouterPattern, type RouterType } from "../../../lib/routerTypes";

type Message = { role: "assistant" | "user"; text: string; chips?: string[] };
type AIEvent = CustomEvent<{ prompt?: string; packageName?: string }>;
const INTRO = "Welcome to MyConnect CanalBox support. I can check your recorded account and issues, guide you using the lights on your router, explain packages, and help you report an unresolved fault. What seems wrong?";
const PLANS = [
  { name: "GO", speed: 50, price: 69000, devices: "3–5", use: "everyday browsing, messaging and HD streaming" },
  { name: "FIT", speed: 100, price: 90000, devices: "5–8", use: "families, video calls and multiple HD streams" },
  { name: "START", speed: 200, price: 110000, devices: "8–12", use: "4K streaming, gaming and busy households" },
  { name: "PREMIUM", speed: 300, price: 200000, devices: "12–20", use: "many connected devices and heavy household or workspace use" },
];
// Guided CanalBox support for demonstration: no model API, no unverified network diagnostics.
const whatsapp: string = (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined) || "256758073035"; // Company-confirmed support WhatsApp; show only after guided checks and ticket escalation.
function answerLocal(input: string, profile: CustomerProfile | null, tickets: CustomerTicket[], lastAssistant: string): string | null {
  // Account-bound answers (profile, tickets, packages, Wi-Fi password steps). These never go to the AI provider.
  const text = input.toLowerCase();
  const recent = tickets[0];
  // Verified CanalBox self-service procedure. Ask about connectivity before giving portal steps.
  if (/(forgot|forgotten|lost|don't know|do not know|reset).{0,45}(wi.?fi|wifi|wireless|network).{0,30}(password|passphrase|key)|(?:wi.?fi|wifi).{0,25}(password|passphrase).{0,25}(forgot|reset|lost)/.test(text)) {
    return "If you've forgotten the Wi-Fi password and cannot join your CanalBox network, please request a Wi-Fi password reset through Report Issue. Support may restore the default Wi-Fi credentials provided with the router. Do not press the physical RESET button. CanalBox requires at least 24 hours between password changes or resets. Never share your password in chat. Would you like to create a reset case?";
  }
  if (/forgot (my |the )?password|can't remember (my |the )?(wifi )?password/.test(text)) return "Do you mean your CanalBox Wi-Fi password or your MyConnect login password? If it is Wi-Fi and you cannot connect, use Report Issue to request a support-assisted reset. Never press the router's factory RESET button. Wait 24 hours between changes or resets.";
  if (/(change|update|rename|modify|new).{0,40}(wi.?fi|wifi|wireless|ssid|network).{0,35}(password|passphrase|name)|(?:wi.?fi|wifi).{0,30}(password|name|ssid).{0,40}(change|update|rename)|how.{0,20}(change|update).{0,20}password/.test(text)) {
    return `Are you currently CONNECTED to your CanalBox Wi-Fi? If yes: copy your router serial number from your MyConnect account${profile?.routerSerial ? ` (serial: ${profile.routerSerial})` : " (ask support if your serial is missing)"}, then visit https://my.canalbox.africa/login. Enter the router S/N, open the three-bar menu at top left, choose My Box → WiFi, enter a new SSID (Wi-Fi name) and new Wi-Fi passphrase (password), both at least 8 characters, and save. Your devices may disconnect; reconnect with the new credentials. Keep a secure private record, not a screenshot shared with support. Wait at least 24 hours before another change or reset. If you cannot connect or forgot your password, tell me and I'll guide you to a reset request. Do NOT factory-reset the router.`;
  }
  if (/^(yes|i am connected|connected to (the )?(wifi|network))$/i.test(text) && /currently connected/i.test(lastAssistant)) return "If you mean you're connected and want to change Wi-Fi settings, open https://my.canalbox.africa/login using your CanalBox connection, enter the router S/N from MyConnect, then ☰ → My Box → WiFi. Use at least 8 characters for the new SSID and passphrase and save. If you meant another issue, tell me which one.";
  if (/previous|history|past issue|ticket|my reports|reported before/.test(text)) {
    if (!tickets.length) return "I can't see a previous support ticket in your accessible MyConnect records. If you've reported an issue elsewhere, it may not yet be recorded in this database. What happened?";
    return `Your latest recorded issue is “${recent.title}” (${recent.status.replace(/_/g, " ")}). ${tickets.length > 1 ? `I can see ${tickets.length} recorded support issues.` : ""} Is this problem happening again, or is it a new issue?`;
  }
  if (/my account|my package|my plan|my subscription|expiry|expire|my router/.test(text)) {
    if (!profile) return "Your account details aren't available at the moment. I can still guide troubleshooting, but I won't guess your subscription or router.";
    return `Your MyConnect profile lists ${profile.packageName || "an unspecified package"}, ${profile.accountStatus || "unknown"} account status, expiry ${profile.expiryDate || "not listed"}, and router ${profile.routerModel || "not recorded"}. If these details look incorrect, please report them to support. What would you like help with?`;
  }
  const plan = PLANS.find(p => new RegExp(`\\b${p.name.toLowerCase()}\\b`).test(text));
  if (plan) return `${plan.name}: ${plan.speed} Mbps, UGX ${plan.price.toLocaleString("en-UG")}/month. Suggested use: ${plan.use}. Roughly ${plan.devices} devices with mixed usage (not an official guaranteed limit). Staff must confirm eligibility and changes.`;
  if (/\b(package|plan|price|cost|subscribe|upgrade|bundle)s?\b/.test(text)) return PLANS.map(p => `${p.name} — ${p.speed} Mbps — UGX ${p.price.toLocaleString("en-UG")}/month`).join("\n") + "\nWhich plan would you like to know more about?";
  return null;
}
function answerGuided(input: string, profile: CustomerProfile | null, tickets: CustomerTicket[], turns: number): string {
  // Rule-based troubleshooting. Used when the AI is off, slow or rate-limited.
  const text = input.toLowerCase();
  const recent = tickets[0];
  if (/some websites|certain websites|specific websites|some sites|websites? (won.t|will not|not|isn.t|is not|cannot|can.t) (open|load|work|accessible)|can.t (open|access|reach) (some|certain|a) (websites?|sites?)|not accessing (some|certain) websites?|site not opening|website blocked/.test(text)) return "Let's isolate the website problem without changing your router settings. 1) Is it just one website or several? 2) Does it work on another device or using mobile data (not CanalBox Wi-Fi)? 3) What error do you see (timeout, DNS error, access denied, or blank page)? 4) Do other websites open normally on CanalBox? Try a private/incognito tab and another browser. Please don't change DNS settings or factory-reset the router yet. Tell me what you find and I can guide the next check or help report the issue.";
  if (/dns|site can.t be reached|name not resolved|err_name_not_resolved|connection timed out|connection reset|access denied|403|website still/.test(text)) return "Thanks. Does this website open on mobile data but fail on your CanalBox connection, or does it fail on both? Tell me the website domain (never share a login link or password) and exact error. If other sites work, this alone doesn't prove a CanalBox outage. Try another browser and device, then report the website-access issue with those details if it persists.";
  if (/red los|los red|los light|red light|fibre cut|fiber cut/.test(text)) return "A RED LOS light on a white ZTE may mean loss of fibre signal, possibly from a fibre fault or cut; I cannot confirm a cut remotely. Do not disconnect, bend, or look into the fibre cable, and do not press RESET. Please open the light selector so I can record what is lit, then report the issue if LOS remains red.";
  if (RE.wifiMissing.test(text)) {
    const rt = normalizeRouterType(profile?.routerType);
    const black = rt !== "zte_white";
    return `Let's find out why your Wi-Fi name is not showing. Look at your ${routerName(rt)}: is the ${black ? "WLAN 2.4G / 5G" : "WiFi"} light ON or OFF? If it is OFF, briefly press the ${black ? "WLAN button on the BACK" : "Wi-Fi button on the WIDE SIDE"}, wait a minute and check again. If it is ON but you still can't see the network, tell me and we'll try the next step. Please don't press RESET.`;
  }
  if (RE.restart.test(text)) return "CanalBox restart procedure: turn the router OFF with its power switch or unplug its POWER ADAPTER. Wait 5 full minutes, reconnect power, and allow the indicator lights to settle. Do NOT press the small RESET button or touch the fibre connector. Did the service return?";
  if (RE.slow.test(text)) return `Let's investigate slow speeds on your ${profile?.routerModel || "router"}. Is it slow on ALL devices or only one? Is it over Wi-Fi, wired connection, or both? Use https://www.speedtest.net/ while connected to CanalBox Wi-Fi near your router, with other downloads paused. Share the download Mbps, upload Mbps, ping ms, and whether you tested over Wi-Fi or Ethernet. Use the router-light selector if any lights seem abnormal. ${recent?.category === "slow_speed" ? "There is an earlier slow-speed issue in your accessible ticket history." : ""} If it persists, we can open a slow-speed support case.`;
  if (/offline|no internet|disconnected|not working|can't connect|cannot connect/.test(text)) return `Let's check your ${profile?.routerModel || "router"} first. Is the power light on? For a white ZTE router, is PON on and LOS red? For a black ALCL device, are LINK and AUTH lit? Please tell me the lights you see. Don't touch the fiber connector or press RESET.`;
  if (/one device|only one|wifi only|wi-fi only/.test(text)) return "That may be a device or Wi-Fi issue rather than the full CanalBox line. Try moving closer to the router and reconnecting Wi-Fi on that device. Does another device work normally in the same place?";
  if (/all devices|every device|still slow|still offline|didn't work|did not work|same problem|not better|unresolved|still not/.test(text)) return turns >= 3 ? "The earlier checks haven't resolved this. Please open a MyConnect support ticket so the team can follow your steps and recorded issues. If the issue needs photos and standard support cannot resolve it, use the final-escalation WhatsApp option if the company has configured it." : "Thanks for checking. Before escalating, tell me which router lights are on, whether this affects all devices, and whether you've already tried a safe power restart. I won't ask you to factory-reset the router.";
  if (/whatsapp|photo|picture|human|agent/.test(text)) return "I can help with the router lights and safe checks first. If those fail, please record the issue through MyConnect Report Issue. After troubleshooting and the support case path have been tried, WhatsApp is available for sending router-light photos. Never share passwords, payment PINs or unnecessary personal documents.";
  if (/bill|payment|renew|balance|invoice|transaction/.test(text)) return "For renewals or missing payments, CanalBox Finance handles payment verification. Please have your payment transaction ID ready as proof of payment and use Report Issue to submit a payment case to Finance. Do not share a PIN, password or full financial account details. I cannot confirm payment receipt from this chat. Is the payment missing or are you asking about renewal?";
  if (RE.greeting.test(text)) return "I can help with your registered router, previous MyConnect tickets, slow or lost connection, and package information. What issue are you facing?";
  return "To help with your CanalBox service, tell me: (1) what isn't working, (2) which router lights you see, and (3) whether all devices are affected. I can check your recorded MyConnect tickets, but I can't see live line diagnostics.";
}
function answer(input: string, profile: CustomerProfile | null, tickets: CustomerTicket[], turns: number): string {
  return answerLocal(input, profile, tickets, "") ?? answerGuided(input, profile, tickets, turns);
}

export function AIChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: INTRO }]);
  const [draft, setDraft] = useState("");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [recordStatus, setRecordStatus] = useState("Checking account records…");
  const [escalation, setEscalation] = useState(false);
  const [failedChecks, setFailedChecks] = useState(0);
  const [ticketPathOffered, setTicketPathOffered] = useState(false);
  const [lightsOpen, setLightsOpen] = useState(false);
  const [routerOverride, setRouterOverride] = useState<RouterType | null>(null);
  const [selectedLights, setSelectedLights] = useState<string[]>([]);
  const [issueType, setIssueType] = useState("no_internet");
  const [thinking, setThinking] = useState(false);
  const [aiActive, setAiActive] = useState(false);
  const [speedFormOpen, setSpeedFormOpen] = useState(false);
  const [download, setDownload] = useState("");
  const [upload, setUpload] = useState("");
  const [ping, setPing] = useState("");
  const [connectionType, setConnectionType] = useState("Wi-Fi");
  const [speedError, setSpeedError] = useState("");
  const [speedRecorded, setSpeedRecorded] = useState(false);
  const [speedSummary, setSpeedSummary] = useState("");
  const userTurns = messages.filter(m => m.role === "user").length;
  const routerType = routerOverride ?? normalizeRouterType(profile?.routerType);
  const visibleLights = routerLightsFor(routerType);
  useEffect(() => onAuthStateChanged(auth, async user => {
    setProfile(null); setTickets([]); setEscalation(false); setFailedChecks(0); setTicketPathOffered(false);
    if (!user) { setRecordStatus("Sign in to use customer history"); return; }
    try {
      const info = await getUserProfile(user.uid);
      setProfile(info);
      if (!info) { setRecordStatus("No matching customer profile"); return; }
      setRecordStatus("Customer profile loaded; checking ticket history…");
      // A UID-scoped query avoids exposing other customers' records.
      // Firestore rules must also restrict tickets to the signed-in owner.
      const result = await getDocs(query(collection(db, "tickets"), where("customerUid", "==", user.uid)));
      const items = result.docs.map(d => ({ id: d.id, ...d.data() } as CustomerTicket));
      items.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setTickets(items.slice(0, 15));
      setRecordStatus(`Account linked · ${items.length} recorded issue${items.length === 1 ? "" : "s"}`);
    } catch (error) {
      console.error("Assistant could not access profile or ticket history", error);
      setRecordStatus("Ticket history unavailable; general help still works");
    }
  }), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as AIEvent).detail;
      event.preventDefault();
      setOpen(true);
      if (detail?.prompt) setMessages(m => [...m, { role: "user", text: detail.prompt! }, { role: "assistant", text: answer(detail.prompt!, profile, tickets, userTurns) }]);
    }
    window.addEventListener("myconnect:open-ai", onOpen);
    return () => window.removeEventListener("myconnect:open-ai", onOpen);
  }, [profile, tickets, userTurns]);
  useEffect(() => { if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [open, messages]);
  function aiContext() {
    return {
      packageName: profile?.packageName || undefined,
      accountStatus: (profile?.accountStatus || "").toLowerCase() || undefined,
      routerType,
      failedChecks: Math.min(failedChecks, 9),
      lights: visibleLights.filter(l => selectedLights.includes(l.id)).map(l => l.label),
      recentTickets: tickets.slice(0, 3).map(t => ({ title: t.title, status: String(t.status || "").replace(/_/g, " ") })),
    };
  }
  async function send(value = draft) {
    const text = value.trim().slice(0, 500);
    if (!text || thinking) return;
    const lower = text.toLowerCase();
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")?.text ?? "";
    const history = [...messages, { role: "user" as const, text }];
    setMessages(m => [...m, { role: "user", text }]);
    setDraft("");
    if (/still|didn.t work|did not work|not better|unresolved|still slow|still offline|didn.t help|no change/.test(lower)) {
      setFailedChecks(n => n + 1);
      setTicketPathOffered(true);
    }
    setIssueType(t => classifyIssueType(text, t));
    if (RE.slow.test(lower)) setSpeedFormOpen(true);

    // 1) Account-bound questions are answered locally and never leave the browser.
    const local = answerLocal(text, profile, tickets, lastAssistant);
    if (local) { setMessages(m => [...m, { role: "assistant", text: local }]); return; }

    // 2) Troubleshooting goes to the AI (personal data masked); 3) any failure falls back to the rules.
    setThinking(true);
    const ai = await askAssistant(
      history.slice(-8).map(m => ({ role: m.role, text: maskPersonalData(redactSecrets(m.text)) })),
      aiContext(),
    );
    setThinking(false);
    if (!ai) {
      setMessages(m => [...m, { role: "assistant", text: answerGuided(text, profile, tickets, userTurns) }]);
      return;
    }
    setAiActive(true);
    setMessages(m => [...m, { role: "assistant", text: ai.reply, chips: ai.quickReplies }]);
    if (ai.issueType) setIssueType(ai.issueType);
    if (ai.askLights) setLightsOpen(true);
    if (ai.suggestTicket) setTicketPathOffered(true);
  }
  function recordSpeed() {
    const values = [download, upload, ping].map(x => x.trim() === "" ? NaN : Number(x));
    if (values.some(x => !Number.isFinite(x) || x < 0 || x > 100000)) {
      setSpeedError("Enter valid non-negative numbers from your Speedtest.net result for download, upload and ping.");
      return;
    }
    const summary = `Customer-provided Speedtest.net result (not independently verified): Download ${values[0]} Mbps, Upload ${values[1]} Mbps, Ping ${values[2]} ms. Test connection: ${connectionType}.`;
    setSpeedSummary(summary);
    setSpeedError("");
    setSpeedRecorded(true);
    setIssueType("slow_speed");
    setMessages(m => [...m, {role:"user", text:summary}, {role:"assistant", text:"Thanks. I've prepared these results for a slow-speed support case. They will be included in the report description when you review and submit the ticket. We cannot confirm the cause from one test alone; please also say whether other devices have the same problem."}]);
  }
  function openSupportTicket() {
    // Transfer customer-reported evidence and the current symptom to the ticket form.
    // Never transfer passwords or secret values.
    const lastUser = redactSecrets([...messages].reverse().find(m => m.role === "user")?.text ?? "");
    const safeSymptom = lastUser.slice(0, 350);
    const lightsNote = selectedLights.length ? `\nRouter indicators selected: ${visibleLights.filter(light => selectedLights.includes(light.id)).map(light => light.label).join(", ")}.` : "";
    const report = issueType === "slow_speed" && speedRecorded
      ? speedSummary + "\nCustomer statement: " + safeSymptom + lightsNote
      : "Issue reported through MyConnect assistant: " + safeSymptom + lightsNote;
    sessionStorage.setItem("myconnect:assistant-ticket-description", report);
    setTicketPathOffered(true);
    setOpen(false);
    navigate(`/report-issue?mode=ticket&type=${encodeURIComponent(issueType)}&source=assistant`);
  }
  function checkLights() {
    const pattern = diagnoseRouterLights(routerType, selectedLights, issueType);
    const label = routerPatternLabel(pattern);
    const wifiDisabled = pattern === "zte_wifi_disabled" || pattern === "alc_wifi_disabled";
    const loss = pattern === "zte_los_red" || pattern === "alc_link_issue" || pattern === "zte_fiber_unclear";
    const noPower = pattern === "zte_no_power" || pattern === "alc_no_power";
    const guidance = wifiDisabled
      ? routerType === "zte_white"
        ? "The Wi-Fi indicator appears OFF. On a WHITE ZTE router, briefly press the Wi-Fi button on the WIDE SIDE. Wait for the light and network name; do not press RESET. Did your network reappear?"
        : "Both WLAN indicators appear OFF. On a BLACK router, briefly press the WLAN button on the BACK. Wait for the Wi-Fi lights/network name. Do not press RESET. Did Wi-Fi come back?"
      : loss
      ? "This may indicate a fibre signal problem, including a possible fibre cut, but it cannot be confirmed here. Do not handle the fibre connector. Please submit a support case with this light pattern."
      : noPower
      ? "The POWER indicator is not selected. Check the wall socket and power adapter safely. If it remains off, report a router power issue. Do not press RESET."
      : "Thank you for selecting the lights. If the issue persists, use CanalBox's approved restart: power OFF for 5 minutes, then ON; never factory-reset. If the lights remain abnormal, open a support case.";
    setMessages(m => [...m, {role:"user", text:`${routerName(routerType)} indicators: ${visibleLights.filter(l => selectedLights.includes(l.id)).map(l => l.label).join(", ") || "none selected"}`}, {role:"assistant", text:`Light check: ${label}. ${guidance}`}]);
    setIssueType(ticketTypeFromRouterPattern(issueType, pattern));
    setLightsOpen(false);
    if (loss || noPower) setTicketPathOffered(true);
  }
  return <>
    {!open && <button type="button" aria-label="Open MyConnect support assistant" onClick={() => setOpen(true)} className="fixed z-[10000] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-3.5 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-[var(--color-primary-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] lg:bottom-7 lg:right-7 lg:px-5"><Bot size={20}/><span className="lg:hidden">Ask AI</span><span className="hidden lg:inline">Ask MyConnect</span></button>}
    {open && <div className="fixed inset-0 z-[10060] flex items-end justify-center bg-[var(--color-overlay)]/55 lg:pointer-events-none lg:items-end lg:justify-end lg:bg-transparent lg:p-7" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-label="MyConnect support assistant" className="pointer-events-auto flex h-[min(82dvh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xl sm:mx-4 sm:mb-4 sm:rounded-3xl lg:mx-0 lg:mb-0 lg:h-[min(78dvh,690px)] lg:w-[440px] lg:max-w-[calc(100vw-3rem)] lg:border lg:border-[var(--color-border)]">
        <header className="bg-[var(--color-primary)] text-white flex items-center gap-2 p-4 shrink-0"><Bot size={22}/><div className="flex-1"><div className="font-bold">MyConnect Assistant</div><div className="text-[11px] opacity-90">{aiActive ? "CanalBox support · AI-assisted, can make mistakes" : "CanalBox guided support"}</div></div><button type="button" aria-label="Start new conversation" onClick={() => setMessages([{ role: "assistant", text: INTRO }])} className="p-2"><RotateCcw size={17}/></button><button type="button" aria-label="Close assistant" onClick={() => setOpen(false)} className="p-2"><X size={19}/></button></header>
        <div className="border-b border-[var(--color-border)] px-4 py-2 text-[11px] bg-[var(--color-surface)] text-[var(--color-muted)]">{recordStatus}{aiActive ? " · never share passwords in chat" : ""}{profile ? ` · ${profile.packageName || "Package unknown"}` : ""}</div>
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-[var(--color-bg)] px-4 py-4 space-y-3" aria-live="polite">{messages.map((m,i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><p className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"}`}>{m.text}</p></div>)}{thinking && <div className="flex justify-start"><p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-muted)]" role="status">Checking…</p></div>}{!thinking && messages[messages.length - 1]?.role === "assistant" && (messages[messages.length - 1]?.chips?.length ?? 0) > 0 && <div className="flex flex-wrap gap-2 pl-1">{messages[messages.length - 1].chips!.map(c => <button type="button" key={c} onClick={() => send(c)} className="rounded-full border border-[var(--color-primary)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-text)]">{c}</button>)}</div>}</div>
        <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 pt-3 shrink-0">
          {profile?.routerSerial && <button type="button" onClick={() => navigator.clipboard.writeText(profile.routerSerial).catch(() => {})} className="mb-2 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-primary-dark)]">Copy my router serial number</button>}
          <button type="button" onClick={() => setLightsOpen(v => !v)} className="w-full flex justify-center items-center gap-2 rounded-xl bg-[var(--color-surface-soft)] py-2.5 mb-2 text-xs font-semibold text-[var(--color-primary-text)]"><Router size={16}/> {lightsOpen ? "Hide router light selector" : "Check router lights (visual guide)"}</button>
          {lightsOpen && <div className="max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-xl p-2 mb-2 text-xs">
            <div className="flex gap-2 items-center mb-2"><span className="font-semibold">Router:</span><select aria-label="Router model" value={routerType} onChange={e => {setRouterOverride(e.target.value as RouterType); setSelectedLights([]);}} className="border rounded px-1 py-1"><option value="zte_white">White ZTE</option><option value="alcl_black">Black ALCL</option></select></div>
            <p className="text-[var(--color-muted)] mb-2">Tap the lights currently ON (including red LOS if lit). This simplified router illustration represents the indicators, not a photograph.</p>
            <div className={`rounded-xl border-2 px-2 py-4 flex flex-wrap gap-2 justify-center ${routerType === "zte_white" ? "bg-slate-100 border-slate-400" : "bg-slate-900 border-slate-700"}`}>
              {visibleLights.map(light => { const selected = selectedLights.includes(light.id); return <button type="button" key={light.id} aria-pressed={selected} title={light.description} onClick={() => setSelectedLights(current => selected ? current.filter(i=>i!==light.id) : [...current, light.id])} className={`flex flex-col items-center gap-1 px-1 ${routerType === "zte_white" ? "text-[var(--color-text)]" : "text-white"}`}><span className={`w-3.5 h-3.5 rounded-full border ${selected ? (light.color === "red" ? "bg-red-600 border-red-800" : "bg-green-500 border-green-700") : "bg-slate-500 border-slate-400"}`}/><span className="text-[9px]">{light.label}</span></button>})}
            </div>
            <button type="button" onClick={checkLights} className="mt-2 bg-[var(--color-primary)] text-white rounded-lg px-3 py-2 font-semibold w-full">Diagnose selected lights</button>
          </div>}{speedFormOpen && <div className="mb-3 max-h-[30vh] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3 text-xs text-[var(--color-text)]">
            <div className="font-semibold mb-1">Speedtest.net — customer results</div>
            <p className="mb-2">Open <a href="https://www.speedtest.net/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[var(--color-primary-text)]">speedtest.net</a>, run a test on CanalBox, then enter the measured figures below.</p>
            <div className="grid grid-cols-3 gap-1 mb-2">{[["Download Mbps",download,setDownload],["Upload Mbps",upload,setUpload],["Ping ms",ping,setPing]].map(([label,value,setter],idx) => <label key={idx} className="text-[10px]">{label as string}<input type="number" min="0" step="any" value={value as string} onChange={e => (setter as (x:string)=>void)(e.target.value)} className="w-full rounded border border-[var(--color-border)] px-1 py-1 mt-1"/></label>)}</div>
            <label className="block mb-2">Tested using <select value={connectionType} onChange={e=>setConnectionType(e.target.value)} className="ml-1 border rounded px-1 py-1"><option>Wi-Fi</option><option>Ethernet</option></select></label>
            {speedError && <p className="text-[var(--color-danger-text)] mb-2" role="alert">{speedError}</p>}
            <button type="button" onClick={recordSpeed} className="bg-[var(--color-primary)] text-white rounded-lg px-3 py-2 w-full font-semibold">Use these results in my report</button>
          </div>}<div className="flex gap-2 overflow-x-auto pb-2">{["Packages & prices", "My internet is slow", "Some websites won't open", "Change Wi-Fi password", "Restart router"].map(q => <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary-text)] text-xs font-semibold px-3 py-2 hover:bg-[var(--color-hover)]">{q}</button>)}</div><button type="button" className="mb-2 w-full rounded-lg border border-[var(--color-primary)] text-[var(--color-primary-text)] flex justify-center items-center gap-2 py-2 text-xs font-semibold" onClick={openSupportTicket}><Headphones size={15}/> Create / View support ticket</button>{ticketPathOffered && <div className="mb-2 text-xs text-[var(--color-muted)]">The checks have not resolved the issue. Please create or follow up on a support ticket first.</div>}{failedChecks >= 2 && ticketPathOffered && <div className="mb-2 text-xs text-[var(--color-muted)]">Still unresolved after guided checks and the ticket route? {whatsapp ? <a className="font-bold text-[var(--color-primary-text)] underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello CanalBox support, I need help with an unresolved MyConnect issue. I can share router photos if needed.")}`}>Escalate to WhatsApp for photos</a> : "A WhatsApp support number has not been configured yet. Please use Report Issue."}</div>}<form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2 pb-3"><input aria-label="Message" value={draft} maxLength={500} onChange={e => setDraft(e.target.value)} placeholder="Ask a question..." className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-text)] px-3 py-2.5 text-sm"/><button type="submit" disabled={!draft.trim()} aria-label="Send message" className="bg-[var(--color-primary)] disabled:opacity-50 text-white px-3 rounded-xl hover:bg-[var(--color-primary-dark)]"><Send size={18}/></button></form></div>
      </section>
    </div>}
  </>;
}
