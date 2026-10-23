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
};

/** Pick the ticket category from what the customer typed. Most specific signal wins. */
export function classifyIssueType(input: string, current: string): string {
  const t = input.toLowerCase();
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
