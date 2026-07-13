import { z } from "zod";

export const storeCodeSchema = z.object({ storeCode: z.string().trim().min(2).max(64) });
export const branchSelectSchema = z.object({ branchId: z.string().uuid() });
export const employeeVerifySchema = z.object({ employeeCode: z.string().trim().min(1).max(64) });
export const deviceSelectSchema = z.object({ deviceId: z.string().uuid() });
