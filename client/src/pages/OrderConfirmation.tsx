import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, LockKeyhole, ShoppingBag } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { getCartCopy } from "@/lib/cartCopy";
import { commerceT } from "@/lib/i18n";

export default function OrderConfirmation() {
  const [, setLocation] = useLocation();
  const { locale } = useLocale();
  const c = getCartCopy(locale);

  return <div className="flex min-h-screen flex-col bg-[#fbf7f2]"><Header /><main className="container flex flex-1 items-center justify-center px-4 py-20"><Card className="w-full max-w-2xl border-orange-200 bg-white text-center shadow-none"><CardContent className="p-8 md:p-12"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-600"><LockKeyhole className="h-8 w-8" /></div><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{c.paymentDisabled}</h1><p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">{c.paymentText}</p><div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">{c.noPayment}</div><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => setLocation("/panier")} variant="outline" className="gap-2 border-[#d9cbbc]"><ArrowLeft className="h-4 w-4" />{c.backCart}</Button><Button onClick={() => setLocation("/boutique")} className="gap-2 bg-orange-500 text-white hover:bg-orange-600"><ShoppingBag className="h-4 w-4" />{c.continueShopping}</Button></div><p className="mt-6 text-xs text-slate-500">{commerceT(locale, "noPaymentNow")}</p></CardContent></Card></main><Footer /></div>;
}
