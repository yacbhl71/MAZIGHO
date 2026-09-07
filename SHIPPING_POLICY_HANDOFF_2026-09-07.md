# Politique de livraison configurable — MAZIGHO

**Date :** 7 septembre 2026  
**Objet :** livraison offerte ou frais fixes configurables depuis l’administration.

## Règle métier

| Réglage `shipping_policy` | Comportement client |
|---|---|
| `included` | Livraison offerte, comprise dans les prix affichés. C’est la valeur par défaut afin de préserver le fonctionnement historique de MAZIGHO. |
| `flat_rate` | Un seul frais fixe est ajouté par commande. Il devient gratuit à partir de `free_shipping_threshold`. Une valeur de seuil `0` désactive la gratuité automatique. |

Les profils de livraison par produit et destination restent obligatoires afin de confirmer qu’un article peut être livré vers le pays choisi et de conserver un devis fournisseur vérifiable. Ils ne déterminent plus les frais payés par le client lorsque la politique globale est appliquée.

## Cohérence comptable

Le montant réellement facturé au client est calculé côté serveur au moment du checkout. Il est enregistré de manière immuable dans `orders.customerShippingAmount`, envoyé à Stripe Test comme une unique ligne « Livraison » lorsque son montant est supérieur à zéro et transmis à Odoo sous la même forme. Ainsi, les totaux du panier, de Stripe, de MAZIGHO et d’Odoo restent cohérents.

## Garanties

Cette évolution ne modifie pas les commandes existantes et n’exécute aucune action fournisseur, aucun paiement fournisseur, aucune expédition ni aucune publication de produit.
