"use server";

import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { sessionClient } from "@/lib/supabase/session";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export async function signIn(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email && !password) return { error: "Enter your email and password." };
  if (!email) return { error: "Enter your email address." };
  if (!EMAIL.test(email)) return { error: "That doesn’t look like a valid email address. Check for typos." };
  if (!password) return { error: "Enter your password." };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: "Sign-in isn’t configured: the Supabase environment variables are missing on the server." };
  }
  // ADMIN_EMAILS is a separate allowlist on top of the Supabase user.
  if (!isAdminEmail(email)) {
    return { error: "This email isn’t on the admin list. Check the spelling, or ask the site owner to add it to ADMIN_EMAILS." };
  }

  let failure: string | undefined;
  try {
    const supabase = await sessionClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Admin sign-in failed:", error.code ?? error.status, error.message);
      switch (error.code) {
        case "invalid_credentials":
          failure = "Incorrect email or password. Check both and try again.";
          break;
        case "email_not_confirmed":
          failure = "This account’s email hasn’t been confirmed. In Supabase, open Authentication → Users and confirm the user.";
          break;
        case "over_request_rate_limit":
        case "over_email_send_rate_limit":
          failure = "Too many sign-in attempts. Wait a few minutes, then try again.";
          break;
        case "user_banned":
          failure = "This account has been disabled in Supabase.";
          break;
        default:
          failure =
            error.status && error.status >= 500
              ? "The authentication service is having trouble. Try again in a moment."
              : `Couldn’t sign in (${error.code ?? error.message}).`;
      }
    }
  } catch (e) {
    console.error("Admin sign-in error:", e);
    failure = "Couldn’t reach the authentication service. Check your connection and try again.";
  }

  if (failure) return { error: failure };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
