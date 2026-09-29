import { Assessment } from "@/components/Assessment";

export default function Home() {
  return (
    <>
      <header className="border-b border-hairline bg-white">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center px-4 sm:px-6">
          <span className="serif text-[22px] text-brand">Business Social Media Health Check</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-8 sm:pt-12">
        <Assessment />
      </main>
      <footer className="pb-10 text-center text-[13px] text-muted">
        Your answers are used only to prepare your results.
      </footer>
    </>
  );
}
