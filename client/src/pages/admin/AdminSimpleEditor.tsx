import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, FileText, Image, Languages, LayoutPanelTop, Loader2, Save, ShieldCheck, Tags } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { DesignProfile } from "@/hooks/useDesignProfile";

const editingAreas = [
  { href: "/admin/personnalisation", icon: LayoutPanelTop, title: "Titres et textes de l’accueil", description: "Modifiez les grands titres, les descriptions courtes, l’histoire MAZIGHO et les encarts éditoriaux.", examples: "Exemples : titre principal, phrase d’inspiration, description de carte." },
  { href: "/admin/contenu", icon: Image, title: "Bannières et boutons", description: "Changez les titres et accroches de vos bannières, leur image, leur lien et leur visibilité.", examples: "Exemples : promotion, nouvelle collection, bouton Découvrir." },
  { href: "/admin/categories", icon: Tags, title: "Cartes de catégories", description: "Ajustez le nom, la description courte, l’icône et l’ordre de vos catégories sans toucher aux produits.", examples: "Exemples : Mode, Beauté, Maison, Collections créatives." },
];

type NavigationForm = Pick<DesignProfile, "navigationHome" | "navigationShop" | "navigationCategories" | "navigationCreations" | "navigationContact">;
const emptyNavigation: NavigationForm = { navigationHome: "Accueil", navigationShop: "Boutique", navigationCategories: "Catégories", navigationCreations: "Créations", navigationContact: "Contact" };

export default function AdminSimpleEditor() {
  const designQuery = trpc.admin.design.get.useQuery();
  const updateDesign = trpc.admin.design.update.useMutation();
  const [navigation, setNavigation] = useState<NavigationForm>(emptyNavigation);

  useEffect(() => {
    if (designQuery.data) setNavigation({
      navigationHome: designQuery.data.navigationHome,
      navigationShop: designQuery.data.navigationShop,
      navigationCategories: designQuery.data.navigationCategories,
      navigationCreations: designQuery.data.navigationCreations,
      navigationContact: designQuery.data.navigationContact,
    });
  }, [designQuery.data]);

  const saveNavigation = async () => {
    const profile = designQuery.data;
    if (!profile) return;
    if (Object.values(navigation).some(value => value.trim().length === 0)) {
      toast.error("Chaque libellé doit contenir au moins un caractère.");
      return;
    }
    try {
      await updateDesign.mutateAsync({ ...profile, ...Object.fromEntries(Object.entries(navigation).map(([key, value]) => [key, value.trim()])) });
      await designQuery.refetch();
      toast.success("Libellés de navigation enregistrés.");
    } catch (error) {
      toast.error(`Enregistrement impossible : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  };

  return <DashboardLayout><div className="space-y-6 pb-8">
    <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 md:p-8">
      <div className="max-w-3xl"><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"><FileText className="h-4 w-4" /> Éditeur simple</p><h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Modifier votre boutique sans risque</h1><p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">Cet espace rassemble uniquement les changements visuels et éditoriaux sûrs. Vous ne pouvez pas casser le code, le panier, les prix, la livraison, les comptes ni les informations légales depuis ici.</p></div>
    </section>

    <Card className="border-emerald-200 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Languages className="h-5 w-5 text-emerald-700" /> Libellés du menu français</CardTitle><CardDescription>Ces cinq mots sont les libellés visibles par les clients qui choisissent le français. Les versions étrangères restent protégées par le système de traduction.</CardDescription></CardHeader><CardContent>{designQuery.isLoading ? <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}</div> : <><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{([
      ["navigationHome", "Accueil"], ["navigationShop", "Boutique"], ["navigationCategories", "Catégories"], ["navigationCreations", "Créations"], ["navigationContact", "Contact"],
    ] as Array<[keyof NavigationForm, string]>).map(([field, label]) => <div key={field} className="space-y-2"><Label htmlFor={field}>{label}</Label><Input id={field} maxLength={40} value={navigation[field]} onChange={event => setNavigation(current => ({ ...current, [field]: event.target.value }))} /></div>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4"><p className="text-sm text-emerald-950">Les changements sont visibles après enregistrement, sans modifier le code.</p><Button onClick={saveNavigation} disabled={updateDesign.isPending || designQuery.isLoading} className="bg-emerald-700 hover:bg-emerald-800">{updateDesign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer</Button></div></>}</CardContent></Card>

    <section className="grid gap-5 lg:grid-cols-3">{editingAreas.map(area => <Card key={area.href} className="border-slate-200 shadow-sm"><CardHeader><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><area.icon className="h-5 w-5" /></div><CardTitle className="pt-3 text-xl">{area.title}</CardTitle><CardDescription className="leading-6">{area.description}</CardDescription></CardHeader><CardContent><p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{area.examples}</p><Link href={area.href}><Button className="mt-5 w-full bg-emerald-700 hover:bg-emerald-800">Modifier <ArrowUpRight className="ml-2 h-4 w-4" /></Button></Link></CardContent></Card>)}</section>

    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-slate-700"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-semibold text-slate-900">Ce qui reste protégé</p><p className="mt-1 leading-6">Les prix, les frais de livraison, les traductions produit, les commandes, les utilisateurs et les pages légales sont volontairement séparés. Cela vous laisse la liberté de modifier les textes et l’apparence sans risque commercial ou technique.</p></div></div></section>
  </div></DashboardLayout>;
}
