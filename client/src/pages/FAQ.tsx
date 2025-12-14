import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    category: "Livraison",
    question: "Quels sont les délais de livraison ?",
    answer:
      "Nous proposons plusieurs options de livraison : Livraison standard (5-7 jours ouvrables), Livraison express (2-3 jours ouvrables), et Livraison gratuite à partir de 50€ d'achat. Les délais commencent à partir de la date de confirmation de votre commande.",
  },
  {
    id: "2",
    category: "Livraison",
    question: "Livrez-vous à l'étranger ?",
    answer:
      "Oui, nous livrons en Suisse et en Europe. Les frais de livraison varient selon le pays de destination. Vous pouvez consulter les tarifs exacts lors de la validation de votre panier en sélectionnant votre pays de livraison.",
  },
  {
    id: "3",
    category: "Livraison",
    question: "Comment puis-je suivre ma commande ?",
    answer:
      "Une fois votre commande confirmée, vous recevrez un email de confirmation avec un numéro de suivi. Vous pouvez utiliser ce numéro pour suivre votre colis en temps réel sur notre plateforme ou celle du transporteur.",
  },
  {
    id: "4",
    category: "Paiement",
    question: "Quels sont les modes de paiement acceptés ?",
    answer:
      "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, et les virements bancaires. Tous les paiements sont sécurisés et chiffrés avec SSL 256-bit.",
  },
  {
    id: "5",
    category: "Paiement",
    question: "Mon paiement est-il sécurisé ?",
    answer:
      "Oui, absolument. Nous utilisons les protocoles de sécurité les plus avancés pour protéger vos données bancaires. Vos informations ne sont jamais stockées sur nos serveurs et sont traitées par des prestataires de paiement certifiés.",
  },
  {
    id: "6",
    category: "Paiement",
    question: "Puis-je utiliser un code promo ?",
    answer:
      "Oui ! Nous proposons régulièrement des codes promo. Vous pouvez les appliquer lors de la validation de votre panier. Consultez notre newsletter ou nos réseaux sociaux pour ne pas manquer nos offres exclusives.",
  },
  {
    id: "7",
    category: "Retours",
    question: "Quelle est votre politique de retour ?",
    answer:
      "Vous avez 30 jours à partir de la date de réception de votre commande pour retourner un article. Le produit doit être en parfait état, non utilisé et dans son emballage d'origine. Les frais de retour sont à votre charge, sauf en cas d'erreur de notre part.",
  },
  {
    id: "8",
    category: "Retours",
    question: "Comment initier un retour ?",
    answer:
      "Connectez-vous à votre compte, allez dans 'Mes Commandes', sélectionnez la commande concernée et cliquez sur 'Demander un retour'. Suivez les instructions pour imprimer l'étiquette de retour et envoyez votre colis à notre entrepôt.",
  },
  {
    id: "9",
    category: "Retours",
    question: "Combien de temps pour être remboursé ?",
    answer:
      "Une fois que nous recevons votre retour et que nous vérifions l'état du produit, le remboursement est généralement traité sous 5-7 jours ouvrables. Vous recevrez une confirmation par email.",
  },
  {
    id: "10",
    category: "Compte",
    question: "Comment créer un compte ?",
    answer:
      "Cliquez sur 'Mon compte' dans le menu principal, puis sur 'Créer un compte'. Remplissez le formulaire avec vos informations (prénom, nom, email, mot de passe) et cliquez sur 'Créer mon compte'. Vous recevrez une confirmation par email.",
  },
  {
    id: "11",
    category: "Compte",
    question: "J'ai oublié mon mot de passe, comment le réinitialiser ?",
    answer:
      "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Entrez votre email et vous recevrez un lien pour réinitialiser votre mot de passe. Cliquez sur le lien et créez un nouveau mot de passe.",
  },
  {
    id: "12",
    category: "Compte",
    question: "Comment modifier mes informations personnelles ?",
    answer:
      "Connectez-vous à votre compte, allez dans 'Paramètres' et modifiez vos informations (nom, email, adresse, téléphone). Cliquez sur 'Sauvegarder les modifications' pour enregistrer vos changements.",
  },
  {
    id: "13",
    category: "Produits",
    question: "Comment puis-je laisser un avis sur un produit ?",
    answer:
      "Après avoir acheté un produit, vous pouvez laisser un avis directement sur la page du produit. Connectez-vous à votre compte, accédez à la page du produit et remplissez le formulaire d'avis avec votre note et commentaire.",
  },
  {
    id: "14",
    category: "Produits",
    question: "Les produits sont-ils authentiques ?",
    answer:
      "Oui, tous nos produits sont 100% authentiques et proviennent directement de nos fournisseurs partenaires. Nous garantissons l'authenticité de chaque article vendu sur notre plateforme.",
  },
  {
    id: "15",
    category: "Produits",
    question: "Proposez-vous des garanties sur les produits ?",
    answer:
      "Oui, tous nos produits bénéficient de la garantie légale de 2 ans. Certains produits peuvent avoir une garantie supplémentaire du fabricant. Consultez les détails de chaque produit pour connaître les conditions de garantie.",
  },
];

const categories = ["Tous", "Livraison", "Paiement", "Retours", "Compte", "Produits"];

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQ =
    selectedCategory === "Tous"
      ? faqItems
      : faqItems.filter((item) => item.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 cursor-pointer w-fit">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Retour à l'accueil</span>
              </div>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Questions Fréquemment Posées
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Trouvez les réponses aux questions les plus courantes sur MAZIGHO
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Category Filter */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Catégories
              </h2>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    className={
                      selectedCategory === category
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : ""
                    }
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQ.length > 0 ? (
                filteredFAQ.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {item.question}
                          </h3>
                          {expandedId === item.id && (
                            <p className="mt-4 text-gray-700 leading-relaxed">
                              {item.answer}
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-6 w-6 text-gray-400 flex-shrink-0 transition-transform ${
                            expandedId === item.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    Aucune question trouvée dans cette catégorie.
                  </p>
                </div>
              )}
            </div>

            {/* Contact Section */}
            <Card className="mt-12 bg-gradient-to-r from-orange-50 to-teal-50 border-orange-200">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Vous n'avez pas trouvé votre réponse ?
                </h3>
                <p className="text-gray-700 mb-6">
                  Notre équipe de support est là pour vous aider. N'hésitez pas
                  à nous contacter pour toute question supplémentaire.
                </p>
                <Link href="/contact">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Nous Contacter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
