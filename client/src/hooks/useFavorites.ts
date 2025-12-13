import { useState, useEffect } from "react";

const FAVORITES_KEY = "mazigho_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les favoris au montage
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error("Erreur lors du chargement des favoris:", error);
        setFavorites([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder les favoris dans localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isFavorite = (productId: number) => {
    return favorites.includes(productId);
  };

  const addFavorite = (productId: number) => {
    if (!favorites.includes(productId)) {
      setFavorites((prev) => [...prev, productId]);
    }
  };

  const removeFavorite = (productId: number) => {
    setFavorites((prev) => prev.filter((id) => id !== productId));
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
    isLoaded,
  };
}
