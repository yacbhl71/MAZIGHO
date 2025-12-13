import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { getProductBySlug, getAllProducts } from "@/data/mockData";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { cart, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();

  const allProducts = getAllProducts();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Votre panier est vide
            </h1>
            <p className="text-gray-600 mb-8">
              Découvrez notre sélection de produits et commencez vos achats !
            </p>
            <Button
              onClick={() => setLocation("/boutique")}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Continuer vos achats
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const total = getTotal();
  const shippingCost = total > 5000 ? 0 : 500; // Livraison gratuite à partir de 50€
  const finalTotal = total + shippingCost;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-12 text-white">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Votre Panier</h1>
            <p className="text-white/90">{cart.length} article(s) dans votre panier</p>
          </div>
        </section>

        {/* Cart Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => {
                const product = allProducts.find(p => p.id === item.productId);
                return (
                  <Card key={index} className="border-2 border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                          📦
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {item.productName}
                          </h3>

                          {/* Options */}
                          {item.options && Object.keys(item.options).length > 0 && (
                            <div className="text-sm text-gray-600 mb-3 space-y-1">
                              {Object.entries(item.options).map(([key, value]) => (
                                <p key={key}>
                                  <span className="font-medium capitalize">{key}:</span> {value}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Price */}
                          <p className="text-lg font-bold text-orange-500 mb-4">
                            {(item.price / 100).toFixed(2)} € x {item.quantity} =
                            <span className="ml-2">
                              {((item.price * item.quantity) / 100).toFixed(2)} €
                            </span>
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                    item.options
                                  )
                                }
                                className="px-3 py-1 hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-4 py-1 font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity + 1,
                                    item.options
                                  )
                                }
                                className="px-3 py-1 hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <button
                              onClick={() =>
                                removeFromCart(item.productId, item.options)
                              }
                              className="ml-auto text-red-500 hover:text-red-700 transition-colors p-2"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="border-2 border-gray-200 sticky top-4">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Résumé de la commande
                  </h2>

                  {/* Subtotal */}
                  <div className="space-y-3 border-b border-gray-200 pb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Sous-total</span>
                      <span>{(total / 100).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Livraison</span>
                      <span>
                        {shippingCost === 0 ? (
                          <span className="text-green-600 font-semibold">Gratuite</span>
                        ) : (
                          `${(shippingCost / 100).toFixed(2)} €`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Free Shipping Info */}
                  {shippingCost > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                      Livraison gratuite à partir de 50€
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between text-xl font-bold text-gray-800 pt-4">
                    <span>Total</span>
                    <span className="text-orange-500">
                      {(finalTotal / 100).toFixed(2)} €
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg font-semibold">
                    Procéder au paiement
                  </Button>

                  {/* Continue Shopping */}
                  <Button
                    onClick={() => setLocation("/boutique")}
                    variant="outline"
                    className="w-full border-2 border-gray-300"
                  >
                    Continuer vos achats
                  </Button>

                  {/* Clear Cart */}
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Êtes-vous sûr de vouloir vider votre panier ?"
                        )
                      ) {
                        clearCart();
                      }
                    }}
                    className="w-full text-red-500 hover:text-red-700 text-sm font-medium py-2 transition-colors"
                  >
                    Vider le panier
                  </button>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <span>✓</span>
                  <span>Paiement sécurisé</span>
                </div>
                <div className="flex gap-2">
                  <span>✓</span>
                  <span>Livraison rapide</span>
                </div>
                <div className="flex gap-2">
                  <span>✓</span>
                  <span>Retours gratuits 30 jours</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
