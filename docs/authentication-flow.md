# Authentication Flow

1. Store code verification resolves active tenant.
2. Active branches are loaded server-side.
3. Single branch can be auto-selected; multi-branch shows branch selection.
4. Employee code/PIN verification must resolve membership and role server-side.
5. Server creates/reuses revocable POS session and sets HttpOnly mobile cookie.
6. Logout revokes server session before clearing cookie.
