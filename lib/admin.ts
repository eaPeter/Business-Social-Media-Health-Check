import "server-only";
import { redirect } from "next/navigation";
import { sessionClient } from "./supabase/session";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/** Returns the signed-in admin's email, or null. Verified against Supabase Auth on every call. */
export async function currentAdmin(): Promise<string | null> {
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  return isAdminEmail(data.user?.email) ? data.user!.email! : null;
}

export async function requireAdmin(): Promise<string> {
  const email = await currentAdmin();
  if (!email) redirect("/admin/login");
  return email;
}
