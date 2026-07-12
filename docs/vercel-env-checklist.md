# Vercel Environment Checklist

Set these variables in Vercel Project Settings > Environment Variables for Production. Use the same Supabase project/database as `SSTiPOS`.

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOBILE_SESSION_SECRET`
- `MOBILE_SESSION_COOKIE_NAME=sstipos_mobile_session`
- `MOBILE_SESSION_TTL_HOURS=12`
- `MOBILE_LOGIN_CONTEXT_TTL_MINUTES=10`
- `AUTH_API_TIMEOUT_MS=8000`
- `RATE_LIMIT_BACKEND=memory`

Optional for production rate limiting:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Do not commit real values. After saving env vars in Vercel, redeploy Production.

Smoke test after redeploy:

1. Open `https://sstiposmobile.vercel.app/login/store`.
2. Enter store code `NDL-TH-001`.
3. Select branch `NDL-ONNUT-01` if branch selection appears.
4. Login with employee `sst182536` and PIN `182536`.
5. Confirm dashboard loads for the selected branch.
