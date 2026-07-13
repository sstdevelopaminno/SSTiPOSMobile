import { BadgeDollarSign, PackageSearch, ReceiptText, Settings, ShoppingCart, type LucideIcon } from "lucide-react";
import type { BranchRole } from "@/types/contracts";

export type MobileMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: BranchRole[];
};

export const mobileMenuItems: MobileMenuItem[] = [
  { href: "/sales", label: "ขาย", icon: ShoppingCart, roles: ["owner", "manager", "staff"] },
  { href: "/orders", label: "รายการขาย", icon: ReceiptText, roles: ["owner", "manager", "staff", "accountant"] },
  { href: "/stock", label: "จัดการสินค้า", icon: PackageSearch, roles: ["owner", "manager"] },
  { href: "/shifts", label: "ปิดยอด", icon: BadgeDollarSign, roles: ["owner", "manager", "staff"] },
  { href: "/settings", label: "ตั้งค่า", icon: Settings, roles: ["owner", "manager"] }
];

export function getMobileMenuItems(role: BranchRole) {
  return mobileMenuItems.filter((item) => item.roles.includes(role));
}
