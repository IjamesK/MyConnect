# MyConnect theme refresh — installation & checks

## What's new
- **Mist Grey**: soft slate-grey canvas, white cards, charcoal accent; available in Settings → Theme.
- Updated **CanalBox Rose, Midnight, Emerald, and Sunset** palettes, with readable text and coherent status feedback.
- Shared design tokens in `src/lib/theme.ts` and `src/styles/index.css`, used by the Tailwind/shadcn layer in `src/styles/theme.css`.
- Updated customer dashboard, subscription cards and modal, notifications, self-help, ticket flows, login, account settings, staff views, and assistant panel to use the selected palette instead of fixed colors.
- Responsive staff navigation and refined customer sidebar/chat layout.
- Theme preference is saved on this device and applied before rendering to avoid a flash of the old theme.

## Safest installation
1. Commit/back up the currently deployed version of MyConnect in GitHub.
2. Use **MyConnect_Theme_UI_Patch.zip** to copy only the included paths into the project root, or use the complete project source as a reference.
3. **Do not overwrite your working Firebase environment settings, service credentials, or Firestore rules.** This change does not migrate or modify your database.
4. Commit to a branch and deploy a Vercel Preview before releasing to Production.
5. Open the app → Settings → Theme → Mist Grey. Check dashboard, packages, modal, router light selector, assistant, ticket form, and staff pages in every palette.
6. Test narrow phones (320–430px), tablets (~768px), laptop (~1280px), and desktop (~1440px). Check modals, text wrapping, contrast, and navigation.
7. Verify login and ticket submission with your Firebase test user before switching the live site.

## Technical verification
- The changed TypeScript and TSX files pass syntax transpilation with TypeScript.
- Every referenced theme token has a defined palette value; local relative imports are present.
- Primary buttons against white foreground pass the 4.5:1 contrast threshold by approximate color calculations for all five themes.
- A full Vite production build and live-browser end-to-end checks could **not** be completed in this environment (dependency installation unavailable). **Do not interpret syntax checks as a verified deployment.**

## Unchanged behavior
- MyConnect's authenticated Firebase project is still read from the existing `VITE_FIREBASE_*` environment variables; no Firebase project ID or secrets were added.
- No ticket-creation logic, pricing, chatbot guidance, or Firestore rules were intentionally modified.
- Old live customer data stays untouched.
