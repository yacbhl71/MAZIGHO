import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CHECKOUT_LEGAL_VERSION } from "@shared/checkoutLegalAcceptance";
import { toast } from "sonner";

type CheckoutLine = {
  productId: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  variantId?: number;
};

type AlgeriaCashOnDeliveryCheckoutProps = {
  available: boolean;
  legalReady: boolean;
  legalAccepted: boolean;
  promoCode?: string;
  items: CheckoutLine[];
  onDeliveryQuoteChange: (amountDzdCents: number) => void;
  onCreated: () => void;
};

/** Customer form shown only for an explicitly enabled DZ delivery-payment flow. */
export default function AlgeriaCashOnDeliveryCheckout({ available, legalReady, legalAccepted, promoCode, items, onDeliveryQuoteChange, onCreated }: AlgeriaCashOnDeliveryCheckoutProps) {
  const [address, setAddress] = useState({ name: "", phone: "", line1: "", line2: "", city: "", postalCode: "" });
  const [wilayaCode, setWilayaCode] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"home" | "relay">("home");
  const deliveryOptions = trpc.content.getAlgeriaWilayaDeliveryOptions.useQuery(undefined, { enabled: available, retry: false, refetchOnWindowFocus: false });
  const createOrder = trpc.checkout.createAlgeriaCashOnDeliveryOrder.useMutation({
    onSuccess: () => {
      toast.success("Votre commande à régler à la livraison est enregistrée.");
      onCreated();
    },
    onError: error => toast.error(error.message || "La commande à la livraison n’a pas pu être créée."),
  });
  if (!available) return null;
  const addressComplete = Boolean(address.name.trim() && address.phone.trim() && address.line1.trim() && address.city.trim() && address.postalCode.trim());
  const selectedWilaya = deliveryOptions.data?.find(option => option.code === wilayaCode);
  const deliveryAmount = deliveryMode === "home" ? selectedWilaya?.homeDeliveryDzd : selectedWilaya?.relayDeliveryDzd;
  const deliveryReady = Boolean(selectedWilaya && deliveryAmount !== null && deliveryAmount !== undefined);
  useEffect(() => {
    onDeliveryQuoteChange(deliveryReady ? (deliveryAmount || 0) * 100 : 0);
  }, [deliveryAmount, deliveryReady, onDeliveryQuoteChange]);
  const disabled = !legalReady || !legalAccepted || !addressComplete || !deliveryReady || createOrder.isPending;
  const set = (key: keyof typeof address, value: string) => setAddress(current => ({ ...current, [key]: value }));

  return <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4" data-testid="checkout-algeria-cash-on-delivery">
    <div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-700 text-white"><Banknote className="h-4 w-4" /></span><div><p className="font-semibold text-slate-950">Paiement à la livraison · Algérie</p><p className="mt-1 text-xs leading-5 text-slate-700">Vous réglerez le montant de votre commande lors de la livraison. Aucun paiement par carte n’est demandé ici.</p></div></div>
    <div className="rounded-xl border border-emerald-200 bg-white/80 p-3">
      <label htmlFor="cod-wilaya" className="text-xs font-semibold text-slate-700">Wilaya de livraison *</label>
      {deliveryOptions.isLoading ? <div className="mt-2 h-11 animate-pulse rounded-md bg-slate-100" /> : <select id="cod-wilaya" value={wilayaCode} onChange={event => setWilayaCode(event.target.value)} className="mt-1.5 flex min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"><option value="">Choisir une wilaya</option>{deliveryOptions.data?.map(option => <option key={option.code} value={option.code}>{option.code} · {option.name}</option>)}</select>}
      {deliveryOptions.isError || (!deliveryOptions.isLoading && (deliveryOptions.data?.length || 0) === 0) ? <p className="mt-2 text-xs leading-5 text-amber-900">Aucune wilaya n’est encore disponible pour cette boutique. La commande à la livraison reste fermée.</p> : null}
      {selectedWilaya && <div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" disabled={selectedWilaya.homeDeliveryDzd === null} onClick={() => setDeliveryMode("home")} className={`rounded-lg border p-3 text-left text-xs leading-5 disabled:cursor-not-allowed disabled:opacity-45 ${deliveryMode === "home" ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-300" : "border-slate-200 bg-white text-slate-700"}`}><strong>Domicile</strong><br />{selectedWilaya.homeDeliveryDzd === null ? "Non disponible" : `${new Intl.NumberFormat("fr-DZ").format(selectedWilaya.homeDeliveryDzd)} DA`}</button><button type="button" disabled={selectedWilaya.relayDeliveryDzd === null} onClick={() => setDeliveryMode("relay")} className={`rounded-lg border p-3 text-left text-xs leading-5 disabled:cursor-not-allowed disabled:opacity-45 ${deliveryMode === "relay" ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-300" : "border-slate-200 bg-white text-slate-700"}`}><strong>Point relais</strong><br />{selectedWilaya.relayDeliveryDzd === null ? "Non disponible" : `${new Intl.NumberFormat("fr-DZ").format(selectedWilaya.relayDeliveryDzd)} DA`}</button></div>}
      {selectedWilaya && deliveryReady ? <p className="mt-3 text-xs leading-5 text-emerald-950"><strong>Livraison :</strong> {deliveryMode === "home" ? "à domicile" : "en point relais"} · {new Intl.NumberFormat("fr-DZ").format(deliveryAmount || 0)} DA · délai annoncé {selectedWilaya.deliveryLeadTime}. Ce montant est recalculé et enregistré avec votre commande.</p> : null}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field id="cod-name" label="Nom complet" value={address.name} onChange={value => set("name", value)} autoComplete="name" />
      <Field id="cod-phone" label="Téléphone" value={address.phone} onChange={value => set("phone", value)} autoComplete="tel" inputMode="tel" />
      <Field id="cod-line1" label="Adresse" value={address.line1} onChange={value => set("line1", value)} autoComplete="address-line1" className="sm:col-span-2" />
      <Field id="cod-line2" label="Complément d’adresse (facultatif)" value={address.line2} onChange={value => set("line2", value)} autoComplete="address-line2" className="sm:col-span-2" required={false} />
      <Field id="cod-postal" label="Code postal" value={address.postalCode} onChange={value => set("postalCode", value)} autoComplete="postal-code" inputMode="numeric" />
      <Field id="cod-city" label="Ville" value={address.city} onChange={value => set("city", value)} autoComplete="address-level2" />
    </div>
    <p className="rounded-lg border border-emerald-200 bg-white/80 p-3 text-xs leading-5 text-emerald-950">Vos coordonnées sont utilisées uniquement pour préparer cette livraison. Elles restent masquées dans le panneau de la boutique jusqu’à la préparation de la commande.</p>
    <Button type="button" className="h-12 w-full bg-emerald-700 text-base font-semibold text-white hover:bg-emerald-800" disabled={disabled} onClick={() => createOrder.mutate({ requestId: crypto.randomUUID(), countryCode: "DZ", wilayaCode, deliveryMode, promoCode, legalAcceptanceVersion: CHECKOUT_LEGAL_VERSION, legalAccepted: true, address, items })}>
      {createOrder.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Commander et régler à la livraison</>}
    </Button>
    {!deliveryReady ? <p className="text-xs leading-5 text-amber-900">Choisissez une wilaya et un mode de livraison disponible avant de confirmer.</p> : !legalReady ? <p className="text-xs leading-5 text-amber-900">Les informations de vente de cette boutique doivent être complétées avant toute commande.</p> : !legalAccepted ? <p className="text-xs leading-5 text-amber-900">Acceptez les conditions de vente ci-dessus avant de confirmer la commande.</p> : null}
  </section>;
}

function Field({ id, label, value, onChange, className = "", required = true, ...inputProps }: { id: string; label: string; value: string; onChange: (value: string) => void; className?: string; required?: boolean } & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange">) {
  return <div className={`space-y-1.5 ${className}`}><Label htmlFor={id} className="text-xs text-slate-700">{label}{required ? " *" : ""}</Label><Input id={id} value={value} onChange={event => onChange(event.target.value)} className="min-h-11 bg-white" {...inputProps} /></div>;
}
