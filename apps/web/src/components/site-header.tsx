import Link from "next/link";
import { LogOut, Search, Shield } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
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
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="btn-ghost text-sm"
                  title="Admin panel"
                >
                  <Shield size={16} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <Link href="/dashboard" className="btn-gradient text-sm">
                Dashboard
              </Link>
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-2 btn-ghost text-sm"
                title={user.name}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="btn-ghost text-sm text-muted"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </form>
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
