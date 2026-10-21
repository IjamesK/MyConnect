import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bot, X, Send, Headphones, RotateCcw, Router } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { getUserProfile, type CustomerProfile } from "../../../lib/auth";
import type { CustomerTicket } from "../../../lib/tickets";
import { diagnoseRouterLights, normalizeRouterType, routerLightsFor, routerName, routerPatternLabel, ticketTypeFromRouterPattern, type RouterType } from "../../../lib/routerTypes";

type Message = { role: "assistant" | "user"; text: string };
type AIEvent = CustomEvent<{ prompt?: string; packageName?: string }>;
const INTRO = "Welcome to MyConnect CanalBox support. I can check your recorded account and issues, guide you using the lights on your router, explain packages, and help you report an unresolved fault. What seems wrong?";
const PLANS = [
  { name: "GO", speed: 50, price: 69000, devices: "3–5", use: "everyday browsing, messaging and HD streaming" },
  { name: "FIT", speed: 100, price: 90000, devices: "5–8", use: "families, video calls and multiple HD streams" },
  { name: "START", speed: 200, price: 110000, devices: "8–12", use: "4K streaming, gaming and busy households" },
  { name: "PREMIUM", speed: 300, price: 200000, devices: "12–20", use: "many connected devices and heavy household or workspace use" },
];
// Guided CanalBox support for demonstration: no model API, no unverified network diagnostics.
const whatsapp = "256758073035"; // Company-confirmed support WhatsApp; show only after guided checks and ticket escalation.
function answer(input: string, profile: CustomerProfile | null, tickets: CustomerTicket[], turns: number): string {
  const text = input.toLowerCase();
  const recent = tickets[0];
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
  if (/package|plan|price|cost|subscribe|upgrade|bundle/.test(text)) return PLANS.map(p => `${p.name} — ${p.speed} Mbps — UGX ${p.price.toLocaleString("en-UG")}/month`).join("\n") + "\nWhich plan would you like to know more about?";
  if (/red los|los red|los light|red light|fibre cut|fiber cut/.test(text)) return "A RED LOS light on a white ZTE may mean loss of fibre signal, possibly from a fibre fault or cut; I cannot confirm a cut remotely. Do not disconnect, bend, or look into the fibre cable, and do not press RESET. Please open the light selector so I can record what is lit, then report the issue if LOS remains red.";
  if (/restart|reboot|not yet/.test(text)) return "CanalBox restart procedure: turn the router OFF with its power switch or unplug its POWER ADAPTER. Wait 5 full minutes, reconnect power, and allow the indicator lights to settle. Do NOT press the small RESET button or touch the fibre connector. Did the service return?";
  if (/slow|buffer|lag|speed/.test(text)) return `Let's investigate slow speeds on your ${profile?.routerModel || "router"}. Is it slow on ALL devices or only one? Is it over Wi-Fi, wired connection, or both? If you can, test near the router with other downloads paused. Use the router-light selector to describe its indicators. ${recent?.category === "slow_speed" ? "There is an earlier slow-speed issue in your accessible ticket history." : ""} If it persists, we can open a slow-speed support case.`;
  if (/offline|no internet|disconnected|not working|can't connect|cannot connect/.test(text)) return `Let's check your ${profile?.routerModel || "router"} first. Is the power light on? For a white ZTE router, is PON on and LOS red? For a black ALCL device, are LINK and AUTH lit? Please tell me the lights you see. Don't touch the fiber connector or press RESET.`;
  if (/wi-?fi (name|network|ssid) (is )?(missing|gone|not showing)|can.t see (the )?wi-?fi|wifi light off|wlan light off/.test(text)) return "If your Wi-Fi name has disappeared and the Wi-Fi/WLAN light is off: on a WHITE ZTE router, briefly press the Wi-Fi button on the WIDE SIDE; on a BLACK router, briefly press the WLAN button on the BACK. Wait for the Wi-Fi light and network name to appear. Do not press RESET or hold buttons down. Is the network name visible now?";
  if (/one device|only one|wifi only|wi-fi only/.test(text)) return "That may be a device or Wi-Fi issue rather than the full CanalBox line. Try moving closer to the router and reconnecting Wi-Fi on that device. Does another device work normally in the same place?";
  if (/all devices|every device|still slow|still offline|didn't work|did not work|same problem|not better|unresolved|still not/.test(text)) return turns >= 3 ? "The earlier checks haven't resolved this. Please open a MyConnect support ticket so the team can follow your steps and recorded issues. If the issue needs photos and standard support cannot resolve it, use the final-escalation WhatsApp option if the company has configured it." : "Thanks for checking. Before escalating, tell me which router lights are on, whether this affects all devices, and whether you've already tried a safe power restart. I won't ask you to factory-reset the router.";
  if (/whatsapp|photo|picture|human|agent/.test(text)) return "I can help with the router lights and safe checks first. If those fail, please record the issue through MyConnect Report Issue. After troubleshooting and the support case path have been tried, WhatsApp is available for sending router-light photos. Never share passwords, payment PINs or unnecessary personal documents.";
  if (/bill|payment|renew|balance|invoice|transaction/.test(text)) return "For renewals or missing payments, CanalBox Finance handles payment verification. Please have your payment transaction ID ready as proof of payment and use Report Issue to submit a payment case to Finance. Do not share a PIN, password or full financial account details. I cannot confirm payment receipt from this chat. Is the payment missing or are you asking about renewal?";
  if (/hello|hi|hey|help/.test(text)) return "I can help with your registered router, previous MyConnect tickets, slow or lost connection, and package information. What issue are you facing?";
  return "To help with your CanalBox service, tell me: (1) what isn't working, (2) which router lights you see, and (3) whether all devices are affected. I can check your recorded MyConnect tickets, but I can't see live line diagnostics.";
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
      if (detail?.prompt) setMessages(m => [...m, { role: "user", text: detail.prompt! }, { role: "assistant", text: answer(detail.prompt!, profile, tickets, messages.length) }]);
    }
    window.addEventListener("myconnect:open-ai", onOpen);
    return () => window.removeEventListener("myconnect:open-ai", onOpen);
  }, [profile, tickets, messages.length]);
  useEffect(() => { if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [open, messages]);
  function send(value = draft) {
    const text = value.trim().slice(0, 500);
    if (!text) return;
    setMessages(m => [...m, { role: "user", text }, { role: "assistant", text: answer(text, profile, tickets, messages.length) }]);
    if (/still|didn.t work|did not work|not better|unresolved|still slow|still offline|didn.t help|no change/.test(text.toLowerCase())) {
      setFailedChecks(n => n + 1);
      setTicketPathOffered(true);
    }
    if (/slow|buffer|lag|speed/.test(text.toLowerCase())) setIssueType("slow_speed");
    if (/missing payment|payment not reflected|paid but/.test(text.toLowerCase())) setIssueType("payment_not_reflected");
    if (/los|red light|fibre cut/.test(text.toLowerCase())) setIssueType("los_light");
    if (/wifi|wi-fi|wlan|network name/.test(text.toLowerCase())) setIssueType("router_issue");
    setDraft("");
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
    {!open && <button type="button" aria-label="Open MyConnect support assistant" onClick={() => setOpen(true)} className="fixed z-[10000] bottom-20 right-4 sm:right-[calc(50%-11rem)] rounded-full bg-[#E5007D] text-white shadow-lg px-4 py-3 flex items-center gap-2 text-sm font-bold"><Bot size={20}/> Ask MyConnect</button>}
    {open && <div className="fixed z-[10060] inset-0 bg-black/45 flex justify-center items-end sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-label="MyConnect support assistant" className="bg-white w-full max-w-sm h-[min(78dvh,630px)] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        <header className="bg-[#E5007D] text-white flex items-center gap-2 p-4 shrink-0"><Bot size={22}/><div className="flex-1"><div className="font-bold">MyConnect Assistant</div><div className="text-[11px] opacity-90">CanalBox guided support · Preview</div></div><button type="button" aria-label="Start new conversation" onClick={() => setMessages([{ role: "assistant", text: INTRO }])} className="p-2"><RotateCcw size={17}/></button><button type="button" aria-label="Close assistant" onClick={() => setOpen(false)} className="p-2"><X size={19}/></button></header>
        <div className="px-3 py-1 text-[11px] bg-pink-50 text-slate-600">{recordStatus}{profile ? ` · ${profile.packageName || "Package unknown"}` : ""}</div>
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-[#FFF7FB] px-3 py-4 space-y-3" aria-live="polite">{messages.map((m,i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><p className={`max-w-[89%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-[#E5007D] text-white" : "bg-white border border-[#FBCFE8] text-[#334155]"}`}>{m.text}</p></div>)}</div>
        <div className="bg-white border-t border-[#F1D5E3] px-3 pt-2 shrink-0">
          <button type="button" onClick={() => setLightsOpen(v => !v)} className="w-full flex justify-center items-center gap-2 rounded-lg bg-[#FCE7F3] py-2 mb-2 text-xs font-semibold text-[#9D0758]"><Router size={16}/> {lightsOpen ? "Hide router light selector" : "Check router lights (visual guide)"}</button>
          {lightsOpen && <div className="max-h-48 overflow-y-auto border border-[#F4BBDD] rounded-xl p-2 mb-2 text-xs">
            <div className="flex gap-2 items-center mb-2"><span className="font-semibold">Router:</span><select aria-label="Router model" value={routerType} onChange={e => {setRouterOverride(e.target.value as RouterType); setSelectedLights([]);}} className="border rounded px-1 py-1"><option value="zte_white">White ZTE</option><option value="alcl_black">Black ALCL</option></select></div>
            <p className="text-slate-600 mb-2">Tap the lights currently ON (including red LOS if lit). This simplified router illustration represents the indicators, not a photograph.</p>
            <div className={`rounded-xl border-2 px-2 py-4 flex flex-wrap gap-2 justify-center ${routerType === "zte_white" ? "bg-slate-100 border-slate-400" : "bg-slate-900 border-slate-700"}`}>
              {visibleLights.map(light => { const selected = selectedLights.includes(light.id); return <button type="button" key={light.id} aria-pressed={selected} title={light.description} onClick={() => setSelectedLights(current => selected ? current.filter(i=>i!==light.id) : [...current, light.id])} className={`flex flex-col items-center gap-1 px-1 ${routerType === "zte_white" ? "text-slate-800" : "text-white"}`}><span className={`w-3.5 h-3.5 rounded-full border ${selected ? (light.color === "red" ? "bg-red-600 border-red-800" : "bg-green-500 border-green-700") : "bg-slate-500 border-slate-400"}`}/><span className="text-[9px]">{light.label}</span></button>})}
            </div>
            <button type="button" onClick={checkLights} className="mt-2 bg-[#E5007D] text-white rounded-lg px-3 py-2 font-semibold w-full">Diagnose selected lights</button>
          </div>}<div className="flex gap-2 overflow-x-auto pb-2">{["Packages & prices", "My internet is slow", "Restart router"].map(q => <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full bg-[#FCE7F3] text-[#9D0758] text-xs font-semibold px-3 py-2">{q}</button>)}</div><button type="button" className="mb-2 w-full rounded-lg border border-[#E5007D] text-[#BE0067] flex justify-center items-center gap-2 py-2 text-xs font-semibold" onClick={() => { setTicketPathOffered(true); setOpen(false); navigate(`/report-issue?mode=ticket&type=${encodeURIComponent(issueType)}&source=assistant`); }}><Headphones size={15}/> Create / View support ticket</button>{ticketPathOffered && <div className="mb-2 text-xs text-slate-600">The checks have not resolved the issue. Please create or follow up on a support ticket first.</div>}{failedChecks >= 2 && ticketPathOffered && <div className="mb-2 text-xs text-slate-600">Still unresolved after guided checks and the ticket route? {whatsapp ? <a className="font-bold text-[#BE0067] underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello CanalBox support, I need help with an unresolved MyConnect issue. I can share router photos if needed.")}`}>Escalate to WhatsApp for photos</a> : "A WhatsApp support number has not been configured yet. Please use Report Issue."}</div>}<form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2 pb-3"><input aria-label="Message" value={draft} maxLength={500} onChange={e => setDraft(e.target.value)} placeholder="Ask a question..." className="min-w-0 flex-1 rounded-xl border border-[#CBD5E1] text-[#0F172A] px-3 py-2.5 text-sm"/><button type="submit" disabled={!draft.trim()} aria-label="Send message" className="bg-[#E5007D] disabled:opacity-50 text-white px-3 rounded-xl"><Send size={18}/></button></form></div>
      </section>
    </div>}
  </>;
}
