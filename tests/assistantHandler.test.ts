import { describe, expect, it } from "vitest";
import handler from "../api/assistant";

function run(req: Record<string, unknown>) {
  const out: { status?: number; json?: any; headers: Record<string, string> } = { headers: {} };
  const res = {
    setHeader: (k: string, v: string) => { out.headers[k] = v; },
    status(c: number) { out.status = c; return res; },
    json(b: unknown) { out.json = b; },
  };
  return handler(req, res).then(() => out);
}

describe("api/assistant entrypoint", () => {
  it("answers 503 (rules fallback) when the AI provider is not configured, and never caches", async () => {
    const r = await run({ method: "POST", headers: {}, body: {} });
    expect(r.status).toBe(503);
    expect(r.json).toEqual({ error: "ai_disabled" });
    expect(r.headers["Cache-Control"]).toBe("no-store");
  });
  it("rejects non-POST", async () => {
    expect((await run({ method: "GET", headers: {} })).status).toBe(405);
  });
});
