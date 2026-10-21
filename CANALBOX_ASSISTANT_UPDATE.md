# CanalBox support assistant — demonstration build

This updates `src/app/components/isp/AIChatWidget.tsx` from the preceding assistant build.

## Verified procedures included
- Company WhatsApp escalation: +256 758 073 035, displayed only after repeated unresolved checks and the Report Issue route has been offered. WhatsApp opens an external chat; it does not upload photos itself.
- Most clients have ZTE white routers; selector also supports black ALCL routers.
- Router power restart: power OFF for 5 minutes, restore power and allow lights to settle. Never factory-reset or touch optical connector.
- Wi-Fi network name missing: white ZTE — briefly press the Wi-Fi button on the wide side; black router — briefly press rear WLAN button.
- Red LOS: possible lost optical signal / fibre fault (a cut is NOT confirmed remotely).
- Slow speeds: compare devices/Wi-Fi versus wired use, inspect lights, and offer a `slow_speed` support case.
- Finance: customer supplies transaction ID as proof; assistant cannot claim payment verification.

## Demo sequence
1. Sign in with test Firebase user that has `users/{auth.uid}` profile.
2. Open Ask MyConnect, then 'Check router lights (visual guide)'. Select white ZTE and choose indicators.
3. Test POWER + PON + INTERNET but without WiFi; diagnosis suggests wide-side Wi-Fi button.
4. Test POWER + LOS; diagnosis recommends opening a case for a possible optical fault.
5. Type 'My internet is slow', then 'still slow' and use Create/View support ticket.
6. Ask 'previous tickets' to see the latest accessible ticket; history will only work if Firestore rules allow owner-scoped queries on `tickets` where `customerUid == request.auth.uid`.
7. After unresolved checks and escalation offer, WhatsApp link becomes available for sharing photos.

## Limitations / safety
- This is a deterministic guided assistant, NOT a generative AI model or real-time fibre line diagnostic.
- No support ticket is automatically created: the assistant navigates to the existing issue-report workflow.
- The light panel is a simplified selectable indicator illustration, not a photorealistic router photo.
- Existing deployed Firebase rules may deny ticket-history reads; the assistant degrades gracefully.
- It does not recover records from the inaccessible old Firebase project.
- Keep current `src/lib/firebase.ts` connected to your NEW ijkjames project through Vercel VITE_FIREBASE_* variables.
- The password, OTP, payment PIN, full card details should never be requested through chat.
- Test on Vercel first; a local npm build was not possible because dependencies were absent from the offline npm cache.
