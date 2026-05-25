import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Blog<span className="text-accent">.</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
