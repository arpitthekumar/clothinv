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
        {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}{" "}
        products
      </p>

      {/* Pagination Controls */}
      <div className="flex flex-col  items-center space-x-2">
        {/* Previous */}
        <div className="flex">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="min-w-[70px] hidden md:inline-flex mr-2"
          >
            Prev
          </Button>
          
          {/* --- FIRST PAGE BUTTON --- */}
          {startPage > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(1)}
              >
                1
              </Button>

              {/* Dots */}
              {startPage > 2 && <span className="px-1">...</span>}
            </>
          )}

          {/* --- CENTER DYNAMIC PAGES --- */}
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

          {/* --- LAST PAGE BUTTON --- */}
          {endPage < totalPages && (
            <>
              {/* Dots */}
              {endPage < totalPages - 1 && <span className="px-1">...</span>}

              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="min-w-[70px] hidden md:inline-flex ml-2"
          >
            Next{" "}
          </Button>
        </div>

        {/* mobile buttons */}
        <div className="md:hidden space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev{" "}
          </Button>
          {/* Next */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next{" "}
          </Button>
        </div>
      </div>
    </div>
  );
}
