# Automatisation prudente des commandes CJdropshipping

## Objectif et périmètre initial

MAZIGHO reste la source de vérité de la commande client. Une confirmation Stripe en **mode Test** rend d’abord le paiement durable dans la base MAZIGHO ; la commande est ensuite synchronisée à titre informatif dans Odoo et placée dans une outbox interne de préparation CJ. Les opérations Odoo et CJ ne doivent jamais empêcher Stripe d’obtenir une réponse correcte une fois le paiement local enregistré.

La première version est volontairement limitée au contrôle administratif et au **sandbox CJ**. Elle ne crée ni débit du solde CJ, ni paiement carte ou bancaire fournisseur, ni expédition réelle. Le client ne voit jamais les coûts fournisseur, les devis, les transporteurs CJ, les données d’origine ou les messages internes de validation.

## Parcours mis en œuvre

| Étape | Responsable | Effet durable | Garde-fou |
|---|---|---|---|
| Paiement | Stripe Test | Paiement local MAZIGHO marqué payé | Réception Stripe signée et idempotente |
| Adresse et instantané | MAZIGHO | Adresse Stripe, options, référence CJ et profil initial figés dans la commande | Aucune variante ou adresse ne sera devinée ultérieurement |
| Miroir back-office | Odoo | `sale.order` brouillon identifié par `client_order_ref=MAZIGHO-<id>` | Recherche avant création, identifiant Odoo conservé localement |
| Préparation | Opérateur MAZIGHO | Tâche CJ sandbox explicitement démarrée depuis le panneau Commandes | Saisie de confirmation humaine `TEST CJ #<id>` |
| Contrôles CJ | MAZIGHO + CJ | Stock, variante, transport, origine et prix fournisseur revalidés | Blocage en cas d’adresse, de mappage, de stock, de fret ou de marge insuffisants |
| Commande fournisseur test | CJ sandbox | Brouillon fournisseur tracé dans MAZIGHO | `isSandbox=1` et `payType=3` exclusivement |

## États internes de fulfillment

Les états de fulfillment sont distincts du statut présenté au client. Ils comprennent : `not_eligible`, `awaiting_supplier_preparation`, `supplier_order_draft`, `supplier_payment_review`, `supplier_payment_pending`, `supplier_paid`, `supplier_exception`, `shipped`, `delivered`, `cancelled` et `refunded`.

Une commande payée mais dépourvue de correspondance CJ certaine est placée dans `supplier_exception`. Aucune reprise automatique ne doit recréer une commande fournisseur après une réponse ambiguë ou un échec réseau : l’opérateur examine d’abord l’exception dans le panneau MAZIGHO.

## Règles CJ vérifiées

> `createOrderV2` requiert une référence de commande boutique unique, les coordonnées de livraison, une méthode logistique, le pays d’origine et des lignes produits identifiées par `vid` ou `sku`.[1]

Le mode `payType=3` ne réalise pas de paiement fournisseur ; `payType=1` renvoie un parcours de paiement CJ et `payType=2` peut utiliser le solde CJ. Seul `payType=3` est autorisé dans cette phase. `isSandbox=1` permet de simuler la création et la logistique sans frais ou fulfillment réels.[1]

## Paiement fournisseur et suivi : non activés

Le paiement fournisseur réel, le solde CJ, toute URL de paiement CJ et l’enregistrement d’un callback public restent **hors périmètre**. Leur activation nécessite une confirmation distincte précisant la cible, le montant maximal et la conséquence commerciale.

Avant d’activer les suivis réels, le récepteur `/webhook/cj` devra vérifier la signature HMAC-SHA256/Base64 sur le corps brut à l’aide du secret `openId`, dédupliquer `messageId`, enregistrer l’événement rapidement et répondre 200 en moins de trois secondes.[2] Les secrets CJ, Odoo, Stripe et Make ne doivent jamais être ajoutés au code client, aux journaux ni au dépôt.

## Références

[1]: https://developers.cjdropshipping.cn/en/api/api2/api/shopping.html "CJdropshipping API — Shopping / Create Order"
[2]: https://developers.cjdropshipping.cn/en/api/api2/api/webhook.html "CJdropshipping API — Webhooks"
[3]: https://docs.stripe.com/payments/collect-addresses "Stripe — Collect customer addresses"
[4]: https://www.odoo.com/documentation/17.0/developer/reference/external_api.html "Odoo — External API"
