import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, CheckCircle2, LockKeyhole, Minus, PackageCheck, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/currency";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getLocalizedCountryName } from "@/lib/countryLocale";
import { commerceT } from "@/lib/i18n";
import { getCartCopy } from "@/lib/cartCopy";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { locale } = useLocale();
  const c = getCartCopy(locale);
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const productsQuery = trpc.products.getAll.useQuery(locale);
  const products = productsQuery.data || [];
  const productById = new Map(products.map(product => [product.id, product]));
  const items = cart.map(item => {
    const product = productById.get(item.productId);
    const deliveryProfile = getDeliveryProfileForCountry(product?.deliveryProfiles, countryCode);
    const available = Boolean(product && product.stock > 0 && deliveryProfile);
    const reason = !product ? commerceT(locale, "productNotFoundText") : product.stock <= 0 ? commerceT(locale, "outOfStock") : !deliveryProfile ? commerceT(locale, "deliveryUnconfirmed", { country: countryLabel }) : null;
    return { item, deliveryProfile, available, reason, shipping: deliveryProfile ? deliveryProfile.customerShippingCost * item.quantity : 0 };
  });
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = items.reduce((sum, entry) => sum + entry.shipping, 0);
  const estimatedTotal = subtotal;
  const unavailableItems = items.filter(entry => !entry.available);
  const isReadyForReview = cart.length > 0 && !productsQuery.isLoading && unavailableItems.length === 0;

  if (cart.length === 0) return <div className="flex min-h-screen flex-col bg-[#fbf7f2]"><Header /><main className="container flex flex-1 items-center justify-center px-4 py-20 text-center"><div className="max-w-md"><div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600"><ShoppingBag className="h-9 w-9" /></div><p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">{c.selection}</p><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{c.empty}</h1><p className="mt-4 text-slate-600">{c.emptyText}</p><Button onClick={() => setLocation("/boutique")} className="mt-8 gap-2 bg-orange-500 text-white hover:bg-orange-600"><ArrowLeft className="h-4 w-4" /> {c.continueShopping}</Button></div></main><Footer /></div>;

  return <div className="flex min-h-screen flex-col bg-[#fbf7f2]"><Header /><main className="container flex-1 px-4 py-10 md:py-14"><div className="mb-10 flex flex-col gap-4 border-b border-[#eadfd2] pb-8 md:flex-row md:items-end md:justify-between"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">{c.selection}</p><h1 className="text-4xl font-semibold tracking-tight text-slate-950">{c.cart}</h1><p className="mt-2 text-sm text-slate-600">{c.destination}: <strong>{countryLabel}</strong>.</p></div><Button variant="outline" onClick={() => setLocation("/boutique")} className="w-fit gap-2 border-[#d9cbbc] bg-white"><ArrowLeft className="h-4 w-4" /> {c.continueShopping}</Button></div>
    {productsQuery.isLoading && <div className="mb-6 flex items-center gap-3 rounded-xl border bg-white p-4 text-sm text-slate-600"><span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /> {c.checking}</div>}
    {unavailableItems.length > 0 && <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><strong>{c.adjust}</strong><p className="mt-1">{unavailableItems.length} {c.adjustText}</p></div></div>}
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"><div className="space-y-4">{items.map(({ item, deliveryProfile, available, reason }) => <Card key={`${item.productId}-${JSON.stringify(item.options)}`} className={`border bg-white shadow-none ${available ? "border-[#eadfd2]" : "border-amber-200"}`}><CardContent className="p-4 md:p-6"><div className="flex gap-4 md:gap-6"><div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-[#f2eee9] md:h-36 md:w-36">{item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">📦</div>}</div><div className="flex min-w-0 flex-1 flex-col"><div className="flex justify-between gap-3"><div><p className="mb-1 text-xs uppercase tracking-wider text-slate-400">{c.selectedItem}</p><h2 className="line-clamp-2 text-base font-semibold text-slate-950 md:text-lg">{item.productName}</h2></div><button onClick={() => removeFromCart(item.productId, item.options)} className="h-fit rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label={c.remove}><Trash2 className="h-4 w-4" /></button></div>{item.options && Object.keys(item.options).length > 0 && <div className="mt-2 text-xs text-slate-500">{Object.entries(item.options).map(([key, value]) => <span key={key} className="mr-3">{key}: {value}</span>)}</div>}<div className={`mt-3 rounded-lg border p-3 text-xs leading-5 ${available ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}><p className="font-semibold">{available ? <><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />{c.available}</> : reason}</p></div><div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4"><div><p className="text-xs text-slate-500">{c.unitPrice}</p><p className="font-semibold text-slate-950">{formatPrice(item.price, locale)}</p></div><div className="flex items-center rounded-lg border border-[#d9cbbc] bg-[#fbf7f2]"><button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.options)} className="p-2.5 hover:text-orange-600" aria-label={c.decrease}><Minus className="h-4 w-4" /></button><span className="min-w-9 text-center text-sm font-semibold">{item.quantity}</span><button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.options)} className="p-2.5 hover:text-orange-600" aria-label={c.increase}><Plus className="h-4 w-4" /></button></div><p className="text-lg font-bold text-orange-600">{formatPrice(item.price * item.quantity, locale)}</p></div></div></div></CardContent></Card>)}</div>
    <div className="space-y-5"><Card className="border-orange-200 bg-white shadow-none lg:sticky lg:top-24"><CardContent className="p-6 md:p-7"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-950">{c.summary}: {countryLabel}</h2><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">CHF</span></div><div className="space-y-3 border-b border-[#eadfd2] pb-5 text-sm"><div className="flex justify-between text-slate-600"><span>{c.subtotal}</span><span className="font-medium text-slate-950">{formatPrice(subtotal, locale)}</span></div></div><div className="flex justify-between py-5 text-xl font-bold"><span>{c.estimatedTotal}</span><span className="text-orange-600">{isReadyForReview ? formatPrice(estimatedTotal, locale) : "—"}</span></div><Button onClick={() => setLocation("/commander")} disabled={!isReadyForReview} className="h-12 w-full bg-orange-500 text-base font-semibold text-white hover:bg-orange-600 disabled:bg-slate-400">{isReadyForReview ? c.review : c.destinationFix}</Button><p className="mt-3 text-center text-xs leading-5 text-slate-500">{c.noPayment}</p><Button onClick={() => setLocation("/boutique")} variant="outline" className="mt-3 w-full border-[#d9cbbc]">{c.continueShopping}</Button><button onClick={() => { if (confirm(c.clearConfirm)) clearCart(); }} className="mt-4 w-full text-xs font-semibold text-slate-400 hover:text-red-500">{c.clear}</button></CardContent></Card><div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500"><div className="border border-[#eadfd2] bg-white p-3"><PackageCheck className="mx-auto mb-2 h-4 w-4 text-orange-500" />{c.verified}</div><div className="border border-[#eadfd2] bg-white p-3"><LockKeyhole className="mx-auto mb-2 h-4 w-4 text-orange-500" />{c.paymentSoon}</div></div></div></div></main><Footer /></div>;
}
