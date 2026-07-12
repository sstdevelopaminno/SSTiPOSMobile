import {redirect} from "next/navigation";import {readMobileSession} from "@/lib/auth/session";import type {BranchRole} from "@/types/contracts";
export async function requireMobileSession(roles?:BranchRole[]){const s=await readMobileSession();if(!s)redirect("/login/store");if(roles&&!roles.includes(s.role))redirect("/dashboard?error=unauthorized");return s}
