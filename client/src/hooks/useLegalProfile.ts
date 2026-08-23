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
  operatorName: "Bahloul Yacine",
  addressLine: "Chemin des Lieugex 17",
  postalCodeCity: "1860 Aigle",
  country: "Suisse",
  contactEmail: "yacbhll@gmail.com",
  businessStatus: "Activité individuelle en cours de création",
  ideVatNumber: "Aucun numéro IDE ou TVA attribué à ce jour",
  deliveryZones: "Suisse et certains pays d’Europe, selon disponibilité",
  deliveryDetails: "Les destinations, frais et délais définitifs seront affichés avant l’ouverture des commandes.",
  returnsPolicy: "Aucun programme commercial de retours ou d’échanges n’est proposé à ce stade.",
};

export function useLegalProfile() {
  const query = trpc.legal.get.useQuery();
  return {
    ...query,
    profile: (query.data ?? defaultLegalProfile) as LegalProfile,
  };
}
