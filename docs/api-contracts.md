# API Contracts

Responses use `{ data, error }`.

Implemented scaffold endpoints:
- `POST /api/auth/store-code/verify`
- `POST /api/auth/branches/select`
- `POST /api/auth/employee/verify`
- `POST /api/auth/devices/select`
- `POST /api/auth/session/logout`
- `GET /api/mobile/dashboard`
- `POST /api/mobile/shifts` with `{ action: "open", openingCash }` or `{ action: "close" }`
