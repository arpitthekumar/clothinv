"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import SalesCard from "./SalesCard";
import { Button } from "@/components/ui/button";

export default function SalesList({
  salesQuery,
  handleDelete,
  handleRestore,
  handlePermanentDelete,
  handleReturnSale,
  handlePrintSale,
  isSystemAdmin,
}: any) {
  const sales =
    salesQuery?.data?.pages?.flatMap((page: any) => page.data) ?? [];

  const hasMore = salesQuery?.hasNextPage;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales ({sales.length})</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Loading state */}
        {salesQuery.isLoading ? (
          <p className="text-center py-6 text-muted-foreground">Loading...</p>
        ) : sales.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">No sales found.</p>
        ) : (
          <>
            <div className="space-y-4">
              {sales.map((sale: any) => (
                <SalesCard
                  key={`${sale.id}-${sale.created_at}`}
                  sale={sale}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                  onReturn={handleReturnSale}
                  onPrint={handlePrintSale}
                  isSystemAdmin={isSystemAdmin}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => salesQuery.fetchNextPage()}
                  disabled={salesQuery.isFetchingNextPage}
                >
                  {salesQuery.isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}

            {/* End Message */}
            {!hasMore && !salesQuery.isFetchingNextPage && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No more sales to load
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}