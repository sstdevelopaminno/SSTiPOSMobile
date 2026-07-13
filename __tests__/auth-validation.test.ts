import { describe, expect, it } from "vitest";
import { decodeMobileSessionToken } from "../src/lib/auth/session-token";
import { storeCodeSchema } from "../src/lib/validation/auth";

describe("auth validation", () => {
  it("accepts a compact store code", () => {
    expect(storeCodeSchema.safeParse({ storeCode: "SHOP1" }).success).toBe(true);
  });

  it("rejects malformed mobile session tokens without throwing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.MOBILE_SESSION_SECRET = "012345678901234567890123";

    expect(decodeMobileSessionToken("payload.short")).toBeNull();
    expect(decodeMobileSessionToken("not-json.0123456789012345678901234567890123456789012")).toBeNull();
  });
});
