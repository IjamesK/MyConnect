import { recognizeSupportCase, isRouterPlacement } from "./supportCases";
// Pure helpers for the support assistant, kept separate so they can be unit-tested.

/** Whole-word matchers. Plain substring regexes caused "close" -> LOS, "this" -> greeting, etc. */
export const RE = {
  slow: /\b(slow|slowly|buffer|buffering|lag|lagging|speed)\b/,
  password: /\b(forgot|forgotten|reset)\b.{0,30}\b(password|passphrase)\b|\b(password|passphrase)\b.{0,30}\breset\b/,
  payment: /\b(missing payment|payment not reflected|not reflected|paid but)\b/,
  los: /\b(red los|los red|los light|los)\b|\bred light\b|\bfib(re|er) cut\b/,
  websites: /\b(some|certain|specific) (websites?|sites?)\b|\bsite not opening\b|\bwebsite blocked\b|\bnot accessing .{0,20}websites?\b/,
  wifi: /\b(wifi|wi-fi|wlan|network name)\b/,
  greeting: /\b(hello|hi|hey|help)\b/,
  restart: /\b(restart|reboot)\b|^not yet\b/,
  // "I am not seeing my WiFi", "can't find the CanalBox network", "wifi name is missing", "no wifi", "wifi light is off"
  wifiMissing: new RegExp(
    [
      String.raw`\b(?:can.?t|cannot|can not|couldn.?t|unable to|don.?t|do not|not|no longer|never|fail(?:s|ed)? to)\s+(?:be\s+)?(?:see|seeing|find|finding|detect|detecting|show|showing|appear|appearing|pick up|picking up)(?:\s+(?:my|the|any|our|a|canalbox|home|internet))*\s+(?:wi-?fi|wlan|wireless|ssid|network)\b`,
      String.raw`\b(?:wi-?fi|wlan|wireless|ssid|network)(?:\s+(?:name|network|signal))?\s+(?:is\s+|has\s+|was\s+)?(?:missing|gone|disappeared|vanished|not\s+(?:showing|appearing|visible|available|there|detected)|(?:doesn.?t|isn.?t)\s+(?:show|showing|appear|visible|there))`,
      String.raw`\bno\s+(?:wi-?fi|wlan)\b`,
      String.raw`\b(?:wi-?fi|wlan)\s+light\s+(?:is\s+)?(?:off|out)\b`,
    ].join("|"),
  ),
};

/** Pick the ticket category from what the customer typed. Most specific signal wins. */
export function classifyIssueType(input: string, current: string): string {
  const t = input.toLowerCase();
  const reportCase = recognizeSupportCase(t);
  if (isRouterPlacement(t)) return "router_issue";
  if (reportCase && (reportCase.mode === "incident" || ["move_eligibility", "wrong_router_payment", "payment_not_reflected", "password_reset", "other"].includes(reportCase.id))) return reportCase.id;
  if (RE.password.test(t)) return "password_reset";
  if (RE.payment.test(t)) return "payment_not_reflected";
  if (RE.los.test(t)) return "los_light";
  if (RE.slow.test(t)) return "slow_speed";
  if (RE.websites.test(t)) return "other";
  if (RE.wifi.test(t)) return "router_issue";
  return current;
}

/** Strip obvious secrets before customer text is copied into a ticket. */
export function redactSecrets(input: string): string {
  let out = input;
  // "password is hunter2", "passphrase: abc", "otp = 123456"
  out = out.replace(/\b(password|passphrase|passcode|pin|otp)\b\s*(?:is|:|=)\s*\S+/gi, "$1 [removed]");
  // card-like numbers (13-19 digits, optional spaces/dashes)
  out = out.replace(/\b(?:\d[ -]?){13,19}\b/g, "[removed]");
  // short numeric codes when the message talks about a pin/otp/code
  if (/\b(pin|otp|code)\b/i.test(out)) out = out.replace(/\b\d{4,8}\b/g, "[removed]");
  return out;
}

/** Mask phone numbers and e-mail addresses before text is sent to an external AI provider. */
export function maskPersonalData(input: string): string {
  return input
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\+?\d[\d\s-]{8,}\d/g, "[number]");
}
