# Deployment and security notes

- No live Firebase project or authentication settings were changed.
- Grant staff/admin Firebase **custom claims** through a trusted Admin SDK; the repository has no claim-issuing workflow. Until claims are issued, staff features remain denied.
- Firestore rules for `incidents` intentionally permit reads to signed-in customers because the current app queries all incidents and filters client-side. Do not store private customer details in published incidents.
- `getAffectedCustomerUids` in `src/lib/incidents.ts` attempts to list **all users** from the client. This stays denied by Firestore rules; move incident notifications and user enumeration to a trusted backend instead of granting broad user-list permission.
- Confirm helpline, WhatsApp, and moving-policy details with CanalBox before publishing.
- Node >=22.18 is required for direct `.ts` imports in Node tests.
- After deploying rules, test separately with a real customer UID, a staff-claim UID, and an unauthenticated session using Firebase Emulator.
- `.gitattributes` added; normalize only after reviewing diff: `git add --renormalize .`.
