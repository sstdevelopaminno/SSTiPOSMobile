# SSTiPOSMobile

Mobile-first Web App/PWA for SSTiPOS store owners, managers, and staff.

## Setup
```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

## Environment
Use the same Supabase project/database as `SSTiPOS` and `SSTiPOSSupport`. Do not create a second database and do not commit real secrets. Required names are listed in `.env.example`.

## Commands
```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Authentication Flow
`/login/store -> /login/branch -> /login/employee -> /dashboard`

The server resolves tenant, branch, user, role, session and feature state. Client-submitted scope is never trusted.

## Known Limitations
- Current login context is in-memory for Phase 1 scaffold; production should reuse `pos_login_contexts` or apply a reviewed mobile context migration.
- PIN hash verification is marked for integration with the existing SSTiPOS verifier before production login use.
- Sales write flow is not implemented in Phase 1.

## Next Phase
Wire the mobile auth service directly to existing SSTiPOS auth/session utilities or replace the in-memory context with a reviewed database-backed mobile context.
