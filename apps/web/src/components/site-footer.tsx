import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <p>
          &copy; {new Date().getFullYear()} Blog. SoftUni Capstone project.
        </p>
        <nav className="flex items-center gap-6">
          <Link href="/" className="hover:text-accent transition">
            Home
          </Link>
          <Link href="/search" className="hover:text-accent transition">
            Search
          </Link>
          <Link href="/about" className="hover:text-accent transition">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
