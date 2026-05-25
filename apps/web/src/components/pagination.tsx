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
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t border-border"
      aria-label="Pagination"
    >
      <div className="text-sm text-muted">
        Page {page} of {totalPages} ({total.toLocaleString()} results)
      </div>
      <div className="flex items-center gap-2">
        {prev ? (
          <Link href={hrefForPage(prev)} className="btn-gradient text-sm">
            <ChevronLeft size={16} />
            Prev
          </Link>
        ) : (
          <span className="btn-gradient is-disabled text-sm" aria-disabled="true">
            <ChevronLeft size={16} />
            Prev
          </span>
        )}
        {next ? (
          <Link href={hrefForPage(next)} className="btn-gradient text-sm">
            Next
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className="btn-gradient is-disabled text-sm" aria-disabled="true">
            Next
            <ChevronRight size={16} />
          </span>
        )}
      </div>
    </nav>
  );
}
