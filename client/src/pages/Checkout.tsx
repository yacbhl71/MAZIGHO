import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/hooks/useCart";
import { trpc } from "@/lib/trpc";
import { getDeliveryProfileForCountry, useDeliveryCountry } from "@/contexts/DeliveryCountryContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getLocalizedCountryName } from "@/lib/countryLocale";
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, LockKeyhole, PackageCheck, Truck } from "lucide-react";
import { commerceT } from "@/lib/i18n";
import { getCartCopy } from "@/lib/cartCopy";
import { toast } from "sonner";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, isLoaded } = useCart();
  const { locale } = useLocale();
  const c = getCartCopy(locale);
  const { countryCode } = useDeliveryCountry();
  const countryLabel = getLocalizedCountryName(countryCode, locale);
  const productsQuery = trpc.products.getAll.useQuery(locale);
  const createStripeSession = trpc.checkout.createSession.useMutation({
    onSuccess: ({ url }) => window.location.assign(url),
    onError: error => toast.error(error.message || c.paymentText),
  });
  const productById = new Map((productsQuery.data || []).map(product => [product.id, product]));
  const items = cart.map(item => { const product = productById.get(item.productId); const deliveryProfile = getDeliveryProfileForCountry(product?.deliveryProfiles, countryCode); const valid = Boolean(product && product.stock > 0 && deliveryProfile); const reason = !product ? commerceT(locale, "productNotFoundTitle") : product.stock <= 0 ? commerceT(locale, "outOfStock") : commerceT(locale, "deliveryUnconfirmed", { country: countryLabel }); return { item, deliveryProfile, valid, reason, shipping: deliveryProfile ? deliveryProfile.customerShippingCost * item.quantity : 0 }; });
  const invalidItems = items.filter(entry => !entry.valid);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = items.reduce((sum, entry) => sum + entry.shipping, 0);
  const estimatedTotal = subtotal + shipping;
  useEffect(() => { if (isLoaded && cart.length === 0) setLocation("/panier"); }, [cart.length, isLoaded, setLocation]);
  if (!isLoaded) return <div className="flex min-h-screen items-center justify-center bg-[#fbf7f2] text-slate-600">{c.loading}</div>;
  if (cart.length === 0) return null;

  return <div className="flex min-h-screen flex-col bg-[#fbf7f2]"><Header /><main className="container flex-1 px-4 py-10 md:py-14"><div className="mx-auto max-w-5xl"><div className="mb-8 max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">{c.verified}</p><h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{c.prepare}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{c.prepareText}</p></div>
    {productsQuery.isLoading ? <div className="flex items-center gap-3 rounded-xl border bg-white p-5 text-sm text-slate-600"><span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /> {c.checking}</div> : invalidItems.length > 0 ? <Card className="border-amber-200 bg-amber-50 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-950"><AlertTriangle className="h-5 w-5" /> {c.fixBefore}</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-amber-950"><p>{c.invalidLine}</p><ul className="space-y-2">{invalidItems.map(({ item, reason }) => <li key={`${item.productId}-${JSON.stringify(item.options)}`} className="rounded-lg border border-amber-200 bg-white px-3 py-2"><strong>{item.productName}</strong> — {reason}</li>)}</ul><Button onClick={() => setLocation("/panier")} className="bg-amber-700 text-white hover:bg-amber-800"><ArrowLeft className="mr-2 h-4 w-4" /> {c.backCart}</Button></CardContent></Card> : <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"><section className="space-y-5"><Card className="border-emerald-200 bg-white shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-xl"><PackageCheck className="h-5 w-5 text-emerald-600" /> {c.verifiedDelivery}: {countryLabel}</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-slate-600"><p>{c.verifiedText}</p><div className="space-y-3">{items.map(({ item, deliveryProfile }) => <div key={`${item.productId}-${JSON.stringify(item.options)}`} className="rounded-xl border border-[#eadfd2] bg-[#fffaf5] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.productName} × {item.quantity}</p><p className="mt-1 text-xs text-slate-600">{deliveryProfile?.customerShippingCost === 0 ? commerceT(locale, "deliveryIncluded") : commerceT(locale, "shippingPerItem", { amount: formatPrice(deliveryProfile?.customerShippingCost || 0, locale) })}{deliveryProfile?.minDeliveryDays ? ` · ${commerceT(locale, "deliveryEstimate", { min: deliveryProfile.minDeliveryDays, range: deliveryProfile.maxDeliveryDays && deliveryProfile.maxDeliveryDays !== deliveryProfile.minDeliveryDays ? `–${deliveryProfile.maxDeliveryDays}` : "" })}` : ""}</p></div><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div></div>)}</div></CardContent></Card><Card className="border-orange-200 bg-orange-50/60 shadow-none"><CardContent className="p-5 text-sm leading-6 text-slate-700"><strong className="text-slate-950">{c.paymentDisabled}</strong><br />{c.paymentText}</CardContent></Card></section><aside><Card className="border-orange-200 bg-white shadow-none lg:sticky lg:top-24"><CardHeader><CardTitle>{c.summary}: {countryLabel}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-3 border-b border-[#eadfd2] pb-4">{items.map(({ item }) => <div key={`${item.productId}-${JSON.stringify(item.options)}`} className="flex items-center gap-3 text-sm"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f2eee9]">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}</div><span className="min-w-0 flex-1 truncate text-slate-600">{item.productName} × {item.quantity}</span><span className="font-medium text-slate-900">{formatPrice(item.price * item.quantity, locale)}</span></div>)}</div><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-600">{c.subtotal}</span><span>{formatPrice(subtotal, locale)}</span></div><div className="flex justify-between"><span className="text-slate-600">{c.shipping}</span><span>{formatPrice(shipping, locale)}</span></div></div><div className="flex justify-between border-t border-[#eadfd2] pt-4 text-lg font-bold"><span>{c.estimatedTotal}</span><span className="text-orange-600">{formatPrice(estimatedTotal, locale)}</span></div><div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs leading-5 text-sky-900"><Truck className="mr-1 inline h-4 w-4" /> {c.reviewShipping}</div><Button disabled={createStripeSession.isPending} onClick={() => createStripeSession.mutate({ countryCode })} className="h-12 w-full bg-orange-500 text-base font-semibold text-white hover:bg-orange-600"><CreditCard className="mr-2 h-4 w-4" /> {createStripeSession.isPending ? "…" : commerceT(locale, "paymentSoon")}</Button><Button type="button" variant="outline" className="w-full border-[#d9cbbc]" onClick={() => setLocation("/panier")}><ArrowLeft className="mr-2 h-4 w-4" /> {c.backCart}</Button><p className="flex items-center justify-center gap-1 text-center text-xs text-slate-500"><LockKeyhole className="h-3.5 w-3.5" /> {commerceT(locale, "noPaymentNow")}</p></CardContent></Card></aside></div>}</div></main><Footer /></div>;
}
