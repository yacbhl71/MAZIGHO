import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Heart, Share2, Shield, Truck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import ProductOptions from "@/components/ProductOptions";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/currency";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { commerceT, t } from "@/lib/i18n";
import { getLocalizedCountryName } from "@/lib/countryLocale";
import { getProductPublicCopy } from "@/lib/productPublicCopy";
import { getReviewFormCopy } from "@/lib/reviewFormCopy";

export default function Product() {
  const { key } = useParams<{ key?: string }>();
  const [, setLocation] = useLocation();
  const canonicalId = key && /^\d+$/.test(key) ? Number(key) : undefined;
  const slug = canonicalId ? undefined : key;
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";

  const { locale } = useLocale();
  const copy = getProductPublicCopy(locale);
  const previewQuery = trpc.admin.products.preview.useQuery({ key: key || "", locale }, {
    enabled: isPreview && Boolean(key), retry: false,
  });
  const productByIdQuery = trpc.products.getById.useQuery({ id: canonicalId || 0, locale }, {
    enabled: !isPreview && Boolean(canonicalId)
  });
  const productBySlugQuery = trpc.products.getBySlug.useQuery({ slug: slug || "", locale }, {
    enabled: !isPreview && !canonicalId && !!slug
  });
  const productQuery = isPreview ? previewQuery : (canonicalId ? productByIdQuery : productBySlugQuery);
  const product = productQuery.data;
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const deliveryProfile = getDeliveryProfileForCountry(product?.deliveryProfiles, countryCode);

  const reviewCopy = getReviewFormCopy(locale);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const submitReview = trpc.products.submitReview.useMutation();

  useEffect(() => {
    if (!isPreview && product && !canonicalId && slug) {
      setLocation(`/produit/${product.id}`, { replace: true });
    }
  }, [isPreview, product, canonicalId, slug, setLocation]);

  useEffect(() => {
    if (!product || typeof document === "undefined") return;
    document.title = `${product.name} | MAZIGHO`;
    const metaDescription = product.description?.replace(/\s+/g, " ").trim() || product.name;
    let descriptionTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.name = "description";
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.content = metaDescription.slice(0, 160);
  }, [product?.id, product?.name, product?.description]);
  
  const relatedProductsQuery = trpc.products.getByCategory.useQuery({ categoryId: product?.categoryId || 0, locale }, {
    enabled: !!product?.categoryId
  });
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isAdding, setIsAdding] = useState(false);

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{commerceT(locale, "productNotFoundTitle")}</h1>
          <p className="text-gray-600 mb-8">{commerceT(locale, "productNotFoundText")}</p>
          <Button 
            onClick={() => setLocation("/boutique")}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {commerceT(locale, "backToShop")}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedProducts = (relatedProductsQuery.data || [])
    .filter(p => p.id !== product.id && getDeliveryProfileForCountry(p.deliveryProfiles, countryCode))
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!product || !deliveryProfile) {
      toast.error(commerceT(locale, "deliveryUnconfirmed", { country: countryLabel }));
      return;
    }
    setIsAdding(true);
    const imageUrl = product.images && product.images.length > 0 ? product.images[0].imageUrl : undefined;
    addToCart(product.id, product.name, product.price, quantity, selectedOptions, imageUrl);
    
    toast.success(`${product.name} · ${commerceT(locale, "added")}`, {
      description: `${quantity} × ${commerceT(locale, "addToCart")}`,
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
  };

  const favorite = isFavorite(product.id);
  const handleFavorite = () => {
    toggleFavorite(product.id);
    toast.success(favorite ? copy.favoriteRemoved : copy.favoriteAdded);
  };
  const handleShare = async () => {
    const shareData = { title: product.name, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* User cancelled the native dialog. */ }
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
    toast.success(copy.linkCopied);
  };

  const handleSubmitReview = async () => {
    if (!product) return;
    if (reviewName.trim().length < 2) { toast.error(reviewCopy.errorName); return; }
    if (reviewRating < 1) { toast.error(reviewCopy.errorRating); return; }
    try {
      await submitReview.mutateAsync({ productId: product.id, name: reviewName.trim(), rating: reviewRating, comment: reviewComment.trim() });
      toast.success(reviewCopy.success);
      setReviewName(""); setReviewRating(0); setHoverRating(0); setReviewComment("");
      await productQuery.refetch();
    } catch {
      toast.error(reviewCopy.errorGeneric);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {isPreview && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-amber-950" data-testid="preview-banner">
          Mode aperçu — statut «&nbsp;{product.status === "active" ? "Actif" : product.status === "draft" ? "Brouillon" : "Archivé"}&nbsp;». Cette fiche n'est visible que par l'équipe.
        </div>
      )}

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4 text-sm text-gray-600">
          <button onClick={() => setLocation("/")} className="hover:text-orange-500">
            {t(locale, "home")}
          </button>
          <span className="mx-2">/</span>
          <button onClick={() => setLocation(product.categoryCatalogSection === "creations" ? "/creations" : "/boutique")} className="hover:text-orange-500">
            {product.categoryCatalogSection === "creations" ? commerceT(locale, "creations") : commerceT(locale, "shop")}
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">{product.name}</span>
        </div>

        {/* Product Details */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Image Gallery */}
            <div>
              <ImageGallery images={product.images} productName={product.name} />
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Title and Rating */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.averageRating)
                            ? "fill-orange-500 text-orange-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {product.reviews.length} {commerceT(locale, "reviews")}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-orange-500">
                    {formatPrice(product.price, locale)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.originalPrice, locale)}
                    </span>
                  )}
                </div>
                {product.originalPrice && (
                  <p className="text-green-600 font-semibold">
                    {commerceT(locale, "save", { percent: Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) })}
                  </p>
                )}
              </div>


              {/* Description */}
              <div
                className="prose prose-slate max-w-none text-gray-700 text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: (product as any).longDescription || product.description || "" }}
              />

              {/* Stock Status */}
              <div className={`p-4 rounded-lg ${product.stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {product.stock > 0 ? (
                  <p className="font-semibold">{commerceT(locale, "inStock", { count: product.stock })}</p>
                ) : (
                  <p className="font-semibold">{commerceT(locale, "outOfStock")}</p>
                )}
              </div>

              {/* Options */}
              {(product as any).options && (
                <ProductOptions
                  options={typeof (product as any).options === 'string' ? JSON.parse((product as any).options) : (product as any).options}
                  onSelectOptions={setSelectedOptions}
                />
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-800">{commerceT(locale, "quantity")}:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, product.stock)}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center border-l border-r border-gray-300 py-2"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || !deliveryProfile || isAdding}
                  className={`flex-1 py-3 text-lg font-semibold transition-all ${
                    isAdding 
                      ? "bg-green-600 hover:bg-green-700 text-white scale-95" 
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  }`}
                >
                  {isAdding ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      {commerceT(locale, "added")}
                    </>
                  ) : !deliveryProfile ? (
                    commerceT(locale, "deliveryUnconfirmed", { country: countryLabel })
                  ) : (
                    commerceT(locale, "addToCart")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleFavorite}
                  aria-label={favorite ? copy.removeFavorite : copy.addFavorite}
                  title={favorite ? copy.removeFavorite : copy.addFavorite}
                  className="border-2 border-gray-300 hover:border-orange-500"
                >
                  <Heart className={`h-6 w-6 ${favorite ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  aria-label={copy.share}
                  title={copy.share}
                  className="border-2 border-gray-300 hover:border-orange-500"
                >
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium text-gray-800">{commerceT(locale, "paymentSoon")}</p>
                  <p className="text-xs text-gray-600">{commerceT(locale, "noPaymentNow")}</p>
                </div>
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium text-gray-800">{commerceT(locale, "orderReview")}</p>
                  <p className="text-xs text-gray-600">{commerceT(locale, "rechecked")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">{copy.reviewsTitle}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Review Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="text-4xl font-bold text-gray-800 mb-2">
                        {product.averageRating}
                      </div>
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(product.averageRating)
                                ? "fill-orange-500 text-orange-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">{copy.basedOnReviews(product.reviews.length)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4">
                {product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{review.userName}</p>
                            <p className="text-sm text-gray-600">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-orange-500 text-orange-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-8">{copy.noPublishedReviews}</p>
                )}
              </div>
            </div>

            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="mx-auto max-w-xl text-center">
                <h3 className="text-xl font-semibold text-gray-800">{reviewCopy.title}</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">{reviewCopy.intro}</p>
              </div>
              <div className="mx-auto mt-6 max-w-xl space-y-4" data-testid="review-form">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{reviewCopy.ratingLabel}</label>
                  <div className="flex gap-1" data-testid="review-rating">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = i + 1;
                      const active = (hoverRating || reviewRating) >= value;
                      return (
                        <button
                          key={value}
                          type="button"
                          data-testid={`review-star-${value}`}
                          onMouseEnter={() => setHoverRating(value)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewRating(value)}
                          className="p-1"
                          aria-label={`${value}/5`}
                        >
                          <Star className={`h-7 w-7 transition-colors ${active ? "fill-orange-500 text-orange-500" : "text-gray-300 hover:text-orange-300"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{reviewCopy.nameLabel}</label>
                  <Input data-testid="review-name" value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder={reviewCopy.namePlaceholder} maxLength={120} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{reviewCopy.commentLabel}</label>
                  <Textarea data-testid="review-comment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder={reviewCopy.commentPlaceholder} rows={4} maxLength={1000} />
                </div>
                <Button data-testid="review-submit" onClick={handleSubmitReview} disabled={submitReview.isPending} className="w-full bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 sm:w-auto">
                  {submitReview.isPending ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{reviewCopy.submitting}</> : reviewCopy.submit}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                {copy.relatedProducts}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <button
                    key={relatedProduct.id}
                    onClick={() => setLocation(`/produit/${relatedProduct.slug}`)}
                    className="text-left"
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 h-full bg-white">
	                      <CardContent className="p-0">
	                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
	                          {relatedProduct.images && relatedProduct.images.length > 0 ? (
	                            <img 
	                              src={relatedProduct.images[0].imageUrl} 
	                              alt={relatedProduct.name}
	                              width={640}
                              height={640}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
	                            />
	                          ) : (
	                            "📦"
	                          )}
	                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2">
                            {relatedProduct.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                            <span>{(relatedProduct as any).averageRating || 0}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-orange-500">
                              {formatPrice(relatedProduct.price, locale)}
                            </span>
                            {relatedProduct.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(relatedProduct.originalPrice, locale)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
