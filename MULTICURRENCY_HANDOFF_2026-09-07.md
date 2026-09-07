# Gestion multidevise — reprise technique

## Objectif

Permettre à chaque propriétaire de boutique MAZIGHO de choisir une devise de vente depuis **Admin → Paramètres**, sans modifier le catalogue canonique en CHF ni les commandes historiques.

## Règles appliquées

| Sujet | Règle |
|---|---|
| Catalogue | Les prix produit, promotions et profils de livraison restent stockés en centimes CHF. |
| Devises prises en charge | CHF, EUR, USD, GBP et CAD. |
| Taux | L’administrateur saisit un taux manuel exprimant la monnaie de vente pour 1 CHF. Il est borné entre 0,1000 et 5,0000. |
| Affichage public | Les prix sont convertis et arrondis par ligne avec le taux de la boutique. |
| Checkout | Le serveur recalcule la totalité à partir du catalogue CHF ; il ne fait jamais confiance au montant navigateur. |
| Historique | Chaque commande conserve `currencyCode`, `currencyRateBps`, `totalAmountChf`, `customerShippingAmountChf`, `discountAmountChf` et les prix de ligne CHF. |
| Stripe | Le mode Test reçoit la devise verrouillée et les montants convertis ; le mode Live n’est pas activé par cette évolution. |
| Odoo | Une commande étrangère ne peut être synchronisée que si une liste de prix de même devise est disponible. Elle ne doit jamais être convertie silencieusement en CHF. |
| TWINT | Limité au CHF dans cette implémentation, afin d’éviter une combinaison de méthode et devise incohérente. |

## Exploitation

Avant de changer de devise, l’administrateur doit saisir un taux vérifié, tester une commande Stripe Test et contrôler que la devise et le total reçus correspondent au panier. Les commandes existantes restent en CHF et ne doivent pas être réécrites.

## Migration

La migration `drizzle/0019_store_currency.sql` ajoute les champs d’historique nécessaires et initialise les anciennes commandes en CHF.
