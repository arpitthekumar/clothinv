"use client";

import { Button } from "@/components/ui/button";

interface InventoryPaginationProps {
  currentPage: number;
  setCurrentPage: (val: number | ((prev: number) => number)) => void;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function InventoryPagination({
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: InventoryPaginationProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;

  // 👇 Compute dynamic visible page range
  const visiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  let endPage = startPage + visiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - visiblePages + 1);
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-3 sm:gap-0 items-center justify-between">
      {/* Info text */}
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}–
        {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} products
      </p>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}

        {/* ✅ fixed parentheses here */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
