import LegalLayout from "@/components/LegalLayout";

const updatedAt = "23 août 2026";

export default function ShippingReturns() {
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
          MAZIGHO prévoit de proposer la livraison en Suisse et, selon les possibilités logistiques, dans certains pays d’Europe. La liste précise des pays servis sera publiée avant l’ouverture des commandes et pourra varier selon le produit, le fournisseur et le transporteur disponible.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">3. Délais et frais</h2>
        <p className="mt-3">
          Aucun délai de livraison ni frais de port définitif n’est promis à ce stade. Avant toute commande active, MAZIGHO affichera les informations de livraison applicables de manière claire avant la validation du paiement. Les délais pourront dépendre de la destination, du stock, de la préparation et du transporteur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">4. Retours</h2>
        <p className="mt-3">
          MAZIGHO ne propose pas actuellement de programme commercial de retours ou d’échanges. Cette position sera réévaluée avant l’ouverture des ventes. Elle ne limite pas les droits impératifs qui pourraient résulter du droit applicable lorsqu’un produit est défectueux ou ne correspond pas à ce qui a été convenu.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">5. Assistance</h2>
        <p className="mt-3">
          Pour une question concernant une future livraison, écrivez à <a className="text-orange-700 underline underline-offset-4 hover:text-orange-500" href="mailto:yacbhll@gmail.com">yacbhll@gmail.com</a> ou utilisez le formulaire de contact. Les présentes informations seront mises à jour dès que les conditions de livraison définitives seront déterminées.
        </p>
      </section>
    </LegalLayout>
  );
}
