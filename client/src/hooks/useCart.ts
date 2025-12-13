import { useState, useEffect } from "react";

export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  options?: Record<string, string>;
}

const CART_STORAGE_KEY = "boutique_premium_cart";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Erreur lors du chargement du panier:", error);
        setCart([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  // Ajouter un article au panier
  const addToCart = (
    productId: number,
    productName: string,
    price: number,
    quantity: number = 1,
    options?: Record<string, string>
  ) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) =>
          item.productId === productId &&
          JSON.stringify(item.options) === JSON.stringify(options)
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === productId &&
          JSON.stringify(item.options) === JSON.stringify(options)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevCart,
        {
          productId,
          productName,
          price,
          quantity,
          options,
        },
      ];
    });
  };

  // Mettre à jour la quantité d'un article
  const updateQuantity = (
    productId: number,
    quantity: number,
    options?: Record<string, string>
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, options);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId &&
        JSON.stringify(item.options) === JSON.stringify(options)
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Supprimer un article du panier
  const removeFromCart = (
    productId: number,
    options?: Record<string, string>
  ) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(
            item.productId === productId &&
            JSON.stringify(item.options) === JSON.stringify(options)
          )
      )
    );
  };

  // Vider le panier
  const clearCart = () => {
    setCart([]);
  };

  // Calculer le total
  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Obtenir le nombre d'articles
  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotal,
    getItemCount,
    isLoaded,
  };
}
