"use client";

import { Button } from "@/components/ui/button";
import { Plus, Heart } from "lucide-react";

interface FavoriteProductItem {
  id: string;
  name: string;
  price: string | number;
  sku?: string;
  stock?: number;
}

interface FavoriteProductsProps {
  favorites: FavoriteProductItem[];
  onAddFavoriteToCart: (id: string) => void;
}

export function FavoriteProducts({ favorites, onAddFavoriteToCart }: FavoriteProductsProps) {
  // Formatter for Indian currency (no decimals)
  const formatIN = (num: number | null | undefined) =>
    (typeof num === "number" && !isNaN(num) ? num : 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  if (!favorites || favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-1 md:py-4 px-4 border border-dashed border-border/50 rounded-xl bg-muted/10">
        <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center m">
          <Heart className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold text-foreground">No Favorite Products</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[420px]">
          Click the heart icon on any product in inventory to add it for quick checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-0.5 custom-scrollbar">
      {favorites.map((fav) => {
        const rawPrice = typeof fav.price === "string" ? parseFloat(fav.price) : fav.price;
        const displayPrice = isNaN(rawPrice) ? 0 : rawPrice;

        return (
          <div
            key={fav.id}
            onClick={() => onAddFavoriteToCart(fav.id)}
            className="group relative flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-card/60 hover:bg-accent/40 hover:border-primary/40 transition-all duration-200 shadow-xs cursor-pointer select-none"
          >
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {fav.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                  ₹{formatIN(displayPrice)}
                </span>
                {fav.sku && (
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {fav.sku}
                  </span>
                )}
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddFavoriteToCart(fav.id);
              }}
              className="h-7 w-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
              title="Add to cart"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

