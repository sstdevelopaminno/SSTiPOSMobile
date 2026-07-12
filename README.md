# SSTiPOSMobile

Mobile-first Web App/PWA for SSTiPOS store owners, managers, and staff.

## Setup
```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

## Environment
Use the same Supabase project/database as `SSTiPOS` and `SSTiPOSSupport`. Do not create a second database and do not commit real secrets. Required names are listed in `.env.example` and `docs/vercel-env-checklist.md`.

## Commands
```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Authentication Flow
`/login/store -> /login/branch -> /login/employee -> /dashboard`

The server resolves tenant, branch, user, role, session and feature state from the shared SSTiPOS Supabase database. Client-submitted scope is never trusted.

## Deployment
Production alias: `https://sstiposmobile.vercel.app`

Before production login tests on Vercel, set the required Supabase and mobile session env vars in Vercel Project Settings. See `docs/vercel-env-checklist.md`.

## Known Limitations
- Sales write flow is not implemented in Phase 1.
- Vercel runtime database login requires production env vars to be configured in Vercel Dashboard.

## Smoke Test Account
Use the shared SSTiPOS dev/production database test path after env is configured:

`NDL-TH-001 -> NDL-ONNUT-01 -> sst182536 / 182536`
