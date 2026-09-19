import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, PackagePlus, Headphones, Store, Truck } from "lucide-react";
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
  const workspace = trpc.workspace.getCurrent.useQuery(undefined, { enabled: Boolean(user) });
  const config = workspaceCopy[role];
  const Icon = config.icon;
  const activeMembership = workspace.data?.store && !workspace.data.store.isPlatformStore && workspace.data.membership?.status === "active" ? workspace.data.membership : null;
  const hasClientMission = activeMembership?.role === role || activeMembership?.role === "owner" || activeMembership?.role === "manager";
  const hasPlatformMission = Boolean(workspace.data?.store?.isPlatformStore && user?.role === role);
  const hasMission = hasClientMission || hasPlatformMission;
  const isClientWorkspace = Boolean(activeMembership);
  const title = isClientWorkspace ? `Équipe · ${workspace.data?.store?.displayName}` : APP_TITLE;

  if (loading) return <div className="min-h-screen bg-slate-50" />;
  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><Card className="w-full max-w-md"><CardContent className="p-8 text-center"><p className="text-lg font-semibold">Connexion requise</p><p className="mt-2 text-sm text-muted-foreground">Connectez-vous avec votre invitation personnelle pour accéder à votre mission.</p><Button className="mt-6 bg-orange-600 hover:bg-orange-700" onClick={() => setLocation("/login")}>Se connecter</Button></CardContent></Card></div>;
  }
  if (!workspace.isLoading && !hasMission) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><Card className="w-full max-w-md"><CardContent className="p-8 text-center"><p className="text-lg font-semibold">Accès non autorisé</p><p className="mt-2 text-sm text-muted-foreground">Votre compte n’est pas autorisé pour cette mission dans cette boutique. Les accès sont attribués et isolés par boutique.</p><Button variant="outline" className="mt-6" onClick={() => setLocation("/")}>Retour au site</Button></CardContent></Card></div>;
  }

  return <div className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><div className="flex items-center gap-3">{isClientWorkspace ? <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-100 text-teal-800"><Store className="h-5 w-5" /></div> : <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 rounded-lg object-cover" />}<div><p className={`text-sm font-bold tracking-wide ${isClientWorkspace ? "text-teal-800" : "text-orange-700"}`}>{title}</p><h1 className="text-base font-semibold">{config.title}</h1></div></div><div className="flex items-center gap-2"><ThemeToggle /><Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Déconnexion</Button></div></div></header><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><section className={`mb-6 flex gap-3 rounded-xl border p-4 text-sm ${isClientWorkspace ? "border-teal-100 bg-teal-50 text-teal-950" : "border-orange-100 bg-orange-50 text-orange-950"}`}><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${isClientWorkspace ? "text-teal-700" : "text-orange-700"}`} /><p>{config.detail}{isClientWorkspace ? " Cet espace ne donne aucun accès à MAZIGHO Studio ni à une autre boutique." : ""}</p></section>{children}</main></div>;
}
