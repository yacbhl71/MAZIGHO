import LegalLayout from "@/components/LegalLayout";
import { useLegalProfile } from "@/hooks/useLegalProfile";

const updatedAt = "23 août 2026";

export default function LegalNotice() {
  const { profile } = useLegalProfile();

  return (
    <LegalLayout
      eyebrow="Informations légales"
      title="Mentions légales"
      description="Les informations ci-dessous permettent d’identifier l’exploitant de la boutique MAZIGHO et de le contacter directement."
      updatedAt={updatedAt}
    >
      <section>
        <h2 className="text-xl font-semibold text-slate-950">1. Exploitant du site</h2>
        <p className="mt-3">
          Le site <strong>mazigho.ch</strong> et la boutique MAZIGHO sont exploités par <strong>{profile.operatorName}</strong>. Statut déclaré : {profile.businessStatus}.
        </p>
        <address className="mt-4 not-italic">
          <strong>Adresse postale :</strong><br />
          {profile.addressLine}<br />
          {profile.postalCodeCity}<br />
          {profile.country}
        </address>
        <p className="mt-4">
          <strong>Adresse e-mail de contact :</strong> <a className="text-orange-700 underline underline-offset-4 hover:text-orange-500" href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a>
        </p>
        <p className="mt-4">{profile.ideVatNumber}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">2. Objet de la boutique</h2>
        <p className="mt-3">
          MAZIGHO présente une sélection de produits destinés aux consommateurs. La disponibilité, les caractéristiques, le prix affiché, les conditions de livraison et les modalités de paiement applicables sont indiqués dans le parcours de commande lorsqu’ils sont activés.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">3. Contact et assistance</h2>
        <p className="mt-3">
          Pour toute question concernant le site, une commande, les données personnelles ou les présentes informations, vous pouvez écrire à l’adresse e-mail ci-dessus ou utiliser le formulaire de contact. Le formulaire complète ce moyen de contact ; il ne le remplace pas.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">4. Propriété intellectuelle</h2>
        <p className="mt-3">
          Les éléments propres à MAZIGHO, notamment la présentation du site, les textes, le logo et les créations graphiques, ne peuvent pas être reproduits ou exploités sans autorisation préalable, sauf lorsque la loi le permet. Les marques, images et contenus appartenant à des tiers restent la propriété de leurs titulaires respectifs.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">5. Mise à jour</h2>
        <p className="mt-3">
          Ces mentions peuvent évoluer afin de refléter l’ouverture effective de l’activité, l’activation des paiements, les modalités de livraison définitives ou les obligations réglementaires applicables.
        </p>
      </section>
    </LegalLayout>
  );
}
