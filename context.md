# Context

`SSTiPOSMobile` is an independent mobile-first project. It connects to the same Supabase database as `SSTiPOS` and is governed by `SSTiPOSSupport` package/feature controls.

Authoritative rules:
- Do not create a second database.
- Do not trust client tenant/branch/user/device/role/permission/package values.
- Service role key is server-only.
- Feature metadata is resolved server-side; paid/package feature enforcement must be applied on every protected route/API before enabling new paid features.
- UI targets mobile widths 360px, 390px, 430px first.

Implementation notes:
- Mobile POS bottom navigation keeps the existing five route/permission-driven items and emphasizes the center `สินค้า` action with a raised rounded button, curved page-background notch, safe-area support, and extra shell bottom padding.
