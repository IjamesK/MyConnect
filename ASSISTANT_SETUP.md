# MyConnect assistant demo

This version adds a working **guided support assistant** (not a live generative AI model). It provides useful rule-based answers about the four packages, internet troubleshooting, and support escalation. It has no API costs and does not read or modify customer data. It does not create tickets automatically; users can open the existing report screen.

Files changed:
- `src/app/components/isp/AIChatWidget.tsx` (new)
- `src/app/components/isp/Layout.tsx` (mount the widget)
- `src/lib/firebase.ts` (uses VITE_FIREBASE_* variables; no old project ID embedded)

The `Find out more` button in `SubscriptionPage.tsx` opens the widget with package context through `myconnect:open-ai`.

## Firebase configuration
Before building/deploying, set these in Vercel Settings > Environment Variables (Production, and Preview if needed):
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID (your new project: ijkjames)
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

For local development create a private `.env.local` with those six values. Do not commit passwords or service-account JSON.

If your *live* GitHub repository already has a working `firebase.ts` connected to `ijkjames`, **keep that existing file** and copy only `AIChatWidget.tsx` and the two lines in `Layout.tsx`; this avoids accidentally undoing your live Firebase changes.

## Test
1. Sign into your demo customer account.
2. Tap 'Ask MyConnect' on the dashboard.
3. Ask 'My internet is slow' or 'What packages are available?'
4. On Subscription, tap FIT > Find out more. The assistant should open with FIT details.
5. Tap 'Contact support / Report issue'; this opens the existing report screen.

To add genuine AI later, replace the local `answer()` function with an authenticated request to a server-side API endpoint. Never put an OpenAI key in `VITE_*` variables or the React client.
