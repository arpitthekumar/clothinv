"use client";

import { Button } from "@/components/ui/button";

interface MostSoldItem { productId: string; name: string; totalSold: number; price: string }

interface MostSoldProps {
	mostSoldProducts: MostSoldItem[];
	getProduct: (id: string) => { stock: number } | undefined;
	onAddMostSoldToCart: (item: MostSoldItem) => void;
}

export function MostSold({ mostSoldProducts, getProduct, onAddMostSoldToCart }: MostSoldProps) {
	if (mostSoldProducts.length === 0) {
		return <p className="text-sm text-muted-foreground text-center py-4">No sales data available.</p>;
	}
	return (
		<div className="space-y-2 max-h-48 overflow-y-auto">
			{mostSoldProducts.slice(0, 5).map((product) => {
				const productData = getProduct(product.productId);
				const isOutOfStock = !productData || productData.stock <= 0;
				return (
					<div key={product.productId} className={`flex items-center justify-between p-2 border rounded ${isOutOfStock ? "opacity-50 bg-muted" : ""}`}>
						<div className="flex-1 min-w-0">
							<p className={`text-sm font-medium truncate ${isOutOfStock ? "text-muted-foreground" : ""}`}>{product.name}</p>
							<p className="text-xs text-muted-foreground">{product.totalSold} sold • ₹{product.price}{isOutOfStock && (<span className="text-red-500 ml-2">• Out of Stock</span>)}</p>
						</div>
						<Button size="sm" variant="outline" onClick={() => onAddMostSoldToCart(product)} className="ml-2" disabled={isOutOfStock}>+ Add</Button>
					</div>
				);
			})}
		</div>
	);
}


