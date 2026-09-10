import { useMemo, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BadgeCheck,
  ClipboardPlus,
  CircleAlert,
  Clock3,
  Building2,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Copy,
  Eye,
  Gift,
  Layers3,
  Loader2,
  LockKeyhole,
  Palette,
  PanelTop,
  PawPrint,
  Shirt,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Store,
  UsersRound,
  UserPlus,
  WandSparkles,
} from "lucide-react";

type BoutiqueTheme = "animalier" | "bijoux" | "vetements";
type ProvisioningBusinessType = BoutiqueTheme | "autre";

type ProvisioningDraftForm = {
  displayName: string;
  requestedDomain: string;
  ownerName: string;
  ownerEmail: string;
  businessType: ProvisioningBusinessType;
  preferredCurrency: "CHF" | "EUR" | "USD" | "GBP";
  notes: string;
};

const emptyProvisioningDraft: ProvisioningDraftForm = {
  displayName: "",
  requestedDomain: "",
  ownerName: "",
  ownerEmail: "",
  businessType: "autre",
  preferredCurrency: "CHF",
  notes: "",
};

type ThemePreview = {
  id: BoutiqueTheme;
  label: string;
  owner: string;
  niche: string;
  icon: typeof PawPrint;
  accent: string;
  accentSoft: string;
  canvas: string;
  ink: string;
  headline: string;
  message: string;
  collections: string[];
  clientFocus: string[];
  progress: string;
  tone: string;
};

const previews: Record<BoutiqueTheme, ThemePreview> = {
  animalier: {
    id: "animalier",
    label: "Boutique animalière",
    owner: "Pattes & Compagnie",
    niche: "Bien-être, promenade et quotidien des animaux",
    icon: PawPrint,
    accent: "#0F766E",
    accentSoft: "#CCFBF1",
    canvas: "#F0FDFA",
    ink: "#134E4A",
    headline: "Le meilleur pour leurs grandes aventures.",
    message: "Des essentiels choisis pour rendre chaque sortie plus simple et plus joyeuse.",
    collections: ["Chiens", "Chats", "Promenade"],
    clientFocus: ["Catalogue par espèce", "Conseils de taille", "Livraison & retours"],
    progress: "Pack métier prêt à personnaliser",
    tone: "Teal",
  },
  bijoux: {
    id: "bijoux",
    label: "Boutique bijoux",
    owner: "Éclat Atelier",
    niche: "Bijoux contemporains et cadeaux choisis",
    icon: Sparkles,
    accent: "#9A3412",
    accentSoft: "#FFEDD5",
    canvas: "#FFF7ED",
    ink: "#7C2D12",
    headline: "Des détails qui deviennent des souvenirs.",
    message: "Des pièces lumineuses pour offrir, célébrer et signer votre style.",
    collections: ["Nouveautés", "À offrir", "Essentiels"],
    clientFocus: ["Variantes matière", "Guide cadeaux", "Coffrets & promotions"],
    progress: "Pack métier prêt à personnaliser",
    tone: "Cuivre",
  },
  vetements: {
    id: "vetements",
    label: "Boutique vêtements",
    owner: "Studio Ligne",
    niche: "Mode, silhouettes et essentiels de saison",
    icon: Shirt,
    accent: "#4338CA",
    accentSoft: "#E0E7FF",
    canvas: "#EEF2FF",
    ink: "#312E81",
    headline: "La silhouette juste, pour chaque journée.",
    message: "Une sélection à porter librement, imaginée autour des coupes et des matières.",
    collections: ["Femme", "Homme", "Enfant"],
    clientFocus: ["Tailles & couleurs", "Collections saisonnières", "Retours simplifiés"],
    progress: "Pack métier prêt à personnaliser",
    tone: "Indigo",
  },
};

const storeStatusPresentation = {
  setup: { label: "À préparer", className: "border-amber-200 bg-amber-50 text-amber-800" },
  active: { label: "Active", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  limited: { label: "Accès limité", className: "border-orange-200 bg-orange-50 text-orange-800" },
  suspended: { label: "Suspendue", className: "border-rose-200 bg-rose-50 text-rose-800" },
  closed: { label: "Clôturée", className: "border-slate-200 bg-slate-100 text-slate-700" },
} as const;

function formatBusinessType(value: ProvisioningBusinessType) {
  return ({ animalier: "Animalier", bijoux: "Bijoux", vetements: "Vêtements", autre: "Autre univers" } as const)[value];
}

function formatProvisioningStatus(value: "draft" | "ready_for_confirmation" | "archived") {
  return ({ draft: "Brouillon", ready_for_confirmation: "Prêt à confirmer", archived: "Archivé" } as const)[value];
}

function formatStudioDate(value: Date | string | null) {
  if (!value) return "Aucune commande";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-CH", { dateStyle: "medium" }).format(date);
}

function StudioRailItem({ icon: Icon, title, detail }: { icon: typeof Building2; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-xl bg-slate-900 p-2.5 text-white"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p>
      </div>
    </div>
  );
}

export default function AdminStudio() {
  const [themeId, setThemeId] = useState<BoutiqueTheme>("animalier");
  const [draftForm, setDraftForm] = useState<ProvisioningDraftForm>(emptyProvisioningDraft);
  const [draftAcknowledged, setDraftAcknowledged] = useState(false);
  const [selectedPreflightDraftId, setSelectedPreflightDraftId] = useState<number | null>(null);
  const [giftConfirmOpen, setGiftConfirmOpen] = useState(false);
  const [giftConfirmationName, setGiftConfirmationName] = useState("");
  const [giftAcknowledged, setGiftAcknowledged] = useState(false);
  const [selectedOwnerHandoffStoreId, setSelectedOwnerHandoffStoreId] = useState<number | null>(null);
  const [selectedActivationStoreId, setSelectedActivationStoreId] = useState<number | null>(null);
  const [domainUpdateOpen, setDomainUpdateOpen] = useState(false);
  const [domainUpdateConfirmationName, setDomainUpdateConfirmationName] = useState("");
  const [domainUpdateValue, setDomainUpdateValue] = useState("");
  const [domainUpdateAcknowledged, setDomainUpdateAcknowledged] = useState(false);
  const [selectedSetupReadinessStoreId, setSelectedSetupReadinessStoreId] = useState<number | null>(null);
  const [activationConfirmOpen, setActivationConfirmOpen] = useState(false);
  const [activationConfirmationName, setActivationConfirmationName] = useState("");
  const [activationOwnerEmail, setActivationOwnerEmail] = useState("");
  const [activationDomainVerified, setActivationDomainVerified] = useState(false);
  const [activationAcknowledged, setActivationAcknowledged] = useState(false);
  const [petDemoSetupOpen, setPetDemoSetupOpen] = useState(false);
  const [petDemoSetupConfirmationName, setPetDemoSetupConfirmationName] = useState("");
  const [petDemoSetupAcknowledged, setPetDemoSetupAcknowledged] = useState(false);
  const [retailDemoSetupOpen, setRetailDemoSetupOpen] = useState(false);
  const [selectedRetailDemoStore, setSelectedRetailDemoStore] = useState<{ id: number; displayName: string; businessType: "bijoux" | "vetements" } | null>(null);
  const [retailDemoSetupConfirmationName, setRetailDemoSetupConfirmationName] = useState("");
  const [retailDemoSetupAcknowledged, setRetailDemoSetupAcknowledged] = useState(false);
  const [ownerHandoffConfirmOpen, setOwnerHandoffConfirmOpen] = useState(false);
  const [ownerHandoffAcknowledged, setOwnerHandoffAcknowledged] = useState(false);
  const [ownerHandoffEmail, setOwnerHandoffEmail] = useState("");
  const [ownerHandoffAction, setOwnerHandoffAction] = useState<"prepare" | "reissue">("prepare");
  const [preparedOwnerInvitation, setPreparedOwnerInvitation] = useState<{ link: string; email: string; expiresAt: Date | string } | null>(null);
  const [legalCopyOpen, setLegalCopyOpen] = useState(false);
  const [legalCopyConfirmationName, setLegalCopyConfirmationName] = useState("");
  const [legalCopyAcknowledged, setLegalCopyAcknowledged] = useState(false);
  const utils = trpc.useUtils();
  const inventoryQuery = trpc.admin.studio.getInventory.useQuery(undefined, { refetchOnWindowFocus: false });
  const draftsQuery = trpc.admin.studio.getProvisioningDrafts.useQuery(undefined, { refetchOnWindowFocus: false });
  const reviewsQuery = trpc.admin.studio.getProvisioningReviews.useQuery(undefined, { refetchOnWindowFocus: false });
  const preflightQuery = trpc.admin.studio.getLaunchPreflight.useQuery({ draftId: selectedPreflightDraftId ?? 0 }, { enabled: selectedPreflightDraftId !== null, refetchOnWindowFocus: false });
  const ownerHandoffQuery = trpc.admin.studio.getGiftStoreOwnerHandoff.useQuery({ storeId: selectedOwnerHandoffStoreId ?? 0 }, { enabled: selectedOwnerHandoffStoreId !== null, refetchOnWindowFocus: false });
  const activationPreflightQuery = trpc.admin.studio.getGiftStoreActivationPreflight.useQuery({ storeId: selectedActivationStoreId ?? 0 }, { enabled: selectedActivationStoreId !== null, refetchOnWindowFocus: false });
  const setupReadinessQuery = trpc.admin.studio.getGiftStoreSetupReadiness.useQuery({ storeId: selectedSetupReadinessStoreId ?? 0 }, { enabled: selectedSetupReadinessStoreId !== null, refetchOnWindowFocus: false });
  const retailDemoCandidatesQuery = trpc.admin.studio.getGiftRetailDemoSetupCandidates.useQuery(undefined, { refetchOnWindowFocus: false });
  const installGiftRetailDemoSetupMutation = trpc.admin.studio.installGiftRetailDemoSetup.useMutation({
    onSuccess: result => {
      const label = result.businessType === "bijoux" ? "bijoux" : "vêtements";
      toast.success(`Kit ${label} installé : ${result.store.displayName}. La boutique reste fermée au public.`);
      setRetailDemoSetupOpen(false);
      setSelectedRetailDemoStore(null);
      setRetailDemoSetupConfirmationName("");
      setRetailDemoSetupAcknowledged(false);
      utils.admin.studio.getInventory.invalidate();
      utils.admin.studio.getGiftRetailDemoSetupCandidates.invalidate();
      utils.admin.studio.getPrivateStorefrontPreview.invalidate();
    },
    onError: error => toast.error(error.message || "Le kit de démonstration n’a pas pu être installé."),
  });
  const installGiftPetDemoSetupMutation = trpc.admin.studio.installGiftPetDemoSetup.useMutation({
    onSuccess: result => {
      toast.success(`Kit animalier installé : ${result.store.displayName}. La boutique reste fermée au public.`);
      setPetDemoSetupOpen(false);
      setPetDemoSetupConfirmationName("");
      setPetDemoSetupAcknowledged(false);
      utils.admin.studio.getInventory.invalidate();
      utils.admin.studio.getGiftStoreActivationPreflight.invalidate();
    },
    onError: error => toast.error(error.message || "Le kit animalier n’a pas pu être installé."),
  });
  const copyPlatformLegalProfileMutation = trpc.admin.studio.copyPlatformLegalProfileToGiftStore.useMutation({
    onSuccess: result => {
      toast.success(`Coordonnées légales MAZIGHO copiées dans ${result.store.displayName}. La boutique reste fermée au public.`);
      setLegalCopyOpen(false);
      setLegalCopyConfirmationName("");
      setLegalCopyAcknowledged(false);
      utils.admin.studio.getGiftStoreActivationPreflight.invalidate();
    },
    onError: error => toast.error(error.message || "Les coordonnées légales n’ont pas pu être copiées."),
  });
  const updateGiftStorePrimaryDomainMutation = trpc.admin.studio.updateGiftStorePrimaryDomain.useMutation({
    onSuccess: result => {
      toast.success(`Domaine préparé : ${result.store.primaryDomain}. La boutique reste en setup et fermée au public.`);
      setDomainUpdateOpen(false);
      setDomainUpdateConfirmationName("");
      setDomainUpdateValue("");
      setDomainUpdateAcknowledged(false);
      utils.admin.studio.getInventory.invalidate();
      utils.admin.studio.getGiftStoreActivationPreflight.invalidate();
      utils.admin.studio.getGiftStoreSetupReadiness.invalidate();
      utils.admin.studio.getPrivateStorefrontPreview.invalidate();
    },
    onError: error => toast.error(error.message || "Le domaine n’a pas pu être remplacé."),
  });
  const activateGiftStoreMutation = trpc.admin.studio.activateGiftAnimalStore.useMutation({
    onSuccess: result => {
      toast.success(`Boutique activée : ${result.store.displayName}. Le storefront est maintenant éligible à la diffusion publique.`);
      setActivationConfirmOpen(false);
      setActivationConfirmationName("");
      setActivationOwnerEmail("");
      setActivationDomainVerified(false);
      setActivationAcknowledged(false);
      utils.admin.studio.getInventory.invalidate();
      utils.admin.studio.getGiftStoreActivationPreflight.invalidate();
      utils.admin.studio.getGiftStoreOwnerHandoff.invalidate();
    },
    onError: error => toast.error(error.message || "La boutique n’a pas pu être activée."),
  });
  const reissueOwnerInvitationMutation = trpc.admin.studio.reissueGiftStoreOwnerInvitation.useMutation({
    onSuccess: result => {
      setPreparedOwnerInvitation({ link: result.invitation.link, email: result.invitation.email, expiresAt: result.invitation.expiresAt });
      toast.success("Nouveau lien préparé. L’ancien lien a été invalidé et aucun e-mail n’a été envoyé.");
      setOwnerHandoffConfirmOpen(false);
      setOwnerHandoffAcknowledged(false);
      setOwnerHandoffEmail("");
      utils.admin.studio.getGiftStoreOwnerHandoff.invalidate();
    },
    onError: error => toast.error(error.message || "Le lien n’a pas pu être régénéré."),
  });
  const prepareOwnerInvitationMutation = trpc.admin.studio.prepareGiftStoreOwnerInvitation.useMutation({
    onSuccess: result => {
      if (result.invitation) {
        setPreparedOwnerInvitation({ link: result.invitation.link, email: result.invitation.email, expiresAt: result.invitation.expiresAt });
        toast.success("Invitation préparée. Aucun e-mail n’a été envoyé.");
      } else {
        toast.success("Le propriétaire disposant déjà d’un compte a été attribué à cette boutique.");
      }
      setOwnerHandoffConfirmOpen(false);
      setOwnerHandoffAcknowledged(false);
      setOwnerHandoffEmail("");
      utils.admin.studio.getInventory.invalidate();
      utils.admin.studio.getGiftStoreOwnerHandoff.invalidate();
    },
    onError: error => toast.error(error.message || "Le parcours propriétaire n’a pas pu être préparé."),
  });
  const provisionGiftMutation = trpc.admin.studio.provisionGiftStore.useMutation({
    onSuccess: result => {
      toast.success(`Boutique créée en préparation : ${result.store.displayName}. Aucun e-mail ni paiement n’a été déclenché.`);
      setGiftConfirmOpen(false);
      setGiftConfirmationName("");
      setGiftAcknowledged(false);
      setSelectedPreflightDraftId(null);
      utils.admin.studio.getInventory.invalidate();
      utils.admin.studio.getProvisioningDrafts.invalidate();
      utils.admin.studio.getProvisioningReviews.invalidate();
    },
    onError: error => toast.error(error.message || "La boutique offerte n’a pas pu être créée."),
  });
  const createDraftMutation = trpc.admin.studio.createProvisioningDraft.useMutation({
    onSuccess: () => {
      toast.success("Brouillon enregistré. Aucune boutique, invitation ni intégration n’a été créée.");
      setDraftForm(emptyProvisioningDraft);
      setDraftAcknowledged(false);
      utils.admin.studio.getProvisioningDrafts.invalidate();
      utils.admin.studio.getProvisioningReviews.invalidate();
    },
    onError: error => toast.error(error.message || "Le brouillon n’a pas pu être enregistré."),
  });
  const inventory = inventoryQuery.data;
  const reviewByDraftId = useMemo(() => new Map((reviewsQuery.data ?? []).map(draft => [draft.id, draft.review])), [reviewsQuery.data]);
  const theme = previews[themeId];
  const ThemeIcon = theme.icon;
  const themeCollections = useMemo(() => theme.collections, [theme.collections]);
  const giftSetupStores = useMemo(() => (inventory?.stores ?? []).filter(store => store.status === "setup" && store.giftProvisioned), [inventory?.stores]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8" data-testid="mazigho-studio-page">
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-300/30">
          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_250px] md:items-center md:p-8">
            <div>
              <Badge className="border border-orange-300/35 bg-orange-400/15 px-3 py-1 text-orange-100 hover:bg-orange-400/15"><Building2 className="mr-1.5 h-3.5 w-3.5" /> Console opérateur</Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">MAZIGHO Studio prend forme.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">Cette console vous appartient. Elle affiche maintenant le parc réel enregistré dans la plateforme, sous forme d’indicateurs agrégés et sans révéler de données clients. Les exemples animalier, bijoux et vêtements restent des modèles non publiés pour visualiser la future offre.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Étape actuelle</p>
              <p className="mt-2 text-lg font-semibold">Console opérateur informative</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-orange-400" /></div>
              <p className="mt-3 text-xs leading-5 text-slate-300">Le registre, l’identité, le catalogue, les relations client et les opérations sont isolés. La création d’une boutique cliente reste volontairement désactivée.</p>
            </div>
          </div>
          <div className="grid border-t border-white/10 sm:grid-cols-3">
            <div className="border-b border-white/10 px-6 py-4 sm:border-b-0 sm:border-r"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Votre rôle</p><p className="mt-1 font-semibold">Opérateur de plateforme</p></div>
            <div className="border-b border-white/10 px-6 py-4 sm:border-b-0 sm:border-r"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Espace client</p><p className="mt-1 font-semibold">Une boutique, un catalogue, un pilotage</p></div>
            <div className="px-6 py-4"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Sécurité</p><p className="mt-1 font-semibold">Secrets techniques hors interface</p></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" data-testid="studio-inventory">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Parc réel de la plateforme</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Les boutiques enregistrées, sans ouvrir leurs données internes.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Chaque ligne regroupe uniquement l’état opérationnel, les membres actifs, le catalogue et les commandes. Les identités client, secrets et contenus détaillés restent isolés.</p>
            </div>
            <Button variant="outline" onClick={() => inventoryQuery.refetch()} disabled={inventoryQuery.isFetching} className="w-fit border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${inventoryQuery.isFetching ? "animate-spin" : ""}`} /> Actualiser
            </Button>
          </div>

          {inventoryQuery.isLoading && !inventory ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
          ) : inventoryQuery.isError && !inventory ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>Les indicateurs Studio ne sont pas disponibles pour le moment. Le panneau quotidien de MAZIGHO reste inchangé ; vous pouvez réessayer cette lecture sans modifier aucune donnée.</p></div>
          ) : (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Boutiques enregistrées</p><p className="mt-2 text-3xl font-bold text-slate-950">{inventory?.summary.total ?? 0}</p><p className="mt-1 text-xs text-slate-500">dont {inventory?.summary.platform ?? 0} plateforme</p></div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Boutiques actives</p><p className="mt-2 text-3xl font-bold text-emerald-950">{inventory?.summary.active ?? 0}</p><p className="mt-1 text-xs text-emerald-800">Aucun accès client n’est créé ici</p></div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">À préparer</p><p className="mt-2 text-3xl font-bold text-amber-950">{inventory?.summary.setup ?? 0}</p><p className="mt-1 text-xs text-amber-800">Identité, catalogue ou domaine à finaliser</p></div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Accès encadrés</p><p className="mt-2 text-3xl font-bold text-violet-950">{(inventory?.summary.limited ?? 0) + (inventory?.summary.suspended ?? 0)}</p><p className="mt-1 text-xs text-violet-800">États informatifs, sans licence automatique</p></div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid min-w-[760px] grid-cols-[minmax(220px,1.4fr)_150px_100px_120px_120px] items-center gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  <span>Boutique</span><span>État & préparation</span><span>Membres</span><span>Catalogue</span><span>Commandes</span>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[760px] divide-y divide-slate-100">
                    {(inventory?.stores ?? []).map(store => {
                      const status = storeStatusPresentation[store.status];
                      return <div key={store.slug} className="grid grid-cols-[minmax(220px,1.4fr)_150px_100px_120px_120px] items-center gap-4 px-5 py-4">
                        <div className="min-w-0"><div className="flex items-center gap-2"><Store className="h-4 w-4 shrink-0 text-slate-500" /><p className="truncate font-semibold text-slate-900">{store.displayName}</p>{Boolean(store.isPlatformStore) && <Badge className="border-0 bg-slate-900 text-white hover:bg-slate-900">Plateforme</Badge>}</div><p className="mt-1 truncate text-xs text-slate-500">{store.primaryDomain} · {store.slug}</p></div>
                        <div><Badge variant="outline" className={status.className}>{status.label}</Badge><p className="mt-1.5 text-xs text-slate-500">{store.setupCompleted ? "Profil initial complété" : "Profil initial à compléter"}</p></div>
                        <div><p className="font-semibold text-slate-900">{store.activeMembers}</p><p className="text-xs text-slate-500">{store.activeOwners} propriétaire{store.activeOwners > 1 ? "s" : ""}</p></div>
                        <div><p className="font-semibold text-slate-900">{store.productCount}</p><p className="text-xs text-slate-500">{store.activeProductCount} actif{store.activeProductCount > 1 ? "s" : ""}</p></div>
                        <div><p className="font-semibold text-slate-900">{store.orderCount}</p><p className="text-xs text-slate-500">{formatStudioDate(store.latestOrderAt)}</p></div>
                      </div>;
                    })}
                  </div>
                </div>
              </div>
              {(inventory?.summary.client ?? 0) === 0 && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-4 text-sm leading-6 text-orange-950"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" /><p><strong>Aucune boutique cliente n’est encore ouverte.</strong> C’est volontaire : Studio vous montre aujourd’hui la boutique plateforme réelle et prépare le dispositif d’accompagnement avant la première mise en service.</p></div>}
            </>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]" data-testid="studio-owner-handoff">
          <Card className="border-violet-200 shadow-sm">
            <CardHeader><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Propriétaire de la boutique offerte</p><CardTitle className="mt-1 flex items-center gap-2 text-2xl"><UserPlus className="h-6 w-6 text-violet-700" /> Préparer l’accès, sans l’envoyer</CardTitle><CardDescription className="mt-2 max-w-2xl">Après la création d’une boutique en `setup`, ce parcours attache un propriétaire existant ou prépare un lien manuel. Il n’envoie jamais d’e-mail et n’ouvre pas la boutique au public.</CardDescription></div><Badge className="border-0 bg-violet-100 text-violet-800 hover:bg-violet-100">Contrôle opérateur</Badge></div></CardHeader>
            <CardContent className="space-y-3">
              {giftSetupStores.length === 0 ? <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-5 text-sm leading-6 text-violet-950"><p className="font-semibold">Aucune boutique offerte en préparation.</p><p className="mt-1">Créez d’abord une boutique cadeau en état `setup` depuis un brouillon validé. Elle apparaîtra ensuite ici pour préparer son propriétaire.</p></div> : giftSetupStores.map(store => <button key={store.id} type="button" onClick={() => { setSelectedOwnerHandoffStoreId(store.id); setPreparedOwnerInvitation(null); }} className={selectedOwnerHandoffStoreId === store.id ? "w-full rounded-2xl border border-violet-400 bg-violet-50 p-4 text-left ring-2 ring-violet-100" : "w-full rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-200 hover:bg-violet-50/40"}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{store.displayName}</p><p className="mt-1 truncate text-xs text-slate-500">{store.primaryDomain}</p></div><Badge className="border-0 bg-amber-100 text-amber-800 hover:bg-amber-100">setup</Badge></div><p className="mt-3 text-xs leading-5 text-slate-600">{store.activeOwners > 0 ? "Propriétaire local déjà rattaché" : "Propriétaire à préparer"} · {store.activeMembers} membre{store.activeMembers > 1 ? "s" : ""}</p></button>)}
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Revue d’accès</p><CardTitle className="mt-1 text-xl">Propriétaire et activation future</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedOwnerHandoffStoreId === null ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Choisissez une boutique offerte à gauche pour vérifier son propriétaire et préparer, si nécessaire, un lien manuel.</div> : ownerHandoffQuery.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-100" /> : ownerHandoffQuery.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">La revue propriétaire n’est pas disponible pour cette boutique.</div> : ownerHandoffQuery.data && <div className="space-y-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><p><strong className="text-slate-900">Bénéficiaire prévu :</strong> {ownerHandoffQuery.data.intendedOwner.name}</p><p><strong className="text-slate-900">E-mail :</strong> {ownerHandoffQuery.data.intendedOwner.email}</p><p className="mt-2"><strong className="text-slate-900">État :</strong> {ownerHandoffQuery.data.ownerState === "attached" ? "propriétaire déjà rattaché" : ownerHandoffQuery.data.ownerState === "invitation_pending" ? "invitation locale déjà en attente" : ownerHandoffQuery.data.ownerState === "existing_account_needs_assignment" ? "compte existant à attribuer" : "compte à préparer"}</p></div>{ownerHandoffQuery.data.requiredBeforePublicActivation.map(item => <p key={item} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" />{item}</p>)}{preparedOwnerInvitation && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-950">Lien préparé — aucun e-mail envoyé</p><p className="mt-1 text-xs leading-5 text-emerald-900">Transmettez-le vous-même au bénéficiaire uniquement après vérification de son identité. Il expire le {formatStudioDate(preparedOwnerInvitation.expiresAt)}.</p><div className="mt-3 flex gap-2"><Input value={preparedOwnerInvitation.link} readOnly className="bg-white text-xs" aria-label="Lien d’invitation préparé" /><Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(preparedOwnerInvitation.link); toast.success("Lien copié dans le presse-papiers."); }} aria-label="Copier le lien d’invitation"><Copy className="h-4 w-4" /></Button></div></div>}{ownerHandoffQuery.data.canPrepareInvitation && !ownerHandoffQuery.data.pendingInvitation.prepared && <Button type="button" className="w-full bg-violet-700 hover:bg-violet-800" onClick={() => { setOwnerHandoffAction("prepare"); setOwnerHandoffEmail(""); setOwnerHandoffAcknowledged(false); setOwnerHandoffConfirmOpen(true); }}><UserPlus className="mr-2 h-4 w-4" /> Préparer l’invitation propriétaire</Button>}{ownerHandoffQuery.data.pendingInvitation.prepared && <Button type="button" variant="outline" className="w-full border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100" onClick={() => { setOwnerHandoffAction("reissue"); setOwnerHandoffEmail(""); setOwnerHandoffAcknowledged(false); setOwnerHandoffConfirmOpen(true); }}><RefreshCw className="mr-2 h-4 w-4" /> Régénérer le lien manuel</Button>}</div>}
            </CardContent>
          </Card>
        </section>

        <Dialog open={ownerHandoffConfirmOpen} onOpenChange={open => { if (!prepareOwnerInvitationMutation.isPending && !reissueOwnerInvitationMutation.isPending) setOwnerHandoffConfirmOpen(open); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-violet-700" /> {ownerHandoffAction === "reissue" ? "Régénérer le lien propriétaire" : "Préparer l’accès propriétaire"}</DialogTitle><DialogDescription>{ownerHandoffAction === "reissue" ? "Cette action invalide le lien manuel précédent et en crée un nouveau. Aucun e-mail n’est envoyé et la boutique reste fermée au public." : "Cette action crée au besoin un compte local en attente et un lien d’invitation manuel. Elle n’envoie aucun e-mail et ne rend pas la boutique publique."}</DialogDescription></DialogHeader>{ownerHandoffQuery.data && <div className="space-y-3"><div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-950"><p><strong>Boutique :</strong> {ownerHandoffQuery.data.store.displayName}</p><p className="mt-1"><strong>Bénéficiaire :</strong> {ownerHandoffQuery.data.intendedOwner.email}</p><p className="mt-1"><strong>Envoi e-mail :</strong> absent — le lien restera à transmettre manuellement.</p></div><div className="space-y-2"><Label htmlFor="owner-handoff-email">Recopiez l’e-mail du bénéficiaire</Label><Input id="owner-handoff-email" type="email" value={ownerHandoffEmail} onChange={event => setOwnerHandoffEmail(event.target.value)} placeholder={ownerHandoffQuery.data.intendedOwner.email} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={ownerHandoffAcknowledged} onChange={event => setOwnerHandoffAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /><span>{ownerHandoffAction === "reissue" ? "Je confirme invalider le lien précédent et préparer un nouveau lien manuel. Aucun e-mail ne sera envoyé, aucun paiement ne sera créé et la boutique restera fermée au public." : "Je confirme préparer l’accès de ce bénéficiaire. J’ai compris qu’aucun e-mail ne sera envoyé, qu’aucun paiement ne sera créé et que la boutique restera fermée au public."}</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setOwnerHandoffConfirmOpen(false)} disabled={prepareOwnerInvitationMutation.isPending || reissueOwnerInvitationMutation.isPending}>Annuler</Button><Button type="button" className="bg-violet-700 hover:bg-violet-800" disabled={!ownerHandoffQuery.data || !ownerHandoffAcknowledged || ownerHandoffEmail.trim().toLowerCase() !== ownerHandoffQuery.data.intendedOwner.email || prepareOwnerInvitationMutation.isPending || reissueOwnerInvitationMutation.isPending} onClick={() => ownerHandoffQuery.data && (ownerHandoffAction === "reissue" ? reissueOwnerInvitationMutation.mutate({ storeId: ownerHandoffQuery.data.store.id, confirmationEmail: ownerHandoffEmail }) : prepareOwnerInvitationMutation.mutate({ storeId: ownerHandoffQuery.data.store.id, confirmationEmail: ownerHandoffEmail }))}>{prepareOwnerInvitationMutation.isPending || reissueOwnerInvitationMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}{ownerHandoffAction === "reissue" ? "Régénérer le lien" : "Préparer le lien"}</Button></DialogFooter></DialogContent>
        </Dialog>

        <section className="rounded-2xl border border-violet-200 bg-violet-50/45 p-5 shadow-sm md:p-6" data-testid="studio-retail-demo-kits">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Bibliothèque de démonstration</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Kits bijoux et vêtements</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ces kits ne sont proposés qu’après la création confirmée d’une boutique offerte en `setup`. Ils préparent une identité, trois catégories et une seule fiche non commerciale ; ils ne créent pas de prix, stock, image, fournisseur, livraison, paiement ou domaine public.</p></div><Badge className="w-fit border-0 bg-violet-700 text-white hover:bg-violet-700">Installation contrôlée</Badge></div>
          {retailDemoCandidatesQuery.isLoading ? <div className="mt-5 grid gap-3 md:grid-cols-2"><div className="h-28 animate-pulse rounded-2xl bg-white/80" /><div className="h-28 animate-pulse rounded-2xl bg-white/80" /></div> : retailDemoCandidatesQuery.isError ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">Les kits de démonstration ne sont pas disponibles pour le moment. Aucun changement n’a été effectué.</div> : (retailDemoCandidatesQuery.data ?? []).length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-violet-200 bg-white/70 p-4 text-sm leading-6 text-violet-950">Aucune boutique offerte bijoux ou vêtements en état `setup` n’attend encore son kit de démonstration.</div> : <div className="mt-5 grid gap-3 md:grid-cols-2">{retailDemoCandidatesQuery.data?.map(store => { const isJewelry = store.businessType === "bijoux"; const Icon = isJewelry ? Sparkles : Shirt; const label = isJewelry ? "bijoux" : "vêtements"; return <div key={store.id} className="rounded-2xl border border-violet-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="rounded-xl bg-violet-100 p-2.5 text-violet-800"><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-semibold text-slate-950">{store.displayName}</p><p className="mt-1 text-xs text-slate-500">Univers {label} · état `setup`</p></div></div>{store.demoInstalled ? <Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Kit installé</Badge> : <Badge className="border-0 bg-violet-100 text-violet-800 hover:bg-violet-100">Prêt</Badge>}</div><p className="mt-4 text-xs leading-5 text-slate-600">{store.demoInstalled ? "Le kit est déjà présent ; aucun écrasement de contenu n’est proposé." : "Le kit restera non commercial et l’aperçu privé pourra ensuite être ouvert depuis Studio."}</p>{!store.demoInstalled && <Button type="button" variant="outline" className="mt-4 w-full border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100" onClick={() => { setSelectedRetailDemoStore({ id: store.id, displayName: store.displayName, businessType: store.businessType }); setRetailDemoSetupConfirmationName(""); setRetailDemoSetupAcknowledged(false); setRetailDemoSetupOpen(true); }}><Icon className="mr-2 h-4 w-4" /> Installer le kit {label}</Button>}</div>; })}</div>}
        </section>

        <section className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 shadow-sm md:p-6" data-testid="studio-private-preview">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Visualisation opérateur</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Aperçu privé des boutiques offertes</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Consultez la présentation réelle de la boutique depuis Studio, sans passer par son domaine et sans l’ouvrir au public. L’aperçu exclut le panier, le paiement, les clients, les commandes et les coordonnées légales.</p></div><Badge className="w-fit border-0 bg-teal-700 text-white hover:bg-teal-700">Lecture seule</Badge></div>
          {giftSetupStores.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-teal-200 bg-white/70 p-4 text-sm leading-6 text-teal-950">Une boutique offerte en état `setup` apparaîtra ici lorsqu’un aperçu privé pourra être ouvert.</div> : <div className="mt-5 grid gap-3 lg:grid-cols-2">{giftSetupStores.map(store => <Link key={store.id} href={`/admin/studio/apercu/${store.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-teal-400 hover:bg-teal-50"><div className="min-w-0"><div className="flex items-center gap-2"><Eye className="h-4 w-4 shrink-0 text-teal-700" /><p className="truncate font-semibold text-slate-950">{store.displayName}</p></div><p className="mt-1 truncate text-xs text-slate-500">État `setup` · {store.activeProductCount} fiche active de démonstration</p></div><span className="inline-flex shrink-0 items-center text-sm font-semibold text-teal-800 group-hover:text-teal-950">Ouvrir l’aperçu <ArrowUpRight className="ml-1.5 h-4 w-4" /></span></Link>)}</div>}
        </section>

        <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-sm md:p-6" data-testid="studio-setup-readiness">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Pilotage opérateur</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Suivi privé de préparation</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cette lecture synthétise, boutique par boutique, les bases nécessaires à un aperçu et à une préparation structurée. Elle ne vérifie pas le domaine, ne modifie aucun état et ne constitue pas une autorisation d’ouverture publique.</p></div><Badge className="w-fit border-0 bg-sky-800 text-white hover:bg-sky-800">Lecture seule</Badge></div>
          {giftSetupStores.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-white/70 p-4 text-sm leading-6 text-sky-950">Une boutique offerte en état `setup` pourra être suivie ici.</div> : <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(250px,.72fr)_minmax(0,1.28fr)]"><div className="space-y-2">{giftSetupStores.map(store => <button key={store.id} type="button" onClick={() => setSelectedSetupReadinessStoreId(store.id)} className={selectedSetupReadinessStoreId === store.id ? "w-full rounded-2xl border border-sky-400 bg-sky-100 p-4 text-left ring-2 ring-sky-100" : "w-full rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-sky-300 hover:bg-sky-50"}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-950">{store.displayName}</p><p className="mt-1 text-xs text-slate-500">État `setup` · {store.activeProductCount} fiche{store.activeProductCount > 1 ? "s" : ""} active{store.activeProductCount > 1 ? "s" : ""}</p></div><ClipboardCheck className="h-5 w-5 shrink-0 text-sky-700" /></div></button>)}</div><div className="rounded-2xl border border-sky-200 bg-white p-4 md:p-5">{selectedSetupReadinessStoreId === null ? <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm leading-6 text-slate-600">Sélectionnez une boutique à gauche pour consulter son suivi privé de préparation.</div> : setupReadinessQuery.isLoading ? <div className="min-h-56 animate-pulse rounded-xl bg-slate-100" /> : setupReadinessQuery.isError ? <div className="flex min-h-56 items-center rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900">Ce suivi est indisponible pour cette boutique. Aucun changement n’a été effectué.</div> : setupReadinessQuery.data && <div><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-bold tracking-tight text-slate-950">{setupReadinessQuery.data.store.displayName}</p><p className="mt-1 text-sm text-slate-600">Univers {formatBusinessType(setupReadinessQuery.data.store.businessType)} · devise {setupReadinessQuery.data.store.currency}</p></div><div className="flex flex-wrap gap-x-4 gap-y-2"><Link href={`/admin/studio/apercu/${setupReadinessQuery.data.store.id}`} className="inline-flex w-fit items-center text-sm font-semibold text-sky-800 hover:text-sky-950"><Eye className="mr-1.5 h-4 w-4" /> Voir l’aperçu privé</Link><Link href={`/admin/studio/espace-proprietaire/${setupReadinessQuery.data.store.id}`} className="inline-flex w-fit items-center text-sm font-semibold text-violet-800 hover:text-violet-950"><PanelTop className="mr-1.5 h-4 w-4" /> Voir le panneau propriétaire</Link></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-700">Prêts</p><p className="mt-1 text-2xl font-bold text-emerald-950">{setupReadinessQuery.data.readiness.readyCount}</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-amber-700">À vérifier</p><p className="mt-1 text-2xl font-bold text-amber-950">{setupReadinessQuery.data.readiness.manualCount}</p></div><div className="rounded-xl bg-rose-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-rose-700">À compléter</p><p className="mt-1 text-2xl font-bold text-rose-950">{setupReadinessQuery.data.readiness.blockedCount}</p></div></div><div className="mt-5 space-y-2">{setupReadinessQuery.data.readiness.checks.map(check => <div key={check.key} className={check.state === "ready" ? "flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3" : check.state === "manual" ? "flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3" : "flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3"}>{check.state === "ready" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> : check.state === "manual" ? <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />}<div><p className="text-sm font-semibold text-slate-950">{check.label}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{check.detail}</p></div></div>)}</div><div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-950"><strong>Frontière conservée :</strong> le suivi ne consulte aucun domaine, DNS, client, commande, fournisseur, prix, livraison, panier ou paiement. La boutique demeure en `setup` et son storefront reste fermé.</div></div>}</div></div>}
        </section>

        <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]" data-testid="studio-activation-preflight">
          <Card className="border-emerald-200 shadow-sm">
            <CardHeader><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Activation publique contrôlée</p><CardTitle className="mt-1 flex items-center gap-2 text-2xl"><ShieldCheck className="h-6 w-6 text-emerald-700" /> Revue finale — univers animalier</CardTitle><CardDescription className="mt-2 max-w-2xl">Cette revue sélectionne une boutique offerte en `setup` et affiche les critères qui devront être validés avant une future ouverture publique. Elle ne change aucun statut.</CardDescription></div><Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Aucune bascule active</Badge></div></CardHeader>
            <CardContent className="space-y-3">{giftSetupStores.length === 0 ? <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-sm leading-6 text-emerald-950"><p className="font-semibold">Aucune boutique offerte en préparation à examiner.</p><p className="mt-1">La revue apparaîtra ici après le provisionnement d’une boutique animalière en état `setup`.</p></div> : giftSetupStores.map(store => <button key={store.id} type="button" onClick={() => setSelectedActivationStoreId(store.id)} className={selectedActivationStoreId === store.id ? "w-full rounded-2xl border border-emerald-400 bg-emerald-50 p-4 text-left ring-2 ring-emerald-100" : "w-full rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-200 hover:bg-emerald-50/40"}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{store.displayName}</p><p className="mt-1 truncate text-xs text-slate-500">{store.primaryDomain}</p></div><Badge className="border-0 bg-amber-100 text-amber-800 hover:bg-amber-100">setup</Badge></div><p className="mt-3 text-xs leading-5 text-slate-600">{store.activeProductCount} produit{store.activeProductCount > 1 ? "s" : ""} actif{store.activeProductCount > 1 ? "s" : ""} · {store.activeOwners} propriétaire{store.activeOwners > 1 ? "s" : ""} actif{store.activeOwners > 1 ? "s" : ""}</p></button>)}</CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Conditions avant ouverture</p><CardTitle className="mt-1 text-xl">Prévol local et vérifications manuelles</CardTitle></CardHeader>
            <CardContent className="space-y-3">{selectedActivationStoreId === null ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Choisissez une boutique offerte à gauche. Les critères locaux et les contrôles à effectuer manuellement seront alors affichés ici.</div> : activationPreflightQuery.isLoading ? <div className="h-52 animate-pulse rounded-2xl bg-slate-100" /> : activationPreflightQuery.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">Cette boutique n’est pas éligible à la revue d’activation. Elle doit être offerte, en état `setup` et reliée à son brouillon Studio.</div> : activationPreflightQuery.data && <div className="space-y-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-900">{activationPreflightQuery.data.store.displayName}</p><Badge className="border-0 bg-slate-200 text-slate-800 hover:bg-slate-200">{activationPreflightQuery.data.intendedBusinessType === "animalier" ? "Univers animalier" : "Univers à corriger"}</Badge></div><p className="mt-2 text-sm text-slate-600">{activationPreflightQuery.data.activation.readyCount} {activationPreflightQuery.data.activation.readyCount > 1 ? "contrôles locaux prêts" : "contrôle local prêt"} · {activationPreflightQuery.data.activation.blockedCount} blocage{activationPreflightQuery.data.activation.blockedCount > 1 ? "s" : ""} · {activationPreflightQuery.data.activation.manualCount} vérification{activationPreflightQuery.data.activation.manualCount > 1 ? "s" : ""} manuelle{activationPreflightQuery.data.activation.manualCount > 1 ? "s" : ""}</p></div>{activationPreflightQuery.data.activation.checks.map(check => <div key={check.key} className={check.state === "ready" ? "flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3" : check.state === "manual" ? "flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3" : "flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3"}>{check.state === "ready" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> : check.state === "manual" ? <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />}<div><p className="text-sm font-semibold text-slate-900">{check.label}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{check.detail}</p></div></div>)}<div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><p className="font-semibold text-slate-900">Statut d’ouverture</p><p className="mt-1">La boutique reste en <strong>`setup`</strong> tant que vous n’avez pas confirmé manuellement son domaine et l’activation finale.</p></div>{activationPreflightQuery.data.activation.checks.some(check => check.key === "domain_format" && check.state === "blocked") && <Button type="button" variant="outline" className="w-full border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100" onClick={() => { setDomainUpdateConfirmationName(""); setDomainUpdateValue(""); setDomainUpdateAcknowledged(false); setDomainUpdateOpen(true); }}><LockKeyhole className="mr-2 h-4 w-4" /> Remplacer le domaine interne</Button>}{activationPreflightQuery.data.activation.checks.some(check => check.key === "legal" && check.state === "blocked") && <Button type="button" variant="outline" className="w-full border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100" onClick={() => { setLegalCopyConfirmationName(""); setLegalCopyAcknowledged(false); setLegalCopyOpen(true); }}><ClipboardCheck className="mr-2 h-4 w-4" /> Réutiliser les coordonnées légales de MAZIGHO</Button>}{activationPreflightQuery.data.intendedBusinessType === "animalier" && <Button type="button" variant="outline" className="w-full border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100" onClick={() => { setPetDemoSetupConfirmationName(""); setPetDemoSetupAcknowledged(false); setPetDemoSetupOpen(true); }}><PawPrint className="mr-2 h-4 w-4" /> Installer le kit de démonstration animalier</Button>}{activationPreflightQuery.data.activation.locallyReadyForManualActivation && <Button type="button" className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={() => { setActivationConfirmationName(""); setActivationOwnerEmail(""); setActivationDomainVerified(false); setActivationAcknowledged(false); setActivationConfirmOpen(true); }}><ShieldCheck className="mr-2 h-4 w-4" /> Ouvrir la confirmation d’activation</Button>}</div>}</CardContent>
          </Card>
        </section>

        <Dialog open={domainUpdateOpen} onOpenChange={open => { if (!updateGiftStorePrimaryDomainMutation.isPending) setDomainUpdateOpen(open); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-sky-700" /> Remplacer le domaine interne</DialogTitle><DialogDescription>Cette action remplace uniquement le domaine enregistré pour cette boutique offerte en `setup`. Elle ne l’active pas et ne déclenche aucun panier, paiement, e-mail, fournisseur ou commande.</DialogDescription></DialogHeader>{activationPreflightQuery.data && <div className="space-y-3"><div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><p><strong>Boutique :</strong> {activationPreflightQuery.data.store.displayName}</p><p className="mt-1"><strong>Domaine actuel :</strong> {activationPreflightQuery.data.store.primaryDomain}</p><p className="mt-1">Avant de confirmer, vérifiez dans Vercel que le domaine est bien rattaché et que son certificat est prêt. La boutique restera fermée tant que l’activation publique n’aura pas été confirmée séparément.</p></div><div className="space-y-2"><Label htmlFor="domain-update-value">Nouveau domaine public</Label><Input id="domain-update-value" value={domainUpdateValue} onChange={event => setDomainUpdateValue(event.target.value)} placeholder="animalerie.exemple.ch" autoCapitalize="none" /></div><div className="space-y-2"><Label htmlFor="domain-update-name">Recopiez le nom de la boutique</Label><Input id="domain-update-name" value={domainUpdateConfirmationName} onChange={event => setDomainUpdateConfirmationName(event.target.value)} placeholder={activationPreflightQuery.data.store.displayName} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={domainUpdateAcknowledged} onChange={event => setDomainUpdateAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600" /><span>Je confirme remplacer le domaine interne par ce domaine public. Je comprends que la boutique reste en `setup`, non publique et sans paiement tant que je n’active pas séparément son ouverture.</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setDomainUpdateOpen(false)} disabled={updateGiftStorePrimaryDomainMutation.isPending}>Annuler</Button><Button type="button" className="bg-sky-800 hover:bg-sky-900" disabled={!activationPreflightQuery.data || domainUpdateConfirmationName.trim() !== activationPreflightQuery.data.store.displayName || !domainUpdateValue.trim() || !domainUpdateAcknowledged || updateGiftStorePrimaryDomainMutation.isPending} onClick={() => activationPreflightQuery.data && updateGiftStorePrimaryDomainMutation.mutate({ storeId: activationPreflightQuery.data.store.id, confirmationName: domainUpdateConfirmationName, primaryDomain: domainUpdateValue, acknowledged: true })}>{updateGiftStorePrimaryDomainMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />} Préparer le domaine</Button></DialogFooter></DialogContent>
        </Dialog>

        <Dialog open={legalCopyOpen} onOpenChange={open => { if (!copyPlatformLegalProfileMutation.isPending) setLegalCopyOpen(open); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-slate-700" /> Réutiliser les coordonnées légales MAZIGHO</DialogTitle><DialogDescription>Cette copie reprend uniquement les coordonnées déjà enregistrées dans MAZIGHO, avec votre autorisation. Pattes & Compagnie reste en `setup` et ces informations ne sont pas encore servies publiquement.</DialogDescription></DialogHeader>{activationPreflightQuery.data && <div className="space-y-3"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><p><strong className="text-slate-900">Boutique cible :</strong> {activationPreflightQuery.data.store.displayName}</p><p className="mt-1">La boutique principale MAZIGHO ne sera pas modifiée. Aucun domaine, e-mail, paiement, fournisseur ou storefront ne sera activé.</p></div><div className="space-y-2"><Label htmlFor="legal-copy-name">Recopiez le nom de la boutique</Label><Input id="legal-copy-name" value={legalCopyConfirmationName} onChange={event => setLegalCopyConfirmationName(event.target.value)} placeholder={activationPreflightQuery.data.store.displayName} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={legalCopyAcknowledged} onChange={event => setLegalCopyAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-600" /><span>Je confirme réutiliser mes coordonnées déjà présentes dans MAZIGHO pour cette boutique animalière offerte. La boutique reste fermée au public.</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setLegalCopyOpen(false)} disabled={copyPlatformLegalProfileMutation.isPending}>Annuler</Button><Button type="button" className="bg-slate-800 hover:bg-slate-900" disabled={!activationPreflightQuery.data || legalCopyConfirmationName.trim() !== activationPreflightQuery.data.store.displayName || !legalCopyAcknowledged || copyPlatformLegalProfileMutation.isPending} onClick={() => activationPreflightQuery.data && copyPlatformLegalProfileMutation.mutate({ storeId: activationPreflightQuery.data.store.id, confirmationName: legalCopyConfirmationName, acknowledged: true })}>{copyPlatformLegalProfileMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />} Copier les coordonnées</Button></DialogFooter></DialogContent>
        </Dialog>

        <Dialog open={retailDemoSetupOpen} onOpenChange={open => { if (!installGiftRetailDemoSetupMutation.isPending) setRetailDemoSetupOpen(open); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2">{selectedRetailDemoStore?.businessType === "bijoux" ? <Sparkles className="h-5 w-5 text-violet-700" /> : <Shirt className="h-5 w-5 text-violet-700" />} Installer le kit de démonstration {selectedRetailDemoStore?.businessType === "bijoux" ? "bijoux" : "vêtements"}</DialogTitle><DialogDescription>Cette action prépare uniquement une identité, trois catégories et une fiche non commerciale. La boutique reste en `setup`, sans domaine public, image produit, fournisseur, prix, stock, livraison, paiement, e-mail ou commande.</DialogDescription></DialogHeader>{selectedRetailDemoStore && <div className="space-y-3"><div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-950"><p><strong>Boutique :</strong> {selectedRetailDemoStore.displayName}</p><p className="mt-1"><strong>Univers :</strong> {selectedRetailDemoStore.businessType === "bijoux" ? "bijoux" : "vêtements"}</p><p className="mt-1"><strong>Contenu créé :</strong> identité propre, catégories de démonstration et une fiche active non vendable.</p></div><div className="space-y-2"><Label htmlFor="retail-demo-setup-name">Recopiez le nom de la boutique</Label><Input id="retail-demo-setup-name" value={retailDemoSetupConfirmationName} onChange={event => setRetailDemoSetupConfirmationName(event.target.value)} placeholder={selectedRetailDemoStore.displayName} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={retailDemoSetupAcknowledged} onChange={event => setRetailDemoSetupAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /><span>Je confirme installer uniquement ce kit de démonstration. Je comprends que la boutique reste fermée au public et qu’aucune vente, commande fournisseur, paiement ou invitation ne sera créé.</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setRetailDemoSetupOpen(false)} disabled={installGiftRetailDemoSetupMutation.isPending}>Annuler</Button><Button type="button" className="bg-violet-700 hover:bg-violet-800" disabled={!selectedRetailDemoStore || retailDemoSetupConfirmationName.trim() !== selectedRetailDemoStore.displayName || !retailDemoSetupAcknowledged || installGiftRetailDemoSetupMutation.isPending} onClick={() => selectedRetailDemoStore && installGiftRetailDemoSetupMutation.mutate({ storeId: selectedRetailDemoStore.id, confirmationName: retailDemoSetupConfirmationName, acknowledged: true })}>{installGiftRetailDemoSetupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : selectedRetailDemoStore?.businessType === "bijoux" ? <Sparkles className="mr-2 h-4 w-4" /> : <Shirt className="mr-2 h-4 w-4" />} Installer le kit</Button></DialogFooter></DialogContent>
        </Dialog>

        <Dialog open={petDemoSetupOpen} onOpenChange={open => { if (!installGiftPetDemoSetupMutation.isPending) setPetDemoSetupOpen(open); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><PawPrint className="h-5 w-5 text-teal-700" /> Installer le kit animalier de démonstration</DialogTitle><DialogDescription>Cette action prépare uniquement l’identité et un catalogue non commercial dans Pattes & Compagnie. La boutique reste en `setup`, sans site public, fournisseur, images produit, livraison, paiement ou e-mail.</DialogDescription></DialogHeader>{activationPreflightQuery.data && <div className="space-y-3"><div className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-950"><p><strong>Boutique :</strong> {activationPreflightQuery.data.store.displayName}</p><p className="mt-1"><strong>Contenu créé :</strong> identité Pattes & Compagnie, catégories Chiens / Chats / Promenade, et une fiche clairement marquée démonstration.</p><p className="mt-1"><strong>Contenu absent :</strong> fournisseur, prix commercial, stock vendable, images, livraison et paiement.</p></div><div className="space-y-2"><Label htmlFor="pet-demo-setup-name">Recopiez le nom de la boutique</Label><Input id="pet-demo-setup-name" value={petDemoSetupConfirmationName} onChange={event => setPetDemoSetupConfirmationName(event.target.value)} placeholder={activationPreflightQuery.data.store.displayName} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={petDemoSetupAcknowledged} onChange={event => setPetDemoSetupAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600" /><span>Je confirme installer uniquement ce kit de démonstration. Je comprends que la boutique reste fermée au public et qu’aucune vente, commande fournisseur, paiement ou invitation ne sera créé.</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setPetDemoSetupOpen(false)} disabled={installGiftPetDemoSetupMutation.isPending}>Annuler</Button><Button type="button" className="bg-teal-700 hover:bg-teal-800" disabled={!activationPreflightQuery.data || petDemoSetupConfirmationName.trim() !== activationPreflightQuery.data.store.displayName || !petDemoSetupAcknowledged || installGiftPetDemoSetupMutation.isPending} onClick={() => activationPreflightQuery.data && installGiftPetDemoSetupMutation.mutate({ storeId: activationPreflightQuery.data.store.id, confirmationName: petDemoSetupConfirmationName, acknowledged: true })}>{installGiftPetDemoSetupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PawPrint className="mr-2 h-4 w-4" />} Installer le kit</Button></DialogFooter></DialogContent>
        </Dialog>

        <Dialog open={activationConfirmOpen} onOpenChange={open => { if (!activateGiftStoreMutation.isPending) setActivationConfirmOpen(open); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" /> Activer publiquement la boutique</DialogTitle><DialogDescription>Cette action basculera une boutique offerte animalière de `setup` à `active`. Elle ne crée aucun paiement, abonnement, e-mail, produit ou commande fournisseur.</DialogDescription></DialogHeader>{activationPreflightQuery.data && <div className="space-y-3"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p><strong>Boutique :</strong> {activationPreflightQuery.data.store.displayName}</p><p><strong>Domaine :</strong> {activationPreflightQuery.data.store.primaryDomain}</p><p className="mt-1 text-xs">Vous confirmez que le domaine est bien raccordé, résout vers la boutique et a été vérifié par vos soins.</p></div><div className="space-y-2"><Label htmlFor="activation-name">Recopiez le nom de la boutique</Label><Input id="activation-name" value={activationConfirmationName} onChange={event => setActivationConfirmationName(event.target.value)} placeholder={activationPreflightQuery.data.store.displayName} /></div><div className="space-y-2"><Label htmlFor="activation-owner-email">Recopiez l’e-mail du propriétaire actif</Label><Input id="activation-owner-email" type="email" value={activationOwnerEmail} onChange={event => setActivationOwnerEmail(event.target.value)} placeholder="E-mail du propriétaire" /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={activationDomainVerified} onChange={event => setActivationDomainVerified(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" /><span>Je confirme avoir vérifié manuellement le domaine, son DNS, son rattachement Vercel et l’accès attendu avant l’ouverture.</span></label><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={activationAcknowledged} onChange={event => setActivationAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" /><span>Je confirme ouvrir publiquement cette boutique animalière. Son statut passera à `active` ; aucun paiement, abonnement ni e-mail ne sera créé par cette action.</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setActivationConfirmOpen(false)} disabled={activateGiftStoreMutation.isPending}>Annuler</Button><Button type="button" className="bg-emerald-700 hover:bg-emerald-800" disabled={!activationPreflightQuery.data || activationConfirmationName.trim() !== activationPreflightQuery.data.store.displayName || !activationOwnerEmail.trim() || !activationDomainVerified || !activationAcknowledged || activateGiftStoreMutation.isPending} onClick={() => activationPreflightQuery.data && activateGiftStoreMutation.mutate({ storeId: activationPreflightQuery.data.store.id, confirmationName: activationConfirmationName, confirmationOwnerEmail: activationOwnerEmail, domainVerified: true, activationAcknowledged: true })}>{activateGiftStoreMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Activer la boutique</Button></DialogFooter></DialogContent>
        </Dialog>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]" data-testid="studio-provisioning">
          <Card className="border-orange-200 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Mise en service guidée</p><CardTitle className="mt-1 flex items-center gap-2 text-2xl"><ClipboardPlus className="h-6 w-6 text-orange-600" /> Préparer une future boutique</CardTitle><CardDescription className="mt-2 max-w-2xl">Ce formulaire crée seulement une fiche de préparation interne. Il ne crée pas de boutique, ne réserve pas de domaine et n’envoie aucun e-mail.</CardDescription></div>
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">Brouillon local uniquement</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid gap-2 sm:grid-cols-4">{["Identité", "Propriétaire", "Univers", "Confirmation"].map((step, index) => <div key={step} className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2 text-xs font-semibold text-orange-900"><span className="grid h-5 w-5 place-items-center rounded-full bg-orange-600 text-[10px] text-white">{index + 1}</span>{step}</div>)}</div>
              <form className="grid gap-4" onSubmit={event => { event.preventDefault(); if (!draftAcknowledged) return; createDraftMutation.mutate(draftForm); }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="studio-draft-name">Nom de la future boutique</Label><Input id="studio-draft-name" required value={draftForm.displayName} onChange={event => setDraftForm(current => ({ ...current, displayName: event.target.value }))} placeholder="Ex. Éclat Atelier" /></div>
                  <div className="space-y-2"><Label htmlFor="studio-draft-domain">Domaine souhaité</Label><Input id="studio-draft-domain" required value={draftForm.requestedDomain} onChange={event => setDraftForm(current => ({ ...current, requestedDomain: event.target.value }))} placeholder="exemple-boutique.ch" autoCapitalize="none" /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="studio-draft-owner">Nom du futur propriétaire</Label><Input id="studio-draft-owner" required value={draftForm.ownerName} onChange={event => setDraftForm(current => ({ ...current, ownerName: event.target.value }))} placeholder="Nom et prénom" /></div>
                  <div className="space-y-2"><Label htmlFor="studio-draft-email">E-mail du futur propriétaire</Label><Input id="studio-draft-email" required type="email" value={draftForm.ownerEmail} onChange={event => setDraftForm(current => ({ ...current, ownerEmail: event.target.value }))} placeholder="client@exemple.ch" autoCapitalize="none" /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Univers métier</Label><Select value={draftForm.businessType} onValueChange={value => setDraftForm(current => ({ ...current, businessType: value as ProvisioningBusinessType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="animalier">Animalier</SelectItem><SelectItem value="bijoux">Bijoux</SelectItem><SelectItem value="vetements">Vêtements</SelectItem><SelectItem value="autre">Autre univers</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Devise de départ</Label><Select value={draftForm.preferredCurrency} onValueChange={value => setDraftForm(current => ({ ...current, preferredCurrency: value as ProvisioningDraftForm["preferredCurrency"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CHF">CHF — Franc suisse</SelectItem><SelectItem value="EUR">EUR — Euro</SelectItem><SelectItem value="USD">USD — Dollar US</SelectItem><SelectItem value="GBP">GBP — Livre sterling</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="studio-draft-notes">Notes de préparation <span className="font-normal text-slate-500">(facultatif)</span></Label><Textarea id="studio-draft-notes" value={draftForm.notes} onChange={event => setDraftForm(current => ({ ...current, notes: event.target.value }))} placeholder="Positionnement, besoins de catalogue, contraintes de domaine…" rows={3} /></div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><input type="checkbox" checked={draftAcknowledged} onChange={event => setDraftAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" /><span><strong className="text-slate-900">Je confirme préparer un brouillon seulement.</strong> Cette étape ne crée pas de boutique, de compte, de domaine, d’invitation, de licence, de paiement, de synchronisation Odoo ou d’action fournisseur.</span></label>
                <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!draftAcknowledged || createDraftMutation.isPending} className="bg-slate-900 hover:bg-slate-800">{createDraftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardPlus className="mr-2 h-4 w-4" />} Enregistrer le brouillon</Button><p className="text-xs text-slate-500">La création réelle restera une action distincte et explicitement confirmée.</p></div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">File de préparation</p><CardTitle className="mt-1 text-xl">Brouillons enregistrés</CardTitle><CardDescription className="mt-1">Une vue opérateur interne, sans activation automatique.</CardDescription></div><Button variant="ghost" size="icon" onClick={() => { draftsQuery.refetch(); reviewsQuery.refetch(); }} disabled={draftsQuery.isFetching || reviewsQuery.isFetching} aria-label="Actualiser les brouillons">{draftsQuery.isFetching || reviewsQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button></div></CardHeader>
            <CardContent className="space-y-3">
              {draftsQuery.isLoading || reviewsQuery.isLoading ? <div className="h-36 animate-pulse rounded-2xl bg-slate-100" /> : draftsQuery.isError || reviewsQuery.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">Impossible de charger la revue des brouillons pour le moment.</div> : (draftsQuery.data ?? []).length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-900">Aucun brouillon à préparer.</p><p className="mt-1">Créez une fiche de préparation à gauche lorsque vous aurez le premier client. Elle ne déclenchera aucune action externe.</p></div> : (draftsQuery.data ?? []).map(draft => {
                const review = reviewByDraftId.get(draft.id);
                const attentionChecks = review?.checks.filter(check => check.state === "attention") ?? [];
                const pendingChecks = review?.checks.filter(check => check.state === "pending") ?? [];
                return <div key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{draft.displayName}</p><p className="mt-1 truncate text-xs text-slate-500">{draft.requestedDomain}</p></div><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{formatProvisioningStatus(draft.status)}</Badge></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600"><span>{formatBusinessType(draft.businessType)}</span><span className="text-right">{draft.preferredCurrency}</span><span className="col-span-2 truncate">Propriétaire prévu : {draft.ownerEmail}</span></div>{review && <div className="mt-4 border-t border-slate-100 pt-3"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-800">{review.completeChecks}/{review.totalChecks} critères locaux complets</span><Badge className={review.readiness === "ready_for_confirmation" ? "border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "border-0 bg-amber-100 text-amber-800 hover:bg-amber-100"}>{review.readiness === "ready_for_confirmation" ? "Revue locale complète" : "À compléter"}</Badge></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={review.readiness === "ready_for_confirmation" ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-amber-500"} style={{ width: `${Math.round((review.completeChecks / review.totalChecks) * 100)}%` }} /></div>{attentionChecks.map(check => <p key={check.key} className="mt-2 flex gap-2 text-xs leading-5 text-amber-800"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{check.detail}</p>)}{pendingChecks.map(check => <p key={check.key} className="mt-2 flex gap-2 text-xs leading-5 text-slate-500"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{check.detail}</p>)}</div>}<Button type="button" variant="outline" size="sm" className="mt-4 w-full border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100" onClick={() => setSelectedPreflightDraftId(draft.id)}><Gift className="mr-2 h-3.5 w-3.5" /> Prévol de boutique offerte</Button></div>;
              })}
              <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">Prévol cadeau / lancement</p><p className="mt-1 text-sm font-semibold text-violet-950">Créer une boutique offerte, sans facturation ni activation automatique.</p></div><Badge className="border-0 bg-violet-100 text-violet-800 hover:bg-violet-100">Lecture seule</Badge></div>
                {selectedPreflightDraftId === null ? <p className="mt-3 text-sm leading-6 text-violet-900">Choisissez un brouillon ci-dessus pour vérifier sa préparation interne. Cette revue ne crée pas de boutique, de propriétaire, de domaine ou d’invitation.</p> : preflightQuery.isLoading ? <div className="mt-4 h-24 animate-pulse rounded-xl bg-violet-100" /> : preflightQuery.isError ? <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">Le prévol n’est pas disponible pour le moment.</div> : preflightQuery.data && <div className="mt-4 space-y-3"><div className="grid gap-2 sm:grid-cols-3"><div className="rounded-xl border border-violet-100 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Mode</p><p className="mt-1 text-sm font-semibold text-slate-900">Boutique offerte</p></div><div className="rounded-xl border border-violet-100 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Statut créé plus tard</p><p className="mt-1 text-sm font-semibold text-slate-900">{preflightQuery.data.preflight.proposedStoreStatus}</p></div><div className="rounded-xl border border-violet-100 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Facturation</p><p className="mt-1 text-sm font-semibold text-slate-900">Aucune</p></div></div><div className="rounded-xl border border-white bg-white/80 p-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Slug proposé :</span> {preflightQuery.data.preflight.proposedSlug}</div><div className="space-y-2">{preflightQuery.data.preflight.checks.map(check => <div key={check.key} className={check.state === "attention" ? "flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900" : check.state === "pending" ? "flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600" : "flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"}>{check.state === "attention" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : check.state === "pending" ? <Clock3 className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}<span><strong>{check.label} :</strong> {check.detail}</span></div>)}</div><div className="rounded-xl border border-dashed border-violet-300 bg-white/70 p-3 text-sm leading-6 text-violet-950"><strong>Création contrôlée.</strong> Si le prévol est cohérent, vous pouvez créer une boutique en état `setup`. Elle ne sera pas publique, ne recevra aucune facturation et aucun e-mail ou lien d’invitation ne sera envoyé.</div>{preflightQuery.data.preflight.isLocallyReadyForExplicitConfirmation && <Button type="button" className="w-full bg-violet-700 hover:bg-violet-800" onClick={() => { setGiftConfirmationName(""); setGiftAcknowledged(false); setGiftConfirmOpen(true); }}><Gift className="mr-2 h-4 w-4" /> Créer la boutique offerte en préparation</Button>}</div>}
              </div>
            </CardContent>
          </Card>
        </section>

        <Dialog open={giftConfirmOpen} onOpenChange={open => { if (!provisionGiftMutation.isPending) setGiftConfirmOpen(open); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-violet-700" /> Confirmer la boutique offerte</DialogTitle><DialogDescription>Cette action crée une vraie boutique locale, mais uniquement en état de préparation. Elle n’est pas publique et aucun paiement ni e-mail ne sera envoyé.</DialogDescription></DialogHeader>
            {preflightQuery.data && <div className="space-y-3"><div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-950"><p><strong>Boutique :</strong> {preflightQuery.data.draft.displayName}</p><p className="mt-1"><strong>Domaine :</strong> {preflightQuery.data.draft.requestedDomain}</p><p className="mt-1"><strong>Propriétaire :</strong> {preflightQuery.data.draft.ownerEmail}</p><p className="mt-1"><strong>Résultat :</strong> boutique `setup`, facturation absente, invitation non envoyée.</p></div><div className="space-y-2"><Label htmlFor="gift-confirmation-name">Recopiez exactement le nom de la boutique</Label><Input id="gift-confirmation-name" value={giftConfirmationName} onChange={event => setGiftConfirmationName(event.target.value)} placeholder={preflightQuery.data.draft.displayName} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={giftAcknowledged} onChange={event => setGiftAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /><span>Je confirme créer cette boutique offerte en préparation. J’ai compris qu’elle n’est pas publique, qu’aucun abonnement ni paiement ne sera déclenché, et qu’aucune invitation ne sera envoyée automatiquement.</span></label></div>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setGiftConfirmOpen(false)} disabled={provisionGiftMutation.isPending}>Annuler</Button><Button type="button" className="bg-violet-700 hover:bg-violet-800" disabled={!preflightQuery.data || !giftAcknowledged || giftConfirmationName.trim() !== preflightQuery.data.draft.displayName.trim() || provisionGiftMutation.isPending} onClick={() => preflightQuery.data && provisionGiftMutation.mutate({ draftId: preflightQuery.data.draft.id, confirmationName: giftConfirmationName })}>{provisionGiftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />} Créer en préparation</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <section className="grid gap-5 xl:grid-cols-[1.06fr_.94fr]">
          <Card className="border-orange-100 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Niveau 1 — vous</p>
                  <CardTitle className="mt-1 flex items-center gap-2 text-2xl"><Layers3 className="h-6 w-6 text-orange-600" /> MAZIGHO Studio</CardTitle>
                </div>
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">Réservé opérateur</Badge>
              </div>
              <CardDescription>Le cockpit de l’activité SaaS : il ne sera pas le panneau quotidien de l’acheteur d’une boutique.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <StudioRailItem icon={Store} title="Parc de boutiques" detail="Voir les boutiques actives, leur état d’accès et leur domaine, sans ouvrir leur contenu." />
              <StudioRailItem icon={ClipboardCheck} title="Mises en service" detail="Suivre les étapes de lancement : identité, catalogue, domaine et contrôles de sécurité." />
              <StudioRailItem icon={ShieldCheck} title="Protection plateforme" detail="Contrôler les états limité, suspendu ou révoqué, avec une trace d’audit." />
              <StudioRailItem icon={UsersRound} title="Accompagnement" detail="Orienter un client vers son panneau, sans travailler à sa place dans son catalogue." />
            </CardContent>
          </Card>

          <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white shadow-sm">
            <CardHeader>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Niveau 2 — acheteur</p>
              <CardTitle className="mt-1 flex items-center gap-2 text-2xl"><PanelTop className="h-6 w-6 text-teal-700" /> Panneau de sa boutique</CardTitle>
              <CardDescription>Un espace plus simple et rassurant : le client travaille sur sa marque, son catalogue et ses commandes, jamais sur l’ensemble de la plateforme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Vue du jour : ventes, commandes et alertes", "Catalogue : produits, catégories, variantes et contenus", "Marque : logo, couleurs, bannières et textes", "Relation client : promotions, messages, avis et retours"].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-teal-100 bg-white/85 px-4 py-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" /><span className="text-sm font-medium text-slate-800">{item}</span></div>
              ))}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><p><strong className="text-slate-800">Volontairement absent :</strong> clés Stripe, Odoo, base de données, facturation SaaS et autres secrets ne seront jamais saisis ni affichés dans ce panneau.</p></div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Modèles d’univers métier</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Une même ossature, trois identités vraiment différentes.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Le logiciel reste le même et sécurisé. Seuls l’univers visuel, les catégories, les conseils de catalogue et la priorité de gestion changent selon le métier du client.</p>
            </div>
            <Badge variant="outline" className="w-fit border-slate-200 bg-slate-50 text-slate-600"><Eye className="mr-1.5 h-3.5 w-3.5" /> Simulation locale non publiée</Badge>
          </div>

          <Tabs value={themeId} onValueChange={value => setThemeId(value as BoutiqueTheme)} className="mt-6">
            <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              {(Object.values(previews) as ThemePreview[]).map(item => {
                const Icon = item.icon;
                return <TabsTrigger key={item.id} value={item.id} className="gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-600 data-[state=active]:border-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:text-white"><Icon className="h-4 w-4" />{item.label}</TabsTrigger>;
              })}
            </TabsList>
          </Tabs>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.07fr_.93fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><CircleDashed className="h-4 w-4" /> Aperçu storefront</div><Badge className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-100">{theme.tone}</Badge></div>
              <div className="p-5" style={{ backgroundColor: theme.canvas }}>
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ backgroundColor: theme.accent }}><ThemeIcon className="h-4 w-4" /></div><span className="font-semibold tracking-wide" style={{ color: theme.ink }}>{theme.owner}</span></div><span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-600">Livraison & retours</span></div>
                <div className="mt-7 grid gap-5 sm:grid-cols-[1.15fr_.85fr] sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>{theme.niche}</p><h3 className="mt-3 text-3xl font-bold leading-tight" style={{ color: theme.ink }}>{theme.headline}</h3><p className="mt-3 max-w-md text-sm leading-6 text-slate-700">{theme.message}</p><span className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: theme.accent }}>Découvrir la collection</span></div><div className="grid min-h-44 place-items-center rounded-2xl border border-white/70 bg-white/65 p-5 text-center"><ThemeIcon className="h-12 w-12" style={{ color: theme.accent }} /><p className="mt-3 text-sm font-semibold" style={{ color: theme.ink }}>{theme.label}</p><p className="mt-1 text-xs text-slate-500">Visuels et logo propres au client</p></div></div>
                <div className="mt-6 grid grid-cols-3 gap-2">{themeCollections.map(collection => <div key={collection} className="rounded-xl border border-white/80 bg-white/75 px-3 py-3 text-center text-xs font-semibold" style={{ color: theme.ink }}>{collection}</div>)}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><PanelTop className="h-4 w-4" /> Aperçu panneau client</div><Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Propriétaire boutique</Badge></div>
              <div className="p-5">
                <div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ backgroundColor: theme.accent }}><ThemeIcon className="h-5 w-5" /></div><div><p className="font-semibold text-slate-900">{theme.owner} — administration</p><p className="mt-1 text-sm text-slate-500">Pilotage quotidien de la boutique</p></div></div>
                <div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Aujourd’hui</p><p className="mt-2 text-sm font-semibold text-slate-800">Commandes</p></div><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Catalogue</p><p className="mt-2 text-sm font-semibold text-slate-800">Produits</p></div><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Marque</p><p className="mt-2 text-sm font-semibold text-slate-800">Identité</p></div></div>
                <div className="mt-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Priorités du métier</p><div className="mt-3 space-y-2">{theme.clientFocus.map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><span className="grid h-6 w-6 place-items-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: theme.accent }}>{index + 1}</span><span className="text-sm font-medium text-slate-700">{item}</span></div>)}</div></div>
                <div className="mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: theme.accentSoft, backgroundColor: theme.canvas, color: theme.ink }}><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>{theme.progress}. Le propriétaire adaptera ensuite son logo, son contenu et ses catégories depuis un espace guidé.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="flex items-center gap-2 font-semibold text-amber-950"><WandSparkles className="h-5 w-5 text-amber-700" /> Ce qui viendra maintenant</p>              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">Vous pouvez maintenant préparer une future boutique dans Studio sans l’activer. La création réelle — domaine, boutique, invitation du propriétaire et accès — restera une opération distincte, visible et à confirmer séparément.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Button asChild className="bg-slate-900 hover:bg-slate-800"><Link href="/admin"><ArrowUpRight className="mr-2 h-4 w-4" /> Revenir au pilotage MAZIGHO</Link></Button><Button asChild variant="outline" className="border-orange-200 bg-white text-orange-800 hover:bg-orange-50"><Link href="/admin/personnalisation"><Palette className="mr-2 h-4 w-4" /> Voir la personnalisation</Link></Button></div>
        </section>
      </div>
    </DashboardLayout>
  );
}
