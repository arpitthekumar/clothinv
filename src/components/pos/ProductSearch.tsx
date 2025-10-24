"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrCode, Search } from "lucide-react";

interface ProductSearchProps {
	productCode: string;
	onChangeProductCode: (value: string) => void;
	onSearch: () => void;
	onOpenScanner: () => void;
	searchResults: Array<{ id: string; name: string; sku: string; price: string; stock: number }>;
	onAddToCart: (productId: string) => void;
	onToggleFavorite: (productId: string) => void;
	isFavorite: (productId: string) => boolean;
}

export function ProductSearch({
	productCode,
	onChangeProductCode,
	onSearch,
	onOpenScanner,
	searchResults,
	onAddToCart,
	onToggleFavorite,
	isFavorite,
}: ProductSearchProps) {
	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Input
					placeholder="Search by name, SKU, or barcode"
					value={productCode}
					onChange={(e) => onChangeProductCode(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && onSearch()}
					className="flex-1"
					data-testid="input-product-search"
				/>
				<Button onClick={onSearch} className="px-3 md:px-4" data-testid="button-search-product">
					<Search className="h-4 w-4" />
				</Button>
				<Button variant="outline" onClick={onOpenScanner} data-testid="button-open-scanner">
					<QrCode className="h-4 w-4" />
				</Button>
			</div>
			{searchResults.length > 0 && (
				<div className="space-y-2 max-h-52 overflow-y-auto border rounded p-2">
					{searchResults.map((p) => {
						const fav = isFavorite(p.id);
						const out = p.stock <= 0;
						return (
							<div key={p.id} className={`flex items-center justify-between p-2 rounded ${out ? "opacity-60" : ""}`}>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium truncate">{p.name}</p>
									<p className="text-xs text-muted-foreground">SKU: {p.sku} • ₹{p.price} • Stock: {p.stock}</p>
								</div>
								<div className="flex gap-2">
									<Button size="sm" variant="outline" onClick={() => onToggleFavorite(p.id)} className={fav ? "text-red-500" : ""}>
										{/* simple heart glyph without extra dep */}
										<span>❤</span>
									</Button>
									<Button size="sm" disabled={out} onClick={() => onAddToCart(p.id)}>
										+ Add
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}


