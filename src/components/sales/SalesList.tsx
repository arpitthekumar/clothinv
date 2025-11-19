"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import SalesCard from "./SalesCard";

export default function SalesList({
  isLoading,
  filteredSales,
  handleDelete,
  handleRestore,
  handlePermanentDelete,
  handleReturnSale,
  handlePrintSale,
  isSystemAdmin,
}: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Sales ({filteredSales.length})
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-center py-6 text-muted-foreground">Loading...</p>
        ) : filteredSales.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">No sales found</p>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale: any) => (
              <SalesCard
                key={sale.id}
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
        )}
      </CardContent>
    </Card>
  );
}
