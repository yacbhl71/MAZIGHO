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
| Correctif de recherche CJ | La destination client n’est plus envoyée à `product/listV2` ou `product/query` comme un filtre d’entrepôt CJ. Les candidats et variantes sont lus globalement ; seul le devis de fret décide ensuite, pays par pays, où le produit est livrable. |

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
| `server/cjDropshipping.ts` | Token CJ, fiche produit, stock, fret et devis. La destination client ne doit jamais filtrer la fiche ou la variante comme un entrepôt CJ ; elle est appliquée uniquement au devis de fret. |
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
| Pays de destination | Une ou plusieurs destinations parmi CH, FR, DE, IT, AT, BE, NL ou ES peuvent être cochées. Chaque produit conserve uniquement les profils de livraison rapides effectivement confirmés, pays par pays. |
| Nombre de produits | De 1 à 12 brouillons demandés au maximum par lancement. |
| Limite de brouillons | De 1 à 100 produits CJ non archivés maximum **par catégorie cochée**. La catégorie la plus proche de son plafond limite le lancement. |
| Poids maximum | De 50 g à 10 kg ; variante rejetée sans poids connu ou au-dessus du seuil. |
| Multiplicateur de prix | De 1,1 à 5 ; appliqué au coût produit + transport, arrondi commercialement à `.90` CHF. |
| Transport | Méthode explicitement nommée **CJPacket**, non postale/non économique, avec un délai connu de 15 jours maximum. |

Le prix final est calculé avec le fret fournisseur le plus élevé parmi les **profils effectivement validés**. Ainsi, le même prix public couvre les pays où le produit est visible, sans frais de livraison additionnels. Un produit sans profil de livraison validé pour un pays reste caché dans ce pays, mais peut être importé et visible dans les autres pays validés.

Les anciens lots fixes par catégories et le lot Mode restent intégralement disponibles dans le code, mais sont visuellement repliés dans **« Outils classiques / sauvegarde »**. Ils ne sont pas supprimés, mais ne doivent plus être le parcours par défaut.

Les fichiers clés sont `server/cjBatchImport.ts` pour le moteur, `server/adminRouter.ts` pour les validations et l’audit, `client/src/pages/admin/AdminSuppliers.tsx` pour l’interface, et `server/cjBatchImport.test.ts` pour le verrou du transport rapide.

> **Diagnostic important du 3 septembre 2026 :** un `countryCode` donné à `product/listV2` sert à filtrer le stock physique d’un entrepôt CJ, et non à vérifier qu’un produit peut être livré à un client de ce pays. Pour la Suisse, cette contrainte ramenait souvent le catalogue à zéro. La recherche doit être mondiale, puis chaque variante doit passer le calcul de fret vers les destinations cochées. Ne pas réintroduire ce filtre au stade de la recherche ou de la lecture de fiche.

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


## Gestion groupée des brouillons et tri chronologique

La page **Administration → Produits** permet désormais de sélectionner plusieurs **brouillons** à l’aide d’une case à cocher en début de ligne. La case de l’en-tête sélectionne ou désélectionne tous les brouillons visibles après application des filtres. Les produits actifs et archivés restent visibles dans la liste, mais leurs cases sont désactivées afin de ne jamais les inclure accidentellement dans une action par lot.

| Action | Règle serveur obligatoire |
|---|---|
| Modifier | La modification groupée peut appliquer une catégorie principale, un prix de vente ou un stock. Les champs laissés vides restent inchangés. Les titres, descriptions, images, traductions et profils de livraison restent réservés à l’édition individuelle. |
| Activer | L’activation exige qu’un brouillon ait un prix supérieur à zéro et au moins un profil de livraison validé. La procédure échoue entièrement si une fiche sélectionnée ne satisfait pas ces conditions. |
| Archiver | Les brouillons sélectionnés deviennent archivés et ne sont plus visibles dans la boutique. |
| Supprimer | Une confirmation explicite est requise côté interface. La suppression est définitive et nettoie les images, traductions, profils de livraison, associations de catégories et avis liés au brouillon. |

Toutes ces mutations sont protégées par `catalogEditorProcedure`, limitées à 100 identifiants et vérifient côté serveur que **tous** les éléments sélectionnés sont toujours à l’état `draft`. Elles créent une trace d’audit contenant l’opération et les identifiants concernés. Les procédures sont dans `server/adminRouter.ts`, les protections de données dans `server/db.ts`, et l’interface dans `client/src/pages/admin/AdminProducts.tsx`.

La liste Produits affiche également une colonne **« Créé le »** et un tri au choix : création récente ou ancienne, dernière modification, ou nom de A à Z. Le tri par création récente est le réglage par défaut.


## Préférences d’entrepôt et de transport du sourcing CJ

Le générateur sur-mesure accepte désormais des préférences supplémentaires, toujours appliquées **après** la recherche catalogue mondiale et au moment du devis par variante :

| Paramètre | Comportement sécurisé |
|---|---|
| Entrepôt CJ d’origine | L’administrateur peut conserver **tous les entrepôts compatibles** (valeur par défaut) ou cocher un ou plusieurs entrepôts renvoyés par CJ. Le moteur conserve seulement les variantes dont le pays d’origine confirmé correspond à la préférence. Cette sélection n’est jamais envoyée comme pays de destination à `product/listV2`. |
| Destination client | Les pays commerciaux cochés restent traités séparément. Un profil de livraison n’est créé que pour les pays où le devis CJ est réellement validé. |
| Modes de livraison | L’administrateur choisit une ou plusieurs familles : `CJPacket rapide`, `Express international` ou `Réseaux suivis rapides`. Le moteur compare toujours le nom et le délai reçus dans le devis réel ; les noms postaux, économiques, ordinaires ou explicitement non suivis sont exclus. |
| Suivi | L’API de devis CJ simple ne fournit pas de booléen de suivi universel. L’interface décrit donc ces choix comme des **familles de canaux nommés avec délai vérifié** ; elle ne doit pas promettre formellement le suivi client tant que CJ ne l’atteste pas dans les données reçues. |

Les entrepôts sont lus côté serveur via `getCjGlobalWarehouses()` avec cache de 30 minutes ; aucun jeton CJ n’est renvoyé au navigateur. La préférence est ensuite transmise uniquement à `quoteCjDelivery(..., originCountryCodes)` qui filtre les pays d’origine de la variante avant le calcul de fret. Les fichiers clés sont `server/cjDropshipping.ts`, `server/cjBatchImport.ts`, `server/adminRouter.ts` et `client/src/pages/admin/AdminSuppliers.tsx`.

> Ne jamais réintroduire un filtre d’entrepôt à partir du pays de destination client. Ce comportement est la cause connue des recherches CJ à zéro.


## Règles de sourcing CJ activables

Le générateur sur-mesure ne doit plus appliquer un ensemble opaque de filtres. Chaque sourcing contient désormais une structure `rules`, affichée dans le Hub fournisseurs, validée côté serveur et enregistrée dans l’audit. Les règles ci-dessous sont activées par défaut, mais l’administrateur peut les décocher pour un lancement donné :

| Règle | Effet lorsqu’elle est active | Effet lorsqu’elle est désactivée |
|---|---|---|
| `requireVerifiedPositiveStock` | Accepte uniquement une variante dont le stock CJ est explicitement positif. | Un brouillon peut être créé avec un stock nul ou non confirmé ; il restera naturellement non achetable tant que le stock n’est pas régularisé. |
| `enforceMaxWeight` | Écarte les variantes sans poids ou au-dessus du seuil configuré. | Le poids n’écarte aucun candidat. |
| `requireProductImages` | Écarte les fiches sans image CJ. | Un brouillon sans image peut être créé afin d’être complété manuellement. |
| `enforceSelectedShippingMethods` | Limite les devis aux familles de transport cochées. | Toute ligne disposant d’un devis peut être retenue, sous réserve du filtre de délai s’il est actif. |
| `enforceMaxDeliveryDays` | Écarte les délais au-dessus du seuil saisi, de 1 à 60 jours. | Aucun plafond de délai n’est appliqué. |

Les éléments suivants restent toujours impératifs et ne doivent pas devenir des interrupteurs : référence CJ exploitable, absence de doublon MAZIGHO, prix fournisseur strictement positif, devis de fret chiffré vers au moins un pays client, calcul d’un prix client final tout compris, création au statut `draft`, absence de publication et absence de commande/paiement fournisseur.

Le résultat du sourcing retourne désormais `rejections` avec les compteurs de doublons, variantes écartées par les règles de prix/poids, rejets stock/livraison et absence d’images. Lorsque zéro brouillon est créé, l’interface indique ces compteurs afin que l’opérateur sache quelle règle assouplir.


## Gestion groupée des produits à tous les statuts

La sélection par cases de la page **Administration → Produits** couvre maintenant les produits `draft`, `active` et `archived`, dans la limite de 100 éléments par opération. Les procédures correspondantes sont `admin.products.bulkArchive`, `bulkActivate`, `bulkUpdate` et `bulkDeleteArchived`.

| Action | Statuts pris en charge | Garde-fou serveur |
|---|---|---|
| Modifier | Brouillon, actif, archivé | Modification limitée à catégorie principale, prix et stock. |
| Activer / réactiver | Brouillon, archivé | Un prix strictement positif et au moins un profil de livraison validé restent obligatoires. |
| Archiver | Brouillon, actif | Les produits déjà archivés sont ignorés. |
| Supprimer définitivement | Archivé uniquement | L’archivage préalable est obligatoire ; la procédure refuse tout produit actif ou brouillon. |

L’interface affiche les statuts présents dans la sélection et désactive visuellement le bouton de suppression tant que toute la sélection n’est pas déjà archivée. Cette règle doit être conservée : elle permet la gestion des actifs et archivés sans faciliter une suppression définitive accidentelle.
