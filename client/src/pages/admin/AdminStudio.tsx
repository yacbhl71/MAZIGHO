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
  History,
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
  customBusinessTheme: string;
  preferredCurrency: "CHF" | "EUR" | "USD" | "GBP";
  notes: string;
};

const emptyProvisioningDraft: ProvisioningDraftForm = {
  displayName: "",
  requestedDomain: "",
  ownerName: "",
  ownerEmail: "",
  businessType: "autre",
  customBusinessTheme: "",
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
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [deleteDraftTarget, setDeleteDraftTarget] = useState<{ id: number; displayName: string } | null>(null);
  const [deleteDraftConfirmationName, setDeleteDraftConfirmationName] = useState("");
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
  const [activationVariantsReviewed, setActivationVariantsReviewed] = useState(false);
  const [activationShippingReturnsReviewed, setActivationShippingReturnsReviewed] = useState(false);
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
  const [temporaryOwnerAccessOpen, setTemporaryOwnerAccessOpen] = useState(false);
  const [temporaryOwnerAccessAcknowledged, setTemporaryOwnerAccessAcknowledged] = useState(false);
  const [temporaryOwnerAccessEmail, setTemporaryOwnerAccessEmail] = useState("");
  const [issuedTemporaryOwnerPassword, setIssuedTemporaryOwnerPassword] = useState<{ password: string; email: string } | null>(null);
  const [directAccessStoreId, setDirectAccessStoreId] = useState<string>("");
  const [directAccessEmail, setDirectAccessEmail] = useState("");
  const [directAccessAcknowledged, setDirectAccessAcknowledged] = useState(false);
  const [directAccessPassword, setDirectAccessPassword] = useState<string | null>(null);
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
  const activityTimelineQuery = trpc.admin.studio.getGiftStoreActivityTimeline.useQuery({ storeId: selectedSetupReadinessStoreId ?? 0 }, { enabled: selectedSetupReadinessStoreId !== null, refetchOnWindowFocus: false });
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
      setActivationVariantsReviewed(false);
      setActivationShippingReturnsReviewed(false);
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
  const issueOwnerTemporaryPasswordMutation = trpc.admin.studio.issueOwnerTemporaryPassword.useMutation({
    onSuccess: result => {
      setIssuedTemporaryOwnerPassword({ password: result.temporaryPassword, email: temporaryOwnerAccessEmail });
      setTemporaryOwnerAccessOpen(false);
      setTemporaryOwnerAccessAcknowledged(false);
      setTemporaryOwnerAccessEmail("");
      toast.success("Mot de passe temporaire généré. Copiez-le maintenant et transmettez-le au propriétaire.");
      utils.admin.studio.getInventory.invalidate();
      utils.admin.studio.getGiftStoreOwnerHandoff.invalidate();
    },
    onError: error => toast.error(error.message || "Le mot de passe temporaire n’a pas pu être généré."),
  });
  const directOwnerTemporaryPasswordMutation = trpc.admin.studio.issueOwnerTemporaryPassword.useMutation({
    onSuccess: result => {
      setDirectAccessPassword(result.temporaryPassword);
      setDirectAccessEmail("");
      setDirectAccessAcknowledged(false);
      toast.success("Mot de passe temporaire généré. Copiez-le maintenant.");
      utils.admin.studio.getInventory.invalidate();
    },
    onError: error => toast.error(error.message || "Le mot de passe temporaire n’a pas pu être généré pour cette boutique."),
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
  const updateDraftMutation = trpc.admin.studio.updateProvisioningDraft.useMutation({
    onSuccess: () => {
      toast.success("Brouillon mis à jour. Aucune boutique, invitation ni intégration n’a été créée.");
      setDraftForm(emptyProvisioningDraft);
      setDraftAcknowledged(false);
      setEditingDraftId(null);
      setSelectedPreflightDraftId(null);
      utils.admin.studio.getProvisioningDrafts.invalidate();
      utils.admin.studio.getProvisioningReviews.invalidate();
    },
    onError: error => toast.error(error.message || "Le brouillon n’a pas pu être mis à jour."),
  });
  const deleteDraftMutation = trpc.admin.studio.deleteProvisioningDraft.useMutation({
    onSuccess: () => {
      toast.success("Brouillon supprimé. Aucune boutique ni donnée commerciale n’a été modifiée.");
      setDeleteDraftTarget(null);
      setDeleteDraftConfirmationName("");
      setSelectedPreflightDraftId(null);
      utils.admin.studio.getProvisioningDrafts.invalidate();
      utils.admin.studio.getProvisioningReviews.invalidate();
    },
    onError: error => toast.error(error.message || "Le brouillon n’a pas pu être supprimé."),
  });
  const inventory = inventoryQuery.data;
  const reviewByDraftId = useMemo(() => new Map((reviewsQuery.data ?? []).map(draft => [draft.id, draft.review])), [reviewsQuery.data]);
  const theme = previews[themeId];
  const ThemeIcon = theme.icon;
  const themeCollections = useMemo(() => theme.collections, [theme.collections]);
  const giftSetupStores = useMemo(() => (inventory?.stores ?? []).filter(store => store.status === "setup" && store.giftProvisioned), [inventory?.stores]);
  const inventoryStoreById = useMemo(() => new Map((inventory?.stores ?? []).map(store => [store.id, store])), [inventory?.stores]);
  const storeHealth = useMemo(() => (inventory?.stores ?? []).map(store => {
    if (["limited", "suspended", "closed"].includes(store.status)) {
      return { id: store.id, label: "Accès à surveiller", detail: `Statut ${store.status} · revue opérateur requise`, tone: "rose", href: store.isPlatformStore ? "/admin" : `/admin/studio/gestion-boutique/${store.id}` };
    }
    if (store.status === "setup") {
      return { id: store.id, label: "Préparation en cours", detail: `${store.activeOwners} propriétaire actif · ${store.activeProductCount} fiche${store.activeProductCount > 1 ? "s" : ""} active${store.activeProductCount > 1 ? "s" : ""}`, tone: "amber", href: `/admin/studio/lancement/${store.id}` };
    }
    if (store.activeOwners === 0) {
      return { id: store.id, label: "Propriétaire à vérifier", detail: "Aucun propriétaire actif détecté dans le registre", tone: "rose", href: store.isPlatformStore ? "/admin" : `/admin/studio/gestion-boutique/${store.id}` };
    }
    if (!store.isPlatformStore && store.activeProductCount === 0) {
      return { id: store.id, label: "Catalogue à compléter", detail: "Aucune fiche active détectée dans le registre", tone: "amber", href: `/admin/studio/gestion-boutique/${store.id}` };
    }
    return { id: store.id, label: "Base opérationnelle", detail: `${store.activeOwners} propriétaire actif · ${store.activeProductCount} fiche${store.activeProductCount > 1 ? "s" : ""} active${store.activeProductCount > 1 ? "s" : ""}`, tone: "emerald", href: store.isPlatformStore ? "/admin" : `/admin/studio/gestion-boutique/${store.id}` };
  }), [inventory?.stores]);
  const operatorPriorities = useMemo(() => (inventory?.stores ?? []).map(store => {
    if (store.isPlatformStore) {
      return {
        id: store.id,
        label: "Pilotage plateforme",
        title: "Piloter MAZIGHO principal",
        detail: `${store.activeProductCount} fiche${store.activeProductCount > 1 ? "s" : ""} active${store.activeProductCount > 1 ? "s" : ""} · ${store.orderCount} commande${store.orderCount > 1 ? "s" : ""}`,
        href: "/admin",
        action: "Gérer MAZIGHO",
        tone: "slate",
      };
    }
    if (store.status === "setup") {
      return {
        id: store.id,
        label: "À préparer",
        title: `Poursuivre ${store.displayName}`,
        detail: `${store.activeOwners} propriétaire actif · ${store.activeProductCount} fiche${store.activeProductCount > 1 ? "s" : ""} active${store.activeProductCount > 1 ? "s" : ""}`,
        href: `/admin/studio/lancement/${store.id}`,
        action: "Ouvrir la préparation",
        tone: "amber",
      };
    }
    if (["limited", "suspended", "closed"].includes(store.status)) {
      return {
        id: store.id,
        label: "Accès à vérifier",
        title: `Revoir le statut de ${store.displayName}`,
        detail: `État actuel : ${store.status} · ${store.activeOwners} propriétaire actif`,
        href: `/admin/studio/gestion-boutique/${store.id}`,
        action: "Gérer la boutique",
        tone: "rose",
      };
    }
    if (store.activeProductCount <= 1 || store.orderCount === 0) {
      return {
        id: store.id,
        label: "Développement boutique",
        title: `Compléter ${store.displayName}`,
        detail: `${store.activeProductCount} fiche${store.activeProductCount > 1 ? "s" : ""} active${store.activeProductCount > 1 ? "s" : ""} · ${store.orderCount === 0 ? "aucune commande enregistrée" : `${store.orderCount} commande${store.orderCount > 1 ? "s" : ""}`}`,
        href: `/admin/studio/gestion-boutique/${store.id}`,
        action: "Gérer la boutique",
        tone: "teal",
      };
    }
    return {
      id: store.id,
      label: "Suivi régulier",
      title: `Suivre ${store.displayName}`,
      detail: `${store.activeProductCount} fiches actives · ${store.orderCount} commandes`,
      href: `/admin/studio/gestion-boutique/${store.id}`,
      action: "Ouvrir le suivi",
      tone: "sky",
    };
  }), [inventory?.stores]);

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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" aria-labelledby="studio-priorities-title">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Parcours Studio</p>
              <h2 id="studio-priorities-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ce dont vous avez besoin maintenant, sans perdre la suite.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Commencez par gérer le parc de boutiques. Lorsque vous préparez une nouvelle offre, les outils de mise en service restent disponibles. Les capacités SaaS plus avancées sont conservées plus bas, sans être confondues avec les actions du jour.</p>
            </div>
            <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 text-orange-800">Aucun outil supprimé</Badge>
          </div>
          <nav className="mt-5 grid gap-3 lg:grid-cols-3" aria-label="Priorités MAZIGHO Studio">
            <a href="#studio-inventory" className="group rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-300">1. Aujourd’hui</p><p className="mt-1 text-lg font-semibold">Gérer les boutiques</p></div><Store className="h-5 w-5 text-orange-300" /></div>
              <p className="mt-3 text-sm leading-6 text-slate-300">MAZIGHO principal, boutiques actives et préparations en cours : chaque ligne ouvre le bon parcours.</p>
              <p className="mt-4 inline-flex items-center text-sm font-semibold text-orange-200">Ouvrir le registre <ArrowUpRight className="ml-1.5 h-4 w-4" /></p>
            </a>
            <a href="#studio-provisioning" className="group rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">2. Prochaine boutique</p><p className="mt-1 text-lg font-semibold">Préparer et remettre</p></div><ClipboardPlus className="h-5 w-5 text-amber-800" /></div>
              <p className="mt-3 text-sm leading-6 text-amber-900">Brouillon, propriétaire, accès temporaire et contrôles de préparation, sans ouverture ni facture automatique.</p>
              <p className="mt-4 inline-flex items-center text-sm font-semibold text-amber-900">Voir la mise en service <ArrowUpRight className="ml-1.5 h-4 w-4" /></p>
            </a>
            <a href="#studio-future-saas" className="group rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-950 transition-colors hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-800">3. Pour la suite</p><p className="mt-1 text-lg font-semibold">Construire le SaaS</p></div><Layers3 className="h-5 w-5 text-violet-800" /></div>
              <p className="mt-3 text-sm leading-6 text-violet-900">Kits métier, aperçus, prévols et principes de séparation plateforme / boutique, conservés pour vos futures offres.</p>
              <p className="mt-4 inline-flex items-center text-sm font-semibold text-violet-900">Voir la feuille de route <ArrowUpRight className="ml-1.5 h-4 w-4" /></p>
            </a>
          </nav>
        </section>

        <section id="studio-priorities" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" aria-labelledby="studio-priority-board-title">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Priorités opérateur</p>
              <h2 id="studio-priority-board-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Les prochaines actions, boutique par boutique.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cette synthèse utilise uniquement les indicateurs déjà présents dans Studio. Elle n’ouvre aucune donnée interne et ne modifie rien.</p>
            </div>
            <Badge variant="outline" className="w-fit border-teal-200 bg-teal-50 text-teal-800">Lecture et orientation</Badge>
          </div>
          {inventoryQuery.isLoading && !inventory ? <div className="mt-5 grid gap-3 lg:grid-cols-3"><div className="h-36 animate-pulse rounded-2xl bg-slate-100" /><div className="h-36 animate-pulse rounded-2xl bg-slate-100" /><div className="h-36 animate-pulse rounded-2xl bg-slate-100" /></div> : operatorPriorities.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Les priorités apparaîtront ici dès qu’une boutique sera enregistrée.</div> : <div className="mt-5 grid gap-3 lg:grid-cols-3">{operatorPriorities.map(priority => {
            const palette = priority.tone === "amber" ? { card: "border-amber-200 bg-amber-50", label: "text-amber-800", action: "text-amber-900" } : priority.tone === "rose" ? { card: "border-rose-200 bg-rose-50", label: "text-rose-800", action: "text-rose-900" } : priority.tone === "teal" ? { card: "border-teal-200 bg-teal-50", label: "text-teal-800", action: "text-teal-900" } : priority.tone === "sky" ? { card: "border-sky-200 bg-sky-50", label: "text-sky-800", action: "text-sky-900" } : { card: "border-slate-200 bg-slate-50", label: "text-slate-700", action: "text-slate-950" };
            return <Link key={priority.id} href={priority.href} className={`group rounded-2xl border p-4 transition-colors hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${palette.card}`}><div className="flex items-start justify-between gap-3"><div><p className={`text-xs font-bold uppercase tracking-[0.14em] ${palette.label}`}>{priority.label}</p><p className="mt-1 text-base font-semibold text-slate-950">{priority.title}</p></div><ArrowUpRight className={`h-5 w-5 shrink-0 ${palette.action}`} /></div><p className="mt-3 text-sm leading-6 text-slate-700">{priority.detail}</p><p className={`mt-4 text-sm font-semibold ${palette.action}`}>{priority.action}</p></Link>;
          })}</div>}
        </section>

        <section id="studio-health" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" aria-labelledby="studio-health-title">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Santé du parc</p>
              <h2 id="studio-health-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Voir ce qui est prêt, à compléter ou à surveiller.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cette lecture ne mesure ni les ventes futures, ni la qualité commerciale. Elle rend simplement visibles les signaux structurels déjà connus de Studio.</p>
            </div>
            <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-800">Indicateurs agrégés</Badge>
          </div>
          {inventoryQuery.isLoading && !inventory ? <div className="mt-5 h-28 animate-pulse rounded-2xl bg-slate-100" /> : storeHealth.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">La santé du parc apparaîtra ici dès qu’une boutique sera enregistrée.</div> : <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">{storeHealth.map(health => {
            const store = inventoryStoreById.get(health.id);
            const palette = health.tone === "rose" ? { badge: "border-rose-200 bg-rose-50 text-rose-800", dot: "bg-rose-500" } : health.tone === "amber" ? { badge: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500" } : { badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" };
            return <Link key={health.id} href={health.href} className="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${palette.dot}`} /><div className="min-w-0"><p className="truncate font-semibold text-slate-950">{store?.displayName}</p><p className="mt-1 text-sm leading-5 text-slate-600">{health.detail}</p></div></div><div className="flex shrink-0 items-center gap-3"><Badge variant="outline" className={palette.badge}>{health.label}</Badge><ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-slate-900" /></div></Link>;
          })}</div>}
        </section>

        <section id="studio-boutiques" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" data-testid="studio-inventory">
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
                <div className="grid min-w-[900px] grid-cols-[minmax(220px,1.35fr)_150px_90px_105px_105px_150px] items-center gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  <span>Boutique</span><span>État & préparation</span><span>Membres</span><span>Catalogue</span><span>Commandes</span><span>Action Studio</span>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[900px] divide-y divide-slate-100">
                    {(inventory?.stores ?? []).map(store => {
                      const status = storeStatusPresentation[store.status];
                      return <div key={store.slug} className="grid grid-cols-[minmax(220px,1.35fr)_150px_90px_105px_105px_150px] items-center gap-4 px-5 py-4">
                        <div className="min-w-0"><div className="flex items-center gap-2"><Store className="h-4 w-4 shrink-0 text-slate-500" /><p className="truncate font-semibold text-slate-900">{store.displayName}</p>{Boolean(store.isPlatformStore) && <Badge className="border-0 bg-slate-900 text-white hover:bg-slate-900">Plateforme</Badge>}</div><p className="mt-1 truncate text-xs text-slate-500">{store.primaryDomain} · {store.slug}</p></div>
                        <div><Badge variant="outline" className={status.className}>{status.label}</Badge><p className="mt-1.5 text-xs text-slate-500">{store.setupCompleted ? "Profil initial complété" : "Profil initial à compléter"}</p></div>
                        <div><p className="font-semibold text-slate-900">{store.activeMembers}</p><p className="text-xs text-slate-500">{store.activeOwners} propriétaire{store.activeOwners > 1 ? "s" : ""}</p></div>
                        <div><p className="font-semibold text-slate-900">{store.productCount}</p><p className="text-xs text-slate-500">{store.activeProductCount} actif{store.activeProductCount > 1 ? "s" : ""}</p></div>
                        <div><p className="font-semibold text-slate-900">{store.orderCount}</p><p className="text-xs text-slate-500">{formatStudioDate(store.latestOrderAt)}</p></div>
                        <div>{store.isPlatformStore ? <Link href="/admin"><Button size="sm" variant="outline" className="border-slate-300 bg-white">Gérer MAZIGHO</Button></Link> : store.status === "setup" ? <Link href={`/admin/studio/lancement/${store.id}`}><Button size="sm" className="bg-amber-700 hover:bg-amber-800">Poursuivre</Button></Link> : <Link href={`/admin/studio/gestion-boutique/${store.id}`}><Button size="sm" className="bg-slate-900 hover:bg-slate-800">Gérer la boutique</Button></Link>}</div>
                      </div>;
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><p><strong>Le registre est désormais le point d’entrée Studio.</strong> Une boutique en <code>setup</code> mène vers son centre de préparation ; une boutique active mène vers ses outils Studio de gestion. Aucun lien ne renvoie vers les anciens ateliers de préparation après activation.</p></div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm md:p-6" data-testid="studio-direct-owner-access"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Accès direct opérateur</p><h2 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-amber-950"><LockKeyhole className="h-6 w-6" /> Créer un accès temporaire à une boutique offerte</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-amber-950">Utilisez ce bloc pour une boutique offerte déjà créée, y compris si ses anciens ateliers de préparation ne sont plus accessibles. Le mot de passe est généré une seule fois, n’est jamais envoyé par e-mail et le client doit le remplacer après connexion.</p></div><Badge className="w-fit border-0 bg-amber-700 text-white hover:bg-amber-700">Studio uniquement</Badge></div>{(inventory?.stores ?? []).filter(store => !store.isPlatformStore).length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-amber-300 bg-white/70 p-4 text-sm leading-6 text-amber-950">Aucune boutique offerte n’est disponible pour le moment.</div> : <div className="mt-5 space-y-4 rounded-2xl border border-amber-200 bg-white p-4 md:p-5"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="direct-owner-store">Boutique offerte</Label><Select value={directAccessStoreId} onValueChange={value => { setDirectAccessStoreId(value); setDirectAccessPassword(null); }}><SelectTrigger id="direct-owner-store"><SelectValue placeholder="Choisir une boutique" /></SelectTrigger><SelectContent>{(inventory?.stores ?? []).filter(store => !store.isPlatformStore).map(store => <SelectItem key={store.id} value={String(store.id)}>{store.displayName} · {store.status}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="direct-owner-email">E-mail du propriétaire à confirmer</Label><Input id="direct-owner-email" type="email" value={directAccessEmail} onChange={event => setDirectAccessEmail(event.target.value)} placeholder="proprietaire@exemple.ch" autoCapitalize="none" /></div></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm leading-6 text-amber-950"><input type="checkbox" checked={directAccessAcknowledged} onChange={event => setDirectAccessAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-600" /><span>Je confirme créer un mot de passe temporaire pour le propriétaire de cette boutique. Je le transmettrai manuellement et lui demanderai de le remplacer dès sa première connexion.</span></label>{directAccessPassword ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-950">Mot de passe temporaire — copiez-le maintenant</p><div className="mt-3 flex gap-2"><Input value={directAccessPassword} readOnly className="bg-white font-mono text-sm" aria-label="Mot de passe temporaire direct" /><Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(directAccessPassword); toast.success("Mot de passe copié dans le presse-papiers."); }} aria-label="Copier le mot de passe temporaire"><Copy className="h-4 w-4" /></Button></div></div> : <Button type="button" className="min-h-11 bg-amber-700 hover:bg-amber-800" disabled={!directAccessStoreId || !directAccessEmail.includes("@") || !directAccessAcknowledged || directOwnerTemporaryPasswordMutation.isPending} onClick={() => directOwnerTemporaryPasswordMutation.mutate({ storeId: Number(directAccessStoreId), confirmationEmail: directAccessEmail, acknowledged: true })}>{directOwnerTemporaryPasswordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}Générer le mot de passe temporaire</Button>}</div>}</section>

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
              {selectedOwnerHandoffStoreId === null ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Choisissez une boutique offerte à gauche pour vérifier son propriétaire et préparer, si nécessaire, un lien manuel.</div> : ownerHandoffQuery.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-100" /> : ownerHandoffQuery.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">La revue propriétaire n’est pas disponible pour cette boutique.</div> : ownerHandoffQuery.data && <div className="space-y-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><p><strong className="text-slate-900">Bénéficiaire prévu :</strong> {ownerHandoffQuery.data.intendedOwner.name}</p><p><strong className="text-slate-900">E-mail :</strong> {ownerHandoffQuery.data.intendedOwner.email}</p><p className="mt-2"><strong className="text-slate-900">État :</strong> {ownerHandoffQuery.data.ownerState === "attached" ? "propriétaire déjà rattaché" : ownerHandoffQuery.data.ownerState === "invitation_pending" ? "invitation locale déjà en attente" : ownerHandoffQuery.data.ownerState === "existing_account_needs_assignment" ? "compte existant à attribuer" : "compte à préparer"}</p></div>{ownerHandoffQuery.data.requiredBeforePublicActivation.map(item => <p key={item} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" />{item}</p>)}{preparedOwnerInvitation && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-950">Lien préparé — aucun e-mail envoyé</p><p className="mt-1 text-xs leading-5 text-emerald-900">Transmettez-le vous-même au bénéficiaire uniquement après vérification de son identité. Il expire le {formatStudioDate(preparedOwnerInvitation.expiresAt)}.</p><div className="mt-3 flex gap-2"><Input value={preparedOwnerInvitation.link} readOnly className="bg-white text-xs" aria-label="Lien d’invitation préparé" /><Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(preparedOwnerInvitation.link); toast.success("Lien copié dans le presse-papiers."); }} aria-label="Copier le lien d’invitation"><Copy className="h-4 w-4" /></Button></div></div>}{ownerHandoffQuery.data.canPrepareInvitation && !ownerHandoffQuery.data.pendingInvitation.prepared && <Button type="button" className="w-full bg-violet-700 hover:bg-violet-800" onClick={() => { setOwnerHandoffAction("prepare"); setOwnerHandoffEmail(""); setOwnerHandoffAcknowledged(false); setOwnerHandoffConfirmOpen(true); }}><UserPlus className="mr-2 h-4 w-4" /> Préparer l’invitation propriétaire</Button>}{ownerHandoffQuery.data.pendingInvitation.prepared && <Button type="button" variant="outline" className="w-full border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100" onClick={() => { setOwnerHandoffAction("reissue"); setOwnerHandoffEmail(""); setOwnerHandoffAcknowledged(false); setOwnerHandoffConfirmOpen(true); }}><RefreshCw className="mr-2 h-4 w-4" /> Régénérer le lien manuel</Button>}{["attached", "invitation_pending"].includes(ownerHandoffQuery.data.ownerState) && <Button type="button" variant="outline" className="w-full border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100" onClick={() => { setTemporaryOwnerAccessEmail(""); setTemporaryOwnerAccessAcknowledged(false); setIssuedTemporaryOwnerPassword(null); setTemporaryOwnerAccessOpen(true); }}><LockKeyhole className="mr-2 h-4 w-4" /> Créer un mot de passe temporaire</Button>}{issuedTemporaryOwnerPassword && <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">Mot de passe temporaire — copiez-le maintenant</p><p className="mt-1 text-xs leading-5 text-amber-900">Transmettez-le uniquement au propriétaire concerné. Il devra le remplacer dans ses réglages après sa première connexion.</p><div className="mt-3 flex gap-2"><Input value={issuedTemporaryOwnerPassword.password} readOnly className="bg-white font-mono text-xs" aria-label="Mot de passe temporaire généré" /><Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(issuedTemporaryOwnerPassword.password); toast.success("Mot de passe copié dans le presse-papiers."); }} aria-label="Copier le mot de passe temporaire"><Copy className="h-4 w-4" /></Button></div></div>}</div>}
            </CardContent>
          </Card>
        </section>

        <Dialog open={ownerHandoffConfirmOpen} onOpenChange={open => { if (!prepareOwnerInvitationMutation.isPending && !reissueOwnerInvitationMutation.isPending) setOwnerHandoffConfirmOpen(open); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-violet-700" /> {ownerHandoffAction === "reissue" ? "Régénérer le lien propriétaire" : "Préparer l’accès propriétaire"}</DialogTitle><DialogDescription>{ownerHandoffAction === "reissue" ? "Cette action invalide le lien manuel précédent et en crée un nouveau. Aucun e-mail n’est envoyé et la boutique reste fermée au public." : "Cette action crée au besoin un compte local en attente et un lien d’invitation manuel. Elle n’envoie aucun e-mail et ne rend pas la boutique publique."}</DialogDescription></DialogHeader>{ownerHandoffQuery.data && <div className="space-y-3"><div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-950"><p><strong>Boutique :</strong> {ownerHandoffQuery.data.store.displayName}</p><p className="mt-1"><strong>Bénéficiaire :</strong> {ownerHandoffQuery.data.intendedOwner.email}</p><p className="mt-1"><strong>Envoi e-mail :</strong> absent — le lien restera à transmettre manuellement.</p></div><div className="space-y-2"><Label htmlFor="owner-handoff-email">Recopiez l’e-mail du bénéficiaire</Label><Input id="owner-handoff-email" type="email" value={ownerHandoffEmail} onChange={event => setOwnerHandoffEmail(event.target.value)} placeholder={ownerHandoffQuery.data.intendedOwner.email} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={ownerHandoffAcknowledged} onChange={event => setOwnerHandoffAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /><span>{ownerHandoffAction === "reissue" ? "Je confirme invalider le lien précédent et préparer un nouveau lien manuel. Aucun e-mail ne sera envoyé, aucun paiement ne sera créé et la boutique restera fermée au public." : "Je confirme préparer l’accès de ce bénéficiaire. J’ai compris qu’aucun e-mail ne sera envoyé, qu’aucun paiement ne sera créé et que la boutique restera fermée au public."}</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setOwnerHandoffConfirmOpen(false)} disabled={prepareOwnerInvitationMutation.isPending || reissueOwnerInvitationMutation.isPending}>Annuler</Button><Button type="button" className="bg-violet-700 hover:bg-violet-800" disabled={!ownerHandoffQuery.data || !ownerHandoffAcknowledged || ownerHandoffEmail.trim().toLowerCase() !== ownerHandoffQuery.data.intendedOwner.email || prepareOwnerInvitationMutation.isPending || reissueOwnerInvitationMutation.isPending} onClick={() => ownerHandoffQuery.data && (ownerHandoffAction === "reissue" ? reissueOwnerInvitationMutation.mutate({ storeId: ownerHandoffQuery.data.store.id, confirmationEmail: ownerHandoffEmail }) : prepareOwnerInvitationMutation.mutate({ storeId: ownerHandoffQuery.data.store.id, confirmationEmail: ownerHandoffEmail }))}>{prepareOwnerInvitationMutation.isPending || reissueOwnerInvitationMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}{ownerHandoffAction === "reissue" ? "Régénérer le lien" : "Préparer le lien"}</Button></DialogFooter></DialogContent>
        </Dialog>
        <Dialog open={temporaryOwnerAccessOpen} onOpenChange={open => { if (!issueOwnerTemporaryPasswordMutation.isPending) setTemporaryOwnerAccessOpen(open); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-amber-700" /> Créer un mot de passe temporaire</DialogTitle><DialogDescription>Ce secret sera affiché une seule fois. Transmettez-le manuellement au propriétaire ; il devra le remplacer dès sa première connexion. Aucun e-mail n’est envoyé et la boutique ne sera ni ouverte ni modifiée.</DialogDescription></DialogHeader>{ownerHandoffQuery.data && <div className="space-y-3"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p><strong>Boutique :</strong> {ownerHandoffQuery.data.store.displayName}</p><p className="mt-1"><strong>Propriétaire :</strong> {ownerHandoffQuery.data.intendedOwner.email}</p></div><div className="space-y-2"><Label htmlFor="temporary-owner-access-email">Recopiez l’e-mail du propriétaire</Label><Input id="temporary-owner-access-email" type="email" value={temporaryOwnerAccessEmail} onChange={event => setTemporaryOwnerAccessEmail(event.target.value)} placeholder={ownerHandoffQuery.data.intendedOwner.email} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={temporaryOwnerAccessAcknowledged} onChange={event => setTemporaryOwnerAccessAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600" /><span>Je confirme générer un accès temporaire pour ce propriétaire. Je comprends que ce mot de passe devra être transmis manuellement et remplacé après la première connexion.</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setTemporaryOwnerAccessOpen(false)} disabled={issueOwnerTemporaryPasswordMutation.isPending}>Annuler</Button><Button type="button" className="bg-amber-700 hover:bg-amber-800" disabled={!ownerHandoffQuery.data || !temporaryOwnerAccessAcknowledged || temporaryOwnerAccessEmail.trim().toLowerCase() !== ownerHandoffQuery.data.intendedOwner.email || issueOwnerTemporaryPasswordMutation.isPending} onClick={() => ownerHandoffQuery.data && issueOwnerTemporaryPasswordMutation.mutate({ storeId: ownerHandoffQuery.data.store.id, confirmationEmail: temporaryOwnerAccessEmail, acknowledged: true })}>{issueOwnerTemporaryPasswordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}Générer le mot de passe</Button></DialogFooter></DialogContent>
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

        <section className="rounded-2xl border border-violet-200 bg-violet-50/45 p-5 shadow-sm md:p-6" data-testid="studio-activity-timeline">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Traçabilité opérateur</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Historique privé de préparation</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Consultez les jalons Studio connus pour la boutique sélectionnée. Les libellés sont volontairement génériques : aucun acteur, e-mail, contenu légal, métadonnée, commande, paiement ou action fournisseur n’est affiché.</p></div><Badge className="w-fit border-0 bg-violet-800 text-white hover:bg-violet-800">Lecture seule</Badge></div>
          <div className="mt-5 rounded-2xl border border-violet-200 bg-white p-4 md:p-5">{selectedSetupReadinessStoreId === null ? <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm leading-6 text-slate-600">Sélectionnez d’abord une boutique dans le suivi privé de préparation pour consulter ses jalons Studio.</div> : activityTimelineQuery.isLoading ? <div className="min-h-36 animate-pulse rounded-xl bg-slate-100" /> : activityTimelineQuery.isError ? <div className="flex min-h-36 items-center rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900">L’historique privé est indisponible pour cette boutique. Aucun changement n’a été effectué.</div> : activityTimelineQuery.data && <div><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-slate-950">{activityTimelineQuery.data.store.displayName}</p><p className="mt-1 text-xs text-slate-500">Historique réservé à MAZIGHO Studio · statut actuel `{activityTimelineQuery.data.store.status}`</p></div><History className="h-5 w-5 text-violet-700" /></div>{activityTimelineQuery.data.events.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950">Aucun jalon Studio non sensible n’est encore enregistré pour cette boutique.</div> : <ol className="mt-5 space-y-3 border-l-2 border-violet-100 pl-5">{activityTimelineQuery.data.events.map(event => <li key={`${event.action}-${String(event.occurredAt)}`} className="relative"><span className="absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 border-white bg-violet-600" /><div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-5"><p className="text-sm font-semibold text-slate-950">{event.title}</p><time className="shrink-0 text-xs text-slate-500">{new Date(event.occurredAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}</time></div><p className="mt-1 text-xs leading-5 text-slate-600">{event.detail}</p></div></li>)}</ol>}</div>}</div>
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
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" /> Activer publiquement la boutique</DialogTitle><DialogDescription>Cette action basculera une boutique offerte animalière de `setup` à `active`. Elle ne crée aucun paiement, abonnement, e-mail, produit ou commande fournisseur.</DialogDescription></DialogHeader>{activationPreflightQuery.data && <div className="space-y-3"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p><strong>Boutique :</strong> {activationPreflightQuery.data.store.displayName}</p><p><strong>Domaine :</strong> {activationPreflightQuery.data.store.primaryDomain}</p><p className="mt-1 text-xs">Vous confirmez que le domaine est bien raccordé, résout vers la boutique et a été vérifié par vos soins.</p></div><div className="space-y-2"><Label htmlFor="activation-name">Recopiez le nom de la boutique</Label><Input id="activation-name" value={activationConfirmationName} onChange={event => setActivationConfirmationName(event.target.value)} placeholder={activationPreflightQuery.data.store.displayName} /></div><div className="space-y-2"><Label htmlFor="activation-owner-email">Recopiez l’e-mail du propriétaire actif</Label><Input id="activation-owner-email" type="email" value={activationOwnerEmail} onChange={event => setActivationOwnerEmail(event.target.value)} placeholder="E-mail du propriétaire" /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={activationDomainVerified} onChange={event => setActivationDomainVerified(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" /><span>Je confirme avoir vérifié manuellement le domaine, son DNS, son rattachement Vercel et l’accès attendu avant l’ouverture.</span></label><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={activationVariantsReviewed} onChange={event => setActivationVariantsReviewed(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" /><span>Je confirme avoir revu les variantes affichées au client, ou validé qu’aucune variante n’est nécessaire pour chaque fiche active.</span></label><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={activationShippingReturnsReviewed} onChange={event => setActivationShippingReturnsReviewed(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" /><span>Je confirme avoir revu les informations de livraison, délais et retours qui seront affichées au client.</span></label><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={activationAcknowledged} onChange={event => setActivationAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" /><span>Je confirme ouvrir publiquement cette boutique animalière. Son statut passera à `active` ; aucun paiement, abonnement ni e-mail ne sera créé par cette action.</span></label></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setActivationConfirmOpen(false)} disabled={activateGiftStoreMutation.isPending}>Annuler</Button><Button type="button" className="bg-emerald-700 hover:bg-emerald-800" disabled={!activationPreflightQuery.data || activationConfirmationName.trim() !== activationPreflightQuery.data.store.displayName || !activationOwnerEmail.trim() || !activationDomainVerified || !activationVariantsReviewed || !activationShippingReturnsReviewed || !activationAcknowledged || activateGiftStoreMutation.isPending} onClick={() => activationPreflightQuery.data && activateGiftStoreMutation.mutate({ storeId: activationPreflightQuery.data.store.id, confirmationName: activationConfirmationName, confirmationOwnerEmail: activationOwnerEmail, domainVerified: true, variantsReviewed: true, shippingReturnsReviewed: true, activationAcknowledged: true })}>{activateGiftStoreMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Activer la boutique</Button></DialogFooter></DialogContent>
        </Dialog>

        <section id="studio-provisioning" className="grid gap-5 xl:grid-cols-[1.15fr_.85fr] scroll-mt-6" data-testid="studio-provisioning">
          <Card className="border-orange-200 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Mise en service guidée</p><CardTitle className="mt-1 flex items-center gap-2 text-2xl"><ClipboardPlus className="h-6 w-6 text-orange-600" /> {editingDraftId === null ? "Préparer une future boutique" : "Modifier un brouillon de boutique"}</CardTitle><CardDescription className="mt-2 max-w-2xl">{editingDraftId === null ? "Ce formulaire crée seulement une fiche de préparation interne. Il ne crée pas de boutique, ne réserve pas de domaine et n’envoie aucun e-mail." : "Vous modifiez seulement cette fiche de préparation. La boutique, le domaine, le propriétaire et les intégrations restent inchangés tant que vous ne les créez pas explicitement plus tard."}</CardDescription></div>
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">Brouillon local uniquement</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid gap-2 sm:grid-cols-4">{["Identité", "Propriétaire", "Univers", "Confirmation"].map((step, index) => <div key={step} className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2 text-xs font-semibold text-orange-900"><span className="grid h-5 w-5 place-items-center rounded-full bg-orange-600 text-[10px] text-white">{index + 1}</span>{step}</div>)}</div>
              <form id="studio-provisioning-form" className="grid gap-4 scroll-mt-6" onSubmit={event => { event.preventDefault(); if (!draftAcknowledged || (draftForm.businessType === "autre" && !draftForm.customBusinessTheme.trim())) return; if (editingDraftId === null) createDraftMutation.mutate(draftForm); else updateDraftMutation.mutate({ ...draftForm, id: editingDraftId }); }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="studio-draft-name">Nom de la future boutique</Label><Input id="studio-draft-name" required value={draftForm.displayName} onChange={event => setDraftForm(current => ({ ...current, displayName: event.target.value }))} placeholder="Ex. Éclat Atelier" /></div>
                  <div className="space-y-2"><Label htmlFor="studio-draft-domain">Domaine souhaité</Label><Input id="studio-draft-domain" required value={draftForm.requestedDomain} onChange={event => setDraftForm(current => ({ ...current, requestedDomain: event.target.value }))} placeholder="exemple-boutique.ch" autoCapitalize="none" /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="studio-draft-owner">Nom du futur propriétaire</Label><Input id="studio-draft-owner" required value={draftForm.ownerName} onChange={event => setDraftForm(current => ({ ...current, ownerName: event.target.value }))} placeholder="Nom et prénom" /></div>
                  <div className="space-y-2"><Label htmlFor="studio-draft-email">E-mail du futur propriétaire</Label><Input id="studio-draft-email" required type="email" value={draftForm.ownerEmail} onChange={event => setDraftForm(current => ({ ...current, ownerEmail: event.target.value }))} placeholder="client@exemple.ch" autoCapitalize="none" /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Univers métier</Label><Select value={draftForm.businessType} onValueChange={value => setDraftForm(current => ({ ...current, businessType: value as ProvisioningBusinessType, customBusinessTheme: value === "autre" ? current.customBusinessTheme : "" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="animalier">Animalier</SelectItem><SelectItem value="bijoux">Bijoux</SelectItem><SelectItem value="vetements">Vêtements</SelectItem><SelectItem value="autre">Autre univers</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Devise de départ</Label><Select value={draftForm.preferredCurrency} onValueChange={value => setDraftForm(current => ({ ...current, preferredCurrency: value as ProvisioningDraftForm["preferredCurrency"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CHF">CHF — Franc suisse</SelectItem><SelectItem value="EUR">EUR — Euro</SelectItem><SelectItem value="USD">USD — Dollar US</SelectItem><SelectItem value="GBP">GBP — Livre sterling</SelectItem></SelectContent></Select></div>
                </div>
                {draftForm.businessType === "autre" && <div className="space-y-2"><Label htmlFor="studio-draft-custom-theme">Thématique ou niche de la boutique</Label><Input id="studio-draft-custom-theme" required value={draftForm.customBusinessTheme} onChange={event => setDraftForm(current => ({ ...current, customBusinessTheme: event.target.value }))} placeholder="Ex. décoration artisanale, beauté naturelle, accessoires de voyage…" /><p className="text-xs leading-5 text-slate-500">Cette précision est obligatoire pour un autre univers. Elle vous aide à reprendre et préparer le bon catalogue plus tard.</p></div>}
                <div className="space-y-2"><Label htmlFor="studio-draft-notes">Notes de préparation <span className="font-normal text-slate-500">(facultatif)</span></Label><Textarea id="studio-draft-notes" value={draftForm.notes} onChange={event => setDraftForm(current => ({ ...current, notes: event.target.value }))} placeholder="Positionnement, besoins de catalogue, contraintes de domaine…" rows={3} /></div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><input type="checkbox" checked={draftAcknowledged} onChange={event => setDraftAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" /><span><strong className="text-slate-900">Je confirme préparer un brouillon seulement.</strong> Cette étape ne crée pas de boutique, de compte, de domaine, d’invitation, de licence, de paiement, de synchronisation Odoo ou d’action fournisseur.</span></label>
                <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!draftAcknowledged || (draftForm.businessType === "autre" && !draftForm.customBusinessTheme.trim()) || createDraftMutation.isPending || updateDraftMutation.isPending} className="bg-slate-900 hover:bg-slate-800">{createDraftMutation.isPending || updateDraftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardPlus className="mr-2 h-4 w-4" />}{editingDraftId === null ? "Enregistrer le brouillon" : "Enregistrer les modifications"}</Button>{editingDraftId !== null && <Button type="button" variant="outline" onClick={() => { setEditingDraftId(null); setDraftForm(emptyProvisioningDraft); setDraftAcknowledged(false); }}>Annuler la modification</Button>}<p className="text-xs text-slate-500">La création réelle restera une action distincte et explicitement confirmée.</p></div>
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
                const linkedStore = draft.provisionedStoreId ? inventoryStoreById.get(draft.provisionedStoreId) : undefined;
                const linkedStoreIsActive = Boolean(linkedStore && linkedStore.status !== "setup");
                return <div key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{draft.displayName}</p><p className="mt-1 truncate text-xs text-slate-500">{linkedStoreIsActive ? `Historique lié à ${linkedStore?.displayName} · ${linkedStore?.primaryDomain}` : draft.requestedDomain}</p></div><Badge variant="outline" className={linkedStoreIsActive ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}>{linkedStoreIsActive ? "Boutique active" : formatProvisioningStatus(draft.status)}</Badge></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600"><span>{draft.businessType === "autre" && draft.customBusinessTheme ? draft.customBusinessTheme : formatBusinessType(draft.businessType)}</span><span className="text-right">{draft.preferredCurrency}</span><span className="col-span-2 truncate">Propriétaire prévu : {draft.ownerEmail}</span></div>{review && <div className="mt-4 border-t border-slate-100 pt-3"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-800">{review.completeChecks}/{review.totalChecks} critères locaux complets</span><Badge className={review.readiness === "ready_for_confirmation" ? "border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "border-0 bg-amber-100 text-amber-800 hover:bg-amber-100"}>{review.readiness === "ready_for_confirmation" ? "Revue locale complète" : "À compléter"}</Badge></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={review.readiness === "ready_for_confirmation" ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-amber-500"} style={{ width: `${Math.round((review.completeChecks / review.totalChecks) * 100)}%` }} /></div>{attentionChecks.map(check => <p key={check.key} className="mt-2 flex gap-2 text-xs leading-5 text-amber-800"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{check.detail}</p>)}{pendingChecks.map(check => <p key={check.key} className="mt-2 flex gap-2 text-xs leading-5 text-slate-500"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{check.detail}</p>)}</div>}{!draft.provisionedStoreId && draft.status !== "archived" && <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" size="sm" className="min-h-11 border-slate-200 bg-white text-slate-800 hover:bg-slate-50" onClick={() => { setEditingDraftId(draft.id); setDraftForm({ displayName: draft.displayName, requestedDomain: draft.requestedDomain, ownerName: draft.ownerName, ownerEmail: draft.ownerEmail, businessType: draft.businessType, customBusinessTheme: draft.customBusinessTheme || "", preferredCurrency: draft.preferredCurrency as ProvisioningDraftForm["preferredCurrency"], notes: draft.notes || "" }); setDraftAcknowledged(false); setSelectedPreflightDraftId(null); window.requestAnimationFrame(() => document.getElementById("studio-provisioning-form")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}><span className="mr-2">Reprendre</span> et modifier</Button><Button type="button" variant="outline" size="sm" className="min-h-11 border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100" onClick={() => { setDeleteDraftTarget({ id: draft.id, displayName: draft.displayName }); setDeleteDraftConfirmationName(""); }}><span className="mr-2">Supprimer</span> le brouillon</Button></div>}{draft.provisionedStoreId ? linkedStoreIsActive ? <Link href={`/admin/studio/gestion-boutique/${draft.provisionedStoreId}`} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"><Store className="mr-2 h-4 w-4" /> Gérer la boutique active</Link> : <Link href={`/admin/studio/lancement/${draft.provisionedStoreId}`} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-md border border-teal-200 bg-teal-50 px-3 text-sm font-semibold text-teal-900 hover:bg-teal-100"><Sparkles className="mr-2 h-4 w-4" /> Continuer la préparation</Link> : <Button type="button" variant="outline" size="sm" className="mt-2 min-h-11 w-full border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100" onClick={() => setSelectedPreflightDraftId(draft.id)}><Gift className="mr-2 h-4 w-4" /> Vérifier avant création</Button>}</div>;
              })}
              <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">Prévol cadeau / lancement</p><p className="mt-1 text-sm font-semibold text-violet-950">Créer une boutique offerte, sans facturation ni activation automatique.</p></div><Badge className="border-0 bg-violet-100 text-violet-800 hover:bg-violet-100">Lecture seule</Badge></div>
                {selectedPreflightDraftId === null ? <p className="mt-3 text-sm leading-6 text-violet-900">Choisissez un brouillon ci-dessus pour vérifier sa préparation interne. Cette revue ne crée pas de boutique, de propriétaire, de domaine ou d’invitation.</p> : preflightQuery.isLoading ? <div className="mt-4 h-24 animate-pulse rounded-xl bg-violet-100" /> : preflightQuery.isError ? <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">Le prévol n’est pas disponible pour le moment.</div> : preflightQuery.data && <div className="mt-4 space-y-3"><div className="grid gap-2 sm:grid-cols-3"><div className="rounded-xl border border-violet-100 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Mode</p><p className="mt-1 text-sm font-semibold text-slate-900">Boutique offerte</p></div><div className="rounded-xl border border-violet-100 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Statut créé plus tard</p><p className="mt-1 text-sm font-semibold text-slate-900">{preflightQuery.data.preflight.proposedStoreStatus}</p></div><div className="rounded-xl border border-violet-100 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Facturation</p><p className="mt-1 text-sm font-semibold text-slate-900">Aucune</p></div></div><div className="rounded-xl border border-white bg-white/80 p-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Slug proposé :</span> {preflightQuery.data.preflight.proposedSlug}</div><div className="space-y-2">{preflightQuery.data.preflight.checks.map(check => <div key={check.key} className={check.state === "attention" ? "flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900" : check.state === "pending" ? "flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600" : "flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"}>{check.state === "attention" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : check.state === "pending" ? <Clock3 className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}<span><strong>{check.label} :</strong> {check.detail}</span></div>)}</div><div className="rounded-xl border border-dashed border-violet-300 bg-white/70 p-3 text-sm leading-6 text-violet-950"><strong>Création contrôlée.</strong> Si le prévol est cohérent, vous pouvez créer une boutique en état `setup`. Elle ne sera pas publique, ne recevra aucune facturation et aucun e-mail ou lien d’invitation ne sera envoyé.</div>{preflightQuery.data.preflight.isLocallyReadyForExplicitConfirmation && <Button type="button" className="w-full bg-violet-700 hover:bg-violet-800" onClick={() => { setGiftConfirmationName(""); setGiftAcknowledged(false); setGiftConfirmOpen(true); }}><Gift className="mr-2 h-4 w-4" /> Créer la boutique offerte en préparation</Button>}</div>}
              </div>
            </CardContent>
          </Card>
        </section>

        <Dialog open={Boolean(deleteDraftTarget)} onOpenChange={open => { if (!open && !deleteDraftMutation.isPending) { setDeleteDraftTarget(null); setDeleteDraftConfirmationName(""); } }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Supprimer ce brouillon</DialogTitle><DialogDescription>Cette action retire uniquement la fiche de préparation. Elle ne supprime aucune boutique, domaine, compte, invitation, commande ou donnée fournisseur.</DialogDescription></DialogHeader>{deleteDraftTarget && <div className="space-y-3"><div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-950"><p><strong>Brouillon :</strong> {deleteDraftTarget.displayName}</p><p className="mt-1">La suppression est possible uniquement avant le provisionnement d’une vraie boutique.</p></div><div className="space-y-2"><Label htmlFor="delete-draft-confirmation-name">Recopiez le nom de la boutique</Label><Input id="delete-draft-confirmation-name" value={deleteDraftConfirmationName} onChange={event => setDeleteDraftConfirmationName(event.target.value)} placeholder={deleteDraftTarget.displayName} /></div></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => { setDeleteDraftTarget(null); setDeleteDraftConfirmationName(""); }} disabled={deleteDraftMutation.isPending}>Annuler</Button><Button type="button" className="bg-rose-700 hover:bg-rose-800" disabled={!deleteDraftTarget || deleteDraftConfirmationName.trim() !== deleteDraftTarget.displayName.trim() || deleteDraftMutation.isPending} onClick={() => deleteDraftTarget && deleteDraftMutation.mutate({ id: deleteDraftTarget.id, confirmationName: deleteDraftConfirmationName })}>{deleteDraftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Supprimer définitivement le brouillon</Button></DialogFooter></DialogContent>
        </Dialog>

        <Dialog open={giftConfirmOpen} onOpenChange={open => { if (!provisionGiftMutation.isPending) setGiftConfirmOpen(open); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-violet-700" /> Confirmer la boutique offerte</DialogTitle><DialogDescription>Cette action crée une vraie boutique locale, mais uniquement en état de préparation. Elle n’est pas publique et aucun paiement ni e-mail ne sera envoyé.</DialogDescription></DialogHeader>
            {preflightQuery.data && <div className="space-y-3"><div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-950"><p><strong>Boutique :</strong> {preflightQuery.data.draft.displayName}</p><p className="mt-1"><strong>Domaine :</strong> {preflightQuery.data.draft.requestedDomain}</p><p className="mt-1"><strong>Propriétaire :</strong> {preflightQuery.data.draft.ownerEmail}</p><p className="mt-1"><strong>Résultat :</strong> boutique `setup`, facturation absente, invitation non envoyée.</p></div><div className="space-y-2"><Label htmlFor="gift-confirmation-name">Recopiez exactement le nom de la boutique</Label><Input id="gift-confirmation-name" value={giftConfirmationName} onChange={event => setGiftConfirmationName(event.target.value)} placeholder={preflightQuery.data.draft.displayName} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={giftAcknowledged} onChange={event => setGiftAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /><span>Je confirme créer cette boutique offerte en préparation. J’ai compris qu’elle n’est pas publique, qu’aucun abonnement ni paiement ne sera déclenché, et qu’aucune invitation ne sera envoyée automatiquement.</span></label></div>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setGiftConfirmOpen(false)} disabled={provisionGiftMutation.isPending}>Annuler</Button><Button type="button" className="bg-violet-700 hover:bg-violet-800" disabled={!preflightQuery.data || !giftAcknowledged || giftConfirmationName.trim() !== preflightQuery.data.draft.displayName.trim() || provisionGiftMutation.isPending} onClick={() => preflightQuery.data && provisionGiftMutation.mutate({ draftId: preflightQuery.data.draft.id, confirmationName: giftConfirmationName })}>{provisionGiftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />} Créer en préparation</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <section id="studio-future-saas" className="grid gap-5 xl:grid-cols-[1.06fr_.94fr] scroll-mt-6">
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
