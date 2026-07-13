# API Contracts

Responses use `{ data, error }`.

Implemented scaffold endpoints:
- `POST /api/auth/store-code/verify`
- `POST /api/auth/branches/select`
- `POST /api/auth/employee/verify`
- `POST /api/auth/devices/select`
- `POST /api/auth/session/logout`
- `/dashboard` is page-level compatibility routing only; mobile app entry after login is `/shifts` until an open shift redirects the operator to `/sales`.
- `POST /api/mobile/shifts` with `{ action: "open", openingCash }` or `{ action: "close" }`
