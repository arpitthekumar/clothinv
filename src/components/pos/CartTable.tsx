"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CartItemUI {
	id: string;
	productId: string;
	name: string;
	sku: string;
	quantity: number;
	price: string;
	stock: number;
}

interface CartTableProps {
	items: CartItemUI[];
	onDecrease: (productId: string) => void;
	onIncrease: (productId: string) => void;
	onRemove: (productId: string) => void;
}

export function CartTable({ items, onDecrease, onIncrease, onRemove }: CartTableProps) {
	if (items.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-muted-foreground">Cart is empty</p>
				<p className="text-sm text-muted-foreground">Scan or search for products to add them</p>
			</div>
		);
	}

	return (
		<div className="space-y-3 md:space-y-4">
			{items.map((item) => (
				<div key={item.id} className="flex items-center justify-between gap-3 border-b pb-3 md:pb-4">
					<div className="flex-1 min-w-0">
						<h4 className="font-medium truncate">{item.name}</h4>
						<p className="text-sm text-muted-foreground">SKU: {item.sku} • ₹{item.price}</p>
						<Badge variant="outline" className="mt-1">{item.stock} in stock</Badge>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={() => onDecrease(item.productId)}>-</Button>
						<span className="w-10 md:w-12 text-center font-medium">{item.quantity}</span>
						<Button variant="outline" size="sm" onClick={() => onIncrease(item.productId)}>+</Button>
						<Button variant="outline" size="sm" onClick={() => onRemove(item.productId)}>Remove</Button>
					</div>

					<div className="text-right ml-2 md:ml-4 min-w-[84px]">
						<p className="font-medium">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
					</div>
				</div>
			))}
		</div>
	);
}


