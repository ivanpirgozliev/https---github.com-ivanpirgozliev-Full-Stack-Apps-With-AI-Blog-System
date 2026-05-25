import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border bg-background/80 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Blog<span className="text-accent">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-accent transition">
            Home
          </Link>
          <Link href="/about" className="hover:text-accent transition">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="btn-ghost text-muted"
            aria-label="Search"
            title="Search"
          >
            <Search size={18} />
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="btn-gradient text-sm">
                Dashboard
              </Link>
              <span className="hidden sm:inline text-sm text-muted">
                {user.name}
                {user.role === "admin" && (
                  <span className="ml-1.5 inline-block text-[10px] uppercase tracking-wider bg-accent text-white px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </span>
            </div>
          ) : (
            <Link href="/auth/login" className="btn-gradient text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
