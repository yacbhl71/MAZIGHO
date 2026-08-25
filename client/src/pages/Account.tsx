import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, LogOut, Heart, ShoppingBag, Settings, ArrowLeft, LayoutDashboard } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { getAccountCopy } from "@/lib/accountCopy";

export default function Account() {
  const [, navigate] = useLocation();
  const { user, loading: isLoading, isAuthenticated, logout } = useAuth();
  const { locale } = useLocale();
  const copy = getAccountCopy(locale);

  if (isLoading) {
    return <div className="flex min-h-screen flex-col bg-white"><Header /><main className="flex flex-1 items-center justify-center"><p className="text-gray-600">{copy.loading}</p></main><Footer /></div>;
  }

  const handleLogout = () => { logout(); navigate("/"); };
  const staffWorkspace = {
    catalog_editor: { href: "/admin/catalogue-brouillons", title: "Éditeur catalogue", description: "Préparer des fiches produit en brouillon." },
    support_agent: { href: "/admin/assistance", title: "Service client", description: "Traiter les messages et modérer les avis." },
    order_operator: { href: "/admin/operations-commandes", title: "Opérateur commandes", description: "Suivre les commandes déjà acceptées." },
  }[(user as any)?.role as "catalog_editor" | "support_agent" | "order_operator"];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/"><div className="mb-6 flex w-fit cursor-pointer items-center gap-2 text-orange-500 hover:text-orange-600"><ArrowLeft className="h-5 w-5" /><span className="font-medium">{copy.back}</span></div></Link>
            <div className="mb-4 flex items-center gap-3"><User className="h-8 w-8 text-orange-500" /><h1 className="text-4xl font-bold text-gray-800 md:text-5xl">{copy.title}</h1></div>
            <p className="max-w-2xl text-lg text-gray-600">{copy.lead}</p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {!isAuthenticated ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <Card className="md:col-span-1"><CardContent className="p-6"><div className="mb-6 text-center"><div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-teal-400"><User className="h-10 w-10 text-white" /></div><h2 className="mb-1 text-xl font-bold text-gray-800">{copy.welcome}</h2><p className="text-sm text-gray-600">{copy.guestLead}</p></div><Button asChild className="mb-3 w-full bg-orange-500 text-white hover:bg-orange-600"><Link href="/login">{copy.login}</Link></Button><Button asChild variant="outline" className="w-full"><Link href="/register">{copy.register}</Link></Button></CardContent></Card>
                <div className="space-y-6 md:col-span-2"><Card><CardContent className="p-6"><h2 className="mb-4 text-lg font-semibold text-gray-800">{copy.whyTitle}</h2><ul className="space-y-3"><li className="flex items-start gap-3"><ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" /><span className="text-gray-700"><strong>{copy.benefits.ordersTitle}</strong> — {copy.benefits.ordersText}</span></li><li className="flex items-start gap-3"><Heart className="mt-0.5 h-5 w-5 shrink-0 text-red-500" /><span className="text-gray-700"><strong>{copy.benefits.favoritesTitle}</strong> — {copy.benefits.favoritesText}</span></li><li className="flex items-start gap-3"><Settings className="mt-0.5 h-5 w-5 shrink-0 text-green-500" /><span className="text-gray-700"><strong>{copy.benefits.settingsTitle}</strong> — {copy.benefits.settingsText}</span></li></ul></CardContent></Card></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <Card className="md:col-span-1"><CardContent className="p-6"><div className="mb-6 text-center"><div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-teal-400"><User className="h-10 w-10 text-white" /></div><h2 className="mb-1 text-xl font-bold text-gray-800">{user?.name || copy.customerFallback}</h2><p className="break-all text-sm text-gray-600">{user?.email}</p></div></CardContent></Card>
                <div className="space-y-4 md:col-span-2">
                  <AccountLink href="/commandes" icon={<ShoppingBag className="h-6 w-6 text-blue-600" />} iconClass="bg-blue-100" title={copy.ordersTitle} description={copy.ordersText} />
                  <AccountLink href="/favoris" icon={<Heart className="h-6 w-6 text-red-600" />} iconClass="bg-red-100" title={copy.favoritesTitle} description={copy.favoritesText} />
                  <AccountLink href="/parametres" icon={<Settings className="h-6 w-6 text-green-600" />} iconClass="bg-green-100" title={copy.settingsTitle} description={copy.settingsText} />
                  {(user as any)?.role === "admin" && <AccountLink href="/admin" icon={<LayoutDashboard className="h-6 w-6 text-orange-600" />} iconClass="bg-orange-100" title={copy.adminTitle} description={copy.adminText} className="border-orange-200 bg-orange-50/30" />}
                  {staffWorkspace && <AccountLink href={staffWorkspace.href} icon={<LayoutDashboard className="h-6 w-6 text-orange-600" />} iconClass="bg-orange-100" title={staffWorkspace.title} description={staffWorkspace.description} className="border-orange-200 bg-orange-50/30" />}
                  <Card role="button" tabIndex={0} className="cursor-pointer transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2" onClick={handleLogout} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleLogout(); } }}><CardContent className="p-6"><div className="flex items-start gap-4"><div className="rounded-lg bg-gray-100 p-3"><LogOut className="h-6 w-6 text-gray-600" /></div><div><h2 className="mb-1 font-semibold text-gray-800">{copy.logoutTitle}</h2><p className="text-sm text-gray-600">{copy.logoutText}</p></div></div></CardContent></Card>
                </div>
              </div>
            )}
            <div className="mt-12 rounded border-l-4 border-blue-500 bg-blue-50 p-6"><h2 className="mb-2 font-semibold text-gray-800">{copy.tipTitle}</h2><p className="text-gray-700">{isAuthenticated ? copy.tipAuthenticated : copy.tipGuest}</p></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function AccountLink({ href, icon, iconClass, title, description, className = "" }: { href: string; icon: React.ReactNode; iconClass: string; title: string; description: string; className?: string }) {
  return <Link href={href}><Card className={`cursor-pointer transition-shadow hover:shadow-lg ${className}`}><CardContent className="p-6"><div className="flex items-start gap-4"><div className={`rounded-lg p-3 ${iconClass}`}>{icon}</div><div><h2 className="mb-1 font-semibold text-gray-800">{title}</h2><p className="text-sm text-gray-600">{description}</p></div></div></CardContent></Card></Link>;
}
