import type { Metadata } from "next";
import Link from "next/link";
import { currentAdmin } from "@/lib/admin";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Admin · Business Social Media Health Check", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await currentAdmin();
  return (
    <>
      <header className="border-b border-hairline bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="serif text-[22px] text-brand">
            Health Check <span className="text-[15px] text-muted">· Admin</span>
          </Link>
          {email ? (
            <div className="flex items-center gap-3 text-[14px]">
              <span className="hidden text-muted sm:inline">{email}</span>
              <form action={signOut}>
                <button className="btn-text" type="submit">Sign out</button>
              </form>
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
