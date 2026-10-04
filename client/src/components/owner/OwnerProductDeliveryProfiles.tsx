import { CircleAlert, MapPin, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type OwnerProductDeliveryProfileDraft = {
  countryCode: string;
  supplierShippingCost: string;
  customerShippingCost: string;
  deliveryMethod: string;
  minDeliveryDays: string;
  maxDeliveryDays: string;
};

type CountryChoice = readonly [string, string];

type Props = {
  value: OwnerProductDeliveryProfileDraft[];
  countries: readonly CountryChoice[];
  currencyCode: string;
  sourcePrice: string;
  onChange: (profiles: OwnerProductDeliveryProfileDraft[]) => void;
};

const emptyProfile = (countryCode: string): OwnerProductDeliveryProfileDraft => ({
  countryCode,
  supplierShippingCost: "",
  customerShippingCost: "",
  deliveryMethod: "",
  minDeliveryDays: "",
  maxDeliveryDays: "",
});

function parseAmount(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function displayAmount(value: number, currencyCode: string) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(value);
}

export default function OwnerProductDeliveryProfiles({ value, countries, currencyCode, sourcePrice, onChange }: Props) {
  const availableCountries = countries.filter(([code]) => !value.some(profile => profile.countryCode === code));
  const update = (countryCode: string, patch: Partial<OwnerProductDeliveryProfileDraft>) => onChange(value.map(profile => profile.countryCode === countryCode ? { ...profile, ...patch } : profile));
  const sourceAmount = parseAmount(sourcePrice);

  return <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-950"><Truck className="h-4 w-4" /> Livraison par destination</p>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-emerald-900">Facultatif pour une fiche en brouillon. Une destination configurée précise son coût, son délai et son mode de livraison ; aucun transporteur, fournisseur ou envoi n’est contacté.</p>
      </div>
      <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800">{value.length} destination{value.length > 1 ? "s" : ""}</span>
    </div>

    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="owner-product-delivery-country">Ajouter une destination</Label>
        <select id="owner-product-delivery-country" defaultValue="" onChange={event => { const code = event.target.value; if (code) { onChange([...value, emptyProfile(code)]); event.currentTarget.value = ""; } }} disabled={availableCountries.length === 0} className="h-11 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
          <option value="">{availableCountries.length ? "Choisir un pays" : "Toutes les destinations sont ajoutées"}</option>
          {availableCountries.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </div>
      <div className="hidden sm:block"><span className="inline-flex h-11 items-center rounded-md border border-emerald-200 bg-white px-3 text-sm font-medium text-emerald-800"><Plus className="mr-1.5 h-4 w-4" /> Ajouter</span></div>
    </div>

    {value.length === 0 ? <div className="mt-4 flex gap-3 rounded-xl border border-dashed border-emerald-300 bg-white/75 p-4 text-sm leading-6 text-emerald-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p>Aucune destination par produit. La boutique peut conserver sa règle générale de livraison ; ajoutez une destination ici lorsqu’un produit a des frais ou un délai particulier.</p></div> : <div className="mt-4 space-y-4">
      {value.map(profile => {
        const countryLabel = countries.find(([code]) => code === profile.countryCode)?.[1] || profile.countryCode;
        const supplierShipping = parseAmount(profile.supplierShippingCost) ?? 0;
        const customerShipping = parseAmount(profile.customerShippingCost) ?? 0;
        const sourceTotal = sourceAmount == null ? null : sourceAmount + supplierShipping;
        const saleTotal = customerShipping;
        return <article key={profile.countryCode} className="rounded-xl border border-emerald-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="flex items-center gap-2 font-semibold text-slate-950"><MapPin className="h-4 w-4 text-emerald-700" /> {countryLabel}</p><p className="mt-1 text-xs text-slate-500">{profile.countryCode} · Réglage propre à ce produit</p></div>
            <Button type="button" size="sm" variant="outline" className="min-h-10 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => onChange(value.filter(item => item.countryCode !== profile.countryCode))}><Trash2 className="mr-1.5 h-4 w-4" /> Retirer</Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2"><Label htmlFor={`owner-product-source-shipping-${profile.countryCode}`}>Transport source ({currencyCode})</Label><Input id={`owner-product-source-shipping-${profile.countryCode}`} inputMode="decimal" value={profile.supplierShippingCost} onChange={event => update(profile.countryCode, { supplierShippingCost: event.target.value })} placeholder="0,00" /></div>
            <div className="space-y-2"><Label htmlFor={`owner-product-customer-shipping-${profile.countryCode}`}>Frais client ({currencyCode})</Label><Input id={`owner-product-customer-shipping-${profile.countryCode}`} inputMode="decimal" value={profile.customerShippingCost} onChange={event => update(profile.countryCode, { customerShippingCost: event.target.value })} placeholder="0,00" /></div>
            <div className="space-y-2"><Label htmlFor={`owner-product-method-${profile.countryCode}`}>Mode / transporteur affiché</Label><Input id={`owner-product-method-${profile.countryCode}`} value={profile.deliveryMethod} maxLength={120} onChange={event => update(profile.countryCode, { deliveryMethod: event.target.value })} placeholder="Poste, retrait, coursier…" /></div>
            <div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label htmlFor={`owner-product-min-days-${profile.countryCode}`}>Délai min.</Label><Input id={`owner-product-min-days-${profile.countryCode}`} inputMode="numeric" type="number" min="0" value={profile.minDeliveryDays} onChange={event => update(profile.countryCode, { minDeliveryDays: event.target.value })} placeholder="2" /></div><div className="space-y-2"><Label htmlFor={`owner-product-max-days-${profile.countryCode}`}>Délai max.</Label><Input id={`owner-product-max-days-${profile.countryCode}`} inputMode="numeric" type="number" min="0" value={profile.maxDeliveryDays} onChange={event => update(profile.countryCode, { maxDeliveryDays: event.target.value })} placeholder="5" /></div></div>
          </div>
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950">
            <strong>Repère de coût :</strong> {sourceTotal == null ? "indiquez le coût source pour calculer le total" : `${displayAmount(sourceTotal, currencyCode)} (article + transport source)`}. Frais client : {displayAmount(saleTotal, currencyCode)}. Ces montants servent au contrôle de marge ; ils ne créent pas une expédition.
          </div>
        </article>;
      })}
    </div>}
  </section>;
}
