// Vercel serverless function: POST /api/assistant
// Calls any OpenAI-compatible endpoint (open-weight models on Groq, Together, OpenRouter, Ollama, ...).
// Configure LLM_BASE_URL, LLM_API_KEY and LLM_MODEL in Vercel. Without them it answers 503 and the app uses its rule-based assistant.
import { createRemoteJWKSet } from "jose";
import { createLimiter, handleAssistant, verifyFirebaseToken } from "./_lib/core.js";

declare const process: { env: Record<string, string | undefined> };

const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);
// Per-instance limit (serverless instances do not share memory); also set a spending cap at your AI provider.
const limiter = createLimiter(20, 10 * 60 * 1000);

export default async function handler(req: any, res: any) {
  const out = await handleAssistant(
    { method: req.method, authorization: req.headers?.authorization, body: req.body, env: process.env },
    {
      verify: (token, projectId) => verifyFirebaseToken(token, projectId, jwks),
      fetchImpl: (url, init) => fetch(url, init) as any,
      limiter,
      makeSignal: (ms) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ms);
        return { signal: ctrl.signal, cancel: () => clearTimeout(timer) };
      },
    },
  );
  res.setHeader("Cache-Control", "no-store");
  res.status(out.status).json(out.json);
}
