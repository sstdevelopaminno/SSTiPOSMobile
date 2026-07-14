# SSTiPOSMobile

Mobile-first Web App/PWA for SSTiPOS store owners, managers, and staff.

## Setup
```powershell
pnpm install
Copy-Item .env.example .env.local
npm run dev
```
![alt text]
## Environment
Use the same Supabase project/database as `SSTiPOS` and `SSTiPOSSupport`. Do not create a second database and do not commit real secrets. Required names are listed in `.env.example` and `docs/vercel-env-checklist.md`.

## Commands
```powershell
npm run dev          # live reload for UI/system development
npm run dev:stable   # production-like local run after npm run build
npm run typecheck
npm run lint
npm test
npm run build
```

## Authentication Flow
`/login/store -> /login/branch -> /login/employee -> /login/device -> /shifts -> /sales`

The server resolves tenant, branch, user, role, cashier device, POS session, shift and feature state from the shared SSTiPOS Supabase database. Client-submitted scope is never trusted. After cashier device selection, the operator opens the device shift from `ปิดยอด`; once the shift is open, the app enters the `ขาย` menu. `/dashboard` is kept only as a compatibility redirect to `/sales` or `/shifts`.

## Deployment
Production alias: `https://sstiposmobile.vercel.app`

Before production login tests on Vercel, set the required Supabase and mobile session env vars in Vercel Project Settings. See `docs/vercel-env-checklist.md`.

## Known Limitations
- Sales write flow currently covers takeaway draft bills, held bills, cancellation, and cash/transfer checkout. Table and delivery sales remain placeholder entry points.
- Vercel runtime database login requires production env vars to be configured in Vercel Dashboard.

## Smoke Test Account
Use the shared SSTiPOS dev/production database test path after env is configured:

`NDL-TH-001 -> NDL-ONNUT-01 -> sst182536 -> cashier device -> open shift`
