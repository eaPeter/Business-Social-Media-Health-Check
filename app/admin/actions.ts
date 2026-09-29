"use server";

import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { sessionClient } from "@/lib/supabase/session";

export async function signIn(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const generic = { error: "Those details didn’t work. Check them and try again." };
  // Fail early (and identically) for anyone who isn't on the allowlist.
  if (!isAdminEmail(email)) return generic;

  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return generic;
  redirect("/admin");
}

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
