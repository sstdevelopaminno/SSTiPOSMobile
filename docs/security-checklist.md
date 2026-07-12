# Security Checklist

- [x] `.env.example` contains placeholder names only.
- [x] Service role client is server-only.
- [x] HttpOnly mobile session cookie scaffolded.
- [x] Zod request validation added.
- [x] Generic Thai auth errors added.
- [x] Basic rate limiter scaffolded.
- [x] PWA cache excludes login/auth/session/mobile APIs.
- [ ] Replace in-memory login context with DB-backed context before production.
- [ ] Integrate existing PIN hash verifier before production.
- [ ] Add feature gate resolver before enabling paid features.
