import LegalLayout from "@/components/LegalLayout";
import { useLegalProfile } from "@/hooks/useLegalProfile";

const updatedAt = "23 août 2026";

export default function ShippingReturns() {
  const { profile } = useLegalProfile();

  return (
    <LegalLayout
      eyebrow="Informations pratiques"
      title="Livraison et retours"
      description="Cette page présente l’état actuel des modalités de livraison et de retours de MAZIGHO avant l’ouverture des paiements en ligne."
      updatedAt={updatedAt}
    >
      <section>
        <h2 className="text-xl font-semibold text-slate-950">1. État actuel</h2>
        <p className="mt-3">
          Les commandes avec paiement en ligne ne sont pas encore ouvertes. MAZIGHO ne collecte donc actuellement aucune adresse de livraison et n’expédie pas encore de commande depuis le site.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">2. Zones de livraison envisagées</h2>
        <p className="mt-3">
          {profile.deliveryZones}. La liste précise des pays servis pourra évoluer selon le produit, le fournisseur et le transporteur disponible.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">3. Délais et frais</h2>
        <p className="mt-3">
          {profile.deliveryDetails} Les délais pourront dépendre de la destination, du stock, de la préparation et du transporteur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">4. Retours</h2>
        <p className="mt-3">
          {profile.returnsPolicy} Cette position ne limite pas les droits impératifs qui pourraient résulter du droit applicable lorsqu’un produit est défectueux ou ne correspond pas à ce qui a été convenu.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">5. Assistance</h2>
        <p className="mt-3">
          Pour une question concernant une future livraison, écrivez à <a className="text-orange-700 underline underline-offset-4 hover:text-orange-500" href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a> ou utilisez le formulaire de contact. Les présentes informations seront mises à jour dès que les conditions de livraison définitives seront déterminées.
        </p>
      </section>
    </LegalLayout>
  );
}
