# MyConnect

A customer self-service ISP portal (customers and staff) built with React, Vite and Firebase, deployed on Vercel.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in the Firebase web-app values
pnpm dev
```

Other scripts: `pnpm build`, `pnpm preview`, `pnpm test`.

## Firebase

- Auth: email/password. Each signed-in user must have a matching `users/{uid}` document; its `role` is `customer`, `staff` or `admin`.
- Collections used: `users`, `tickets`, `notifications`, `incidents`, `incidentReports`.
- `firestore.rules` must be published separately in the Firebase console or with the CLI; deploying the app does not publish rules. Test rules in the emulator before publishing.
- Never commit credentials, seed data with passwords, or service-account keys.

## AI-assisted troubleshooting (optional)

The support assistant answers account questions (packages, tickets, Wi-Fi password steps) locally. Troubleshooting
questions go to `POST /api/assistant`, a Vercel function that checks the customer's Firebase login, then calls an
open-weight model through any OpenAI-compatible provider. If the AI is not configured, slow or rate-limited, the
built-in rule-based assistant answers instead, so nothing breaks.

To enable it, add these in Vercel (Production and Preview) and redeploy: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`
(see `.env.example`). Notes:

- Run `vercel dev` (not `pnpm dev`) to test `/api` locally.
- Only masked chat text and non-identifying context (router type, package name, selected lights) are sent. Names,
  phone numbers, addresses and router serials are never sent.
- Every AI reply passes a safety check (no RESET/fibre advice, no password requests, no promises, no unknown links);
  a blocked reply falls back to the rules.
- Free provider tiers have daily limits and are not meant for heavy production use: set a spending cap and check your
  provider's data-handling terms before enabling it for customers.

## Notes

- The support assistant is rule-based (no AI model). Its matching logic lives in `src/lib/assistantRules.ts` and is covered by `pnpm test`.
- More notes: `DEPLOY_AND_FIRESTORE_TEST.md`, `CANALBOX_ASSISTANT_SETUP.md`, `RESPONSIVE_UI_NOTES.md`.
