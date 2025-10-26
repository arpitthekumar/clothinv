"use client";

import { Button } from "@/components/ui/button";

interface RecentSalesProps {
	recentSales: any[];
	onAddRecentSaleToCart: (sale: any) => void;
}

export function RecentSales({ recentSales, onAddRecentSaleToCart }: RecentSalesProps) {
	if (recentSales.length === 0) {
		return <p className="text-sm text-muted-foreground text-center py-4">No recent sales found.</p>;
	}
	return (
		<div className="space-y-2 max-h-48 overflow-y-auto">
			{recentSales.slice(0, 5).map((sale) => (
				<div key={sale.id} className="flex items-center justify-between p-2 border rounded">
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium truncate">{sale.invoiceNumber}</p>
						<p className="text-xs text-muted-foreground">₹{sale.invoice_amount}</p>
					</div>
					<Button size="sm" variant="outline" onClick={() => onAddRecentSaleToCart(sale)} className="ml-2">+ Add</Button>
				</div>	
			))}
		</div>
	);
}


