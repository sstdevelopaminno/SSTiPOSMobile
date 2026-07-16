# Mobile Web Push

ระบบ Web Push ใช้สำหรับแจ้งเตือนมือถือแม้ผู้ใช้ปิดหน้าแอปอยู่ โดยต้องมี 3 ส่วนก่อนเปิดใช้งานจริง:

1. ตั้งค่า VAPID env ใน Vercel
   - `WEB_PUSH_PUBLIC_KEY`
   - `WEB_PUSH_PRIVATE_KEY`
   - `WEB_PUSH_SUBJECT`

2. เพิ่มตาราง Supabase สำหรับเก็บ subscription

```sql
create table if not exists public.mobile_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  branch_id uuid not null,
  user_id uuid not null,
  device_id uuid,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  status text not null default 'active',
  last_seen_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_push_subscriptions_scope_idx
  on public.mobile_push_subscriptions (tenant_id, branch_id, status);
```

3. ผู้ใช้ต้องกดเปิดสิทธิ์แจ้งเตือนบนมือถือ และควรเปิดแอปจากไอคอน PWA ที่ติดตั้งบนหน้าจอหลัก

หมายเหตุ: Chrome บน Android รองรับ Web Push ดีที่สุด ส่วน iOS ต้องติดตั้งเป็น PWA ก่อนจึงจะรับ notification ได้ตามข้อจำกัดของ Safari/iOS.
