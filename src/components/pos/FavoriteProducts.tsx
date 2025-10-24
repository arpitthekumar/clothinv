"use client";

import { Button } from "@/components/ui/button";

interface FavoriteProductsProps {
	favorites: Array<{ id: string; name: string; price: string }>;
	onAddFavoriteToCart: (id: string) => void;
}

export function FavoriteProducts({ favorites, onAddFavoriteToCart }: FavoriteProductsProps) {
	return (
		<div>
			{favorites.length === 0 ? (
				<p className="text-sm text-muted-foreground text-center py-4">No favorites yet. Add products to favorites for quick access.</p>
			) : (
				<div className="space-y-2 max-h-48 overflow-y-auto">
					{favorites.map((fav) => (
						<div key={fav.id} className="flex items-center justify-between p-2 border rounded">
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">{fav.name}</p>
								<p className="text-xs text-muted-foreground">₹{fav.price}</p>
							</div>
							<Button size="sm" variant="outline" onClick={() => onAddFavoriteToCart(fav.id)} className="ml-2">
								+
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}


