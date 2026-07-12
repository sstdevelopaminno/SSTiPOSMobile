# Development Log

## 2026-07-12

- Created independent `SSTiPOSMobile` scaffold.
- Added mobile-first Next.js/PWA structure.
- Added Supabase server-only client and env validation.
- Added mobile login/dashboard scaffold.
- Copied SSTiPOS logo asset only; no secrets copied.
- No database migration applied.

## Verification Notes

- `corepack pnpm install` failed once because `@vite-pwa/next` was not available in npm registry; dependency was removed and replaced with a custom safe `public/sw.js` placeholder.
- `corepack pnpm install --network-concurrency 1` timed out after 5 minutes in this environment.
- `npm install` also timed out after 5 minutes.
- `npm run typecheck` and `npm test` could not run because dependency installation did not complete (`tsc` and `vitest` missing from local bin).

## 2026-07-12 Runtime Fix

- Fixed missing PATH workflow by documenting use of `pnpm.cmd`/Node path when needed.
- Fixed pnpm build approval by setting `allowBuilds` for `esbuild`, `sharp`, and `unrs-resolver` in `pnpm-workspace.yaml`.
- Renamed `next.config.cjs` to `next.config.js` for Next.js 15 compatibility.
- Added ESLint flat config and changed lint script to `eslint .`.
- Marked dashboard as dynamic runtime to avoid build-time Supabase env parsing.
- Fixed JSON encoding to UTF-8 without BOM.
- Verification passed: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Dev server verified at `http://127.0.0.1:3000/login/store` with HTTP 200.
- Added `tsconfig.tsbuildinfo` to `.gitignore` and removed the generated file from the working tree.

## 2026-07-13 Logo Update

- Replaced mobile login logo with the provided CpIPOS PNG asset at `public/brand/cpipos-logo.png`.
- Updated auth shell and PWA manifest to reference the new logo.
- Verification passed: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

## 2026-07-13 Login UI Match

- Updated store login screen to match the provided sample: centered CpIPOS logo, Thai/EN toggle, rounded blue-bordered card, store icon input, 0/32 counter, and blue next button.
- Verification passed: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

## 2026-07-13 Login Card Centering

- Removed the Thai/EN language toggle from the store login card.
- Centered the login card vertically and horizontally on the mobile screen.
- Verification passed: `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## 2026-07-13 Shared Database Auth Flow

- Replaced in-memory mobile login context with a signed HttpOnly mobile flow cookie.
- Store code verification now creates a real `pos_login_contexts` row in the shared SSTiPOS Supabase database when a single active branch is available.
- Multi-branch login stores the verified tenant in a signed cookie first, then creates the `pos_login_contexts` row after branch selection.
- Branch selection validates active branches from the shared `branches` table and creates or updates the login context scope.
- Employee login verifies employee code against `user_branch_roles`/`pos_user_profiles`, verifies PIN against `users_profiles.pin_hash` with bcrypt, and creates a real `pos_sessions` row.
- Removed client `sessionStorage` dependency from login flow.
- Verification passed: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

## 2026-07-13 Env and Login Smoke Test

- Created local `.env.local` from the existing SSTiPOS backoffice env keys without committing secrets.
- Verified real shared-database login smoke locally: `NDL-TH-001` -> `NDL-ONNUT-01` -> employee `sst182536` -> dashboard HTTP 200.
- Confirmed `/login/store` HTML includes Next CSS assets on the fresh dev server.

## 2026-07-13 Vercel Production Check

- Created and deployed Vercel project `sstiposmobile`.
- Production alias verified: `https://sstiposmobile.vercel.app`.
- Verified production `/login/store` returns HTTP 200 and includes Next CSS assets plus CpIPOS content.
- Vercel env values must be entered in Vercel Dashboard; secrets are intentionally not committed or printed.
