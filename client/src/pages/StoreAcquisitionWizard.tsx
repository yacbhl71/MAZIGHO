import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, LockKeyhole, LogIn, MapPin, Sparkles, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { storefrontThemeCatalog, type StorefrontThemeId } from "@shared/storefrontThemeCatalog";
import { acquisitionPlanId, getPublicStoreAcquisitionPlan, publicStoreAcquisitionPlanFromSearch, publicStoreAcquisitionPlanIds, type PublicStoreAcquisitionPlanId } from "@shared/storeAcquisition";

const planCtas: Record<PublicStoreAcquisitionPlanId, { price: string; commission: string; caption: string }> = {
  free: { price: "0 CHF / mois", commission: "2,5 % de commission", caption: "Pour commencer avec une base boutique claire." },
  basic: { price: "7,90 CHF / mois", commission: "1,0 % de commission", caption: "Pour développer sans plafond de catalogue." },
  pro: { price: "12,90 CHF / mois", commission: "1,0 % de commission", caption: "Pour développer avec le dropshipping contrôlé." },
};

function slugifySubdomain(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 62);
}

export default function StoreAcquisitionWizard() {
  const [, setLocation] = useLocation();
  // Wouter's location hook deliberately exposes the path. The offer lives in
  // the query string, so read it from the browser URL to retain FREE/BASIC/PRO
  // when arriving from the pricing landing.
  const selectedFromUrl = publicStoreAcquisitionPlanFromSearch(window.location.search);
  const [step, setStep] = useState(1);
  const [planId, setPlanId] = useState<PublicStoreAcquisitionPlanId>(selectedFromUrl);
  const [displayName, setDisplayName] = useState("");
  const [requestedSubdomain, setRequestedSubdomain] = useState("");
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [businessType, setBusinessType] = useState<"animalier" | "bijoux" | "vetements" | "autre">("autre");
  const [customBusinessTheme, setCustomBusinessTheme] = useState("");
  const [themePreset, setThemePreset] = useState<StorefrontThemeId | "none">("none");
  const [provisioningTemplate, setProvisioningTemplate] = useState<"standard" | "algeria">("standard");
  const [currency, setCurrency] = useState<"CHF" | "EUR" | "USD" | "GBP" | "DZD">("CHF");
  const [notes, setNotes] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: number; domain: string } | null>(null);

  const authQuery = trpc.auth.me.useQuery();
  const submit = trpc.storeAcquisition.submitProject.useMutation({
    onSuccess: result => {
      setSubmitted({ id: result.id, domain: result.requestedDomain });
      toast.success("Votre projet de boutique a été enregistré.");
    },
    onError: error => toast.error(error.message || "La demande n’a pas pu être enregistrée."),
  });

  useEffect(() => {
    setPlanId(selectedFromUrl);
  }, [selectedFromUrl]);

  useEffect(() => {
    if (subdomainTouched) return;
    setRequestedSubdomain(slugifySubdomain(displayName));
  }, [displayName, subdomainTouched]);

  const plan = getPublicStoreAcquisitionPlan(planId);
  const returnTo = `/demarrer-boutique?plan=${planId}`;
  const authenticated = Boolean(authQuery.data);
  const requiredProjectFieldsReady = displayName.trim().length >= 2
    && requestedSubdomain.length >= 3
    && (businessType !== "autre" || customBusinessTheme.trim().length >= 2);

  const choosePlan = (nextPlan: PublicStoreAcquisitionPlanId) => {
    setPlanId(nextPlan);
    setLocation(`/demarrer-boutique?plan=${nextPlan}`);
  };

  const continueToProject = () => {
    if (!authenticated) return;
    setStep(2);
    window.requestAnimationFrame(() => document.getElementById("store-project-step")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const submitProject = () => {
    if (!requiredProjectFieldsReady || !acknowledged || !authenticated) return;
    submit.mutate({
      requestedPlan: acquisitionPlanId(planId),
      displayName: displayName.trim(),
      requestedSubdomain,
      businessType,
      customBusinessTheme: businessType === "autre" ? customBusinessTheme.trim() : null,
      themePreset: themePreset === "none" ? null : themePreset,
      provisioningTemplate,
      preferredCurrency: provisioningTemplate === "algeria" ? "DZD" : currency,
      notes: notes.trim() || undefined,
      acknowledged: true,
    });
  };

  if (submitted) {
    return <main className="min-h-screen bg-[#fbfaf5] px-4 py-10 sm:px-6 sm:py-16"><section className="mx-auto max-w-2xl"><a href="https://pro.mazigho.ch/#tarifs" className="inline-flex items-center gap-2 text-sm font-bold text-[#566632]"><ArrowLeft className="h-4 w-4" /> Retour aux offres</a><Card className="mt-8 border-[#dce4bc] bg-white shadow-[0_28px_70px_-35px_rgba(69,83,38,.45)]"><CardContent className="p-6 sm:p-9"><div className="grid h-14 w-14 place-items-center rounded-full bg-[#eef4d7] text-[#57672f]"><CheckCircle2 className="h-7 w-7" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#718043]">Projet transmis</p><h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.035em] text-[#26301b]">Votre boutique commence ici.</h1><p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Le projet <strong className="text-slate-900">#{submitted.id}</strong> est enregistré pour l’offre <strong className="text-slate-900">{plan.name}</strong>. L’adresse provisoire demandée est <strong className="text-slate-900">{submitted.domain}</strong>.</p><div className="mt-6 rounded-2xl border border-[#e5e4d8] bg-[#fafaf4] p-4 text-sm leading-6 text-slate-700"><strong className="text-slate-950">Ce qui se passe ensuite :</strong> MAZIGHO Studio vérifie le projet. Une boutique reste en préparation tant que la création, les accès, le domaine et l’ouverture n’ont pas été explicitement confirmés. Aucun paiement, abonnement, domaine externe ou publication n’a été déclenché ici.</div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/mon-compte" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#586832] px-5 text-sm font-bold text-white hover:bg-[#48582a]">Accéder à mon espace <ArrowRight className="ml-2 h-4 w-4" /></Link><a href="https://pro.mazigho.ch/#tarifs" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d8d7ca] bg-white px-5 text-sm font-bold text-slate-800 hover:bg-[#fafaf5]">Revoir les offres</a></div></CardContent></Card></section></main>;
  }

  return (
    <main className="min-h-screen bg-[#fbfaf5] text-slate-950">
      <header className="border-b border-[#e8e5d8] bg-[#fffefb]"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><a href="https://pro.mazigho.ch/#tarifs" className="flex items-center gap-2.5" aria-label="Retour aux offres MAZIGHO"><img src={APP_LOGO} alt="" className="h-9 w-9 object-contain" /><div><p className="font-serif text-lg font-bold tracking-[0.13em]">MAZIGH<span className="text-[#7b8a3f]">O</span></p><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Création de boutique</p></div></a><a href="https://pro.mazigho.ch/#tarifs" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-[#f3f2e9]"><ArrowLeft className="h-4 w-4" /> Offres</a></div></header>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-3xl"><p className="inline-flex items-center gap-2 rounded-full border border-[#d9e2ad] bg-[#f3f7df] px-3 py-1.5 text-xs font-bold text-[#566632]"><Store className="h-3.5 w-3.5" /> Parcours propriétaire</p><h1 className="mt-4 font-serif text-4xl font-bold tracking-[-0.04em] text-[#26301b] sm:text-5xl">Préparez votre boutique,<br className="hidden sm:block" /> pas un compte client.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Vous choisissez une offre, une direction et une adresse provisoire. Votre accès MAZIGHO sert à suivre votre projet de boutique ; il ne vous envoie pas dans le parcours d’achat de la boutique publique.</p></div>
        <ol className="mt-8 grid gap-2 sm:grid-cols-3" aria-label="Étapes de création"><li className="rounded-xl border border-[#d9e2ad] bg-[#f4f7e6] px-4 py-3 text-sm font-bold text-[#53622f]"><span className="mr-2">1.</span> Offre et accès</li><li className={`rounded-xl border px-4 py-3 text-sm font-bold ${step >= 2 ? "border-[#d9e2ad] bg-[#f4f7e6] text-[#53622f]" : "border-[#e5e3da] bg-white text-slate-400"}`}><span className="mr-2">2.</span> Projet de boutique</li><li className={`rounded-xl border px-4 py-3 text-sm font-bold ${step >= 3 ? "border-[#d9e2ad] bg-[#f4f7e6] text-[#53622f]" : "border-[#e5e3da] bg-white text-slate-400"}`}><span className="mr-2">3.</span> Confirmation</li></ol>

        <section className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <Card className="border-[#e5e3d8] bg-white shadow-sm"><CardContent className="p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718043]">Étape 1 — Votre offre</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Choisissez votre point de départ</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{publicStoreAcquisitionPlanIds.map(id => { const item = getPublicStoreAcquisitionPlan(id); const selected = planId === id; return <button key={id} type="button" onClick={() => choosePlan(id)} className={`min-h-36 rounded-2xl border p-4 text-left transition ${selected ? "border-[#697b3d] bg-[#f2f6df] ring-2 ring-[#dbe5b8]" : "border-[#e4e2d8] bg-[#fffefb] hover:border-[#aab879]"}`}><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#637338]">{item.name}</p><p className="mt-3 text-lg font-bold text-slate-950">{planCtas[id].price}</p><p className="mt-1 text-xs font-semibold text-[#9b6b20]">{planCtas[id].commission}</p><p className="mt-3 text-xs leading-5 text-slate-600">{planCtas[id].caption}</p>{selected && <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#57672f]"><Check className="h-3.5 w-3.5" /> Sélectionné</span>}</button>; })}</div>
            {!authQuery.isLoading && !authenticated ? <div className="mt-7 rounded-2xl border border-[#dfe7c4] bg-[#f7f9ed] p-4 sm:p-5"><div className="flex gap-3"><UserRound className="mt-0.5 h-5 w-5 shrink-0 text-[#596b31]" /><div><h3 className="font-semibold text-slate-950">Créer ou reprendre votre accès propriétaire</h3><p className="mt-1 text-sm leading-6 text-slate-600">Cet accès vous permet de suivre votre projet de boutique. Il ne sert pas à passer une commande dans MAZIGHO.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Link href={`/register?intent=boutique&returnTo=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#596a32] px-4 text-sm font-bold text-white hover:bg-[#4a5929]">Créer mon accès propriétaire <ArrowRight className="ml-2 h-4 w-4" /></Link><Link href={`/login?intent=boutique&returnTo=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#cbd8a4] bg-white px-4 text-sm font-bold text-[#4f602d] hover:bg-[#f9fbf1]"><LogIn className="mr-2 h-4 w-4" /> Je me connecte</Link></div></div></div></div> : <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfe7c4] bg-[#f7f9ed] p-4"><p className="text-sm font-semibold text-slate-700">Offre choisie : <span className="text-slate-950">{plan.name}</span></p><Button type="button" onClick={continueToProject} className="min-h-11 bg-[#596a32] hover:bg-[#4a5929]">Continuer mon projet <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
          </CardContent></Card>
          <aside className="rounded-[1.45rem] bg-[#273219] p-5 text-white sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#dbe9a3]">Ce parcours protège votre projet</p><div className="mt-5 space-y-4 text-sm leading-6 text-white/78"><p className="flex gap-3"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#edc770]" />L’offre sélectionnée est une intention enregistrée ; elle ne déclenche pas de facture ni de prélèvement.</p><p className="flex gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#edc770]" />Le thème et la base régionale restent modifiables avant l’ouverture.</p><p className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#edc770]" />Studio confirme séparément la boutique, les accès et toute étape commerciale.</p></div></aside>
        </section>

        {authenticated && step >= 2 && <section id="store-project-step" className="mt-7 scroll-mt-6"><Card className="border-[#e5e3d8] bg-white shadow-sm"><CardContent className="p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718043]">Étape 2 — Votre projet</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Donnez une première direction à votre boutique</h2><p className="mt-2 text-sm leading-6 text-slate-600">Aucun de ces éléments n’est public. Ils servent uniquement à préparer la boutique dans Studio.</p><div className="mt-6 grid gap-5 lg:grid-cols-2"><div className="space-y-2"><Label htmlFor="acquisition-store-name">Nom de la boutique</Label><Input id="acquisition-store-name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Ex. Atelier des Amandiers" minLength={2} maxLength={160} /></div><div className="space-y-2"><Label htmlFor="acquisition-subdomain">Adresse provisoire MAZIGHO</Label><div className="flex rounded-md shadow-xs"><Input id="acquisition-subdomain" value={requestedSubdomain} onChange={event => { setSubdomainTouched(true); setRequestedSubdomain(slugifySubdomain(event.target.value)); }} placeholder="atelier-des-amandiers" autoCapitalize="none" className="rounded-r-none" /><span className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">.mazigho.ch</span></div><p className="text-xs leading-5 text-slate-500">Une adresse provisoire, pas un domaine externe. Vous pourrez lier votre propre domaine plus tard.</p></div><div className="space-y-2"><Label>Univers de départ</Label><Select value={businessType} onValueChange={value => setBusinessType(value as typeof businessType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="animalier">Animalier</SelectItem><SelectItem value="bijoux">Bijoux & cadeaux</SelectItem><SelectItem value="vetements">Mode & accessoires</SelectItem><SelectItem value="autre">Autre univers</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Base de démarrage</Label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setProvisioningTemplate("standard"); if (currency === "DZD") setCurrency("CHF"); }} className={`rounded-xl border p-3 text-left text-sm ${provisioningTemplate === "standard" ? "border-[#697b3d] bg-[#f4f7e7]" : "border-slate-200"}`}><strong>Boutique standard</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Marchés et devise ajustables.</span></button><button type="button" onClick={() => { setProvisioningTemplate("algeria"); setCurrency("DZD"); }} className={`rounded-xl border p-3 text-left text-sm ${provisioningTemplate === "algeria" ? "border-emerald-600 bg-emerald-50" : "border-emerald-200"}`}><span className="flex items-center gap-1 font-bold text-emerald-900"><MapPin className="h-3.5 w-3.5" /> Algérie</span><span className="mt-1 block text-xs leading-5 text-emerald-800">DZD et wilayas à préparer.</span></button></div></div><div className="space-y-2"><Label>Devise de départ</Label><Select disabled={provisioningTemplate === "algeria"} value={currency} onValueChange={value => setCurrency(value as typeof currency)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CHF">CHF — Franc suisse</SelectItem><SelectItem value="EUR">EUR — Euro</SelectItem><SelectItem value="USD">USD — Dollar US</SelectItem><SelectItem value="GBP">GBP — Livre sterling</SelectItem><SelectItem value="DZD">DZD — Dinar algérien</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Thème de départ <span className="font-normal text-slate-500">(facultatif)</span></Label><Select value={themePreset} onValueChange={value => setThemePreset(value as StorefrontThemeId | "none")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Je choisirai plus tard</SelectItem>{storefrontThemeCatalog.map(theme => <SelectItem key={theme.id} value={theme.id}>{theme.label}</SelectItem>)}</SelectContent></Select></div></div>{businessType === "autre" && <div className="mt-5 space-y-2"><Label htmlFor="acquisition-theme">Votre univers</Label><Input id="acquisition-theme" value={customBusinessTheme} onChange={event => setCustomBusinessTheme(event.target.value)} placeholder="Ex. déco artisanale, thés, produits de beauté…" maxLength={160} /></div>}<div className="mt-5 space-y-2"><Label htmlFor="acquisition-notes">Une précision utile <span className="font-normal text-slate-500">(facultatif)</span></Label><Textarea id="acquisition-notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Ce que vous aimeriez vendre, une priorité de lancement, une contrainte…" maxLength={1200} rows={3} /></div><div className="mt-6 flex justify-end"><Button type="button" disabled={!requiredProjectFieldsReady} onClick={() => { setStep(3); window.requestAnimationFrame(() => document.getElementById("store-confirm-step")?.scrollIntoView({ behavior: "smooth", block: "start" })); }} className="min-h-11 bg-[#596a32] hover:bg-[#4a5929]">Vérifier mon projet <ArrowRight className="ml-2 h-4 w-4" /></Button></div></CardContent></Card></section>}

        {authenticated && step >= 3 && <section id="store-confirm-step" className="mt-7 scroll-mt-6"><Card className="border-[#dce5ba] bg-[#fbfcf5] shadow-sm"><CardContent className="p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718043]">Étape 3 — Confirmation</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Prêt à envoyer le projet à MAZIGHO Studio ?</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-[#e0e4d0] bg-white p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Offre souhaitée</p><p className="mt-1 font-semibold text-slate-950">{plan.name}</p></div><div className="rounded-xl border border-[#e0e4d0] bg-white p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Boutique</p><p className="mt-1 truncate font-semibold text-slate-950">{displayName}</p></div><div className="rounded-xl border border-[#e0e4d0] bg-white p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Adresse provisoire</p><p className="mt-1 truncate font-semibold text-slate-950">{requestedSubdomain}.mazigho.ch</p></div><div className="rounded-xl border border-[#e0e4d0] bg-white p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Base</p><p className="mt-1 font-semibold text-slate-950">{provisioningTemplate === "algeria" ? "Algérie · DZD" : currency}</p></div></div><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#dce3c6] bg-white p-4 text-sm leading-6 text-slate-700"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#596a32] focus:ring-[#596a32]" /><span><strong className="text-slate-950">Je confirme transmettre un projet de boutique.</strong> Je comprends qu’il ne crée pas encore de boutique publique, de domaine personnalisé, d’accès délégué, d’abonnement, de prélèvement ou de paiement.</span></label><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="outline" className="min-h-11" onClick={() => setStep(2)}>Modifier le projet</Button><Button type="button" disabled={!acknowledged || submit.isPending} onClick={submitProject} className="min-h-11 bg-[#596a32] hover:bg-[#4a5929]">{submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Transmettre à MAZIGHO Studio</Button></div></CardContent></Card></section>}
      </section>
    </main>
  );
}
