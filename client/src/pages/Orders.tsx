import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, ArrowLeft, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocale } from "@/contexts/LocaleContext";
import { getAccountStatusCopy } from "@/lib/accountStatusCopy";

export default function Orders() {
  const { locale } = useLocale();
  const copy = getAccountStatusCopy(locale);
  const orders = copy.orders;

  return <div className="flex min-h-screen flex-col bg-white"><Header /><main className="flex-1"><section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-12 md:py-16"><div className="container mx-auto px-4"><Link href="/mon-compte"><div className="mb-6 flex w-fit cursor-pointer items-center gap-2 text-orange-500 hover:text-orange-600"><ArrowLeft className="h-5 w-5" /><span className="font-medium">{copy.back}</span></div></Link><div className="mb-4 flex items-center gap-3"><ShoppingBag className="h-8 w-8 text-blue-500" /><h1 className="text-4xl font-bold text-gray-800 md:text-5xl">{orders.title}</h1></div><p className="max-w-2xl text-lg text-gray-600">{orders.lead}</p></div></section><section className="py-16 md:py-24"><div className="container mx-auto px-4"><div className="py-20 text-center"><Package className="mx-auto mb-4 h-16 w-16 text-gray-300" /><h2 className="mb-2 text-2xl font-bold text-gray-800">{orders.emptyTitle}</h2><p className="mb-6 text-gray-600">{orders.emptyText}</p><Button asChild className="bg-orange-500 text-white hover:bg-orange-600"><Link href="/boutique">{orders.shopCta}</Link></Button></div><Card className="mt-12 border-blue-200 bg-blue-50"><CardContent className="p-6"><h2 className="mb-2 font-semibold text-gray-800">{orders.infoTitle}</h2><p className="text-gray-700">{orders.infoText}</p></CardContent></Card></div></section></main><Footer /></div>;
}
