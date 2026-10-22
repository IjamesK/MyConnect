# MyConnect responsive UI update

## What's changed
- Desktop (>=1024px): customer portal uses a fixed-width sidebar and a centered main content column instead of a phone-sized column.
- Tablet/mobile (<1024px): bottom navigation remains, with full-width responsive content.
- Subscription: compact 2-column cards on phones and 4-column cards on tablet/desktop.
- Package card link: uses a Lucide `ChevronRight` icon, so it no longer depends on a wrapping text arrow. On very small devices, label is shortened to `Details`.
- Package information modal: bottom sheet on phones, centered dialog on larger screens.
- Customer dashboard: split hero/actions and tip/activity into a two-column desktop layout.
- Assistant: anchored lower right on desktop and above bottom navigation on mobile.

## Files changed
1. `src/app/components/isp/Layout.tsx`
2. `src/app/components/screens/SubscriptionPage.tsx`
3. `src/app/components/screens/CustomerDashboard.tsx`
4. `src/app/components/isp/AIChatWidget.tsx`

## Deployment
Prefer copying only the four changed files into your **latest working GitHub branch**, then commit.
Do not replace `src/lib/firebase.ts` or Vercel environment variables; keep your working `ijkjames` configuration.
The complete ZIP is for convenience; the small patch ZIP contains the changed files alone.

## Test checklist
- Mobile widths: 320px, 375px and 430px. Verify price, Details icon, package modal, chat button and bottom tabs.
- Tablet: 768px. Verify four package cards fit and bottom navigation works.
- Desktop: 1024px, 1366px and 1920px. Verify sidebar, package cards, assistant position and dashboard columns.
- Click GO, FIT, START and PREMIUM: modal opens; close on button/outside click/Escape; `Find out more` opens the assistant.
- Confirm sign-in, account details and support-ticket submission still work using a test account.

## Verification status
- Four modified TSX files pass TypeScript syntax transpilation.
- Full `npm run build` not verified in this environment (dependency installation timed out).
- Live Firebase and Vercel not changed or tested.
