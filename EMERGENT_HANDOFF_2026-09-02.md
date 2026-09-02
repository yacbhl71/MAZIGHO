# Mémo de passation — MAZIGHO

**Date :** 2 septembre 2026
**Objet :** automatisation prudente des commandes entre Stripe Test, MAZIGHO, Odoo et CJdropshipping.
**Référentiel :** branche `main` du dépôt `yacbhl71/MAZIGHO`.

## Résumé exécutif

Une première étape complète d’automatisation des commandes a été ajoutée à MAZIGHO. La boutique reste la **source de vérité** : après un paiement client Stripe, elle enregistre la commande, son adresse et un instantané fournisseur local, puis synchronise Odoo à titre de miroir administratif. Une préparation CJdropshipping existe désormais dans le panneau Commandes, mais elle est volontairement **verrouillée en sandbox** et exige une confirmation humaine écrite.

> **Aucun paiement fournisseur réel n’est implémenté ou activé.** Le solde CJ, les liens de paiement CJ, `payType=2`, les commandes CJ réelles et l’expédition réelle sont expressément exclus de cette version.

## Commits livrés aujourd’hui

| Commit | Rôle |
|---|---|
| `e9b7786` | Ajout du flux de préparation de commande CJ sandbox protégé, de l’outbox interne, du schéma de suivi, de l’UI Commandes, de l’idempotence Odoo et des tests. |
| `b1b6525` | Passage explicite du pays de livraison au contrôle et au devis CJ, afin de toujours revalider une référence dans le contexte de destination. |
| `4f816fb` | Messages administrateur explicites lorsque CJ bloque une référence, une variante, le stock, le fret ou la marge. |
| `ccfc3ad` | Ajout du **Générateur de Sourcing CJ sur-mesure** ; critères personnalisés par pays, poids, multiplicateur de prix et transport CJPacket rapide ; anciens lots fixes repliés comme sauvegardes. |
| Version multi-sélections | Évolution du générateur : catégories et destinations à sélections multiples par cases à cocher ; plafond relevé à 100 brouillons par catégorie. |

La production suit la branche `main` via le déploiement Vercel habituel.

## Flux métier mis en œuvre

| Étape | Comportement ajouté | Garanties |
|---|---|---|
| 1. Checkout | Stripe Checkout Test collecte l’adresse de livraison et le téléphone du client. Le panier transmet les options réellement sélectionnées. | Les prix MAZIGHO ne sont pas recalculés par CJ ; aucun coût fournisseur n’est exposé au client. |
| 2. Paiement | Une confirmation Stripe marque durablement la commande MAZIGHO comme payée. Le retour client Stripe utilise le même traitement idempotent. | Les erreurs Odoo/CJ ne font jamais échouer le webhook Stripe après la persistance locale. |
| 3. Instantané | Chaque ligne de commande conserve le nom produit, les options, la référence produit CJ, la variante CJ, le pays et le profil logistique connu à l’achat. | Le système refuse de deviner une taille, une couleur, une variante ou une destination. |
| 4. Odoo | La vente est recherchée par `client_order_ref = MAZIGHO-<id>` avant création. L’identifiant Odoo est conservé localement. | Une répétition Stripe ne crée pas de doublon dans Odoo. |
| 5. Outbox CJ | Une commande payée et correctement mappée devient `awaiting_supplier_preparation`. | Le traitement fournisseur est séparé du paiement client et traçable. |
| 6. Contrôle humain | Dans **Administration → Commandes**, l’opérateur ouvre la commande et clique sur **« Préparer chez CJ (test) »**, puis saisit exactement `TEST CJ #<id>`. | Sans cette étape volontaire, CJ n’est pas appelé pour créer une commande. |
| 7. Prévalidation CJ | MAZIGHO revalide la fiche, la variante, le stock, l’adresse, le pays, le transport, le pays d’origine, les coûts et une marge minimale de sécurité. | Une anomalie arrête le processus avant la création d’une commande fournisseur. |
| 8. Sandbox CJ | Si tous les contrôles réussissent, MAZIGHO appelle `createOrderV2` avec `isSandbox=1` et `payType=3`. | Ni débit CJ, ni paiement carte, ni lien de paiement CJ, ni fulfillment réel. |

## États internes ajoutés

Les statuts ci-dessous sont internes au fulfillment et distincts du statut client de commande :

| État | Signification |
|---|---|
| `not_eligible` | Panier non-CJ ou données fournisseur insuffisantes. |
| `awaiting_supplier_preparation` | Paiement client confirmé ; la préparation CJ de test peut être déclenchée par un opérateur. |
| `supplier_order_draft` | Brouillon CJ sandbox créé et montants tracés. |
| `supplier_payment_review` / `supplier_payment_pending` | Réservés à une future phase avec approbation explicite ; aucun paiement n’existe aujourd’hui. |
| `supplier_paid` | Réservé à une future intégration de paiement réel. |
| `supplier_exception` | Contrôle CJ bloqué : fiche, variante, stock, transport, adresse ou marge. |
| `shipped`, `delivered`, `cancelled`, `refunded` | Réservés à la future synchronisation de suivi et au cycle de service après-vente. |

## Données et tables ajoutées

Le schéma Drizzle et les helpers de migration idempotents TiDB ont été étendus pour conserver :

| Donnée | Finalité |
|---|---|
| Adresse Stripe normalisée dans la commande | Préparation fournisseur avec destinataire, adresse, ville, code postal, pays et téléphone. |
| Instantané par ligne de commande | Référence produit CJ, variante, pays et information logistique connue à l’achat. |
| Lien local vers `odooSaleOrderId` | Idempotence et traçabilité du miroir Odoo. |
| Outbox / tâches de fulfillment | Verrouillage, idempotency key, tentatives, erreurs, dates et résultat de préparation. |
| Commandes fournisseur CJ | Identifiants CJ, montants USD, estimation CHF, marge, devis et instantanés de commande. |
| États et erreur de fulfillment | Diagnostic administratif sans exposition publique. |

Ne jamais enregistrer dans la base, le dépôt, le client web ou les logs : clés CJ, secrets Stripe, mots de passe Odoo, tokens Make, signature webhook ou URL de paiement fournisseur.

## Interface d’administration

La page **Administration → Commandes** comporte maintenant :

- une colonne **Fournisseur** avec l’état du fulfillment ;
- un bloc interne **Préparation fournisseur CJ** dans le détail d’une commande ;
- badges explicites : Sandbox uniquement, paiement CJ désactivé, référence Odoo ;
- le bouton protégé **« Préparer chez CJ (test) »** ;
- les montants fournisseur et marge uniquement lorsqu’un brouillon sandbox a effectivement été créé ;
- un message humain en cas d’exception, par exemple fiche CJ indisponible, variante supprimée, stock insuffisant, transport indisponible ou marge trop basse.

Ces données ne doivent jamais être ajoutées aux pages produit, panier, checkout, e-mails client ou espace client.

## Résultat du test réel exécuté aujourd’hui

Une commande **Stripe Test** a été passée avec une adresse fictive. Le paiement local a été confirmé, l’adresse et les instantanés ont été stockés, et une vente de test a été créée dans Odoo. Le test est donc validé jusqu’à la mise en file CJ :

| Maillon testé | Résultat |
|---|---|
| Checkout Stripe Test et collecte d’adresse | Réussi. |
| Paiement Stripe Test puis persistance MAZIGHO | Réussi. |
| Traitement de retour Stripe idempotent | Réussi. |
| Synchronisation Odoo idempotente | Réussie ; lien Odoo local créé. |
| Affichage de la commande et de son état fournisseur | Réussi. |
| Préparation CJ sandbox | Bloquée volontairement avant création CJ. |

Le produit de test actif utilisait une ancienne référence de variante CJ. La fiche CJ actuelle ne renvoie plus cette variante dans le contexte suisse. Le système a donc placé la commande dans `supplier_exception` et n’a créé **aucune** commande fournisseur. C’est le comportement attendu : ne jamais expédier un article avec une variante devinée ou devenue indisponible.

La commande de test est conservée dans MAZIGHO comme preuve du parcours ; elle ne sera pas retentée automatiquement, afin d’écarter tout risque de doublon.

## Fichiers clés

| Fichier | Responsabilité |
|---|---|
| `server/stripeWebhook.ts` | Réception Stripe, persistance paiement, adresse, outbox CJ et synchronisation Odoo best-effort. |
| `server/stripeCheckout.ts` | Création Stripe Checkout Test et traitement idempotent du retour de session. |
| `server/db.ts` | Migrations idempotentes, instantanés de commande, outbox, états, commandes fournisseur et lectures admin. |
| `drizzle/schema.ts` | Structures Drizzle des nouveaux champs et tables. |
| `server/services/odoo.ts` | Recherche Odoo par `client_order_ref`, création idempotente et lien local. |
| `server/services/cjFulfillment.ts` | Client CJ distinct du catalogue ; prévalidation puis création sandbox uniquement. |
| `server/cjDropshipping.ts` | Token CJ, fiche produit, stock, fret et devis ; le pays est désormais transmis au contexte de vérification. |
| `server/adminRouter.ts` | Procédures protégées `admin.orders.getFulfillment`, `getCjSafetyStatus` et `prepareCjSandbox`. |
| `client/src/pages/admin/AdminOrders.tsx` | Contrôle visuel et confirmation humaine du test CJ. |
| `server/services/cjFulfillment.test.ts` | Test garantissant que le module est sandbox-only et ne peut débiter CJ. |
| `cj_order_automation_research.md` | Références techniques CJ, Stripe et Odoo. |

## Générateur de Sourcing CJ sur-mesure

Le Hub fournisseurs contient désormais un bloc prioritaire et réservé à l’administration : **« Générateur de Sourcing CJ sur-mesure »**. Il est manuel : aucun traitement planifié, aucune commande CJ et aucune publication ne sont déclenchés sans action humaine.

| Paramètre administrateur | Règle appliquée côté serveur |
|---|---|
| Niche / mot-clé CJ | Recherche texte libre, de 2 à 120 caractères. |
| Catégories MAZIGHO | Une ou plusieurs catégories standard peuvent être cochées. Chaque brouillon créé y est classé simultanément. |
| Pays de destination | Une ou plusieurs destinations parmi CH, FR, DE, IT, AT, BE, NL ou ES peuvent être cochées. La même variante doit avoir un fret rapide confirmé dans chaque pays coché. |
| Nombre de produits | De 1 à 12 brouillons demandés au maximum par lancement. |
| Limite de brouillons | De 1 à 100 produits CJ non archivés maximum **par catégorie cochée**. La catégorie la plus proche de son plafond limite le lancement. |
| Poids maximum | De 50 g à 10 kg ; variante rejetée sans poids connu ou au-dessus du seuil. |
| Multiplicateur de prix | De 1,1 à 5 ; appliqué au coût produit + transport, arrondi commercialement à `.90` CHF. |
| Transport | Méthode explicitement nommée **CJPacket**, non postale/non économique, avec un délai connu de 15 jours maximum. |

Le prix final est calculé avec le fret fournisseur le plus élevé parmi les destinations cochées. Ainsi, le même prix public couvre les pays sélectionnés sans frais de livraison additionnels. Un produit qui échoue dans un seul pays coché est écarté du lancement.

Les anciens lots fixes par catégories et le lot Mode restent intégralement disponibles dans le code, mais sont visuellement repliés dans **« Outils classiques / sauvegarde »**. Ils ne sont pas supprimés, mais ne doivent plus être le parcours par défaut.

Les fichiers clés sont `server/cjBatchImport.ts` pour le moteur, `server/adminRouter.ts` pour les validations et l’audit, `client/src/pages/admin/AdminSuppliers.tsx` pour l’interface, et `server/cjBatchImport.test.ts` pour le verrou du transport rapide.

## Points impératifs pour la suite

1. **Ne pas activer de paiement CJ réel** sans confirmation distincte du propriétaire, précisant le montant maximal, la cible et la conséquence. En particulier, ne pas introduire `payType=2` ni un débit de solde CJ.

2. **Ne pas ajouter `/webhook/cj` avant sa sécurisation complète.** Il devra conserver le corps brut, vérifier la signature HMAC-SHA256/Base64 avec le secret CJ, dédupliquer `messageId`, répondre HTTP 200 en moins de trois secondes et déléguer le traitement lourd à l’outbox.

3. **Actualiser les mappages CJ des produits publiés** avant un nouveau test sandbox. Une commande CJ n’est sûre que si le `supplierProductId`, le `supplierVariantId`/SKU et le devis de fret sont encore valides au moment du test.

4. **Garder la politique client actuelle :** prix final unique en CHF ; aucun coût, devis, origine, transporteur ou diagnostic CJ visible au public ; produit non livrable masqué ; produit en rupture visible mais non ajoutable au panier.

5. **Conserver Stripe en mode Test.** Aucun basculement de clés Stripe ni de mode paiement n’est autorisé sans décision explicite du propriétaire.

6. **Odoo reste un miroir/back-office, pas la seule source de vérité.** MAZIGHO doit conserver les transitions de paiement et de fulfillment localement, même si Odoo est indisponible.

## Recommandation de prochaine itération

Commencer par une tâche dédiée de **remappage/révalidation CJ** : sélectionner un petit groupe de produits actifs, rafraîchir depuis CJ la variante et le fret suisse, puis exécuter un nouveau test Stripe Test → CJ sandbox sur une variante fraîchement confirmée. Cette étape doit rester sans paiement fournisseur et sans publication automatique.

Une fois au moins un brouillon CJ sandbox réellement créé avec succès, ajouter la réception de tracking CJ signée. Le paiement fournisseur réel ne devrait être étudié qu’après ce second jalon et une confirmation écrite séparée.
