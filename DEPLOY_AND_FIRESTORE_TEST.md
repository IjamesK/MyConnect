# MyConnect CanalBox assistant — deployment and verification

## Included
- Guided language matching for common CanalBox symptoms (not a generative AI model).
- Verified Wi-Fi name/password self-service process at https://my.canalbox.africa/login; customer connects to CanalBox Wi-Fi, copies their saved router serial number, enters S/N, then uses menu → My Box → WiFi. SSID and passphrase: at least 8 characters. Allow at least 24 hours between changes/resets. Forgotten Wi-Fi password when not connected: support-assisted reset case, never physical factory reset.
- Router-light choices, 5-minute safe power restart, possible LOS/fibre-fault guidance, trouble accessing websites, Speedtest.net customer measurements, payment transaction ID/Finance, and WhatsApp +256 758 073 035 after escalation.
- Ticket form loads **signed-in UID's current Firestore profile** instead of localStorage; assistant-prefilled symptoms/speed figures; related ticket detection.
- Ticket creation returns its Firestore reference even if optional notification creation fails. Notification failures are logged.

## Firebase rules (CRITICAL)
`firestore.rules` is a **customer-only demonstration baseline**, not a full production ruleset. It grants owner-scoped profile reads, ticket reads/creates and narrowly limited comment appends, plus owner-scoped notification activity. It denies staff ticket management, incidents, billing and all other collections. **Do not replace active production rules blindly**: review all existing collection needs, test in Firebase Rules Playground/emulator, merge necessary role-based permissions, and publish only once verified. The rule set cannot prevent all fabricated initial client metadata; a trusted backend is recommended before public launch. Never use `allow read, write: if true`.

For a test customer, Firebase Authentication UID must equal Firestore `users/{uid}` document ID. The frontend must be built with the six `VITE_FIREBASE_*` variables for the new `ijkjames` project. Do not replace your working Firebase configuration with hardcoded old values.

## Before deploying
1. Back up your current GitHub branch and Firestore rules. Make a preview deployment with Vercel before switching Production.
2. Keep existing working `src/lib/firebase.ts` if it already points at the new project. Compare source changes rather than replacing unrelated app settings.
3. Publish tested, merged Firestore rules in the **ijkjames** Firebase project separately (deploying the ZIP does NOT publish rules).
4. Test sign-in as your new test account. Verify profile loads, router S/N appears, history lists only own tickets.
5. Ask: 'I want to change my WiFi password'; 'I forgot my WiFi password'; 'Some websites will not open'; 'My internet is slow'; 'red LOS'.
6. Enter actual Speedtest.net values; go to Report Issue; verify results in description and submit. Confirm the new `tickets/{id}` in Firestore contains `customerUid == auth.uid`, correct category, description, status `open`, and reference ID. Open ticket tracking and ensure it is visible. If a related active case exists, add comment instead of a duplicate.
7. In a separate test account confirm the other customer's tickets/profile **cannot** be read, edited, or listed. Confirm unauthorized role/status edits fail.
8. Test WhatsApp late escalation only. Never share Wi-Fi passphrases, OTPs, admin logins or transaction PINs.

## Test limitations
No real Firebase account login or ticket submission was performed from this workspace. `npm install --offline` could not complete because dependencies were missing in the local cache. Run `npm install && npm run build` in a network-enabled environment or let Vercel's Preview build run. Review and resolve errors before production deployment. This is still guided support, not a free-form AI model.
