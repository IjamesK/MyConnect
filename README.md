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

## Notes

- The support assistant is rule-based (no AI model). Its matching logic lives in `src/lib/assistantRules.ts` and is covered by `pnpm test`.
- More notes: `DEPLOY_AND_FIRESTORE_TEST.md`, `CANALBOX_ASSISTANT_SETUP.md`, `RESPONSIVE_UI_NOTES.md`.
