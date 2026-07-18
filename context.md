# Context

`SSTiPOSMobile` is an independent mobile-first project. It connects to the same Supabase database as `SSTiPOS` and is governed by `SSTiPOSSupport` package/feature controls.

Authoritative rules:
- Do not create a second database.
- Do not trust client tenant/branch/user/device/role/permission/package values.
- Service role key is server-only.
- Feature metadata is resolved server-side; paid/package feature enforcement must be applied on every protected route/API before enabling new paid features.
- UI targets mobile widths 360px, 390px, 430px first.

Implementation notes:
- Mobile POS bottom navigation keeps the existing five route/permission-driven items and uses an integrated U-shaped concave center notch for `สินค้า`; the center item stays inside the bar, with no floating or detached center button.
- Mobile takeaway receipts use the store `logo_url` when available and fall back to the full system logo `/brand/cpipos-logo.png`, matching the main SSTiPOS receipt fallback.
- The sales home bell shows a red unread dot and opens an in-app notification list for current shift/order/product readiness notices.
- The sales shortcut row pairs `รายการพัก` with a square `สมาชิก` action, and the three sales mode cards use consistent Lucide icons.
- The mobile stock/product management page uses a table-like responsive list without product images or row sequence numbers, keeping search, tabs, pagination, edit/delete, and add-item handlers wired to the existing stock data flow.
