import { trpc } from "@/lib/trpc";

export type LegalProfile = {
  operatorName: string;
  addressLine: string;
  postalCodeCity: string;
  country: string;
  contactEmail: string;
  businessStatus: string;
  ideVatNumber: string;
  deliveryZones: string;
  deliveryDetails: string;
  returnsPolicy: string;
};

export const defaultLegalProfile: LegalProfile = {
  operatorName: "Entreprise à renseigner",
  addressLine: "Adresse à renseigner",
  postalCodeCity: "Code postal et ville à renseigner",
  country: "Pays à renseigner",
  contactEmail: "support@example.com",
  businessStatus: "Statut juridique à renseigner",
  ideVatNumber: "Numéro d’entreprise ou régime TVA à renseigner",
  deliveryZones: "Zones de livraison à renseigner",
  deliveryDetails: "Les destinations, frais et délais sont indiqués avant validation de la commande.",
  returnsPolicy: "Politique de retours à renseigner avant l’ouverture des ventes.",
};

export function useLegalProfile() {
  const query = trpc.legal.get.useQuery();
  return {
    ...query,
    profile: (query.data ?? defaultLegalProfile) as LegalProfile,
  };
}
