// Simple favorites system using localStorage for quick access in POS
export interface FavoriteProduct {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
}

const FAVORITES_KEY = 'pos_favorites';

export const favoritesStorage = {
  getFavorites(): FavoriteProduct[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addFavorite(product: FavoriteProduct): void {
    if (typeof window === 'undefined') return;
    try {
      const favorites = this.getFavorites();
      if (!favorites.find(f => f.id === product.id)) {
        favorites.push(product);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      }
    } catch {
      // Ignore errors
    }
  },

  removeFavorite(productId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const favorites = this.getFavorites();
      const filtered = favorites.filter(f => f.id !== productId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore errors
    }
  },

  isFavorite(productId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some(f => f.id === productId);
  }
};

