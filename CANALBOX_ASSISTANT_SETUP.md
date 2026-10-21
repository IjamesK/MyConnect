# MyConnect CanalBox-aware assistant (presentation preview)

This is a **guided assistant**, not a generative OpenAI chatbot. It displays the authenticated user's Firestore `users/{uid}` profile and up to 15 recent `tickets` documents filtered by `customerUid`. It does not access data from the old Firebase project, claim live network diagnostics, or modify account data. It does not include a server-side AI service.

## Configuration

Use your existing working `src/lib/firebase.ts`, with the six `VITE_FIREBASE_*` values already in Vercel.

**Optional** Vercel environment variable `VITE_SUPPORT_WHATSAPP` must be your *verified, company-approved* international phone number with country code, e.g. `2567XXXXXXXX` (do not use a personal number without authorization). Redeploy after setting it. WhatsApp is hidden until the customer reports continued trouble over several messages. If no number is set, the assistant directs the customer to the existing report issue page.

## Security requirements

- Rules must permit users to read **only their own** `/users/{uid}` document.
- Rules for `/tickets/{ticketId}` must permit customer reads only when `resource.data.customerUid == request.auth.uid`. Rules must not let customers change ownership or admin fields. The `where(customerUid == uid)` client query is NOT an authorization boundary.
- Firebase may request an index depending on the query. This version avoids ordering in Firestore and sorts fetched tickets locally.
- Do not put credentials, service-account keys or chatbot API keys in frontend environment variables.
- The old project's tickets are **not** available unless migrated. A missing ticket history is not proof that no prior issues occurred.

## Test

1. Log in as your new Firebase test user; confirm `users/{uid}` loads.
2. Open assistant: check the account status label and try `my package`.
3. Try `my previous issues`. If there are tickets in the **new** project, make sure the UI reads them under the current UID; otherwise expect the no-history message.
4. Try `my internet is slow`, `all devices`, `still slow` to see guided escalation and report button.
5. If the company WhatsApp number is configured, after several turns choose WhatsApp, and verify the correct company account before presenting.

## CanalBox facts to confirm with operations

Official company WhatsApp number; support hours; router models and light states; safe power-cycle recommendation; outage verification source; payment verification process; escalations and technician dispatch policy; exact package benefits. Update guided responses only after verification.
