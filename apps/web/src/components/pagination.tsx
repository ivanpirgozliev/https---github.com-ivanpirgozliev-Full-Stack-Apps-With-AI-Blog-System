import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  /** Build the link for a given page, preserving other query params. */
  hrefForPage: (page: number) => string;
}

export function Pagination({ page, pageSize, total, hrefForPage }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      className="flex items-center justify-between gap-4 mt-12 pt-6 border-t border-border"
      aria-label="Pagination"
    >
      <div className="text-sm text-muted">
        Page {page} of {totalPages} ({total.toLocaleString()} results)
      </div>
      <div className="flex items-center gap-2">
        {prev ? (
          <Link
            href={hrefForPage(prev)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted-bg transition"
          >
            <ChevronLeft size={16} />
            Prev
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border opacity-40 cursor-not-allowed">
            <ChevronLeft size={16} />
            Prev
          </span>
        )}
        {next ? (
          <Link
            href={hrefForPage(next)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted-bg transition"
          >
            Next
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border opacity-40 cursor-not-allowed">
            Next
            <ChevronRight size={16} />
          </span>
        )}
      </div>
    </nav>
  );
}
