# API Contracts

Responses use `{ data, error }`.

Implemented endpoints:
- `POST /api/auth/store-code/verify`
- `POST /api/auth/branches/select`
- `POST /api/auth/employee/verify`
- `POST /api/auth/devices/select`
- `POST /api/auth/session/logout`
- `/dashboard` is page-level compatibility routing only; mobile app entry after login is `/shifts` until an open shift redirects the operator to `/sales`.
- `POST /api/mobile/shifts` with `{ action: "open", openingCash }` or `{ action: "close" }`
- `GET /api/mobile/dashboard`
- `GET /api/mobile/features` returns the current mobile role permissions, package feature flags, and menu lock metadata.
- `POST /api/mobile/sales/takeaway/hold` stores the current takeaway draft bill as `orders.status = held`.
- `GET /api/mobile/sales/takeaway/held` lists held takeaway bills and line items for the current tenant/branch scope.
- `POST /api/mobile/sales/takeaway/held/restore` restores a scoped held takeaway bill into the current device shift as a draft bill.
- `POST /api/mobile/sales/takeaway/cancel` cancels the scoped takeaway draft bill after owner/manager employee-code confirmation.
- `POST /api/mobile/sales/takeaway/checkout` closes the scoped takeaway draft bill, writes line items and payment, and marks the order paid.
- `GET /api/mobile/payments/qr?amount=120.00` returns the active branch payment QR configuration from `tenant_payment_accounts`, preferring a branch-specific account before an all-branch account, plus INET QR availability from `pos_payment_provider_settings`.
