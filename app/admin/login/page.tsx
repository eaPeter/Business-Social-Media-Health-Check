import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-[440px] pt-6">
      <div className="card p-6 sm:p-9">
        <h1 className="serif text-[32px] leading-tight">Admin sign in</h1>
        <p className="mt-2 text-[15px] text-muted">Sign in to view assessment submissions.</p>
        <LoginForm />
      </div>
    </div>
  );
}
