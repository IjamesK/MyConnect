// Browser client for POST /api/assistant (an open-weight model behind an OpenAI-compatible provider).
// Any failure returns null so the caller falls back to the built-in rule-based assistant.
import { auth } from "./firebase";

export type AssistantTurn = { role: "user" | "assistant"; text: string };
export type AssistantContext = {
  packageName?: string;
  accountStatus?: string;
  routerType?: string;
  failedChecks?: number;
  lights?: string[];
  recentTickets?: { title: string; status: string }[];
};
export type AssistantReply = {
  reply: string;
  issueType: string | null;
  askLights: boolean;
  suggestTicket: boolean;
  quickReplies: string[];
};

let pausedUntil = 0;

export async function askAssistant(
  messages: AssistantTurn[],
  context: AssistantContext,
  timeoutMs = 12000,
): Promise<AssistantReply | null> {
  if (Date.now() < pausedUntil) return null;
  const user = auth.currentUser;
  if (!user) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages, context }),
      signal: ctrl.signal,
    });
    // 503/404: AI not configured or not deployed. 429: slow down. Stop trying for a while.
    if (res.status === 503 || res.status === 404) { pausedUntil = Date.now() + 10 * 60_000; return null; }
    if (res.status === 429) { pausedUntil = Date.now() + 60_000; return null; }
    if (!res.ok) return null;
    const j = await res.json();
    if (typeof j?.reply !== "string" || !j.reply.trim()) return null;
    return {
      reply: j.reply.trim(),
      issueType: typeof j.issue_type === "string" ? j.issue_type : null,
      askLights: j.ask_lights === true,
      suggestTicket: j.suggest_ticket === true,
      quickReplies: Array.isArray(j.quick_replies)
        ? j.quick_replies.filter((x: unknown): x is string => typeof x === "string").slice(0, 4)
        : [],
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
