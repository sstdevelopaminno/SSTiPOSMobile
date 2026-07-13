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
- Added `tsconfig.tsbuildinfo` to `.gitignore`; the file may be regenerated locally by TypeScript incremental builds.

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
- Employee login verifies employee code against `user_branch_roles`/`pos_user_profiles` and creates a real `pos_sessions` row.
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
## 2026-07-13 Vercel Env Safety

- Attempted Vercel env automation was stopped by secret-safety controls because it would transmit `SUPABASE_SERVICE_ROLE_KEY` and `MOBILE_SESSION_SECRET` from local `.env.local` to an external service.
- Documented the safe manual Vercel Dashboard env setup path in `docs/vercel-env-checklist.md`.
- No Vercel token or secret env values were written to repository files.

## 2026-07-13 Session Cookie Hardening

- Hardened mobile session cookie decoding so malformed or tampered cookies return `null` instead of throwing.
- Updated security checklist to reflect the DB-backed login context and employee-code verification now present in code.
- Verification passed: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## 2026-07-13 Store Login Error Handling

- Improved store-code login form to preserve API error messages instead of showing a generic connection failure for every non-OK response.
- Added JSON content-type headers across store, branch, and employee login requests.
- Wrapped auth API route handlers with JSON error responses so server-side Supabase errors do not fall through as HTML 500 responses.
- Hardened store-code branch handling by ignoring invalid branch rows and using `MOBILE_LOGIN_CONTEXT_TTL_MINUTES` for login context expiry.
- Verified Supabase data for `NDL-TH-001`: active tenant with two active branches.
- Verification passed: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## 2026-07-13 Store Login Abort Fix

- Removed the store login form's hard 8-second `AbortController` timeout because local Next.js cold starts and Supabase checks can legitimately exceed it.
- Added a friendly fallback for any future browser abort error instead of exposing `signal is aborted without reason`.
- Verification passed: `npm run lint`, `npm run typecheck`, `npm test`.

## 2026-07-13 Dev Cache Reset

- Diagnosed `next-devtools/userspace/app/segment-explorer-node.js#SegmentViewNode` and `__webpack_modules__[moduleId] is not a function` as a stale/corrupt Next.js dev cache issue.
- Stopped stale `node.exe` dev processes and renamed `.next` to `.next-stale-20260713-105224` so `npm run dev` can regenerate a clean manifest.
- Added `.next-stale-*` to `.gitignore` so local dev cache backups do not appear in git status.
- Follow-up command for this case: stop `npm run dev`, move or delete `.next`, then run `npm run dev` again.

## 2026-07-13 Branch Selection UX Fix

- Fixed invisible branch names by replacing the undefined `text-ink` class with an explicit dark text color on white branch buttons.
- Cached the branch list returned by store-code verification in `sessionStorage` as a UI-only cache so `/login/branch` can render branches immediately while still revalidating with the server.
- Branch selection remains server-enforced; cached branch data is not trusted for POST validation.
- Added `.next-stale-*/**` to ESLint ignores so local dev cache backups are not linted.

## 2026-07-13 Branch Page Server Render

- Changed `npm run dev` to `next dev --turbo` to avoid the webpack devtools `segment-explorer-node.js#SegmentViewNode` manifest error seen in local dev.
- Rebuilt `/login/branch` as a server-rendered page that reads the signed mobile flow cookie and loads active branches before sending HTML.
- Moved branch selection POST behavior into `src/components/auth/branch-selector.tsx`, keeping branch selection server-validated while ensuring branch names are visible even before client hydration completes.

## 2026-07-13 Stable Local Dev Command

- Diagnosed Turbopack `unrecognized HMR message {"event":"ping","page":"/_error"}` as a local HMR websocket/dev-server compatibility issue in Next.js 15.5.20.
- Changed `npm run dev` to run `next start` so local testing uses the latest successful production build without HMR or repeated cold builds.
- Added `npm run dev:hot` for optional hot-reload work with Turbopack when needed.
- After an interrupted build left `.next` incomplete, moved it to `.next-stale-20260713-113708` and verified a clean `npm run build` succeeds.
- Local workflow is now `npm run build` after code changes, then `npm run dev` for stable testing.

## 2026-07-13 Branch Button Visibility Fix

- Replaced the shared `Button` component in branch selection with a native button so the shared `text-white` default cannot override branch labels.
- Added explicit dark inline text color and a two-line branch layout showing branch name and branch code.
- Rewrote corrupted Thai fallback strings in `src/components/auth/branch-selector.tsx`.

## 2026-07-13 Employee Code Login

- Removed the PIN input from `/login/employee`; employee login now submits only `employeeCode`.
- Updated `/api/auth/employee/verify` and employee-code verification to validate active branch membership without bcrypt PIN comparison.
- New `pos_sessions.login_method` value for this mobile flow is `employee_code`.
- Updated README, auth flow, Vercel checklist, manual QA checklist, and security checklist to remove stale PIN instructions.

## 2026-07-13 Cashier Device and Shift Gate

- Split employee verification from POS session creation so entering an employee code no longer skips directly to the dashboard.
- Added `/login/device` and `POST /api/auth/devices/select`; cashier devices are loaded from `branch_devices` and validated server-side before creating `pos_sessions`.
- Extended mobile session cookies with `deviceId`, `deviceCode`, and `deviceName`.
- Updated dashboard to show a required open-shift gate when no `shifts.status = open` row exists for the selected tenant, branch, and cashier `device_code`.
- Added `/shifts` and `POST /api/mobile/shifts` so the selected cashier device can open and close its own shift.
- Reworked branch, employee, device, dashboard gate, and shift UI to follow the provided SSTiPOS flow screenshots.

## 2026-07-13 Store Login Fetch UX

- Hardened store-code verification fetch with explicit JSON accept headers, same-origin credentials, and no-store caching.
- Replaced raw browser `Failed to fetch` text with a Thai server-connection message that points the operator to confirm the local server is running.
- Unregisters stale service workers from the login form to prevent old PWA handlers from intercepting auth API requests.
- Made the next button visibly darker and taller when a store code is entered, while keeping the disabled state pale.

## 2026-07-13 Login Step Loading Popups

- Added a reusable auth loading dialog with CpIPOS branding, spinner, title, and status message.
- Store-code, branch-selection, employee-code, and cashier-device steps now show the loading dialog while server validation and route transition are in progress.
- Kept loading state active during successful navigation to prevent flicker and double-submit while the next server-rendered step is loading.
- Added explicit `Accept: application/json`, `cache: no-store`, and `credentials: same-origin` to branch, employee, and device auth fetches.
- Rewrote branch, employee, and device auth UI text to clean Thai UTF-8 and removed stale mojibake strings.
- Reduced auth-shell vertical padding and hid scrollbars globally/mobile-shell so the mobile web app feels more like an installed application.

## 2026-07-13 Mobile Bottom Menu and Shift Access

- Replaced the mobile bottom navigation with the requested app menu: `ขาย`, `รายการขาย`, `จัดการสินค้า`, `ปิดยอด`, and `ตั้งค่า`.
- Bottom navigation now appears only when the selected cashier device has an open shift.
- The no-shift gate links to `/shifts` with the user-facing label `ไปเมนูปิดยอด`.
- `/shifts` is now titled `ปิดยอด`; opening a shift refreshes the same page so the bottom menu appears there instead of jumping back to dashboard.
- Added role-based menu visibility: owner/manager see all menus, staff see sales/order/close-total, and accountant is limited to sales-list access.
- Added server-side route guards so direct URL access to sales/order/stock/settings requires an open shift and the allowed role.
- Added server-side role enforcement to `POST /api/mobile/shifts` for open/close shift actions.

## 2026-07-13 Opening Cash and Sales Redirect

- Added required opening-cash input to the `ปิดยอด` page before opening a shift.
- `POST /api/mobile/shifts` now validates `openingCash` for open-shift requests and stores it in `shifts.opening_cash` and `shifts.expected_cash`.
- Opening a shift now redirects directly to `/sales` instead of staying on the `ปิดยอด` page, preventing the loading dialog from feeling stuck.
- Added quick opening-cash buttons for `0`, `500`, `1,000`, and `2,000`.
- Replaced the sales placeholder with a blank mobile POS starter surface titled `พร้อมขาย` for the next design pass.

## 2026-07-13 Sales Mobile UI Starter

- Rebuilt `/sales` into a mobile POS launcher matching the provided reference: ready-to-sell status card, quick actions, summary cards, recent sales, and POS starter banner.
- Added sales header subtitle and a notification action slot to `MobileAppShell`.
- Sales summary reads recent same-day orders for the selected tenant and branch, with mock fallback values when no orders exist.
- Kept the sales screen guarded by open-shift and role checks before rendering the mobile POS UI.

## 2026-07-13 Sales Branding Header

- Removed the `SSTiPOS Mobile` eyebrow from the shared mobile app shell.
- Added an optional brand slot to `MobileAppShell` so pages can render product branding without hard-coded shell text.
- Added CpIPOS logo and wordmark beside the `ขาย` header and kept the notification action on the right.
- Added a subtle CpIPOS watermark inside the ready-to-sell card background instead of using a large visible logo block.
- Updated app metadata and login subtitle from `SSTiPOS Mobile` to `CpIPOS Mobile`.
- Replaced the sales header and ready-card watermark image with the standalone CpIPOS symbol at `public/brand/cpipos-symbol.png` while keeping the `CpIPOS` name text.
- Removed the sales page title/subtitle text so the top header shows only the CpIPOS brand row and notification action.

## 2026-07-13 Live Dev and Sales Cleanup

- Changed `npm run dev` back to `next dev` so UI and system edits hot reload immediately during development.
- Kept production-like local testing available as `npm run dev:stable` after `npm run build`.
- Kept optional Turbopack testing available as `npm run dev:turbo`, but it is no longer the default because prior local HMR pings were unstable.
- Cleaned the pending sales/logo changes and kept the CpIPOS symbol asset at `public/brand/cpipos-symbol.png`.
- Rewrote the `/sales` Thai UI strings to valid UTF-8 after the previous logo/header pass left mojibake text in the page.
- Verification passed: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Local live-dev smoke: `npm run dev -- --port 3017` opened a listener on port `3017`; the test process was stopped after verification.

