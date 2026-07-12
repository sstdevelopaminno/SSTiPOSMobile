import { describe, expect, it } from "vitest";
import { storeCodeSchema } from "../src/lib/validation/auth";

describe("auth validation", () => {
  it("accepts a compact store code", () => {
    expect(storeCodeSchema.safeParse({ storeCode: "SHOP1" }).success).toBe(true);
  });
});
