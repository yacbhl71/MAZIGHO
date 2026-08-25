import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, PackagePlus, Headphones, Truck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocation } from "wouter";

export type StaffWorkspaceRole = "catalog_editor" | "support_agent" | "order_operator";

const workspaceCopy: Record<StaffWorkspaceRole, { title: string; detail: string; path: string; icon: typeof PackagePlus }> = {
  catalog_editor: {
    title: "Éditeur catalogue",
    detail: "Préparez uniquement des fiches produit en brouillon. Les prix, livraisons et publications restent protégés.",
    path: "/admin/catalogue-brouillons",
    icon: PackagePlus,
  },
  support_agent: {
    title: "Service client",
    detail: "Traitez les messages de contact et modérez les avis, sans accès aux commandes ni aux comptes.",
    path: "/admin/assistance",
    icon: Headphones,
  },
  order_operator: {
    title: "Opérateur commandes",
    detail: "Renseignez le suivi des commandes déjà acceptées, sans accès aux paiements ni aux adresses clients.",
    path: "/admin/operations-commandes",
    icon: Truck,
  },
};

export default function StaffWorkspaceLayout({
  role,
  children,
}: {
  role: StaffWorkspaceRole;
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth() as any;
  const [, setLocation] = useLocation();
  const config = workspaceCopy[role];
  const Icon = config.icon;

  if (loading) return <div className="min-h-screen bg-slate-50" />;
  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><Card className="w-full max-w-md"><CardContent className="p-8 text-center"><p className="text-lg font-semibold">Connexion requise</p><p className="mt-2 text-sm text-muted-foreground">Connectez-vous avec votre invitation personnelle pour accéder à votre mission.</p><Button className="mt-6 bg-orange-600 hover:bg-orange-700" onClick={() => setLocation("/login")}>Se connecter</Button></CardContent></Card></div>;
  }
  if (user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><Card className="w-full max-w-md"><CardContent className="p-8 text-center"><p className="text-lg font-semibold">Accès non autorisé</p><p className="mt-2 text-sm text-muted-foreground">Votre compte n’est pas autorisé pour cet espace. Contactez l’administrateur MAZIGHO.</p><Button variant="outline" className="mt-6" onClick={() => setLocation("/")}>Retour au site</Button></CardContent></Card></div>;
  }

  return <div className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 rounded-lg object-cover" /><div><p className="text-sm font-bold tracking-wide text-orange-700">{APP_TITLE}</p><h1 className="text-base font-semibold">{config.title}</h1></div></div><div className="flex items-center gap-2"><ThemeToggle /><Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Déconnexion</Button></div></div></header><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><section className="mb-6 flex gap-3 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-950"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" /><p>{config.detail}</p></section>{children}</main></div>;
}
