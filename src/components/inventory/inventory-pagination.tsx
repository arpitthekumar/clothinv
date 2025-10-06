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
  return (
    <div className="p-6 border-t border-border flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-
        {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} products
      </p>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          );
        })}

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
