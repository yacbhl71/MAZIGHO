# Fondation multi-boutique MAZIGHO — étape 1

**Date :** 10 septembre 2026  
**Statut :** fondation technique publiée pour une migration progressive ; aucune boutique cliente, licence ni abonnement n’est créé par ce changement.

## Objectif atteint

Cette évolution introduit la notion de **boutique** dans le modèle MAZIGHO, sans déplacer ni modifier les produits, commandes, paiements, fournisseurs ou données visibles de la boutique actuelle.

| Élément | Comportement mis en place |
|---|---|
| Registre `stores` | Chaque future boutique disposera d’un identifiant, d’un slug, d’un domaine primaire, d’un statut opérationnel et d’un indicateur de boutique plateforme. |
| Droits `storeMemberships` | Un utilisateur peut appartenir à plusieurs boutiques avec un rôle propre à chacune : propriétaire, gestionnaire, catalogue, support, commandes, comptabilité ou lecture seule. |
| Compatibilité MAZIGHO | Une boutique générique `primary-store` est créée automatiquement pour contenir l’installation existante, sans identité personnelle codée dans le code source. Les administrateurs existants deviennent propriétaires de cette boutique de compatibilité. |
| Contexte serveur | Chaque requête tRPC résout une boutique à partir du domaine ; tant qu’aucun domaine client n’est enregistré, le comportement existant est conservé grâce au repli vers `primary-store`. |
| Premier périmètre isolé | Les journaux d’audit portent maintenant un `storeId`. Les entrées historiques sont rattachées à la boutique principale, et les lectures du journal sont filtrées par la boutique résolue. |

## Garanties de cette étape

- La boutique actuelle conserve le même comportement public, le même catalogue, les mêmes commandes et les mêmes réglages.
- Aucun secret Stripe, Odoo, TiDB, CJ ou AliExpress n’est lu, déplacé ou stocké par cette évolution.
- Aucun abonnement, aucun paiement récurrent, aucune suspension et aucune nouvelle boutique n’est créé.
- Les entrées d’audit d’une future boutique ne seront pas mélangées avec celles d’une autre boutique.
- Les états `setup`, `active`, `limited`, `suspended` et `closed` sont seulement préparés dans le registre ; ils ne bloquent pas encore l’accès public ni le checkout.

## Limites connues et prochaines étapes obligatoires

Cette étape est une fondation, **pas encore une isolation complète des données métier**. Les tables suivantes sont toujours globales et doivent être migrées, par familles, avec un filtre serveur `storeId` obligatoire :

1. identité et contenu : réglages, profil de design, bannières, campagnes, pages légales et traductions publiques ;
2. catalogue : catégories, produits, images, variantes, traductions et profils de livraison ;
3. relation client : paniers, avis, messages, promotions et rédemptions ;
4. opérations : commandes, lignes de commande, retours, comptabilité et fournisseurs ;
5. fichiers : clés de stockage et contrôle d’accès par boutique ;
6. console plateforme : création de boutique, invitation du premier propriétaire, domaine, état d’accès, licence et journal de plateforme.

> Ne pas créer une seconde boutique cliente avant que le premier périmètre métier — identité, contenu et catalogue — soit réellement isolé. Le registre et le contexte permettent de bâtir cette étape proprement, mais ne suffisent pas à eux seuls.

## Validation effectuée

- TypeScript sans erreur.
- Suite Vitest : 15 fichiers / 45 tests validés.
- Build de production Vite + serveur Node validé.
- Test dédié : normalisation de domaine et états de boutique servables.

## Étape 2 — identité, informations légales, contenu public et bannières

**Statut :** prête à publier. Cette étape isole le premier périmètre non transactionnel tout en conservant MAZIGHO comme boutique principale compatible.

| Famille | Comportement désormais appliqué |
|---|---|
| Réglages de boutique | La table `storeSettings` contient les réglages publics propres à une boutique. Elle est séparée de `settings`, qui reste volontairement réservé aux réglages globaux et techniques non concernés par cette étape. |
| Profil visuel | `design_profile`, y compris les libellés de navigation et leurs traductions, est lu et écrit par `storeId`. |
| Informations légales | `legal_profile` est lu et écrit par `storeId`. |
| Bannières | Toute liste, lecture par identifiant, création, modification, bascule d’état et suppression exige le périmètre de boutique ; un identifiant de bannière d’une autre boutique ne peut pas être modifié ou supprimé. |
| Traductions publiques | Les traductions du design, des bannières et des catégories sont indexées par `storeId`, type de contenu, identifiant de contenu et langue. Les traductions automatiques déclenchées en arrière-plan reçoivent le même périmètre. |
| Reprise de MAZIGHO | La migration `0021_store_identity_content_scope.sql` crée les structures, rattache les bannières et les traductions existantes à `primary-store`, et copie uniquement `design_profile` et `legal_profile` depuis les réglages globaux existants. |

La résolution par domaine est maintenant transmise aux routes publiques du design, des informations légales, des bannières et des catégories localisées, ainsi qu’aux routes d’administration correspondantes. Les appels historiques sans identifiant explicite restent compatibles exclusivement via un repli contrôlé vers `primary-store`.

> Cette étape ne déplace volontairement ni les secrets, ni Stripe, ni Odoo, ni CJ, ni les paramètres de calcul d’expédition, de devise ou de pixels. Elle ne crée aucune commande fournisseur, aucun paiement et aucune boutique cliente.

## Limites mises à jour et séquence suivante

L’identité et le contenu public sont maintenant prêts pour une boutique future, mais l’isolation globale reste incomplète. La prochaine famille obligatoire est le **catalogue** : catégories, produits, images, variantes, traductions produit et profils de livraison. Aucun second storefront client ne doit être créé avant que ces lectures et écritures soient réellement filtrées par `storeId`.

Les campagnes marketing, les devises, les politiques d’expédition, les pixels et les réglages techniques restent globaux à dessein : ils feront l’objet de décisions métier et migrations séparées, plutôt que d’être déplacés implicitement.

## Validation de l’étape 2

- TypeScript sans erreur.
- Suite Vitest : 15 fichiers / 45 tests validés.
- Build de production Vite + serveur Node validé.
- Vérification de diff sans erreur d’espacement.
- Le script de démonstration rattache désormais explicitement ses bannières à `primary-store`.
- Le correctif différé de visibilité des catégories n’est pas inclus dans ce périmètre.

## Étape 3 — catalogue, traductions et profils de livraison par boutique

**Statut :** prête à publier. Cette étape fait du catalogue le second périmètre métier isolé, sans créer de boutique cliente ni modifier les paiements, les commandes fournisseurs ou les secrets.

| Famille | Comportement désormais appliqué |
|---|---|
| Catégories | `categories.storeId` isole les slugs, l’ordre d’affichage, les lectures localisées et toutes les mutations d’administration. Les catégories créatives historiques restent créées uniquement pour `primary-store`. |
| Produits | `products.storeId` isole les slugs, la catégorie principale, les listes publiques, les fiches, les listes d’administration, les imports et les opérations de lot. Une création ou modification vérifie que la catégorie appartient à la même boutique. |
| Associations et médias | `productCategories` et `productImages` portent `storeId`. Les lectures groupées, remplacements et suppressions de médias ou catégories secondaires sont filtrés par la boutique active. |
| Traductions produit | `productTranslations` porte `storeId`; sa clé d’unicité est désormais `(storeId, productId, locale)`. Les traductions manuelles et automatiques, y compris les tâches asynchrones, conservent leur boutique d’origine. |
| Livraison et variantes | `productDeliveryProfiles` porte `storeId`. Les profils, les contrôles d’activation et les mises à jour de variantes CJ sont bornés au catalogue de la boutique active. Aucun sourcing, paiement ou ordre fournisseur n’est déclenché par ce changement. |
| Imports et panneau | Les imports CJ, AliExpress et les outils collaborateurs propagent le contexte de boutique jusqu’aux lectures de doublons, créations de brouillons, curation, mise à jour et archivage. |
| Storefront et panier | Les routes publiques transmettent la boutique résolue aux catégories, produits, images et traductions. Le panier n’affiche, n’ajoute, ne modifie et ne transforme en commande que les produits appartenant à la boutique active ; la structure transactionnelle du panier reste néanmoins à isoler dans sa propre étape. |
| Reprise de MAZIGHO | La migration `0022_store_catalog_scope.sql` ajoute et remplit `storeId` sur les six tables catalogue existantes en les rattachant à `primary-store`, puis remplace les unicités globales de slug par des clés composées par boutique. |

La migration SQL explicite demeure la voie normale de déploiement. Le bootstrap serveur applique les mêmes colonnes et index de manière idempotente seulement comme filet de compatibilité pour une instance existante qui démarrerait avant l’exécution manuelle de ses migrations.

> Les commandes, lignes de commande, paniers en tant qu’entités propres, avis, promotions, clients, messages, comptabilité et dossiers fournisseurs restent globalement structurés. Leur isolation transactionnelle n’est pas encore réalisée ; il ne faut donc toujours pas créer une boutique cliente ou considérer le multi-tenant comme terminé.

## Séquence obligatoire suivante

La prochaine famille est la **relation client et les transactions** : paniers par boutique, commandes et lignes, avis, promotions et rédemptions, messages, puis les opérations de paiement, Odoo, fournisseurs et comptabilité. Cette étape devra préserver strictement Stripe Test, l’absence de paiement CJ automatisé et le principe de validation humaine.

## Validation de l’étape 3

- TypeScript sans erreur.
- Suite Vitest : 15 fichiers / 45 tests validés.
- Build de production Vite + serveur Node validé.
- Vérification de diff sans erreur d’espacement.
- Le correctif différé de visibilité des catégories reste exclu du périmètre.
- Aucun produit, commande, paiement Stripe, synchronisation Odoo ou ordre fournisseur n’a été créé ou modifié pendant cette étape.

## Étape 4 — relation client, commandes et aperçu MAZIGHO Studio

**Statut :** prête à publier. Cette étape isole les données relationnelles et les frontières de commande nécessaires avant l’ouverture de boutiques clientes. Elle ajoute aussi une première visualisation protégée de la future plateforme, sans créer de boutique, abonnement, paiement ni action fournisseur.

| Famille | Comportement désormais appliqué |
|---|---|
| Paniers | `carts` et `cartItems` portent `storeId`. Un même client possède donc un panier séparé pour chaque storefront, et chaque ligne est vérifiée contre le catalogue de la boutique active. |
| Relation client | Les avis et messages de contact sont créés, affichés, modérés et agrégés par boutique. Les relances de paniers abandonnés utilisent le même périmètre. |
| Promotions | Les codes, leurs limites, les rédemptions et leur validation au checkout sont propres à une boutique. Un même code peut donc exister dans deux boutiques sans être partagé. |
| Commandes | `orders`, `orderItems`, `orderDecisions` et `returnRequests` portent `storeId`. Les listes client et administration, les lignes, les décisions, les chronologies, les retours et les tableaux de bord sont filtrés par boutique. |
| Stripe Test | Le mode Test, les clés et la logique de vérification ne changent pas. Le retour navigateur vérifie en plus que la session Stripe correspond bien au client et à la boutique résolue. Les webhooks restent des entrées serveur globales, car ils n’ont pas de domaine de storefront, mais ne peuvent rapprocher qu’une session locale existante. |
| CJ sandbox | Le déclencheur administratif de préparation sans débit vérifie d’abord la commande dans la boutique active. Les règles de stock, transport, marge, absence de paiement CJ et validation humaine sont conservées. |
| Reprise de MAZIGHO | La migration `0023_store_relationship_scope.sql` rattache les données existantes à `primary-store`, adapte l’unicité du panier et des promotions, puis crée les index de recherche par boutique. |

### Première matérialisation du SaaS

La route protégée `/admin/studio` affiche désormais **MAZIGHO Studio**, distinct du panneau d’administration quotidien. Elle rappelle la séparation cible entre votre console opérateur — parc de boutiques, mises en service, états d’accès et accompagnement — et le futur panneau propriétaire d’un client, concentré sur sa marque, son catalogue, ses commandes et sa relation client.

Trois aperçus clairement étiquetés **« simulation locale non publiée »** rendent la différence visible : une boutique animalière, une boutique de bijoux et une boutique de vêtements. Ils changent l’univers, les catégories et les priorités métier, pas la sécurité ni l’ossature e-commerce. Aucune donnée fictive n’est stockée et aucun storefront n’est créé par ces aperçus.

L’entrée de navigation MAZIGHO Studio est visible uniquement lorsque la boutique résolue est la boutique plateforme (`isPlatformStore`) et que l’utilisateur possède le rôle administrateur global. Les propriétaires et collaborateurs de futures boutiques clientes ne voient donc pas cet accès. Le routeur `workspace.getCurrent` expose uniquement le contexte de boutique et l’appartenance active nécessaires à cette séparation visuelle ; il n’expose aucun secret, paiement, client ni catalogue inter-boutique.

> Les dossiers fournisseurs, les écritures comptables et la configuration technique Stripe/Odoo/CJ restent encore structurés globalement. Ils constituent la prochaine étape obligatoire avant de créer une première boutique cliente réelle. Les aperçus Studio ne doivent pas être confondus avec un système d’abonnement ou de licence déjà actif.

## Validation de l’étape 4

- TypeScript sans erreur.
- Suite Vitest : 15 fichiers / 45 tests validés.
- Build de production Vite + serveur Node validé.
- Vérification de diff sans erreur d’espacement.
- Aucune clé Stripe, Odoo, CJ, TiDB ou AliExpress n’a été déplacée, affichée ou écrite.
- Aucun paiement, remboursement, synchronisation Odoo, produit, commande fournisseur ou boutique cliente n’a été créé pendant cette étape.

## Séquence suivante obligatoire

Avant la première boutique cliente réelle, isoler les **opérations de plateforme restantes** : dossiers et tâches fournisseurs, journalisation opérationnelle associée, comptabilité, paramètres techniques d’exécution et règles explicites d’accès de propriétaire/gestionnaire par boutique. L’inventaire réel des boutiques, leurs accès limité/suspendu/révoqué, l’invitation du premier propriétaire et la couche de licence pourront ensuite être ajoutés progressivement dans MAZIGHO Studio.

## Correctif d’urgence — reprise des associations catalogue héritées

**Statut :** publié dans `763a3f8` après le constat d’un écran d’administration bloqué lors du passage de `productCategories.storeId` en colonne obligatoire.

Une association secondaire de catégorie peut survivre à la suppression du produit auquel elle était historiquement liée. Le bootstrap et la migration `0022_store_catalog_scope.sql` appliquent désormais une seconde reprise vers `primary-store` lorsque la jointure initiale par produit ne permet pas de déterminer une boutique. Cette mesure conserve les enregistrements historiques sans supprimer de produit, de catégorie, de commande ou de fichier ; elle évite qu’une donnée ancienne et isolée bloque tout le catalogue.

> Toute future migration qui rend `storeId` obligatoire sur une table liée à un parent doit prévoir un repli déterministe pour les lignes historiques dont le parent n’est plus disponible.

Les vérifications locales du correctif ont validé TypeScript, les 45 tests Vitest, le build de production et `git diff --check`. Le déploiement Vercel est laissé à son exécution normale, sans boucle de sondage.

---

## Étape 5 — opérations par boutique et séparation des contrôles de plateforme

**Statut :** travail local en cours, non publié. Cette étape isole les tâches de préparation fournisseur sandbox, les dossiers fournisseurs, écritures comptables et campagnes temporelles, puis réserve les contrôles techniques transversaux à MAZIGHO Studio. Elle ne modifie ni les clés d’environnement, ni Stripe Test, ni la politique de paiement fournisseur.

| Élément | Cible de l’étape |
|---|---|
| Tâches CJ sandbox et dossiers fournisseurs | Dériver `storeId` de la commande locale et filtrer toutes les lectures et états par boutique. |
| Comptabilité et TVA | Isoler les dépenses, justificatifs, exports et agrégats de ventes par boutique. |
| Campagnes | Filtrer les campagnes temporelles et le code promotionnel associé par storefront. |
| Contrôles techniques | Réserver les statuts, tests et actions Odoo/Make globaux à la boutique plateforme MAZIGHO Studio. |

Les paramètres publics de devise, livraison et pixels nécessiteront leur propre migration vers `storeSettings` avant l’ouverture d’une première boutique cliente. Les secrets et accès Stripe, Odoo, CJ, TiDB et fournisseurs resteront hors base de données et hors interface client.

---

## Étape suivante avant la première boutique cliente

Finaliser, tester et publier le périmètre opérationnel ; migrer les préférences publiques restantes par boutique ; puis créer dans MAZIGHO Studio la gestion réelle, à accès opérateur, du parc de boutiques et de l’invitation de leur premier propriétaire. Les états licence, grâce, limitation et révocation ne doivent pas être activés tant que leur mécanisme de décision est formellement défini et testé.

---

## Étape 6 — MAZIGHO Studio : inventaire opérateur réel en lecture seule

**Statut :** prête à publier. MAZIGHO Studio ne se limite plus à des aperçus visuels : la console interroge désormais le registre réel des boutiques dans un périmètre strictement opérateur. Aucune boutique cliente n’est créée, invitée ou modifiée par cette étape.

| Élément affiché dans Studio | Règle de sécurité appliquée |
|---|---|
| Registre de boutiques | Nom, domaine, slug, statut et marqueur plateforme uniquement. |
| Préparation | État informatif du profil initial, sans détail de contenus ni de configuration. |
| Membres | Compteurs agrégés de membres et propriétaires actifs, sans identité, e-mail ou compte. |
| Catalogue | Compteurs agrégés de produits et produits actifs, sans révéler les fiches d’une autre boutique. |
| Commandes | Compteurs et date de dernière commande seulement, sans client, montant, ligne ou adresse. |
| États d’accès | `setup`, `active`, `limited`, `suspended` et `closed` sont visibles comme signaux de pilotage ; aucune suspension ou licence automatique n’est activée. |

La procédure `admin.studio.getInventory` est protégée par `platformProcedure`. Elle exige à la fois un administrateur global et le contexte de la boutique plateforme. Le test `platformProcedure.test.ts` confirme qu’un administrateur d’une future boutique cliente reçoit une interdiction pour l’inventaire Studio comme pour les contrôles techniques.

Les aperçus animalier, bijoux et vêtements restent volontairement des modèles non publiés. Ils servent à présenter l’adaptation de la marque, des collections et des priorités métier, mais ne créent ni données, ni domaine, ni client.

> La prochaine étape fonctionnelle est une mise en service guidée et explicitement confirmée : création d’une boutique, statut `setup`, invitation du premier propriétaire et rattachement de son domaine. Elle ne doit pas être lancée avant une validation séparée du parcours et de la gouvernance des accès.

---

## Étape 7 — mise en service guidée : brouillon opérateur sans activation

**Statut :** prête à publier. MAZIGHO Studio dispose maintenant d’un formulaire de préparation pour une future boutique. Il enregistre un **brouillon local** dans `storeProvisioningDrafts`, table distincte de `stores`.

| Information préparée | Finalité | Ce qui n’est pas fait |
|---|---|---|
| Nom, domaine souhaité, univers métier et devise | Préparer le cadrage du storefront et de l’offre | Aucun domaine n’est vérifié, réservé ou rattaché. |
| Nom et e-mail du futur propriétaire | Préparer le futur parcours de propriété | Aucun compte, lien ou e-mail d’invitation n’est créé ou envoyé. |
| Notes de préparation | Conserver les contraintes de lancement | Aucun catalogue, contenu, produit ou profil n’est copié. |
| État `draft` | Rendre la proposition visible dans MAZIGHO Studio | Aucun `storeId`, membership, licence, accès ou statut de storefront n’est activé. |

La création d’un brouillon exige une case de compréhension dans l’interface et est protégée par `platformProcedure`. Le test de sécurité confirme qu’un administrateur d’une boutique cliente ne peut ni consulter ni créer de brouillon de plateforme.

> La prochaine étape à ne lancer qu’avec confirmation explicite est la transformation contrôlée d’un brouillon en boutique réelle : vérification de disponibilité du domaine, création du registre `stores` avec état `setup`, attribution du premier propriétaire, puis invitation séparée. Cette opération devra comporter une confirmation visible et ne devra jamais utiliser ou exposer de secrets techniques.

---

## Étape 8 — revue locale des brouillons de mise en service

**Statut :** prête à publier. Chaque brouillon de mise en service possède désormais une revue opérateur calculée localement dans MAZIGHO Studio.

| Critère de revue | Règle | Limite volontaire |
|---|---|---|
| Identité | Nom de la future boutique renseigné | Ne crée aucun slug ni storefront. |
| Propriétaire | Nom et format d’e-mail renseignés | Ne crée pas de compte et n’envoie aucune invitation. |
| Univers et devise | Univers métier et devise de départ supportée | Ne copie aucun profil, catalogue ou réglage. |
| Domaine | Vérifie uniquement le format et les doublons dans les brouillons locaux | Ne vérifie pas la disponibilité réelle, ne réserve et ne rattache aucun domaine. |
| Lancement | Restitue explicitement les vérifications réservées au lancement | Ne crée aucune boutique, membership, licence, paiement ou intégration. |

Le statut `ready_for_confirmation` de la revue signifie seulement que les données internes du brouillon sont cohérentes. Il **ne constitue pas** une autorisation de lancement. La transformation en boutique réelle reste une opération future distincte, protégée par une confirmation explicite et des contrôles de domaine, de propriété et d’accès.

Les tests `storeProvisioningReview.test.ts` couvrent une préparation locale complète, les données incomplètes et un conflit entre deux brouillons. Aucune requête réseau ni vérification auprès d’un registrar n’est réalisée par cette étape.

---

## Étape 9 — prévol de lancement d’une boutique offerte

**Statut :** prête à publier. MAZIGHO Studio permet désormais de sélectionner un brouillon et d’afficher un **prévol de boutique offerte**. Ce prévol est une lecture interne protégée ; il ne crée aucune boutique.

| Élément contrôlé localement | Résultat du prévol | Limite appliquée |
|---|---|---|
| Brouillon | Réutilise sa revue locale et son univers métier | Ne modifie pas son statut et ne copie aucun contenu. |
| Slug | Propose un slug normalisé et cherche un conflit dans `stores` | N’insère pas de boutique dans le registre. |
| Domaine | Cherche uniquement un domaine déjà utilisé dans le registre MAZIGHO | Ne vérifie pas la disponibilité publique, DNS ou registrar. |
| Bénéficiaire | Indique si l’e-mail correspond déjà à un compte local | Ne crée pas de compte, membership, token ou invitation. |
| Offre | Affiche un lancement prévu en mode « boutique offerte », état futur `setup`, sans facturation | Aucun abonnement, licence, prélèvement ou paiement n’est configuré. |

Le prévol conserve toujours deux contrôles comme **en attente** : la disponibilité/raccordement réel du domaine et la confirmation explicite de lancement. Même un prévol sans conflit local ne peut donc pas créer une boutique, attribuer un propriétaire ni envoyer une invitation.

Les tests `storeLaunchPreflight.test.ts` couvrent le cas d’une offre localement cohérente, les collisions de slug et de domaine, ainsi que la normalisation du slug. La garde `platformProcedure` bloque aussi la lecture de prévol depuis une boutique cliente.

> Lorsque vous souhaiterez effectivement offrir une première boutique, il faudra fournir ou vérifier le nom de la boutique, le domaine, le nom et l’e-mail du bénéficiaire, puis confirmer explicitement la création. Cette action future devra utiliser une transaction atomique, créer la boutique en état `setup`, attacher le propriétaire ou préparer une invitation séparée, sans activer de facturation.

---

## Étape 10 — création contrôlée d’une boutique offerte

**Statut :** prête à publier. Un brouillon disposant d’un prévol local sans conflit peut désormais être transformé en **vraie boutique locale**, après confirmation écrite exacte du nom de marque et case de compréhension dans MAZIGHO Studio.

La transaction `provisionGiftStoreFromDraft` applique les garde-fous suivants dans une seule transaction :

| Action locale réalisée | Garantie |
|---|---|
| Création d’une boutique | Statut forcé à `setup` ; elle ne doit pas servir le storefront public. |
| Domaine et slug | Conflits internes revérifiés dans la transaction avant insertion. |
| Brouillon source | Réclamé puis lié à `provisionedStoreId` et `provisionedAt`, empêchant un second lancement. |
| Bénéficiaire ayant déjà un compte | Une appartenance `owner` est créée dans la transaction. |
| Bénéficiaire sans compte | Aucun compte ni token n’est créé ; `invitationRequired` est seulement signalé. |
| Préférences initiales | Seuls le mode `gift`, le brouillon source et la devise sont enregistrés par boutique. |

> Aucun e-mail, lien d’invitation, paiement, abonnement, licence, appel Stripe, synchronisation Odoo, opération CJ, réservation de domaine ou vérification DNS n’est effectué par cette action.

Les routes storefront, panier, promotions et checkout Stripe Test utilisent désormais le garde-fou `mayServeStorefront`. Une boutique `setup` reçoit une erreur d’accès avant toute lecture de catalogue ou action transactionnelle. Le test `storefrontSetupGuard.test.ts` couvre cette frontière.

La prochaine étape, lorsqu’un véritable bénéficiaire devra recevoir son accès, consiste à préparer une **invitation distincte et explicitement confirmée**. Elle ne devra être proposée qu’après contrôle manuel du domaine et, selon le parcours choisi, de l’identité du propriétaire.

---

## Étape 11 — propriétaire et invitation différée d’une boutique offerte

**Statut :** prête à publier. MAZIGHO Studio peut maintenant sélectionner une boutique offerte en état `setup`, lire son propriétaire prévu et préparer son accès sans expédier d’e-mail.

| Situation du bénéficiaire | Action locale contrôlée | Ce qui n’est pas exécuté |
|---|---|---|
| Compte déjà actif | Son appartenance `owner` est ajoutée à la boutique, après confirmation de l’e-mail | Aucun message, paiement ou changement du statut public. |
| Aucun compte | Un compte local `pending_invitation`, une appartenance propriétaire et un jeton d’invitation de 24 heures sont créés dans une transaction | Aucun e-mail n’est envoyé ; aucun lien n’est transmis automatiquement. |
| Invitation déjà préparée | Le prévol indique une invitation locale en attente | Aucun nouveau lien n’est généré silencieusement. |

Le lien d’invitation brut n’est renvoyé qu’à l’opérateur Studio après la confirmation d’e-mail et une case de compréhension dans l’interface. Il peut être copié puis transmis manuellement par l’opérateur après vérification de l’identité du bénéficiaire. Il n’est jamais ajouté aux journaux d’audit.

> Cette étape ne rend jamais la boutique publique. Avant une future activation, le propriétaire doit pouvoir accéder à la boutique, le domaine doit être contrôlé et raccordé, le profil/catalogue doivent être finalisés et une activation distincte doit être explicitement confirmée.

---

### Récupération d’un lien manuel non copié

Une invitation locale en attente ne bloque plus l’opérateur si le lien brut n’a pas été copié avant la fermeture de la console. MAZIGHO Studio propose **« Régénérer le lien manuel »** après confirmation de l’e-mail du bénéficiaire. Cette action invalide atomiquement l’ancien jeton, crée un nouveau lien de 24 heures et ne déclenche toujours aucun e-mail. Elle reste limitée à une boutique offerte en `setup`, à son propriétaire `pending_invitation` et à son appartenance `owner` déjà vérifiée.

---

## Étape 12 — prévol d’activation publique contrôlée, univers animalier

**Statut :** prêt à publier. MAZIGHO Studio affiche désormais une revue finale réservée aux boutiques offertes en `setup`. Le premier univers retenu est **animalier** ; un brouillon d’un autre univers est volontairement bloqué dans ce prévol.

| Contrôle local | Condition évaluée | Effet si incomplet |
|---|---|---|
| Boutique et origine | État `setup`, provenance cadeau, brouillon animalier source | La revue d’activation reste bloquée. |
| Propriétaire | Compte actif et appartenance `owner` | La boutique reste privée et son bénéficiaire doit terminer son accès. |
| Domaine | Format public (ni `.local`, ni `.test`) | La boutique ne peut pas être considérée prête localement. |
| Identité et légal | Profils distincts de MAZIGHO, marque et e-mail de support renseignés | Évite de publier l’identité ou la légale par défaut. |
| Catalogue | Au moins une catégorie et un produit actif | Le propriétaire doit vérifier la cohérence effective avec l’univers animalier. |
| Devise | Valeur propre à la boutique | La préparation commerciale reste incomplète. |

Deux contrôles restent **toujours manuels** : le raccordement effectif du domaine (DNS, Vercel, accès réel) et la confirmation explicite de l’opérateur. Le prévol est en lecture seule : aucune procédure de ce commit ne modifie `stores.status`, ne sert le storefront, n’ouvre un panier ou ne crée une session Stripe.

> Le futur passage `setup → active` devra être une mutation séparée, atomique, réservée à MAZIGHO Studio, avec relecture du prévol, confirmation forte et audit. Il ne doit jamais être automatisé.

---

## Étape 13 — mutation atomique d’activation publique, boutique offerte animalière

**Statut :** prête à publier. MAZIGHO Studio dispose maintenant d’une mutation distincte `activateGiftAnimalStore`, réservée à la boutique plateforme. Elle n’est jamais appelée automatiquement ; elle ne devient accessible dans l’interface que lorsqu’un prévol local complet est affiché.

La transaction relit les conditions au moment exact de l’activation : boutique non plateforme encore en `setup`, provenance cadeau, brouillon source `animalier`, propriétaire actif correspondant à l’e-mail confirmé, identité et légal propres, devise, catégorie et produit actif. Elle exige aussi la recopie du nom de boutique, la confirmation manuelle du domaine et une seconde confirmation d’ouverture. Le changement `setup → active` utilise une condition de statut dans la requête ; un conflit concurrent annule l’opération.

Une trace non sensible `public_activation_record` est enregistrée avec l’horodatage et le fait que le domaine a été confirmé manuellement. Les données d’audit ne conservent pas le lien d’invitation ni l’e-mail recopié. Aucun paiement, abonnement, e-mail, produit, commande fournisseur, synchronisation Odoo ou appel de domaine externe n’est déclenché.

> La confirmation DNS/Vercel reste volontairement humaine. La plateforme vérifie uniquement la cohérence locale et ne doit pas prétendre confirmer une résolution publique qu’elle n’a pas contrôlée.

---

## Correctif urgent — index global de catégories absent

Une installation déjà migrée pouvait ne plus posséder l’index historique `categories_slug_unique`. Le bootstrap runtime tentait encore de le supprimer avec une instruction non idempotente, ce qui bloquait toutes les lectures catalogue avant même l’affichage des produits.

Le correctif utilise désormais `DROP INDEX IF EXISTS` pour les anciens index globaux des catégories, produits et traductions. Il ne modifie aucune ligne de catégorie, aucun produit, aucune commande ni aucun réglage : les index composés par boutique existants restent la structure cible. Cette précaution doit être conservée dans toute reprise ou migration multi-boutique future.

---

### Stabilisation complémentaire

Le premier correctif empêchait l’échec si un ancien index global avait déjà disparu. Les captures suivantes ont montré un second cas : après cette suppression, une requête serverless pouvait tenter de recréer l’index composé déjà présent. Le bootstrap catalogue transforme maintenant toutes ses créations d’index en `CREATE INDEX IF NOT EXISTS` ou `CREATE UNIQUE INDEX IF NOT EXISTS`.

Cette seconde correction ne modifie aucune donnée ; elle évite seulement qu’un rafraîchissement répété du panneau retente une création d’index déjà réalisée.

---

## Kit de démonstration animalier pour une boutique offerte en setup

Le parcours Studio inclut désormais un kit de démonstration uniquement pour une boutique offerte issue d’un brouillon `animalier` et encore en état `setup`. Avec une confirmation explicite du nom de boutique, il enregistre une identité propre à **Pattes & Compagnie**, les catégories **Chiens**, **Chats** et **Promenade**, ainsi qu’une fiche explicitement libellée comme démonstration. Le kit ne crée ni fournisseur, ni image, ni prix commercial, ni stock vendable, ni méthode de livraison, ni e-mail, ni paiement, ni commande CJ ou Odoo.

L’installation du kit ne modifie jamais le statut `setup`. Les routes publiques, panier et checkout restent bloqués jusqu’aux prévols, au raccordement d’un domaine public et à la confirmation d’activation séparée.

- Procédure : `admin.studio.installGiftPetDemoSetup`, réservée à `platformProcedure`.
- Condition : boutique offerte animale en `setup`, liée à son brouillon Studio.
- Suivi : audit `studio.gift_store.pet_demo.install`, sans secrets, liens, paiement ni action externe.



### Copie autorisée des coordonnées légales — Pattes & Compagnie

Pattes & Compagnie demeure en état `setup` et peut recevoir, après confirmation explicite de l’opérateur, une copie des coordonnées légales déjà présentes dans la boutique plateforme MAZIGHO. Cette opération est strictement réservée à MAZIGHO Studio, exige la recopie du nom de la boutique et une case de confirmation. Elle ne modifie jamais MAZIGHO, ne lance aucun e-mail, paiement, fournisseur ou activation publique, et conserve une trace interne de la source et de l’instant de copie. Toute ouverture publique exige toujours un domaine réel, vérifié manuellement, et une confirmation d’activation distincte.

Pour Pattes & Compagnie, l’opérateur a explicitement autorisé cette réutilisation de ses coordonnées existantes. Aucune valeur personnelle n’est recopiée dans ce document de passation.

### Correctif de cohérence du prévol légal — 10 septembre 2026

La copie autorisée du profil légal de la boutique plateforme vers une boutique offerte en `setup` a mis en évidence un écart de contrat : le prévol et la mutation d’activation lisaient des clés historiques (`companyName`, `supportEmail`), alors que le profil légal réellement enregistré utilise `operatorName` et `contactEmail`. Le contrôle s’appuie désormais sur ces clés persistées et compare aussi les valeurs de référence, afin qu’une copie légale valide soit reconnue sans faux blocage. Ce correctif n’active aucune boutique et ne remplace pas la vérification manuelle du domaine.

> Les coordonnées publiées pour MAZIGHO sont réutilisables vers une boutique offerte seulement après autorisation opérateur explicite ; Pattes & Compagnie demeure en `setup` jusqu’à l’activation finale.


---

## Aperçu privé Studio — Pattes & Compagnie sans ouverture publique

**Statut :** prêt à publier. MAZIGHO Studio propose désormais une visualisation privée en lecture seule pour une boutique offerte préparée, notamment **MAZIGHO PET’S — Pattes & Compagnie**. Cette vue utilise la route d’administration `/admin/studio/apercu/:storeId` et ne dépend ni du domaine configuré de la boutique ni des procédures storefront publiques.

| Élément affiché | Limite appliquée |
|---|---|
| Identité visuelle | Nom de marque, message, palette et logo éventuel issus du profil propre à la boutique. |
| Catalogue de démonstration | Catégories et fiches actives limitées à la boutique demandée ; aucun prix, stock, fournisseur, variante, livraison ou donnée interne n’est retourné. |
| État de la boutique | Le snapshot indique explicitement `privatePreview: true` et `publicStorefront: false`, ainsi que l’état opérationnel et la devise. |
| Accès | La lecture `admin.studio.getPrivateStorefrontPreview` est protégée par `platformProcedure`; un administrateur d’une boutique cliente est refusé. |

La page est rendue dans `DashboardLayout`, avec un bandeau **« Aperçu privé Studio — non public »**, un retour explicite vers Studio et des commandes de vente visuellement désactivées. Elle ne charge pas de pixels marketing, ne contient aucun panier, checkout, lien vers un domaine de boutique ou action commerciale.

> L’aperçu ne modifie jamais l’état `setup`, n’active aucun domaine et ne crée ni paiement, ni commande, ni e-mail, ni fournisseur, ni synchronisation Odoo. Les routes storefront, panier, promotions et Stripe Test restent soumises au garde-fou public existant.

Les contrôles de cette étape ont validé TypeScript, 57 tests Vitest, le build de production et la frontière de sécurité du nouvel endpoint.


---

## Kits de démonstration Studio — bijoux et vêtements

**Statut :** prêt à publier. MAZIGHO Studio peut désormais préparer un kit de démonstration pour une boutique offerte **bijoux** ou **vêtements** déjà créée en état `setup`. Le kit animalier existant est inchangé ; cette extension prépare les deux autres univers déjà visibles dans les simulations Studio.

| Univers | Contenu non commercial installé | Ce qui reste absent |
|---|---|---|
| Bijoux | Profil visuel éditorial, catégories Nouveautés / À offrir / Essentiels et une fiche de pendentif de démonstration. | Images, variantes, prix, stock, fournisseur, transport, paiement et commandes. |
| Vêtements | Profil visuel mode, catégories Nouveautés / Femme / Homme et une fiche de veste de démonstration. | Images, tailles, prix, stock, fournisseur, transport, paiement et commandes. |

Les kits sont listés seulement pour les boutiques offertes, non plateforme, en état `setup`, dont le brouillon source indique l’univers concerné. Leur installation exige la recopie exacte du nom de la boutique et une case de compréhension. Chaque kit est **à usage unique** : un second lancement est refusé afin de ne jamais remplacer une personnalisation ultérieure.

Les procédures `admin.studio.getGiftRetailDemoSetupCandidates` et `admin.studio.installGiftRetailDemoSetup` sont protégées par `platformProcedure`. L’inventaire de kits et leur installation sont donc refusés depuis une boutique cliente, comme le confirme le test de frontière Studio.

> Un kit prépare uniquement des données locales de présentation. Il ne crée pas de boutique, n’utilise pas de domaine, ne modifie pas l’état `setup`, n’envoie pas d’e-mail et ne déclenche ni Stripe Test, ni Odoo, ni CJ, ni action fournisseur.


---

## Suivi privé de préparation — portefeuille de boutiques offertes

**Statut :** prêt à publier. MAZIGHO Studio ajoute un suivi de préparation **en lecture seule** pour chaque boutique offerte encore en état `setup`, quel que soit l’univers pris en charge : animalier, bijoux ou vêtements.

| Contrôle synthétisé | Donnée retournée | Limite appliquée |
|---|---|---|
| Boutique et origine | État `setup` et provenance « boutique offerte ». | N’expose ni domaine, ni propriétaire, ni brouillon source détaillé. |
| Univers, identité et catalogue | État de préparation de l’univers, du profil visuel et de la base catalogue. | Ne retourne ni image, prix, stock, variante, fournisseur ou transport. |
| Devise, accès et légal | États de présence de la devise, d’un propriétaire actif et des informations légales. | Ne retourne aucune coordonnée, adresse, e-mail, compte ou contenu légal. |
| Ouverture publique | Rappel de contrôle manuel hors de ce module. | Aucun DNS, domaine, panier, paiement ou activation n’est évalué ou modifié. |

La procédure `admin.studio.getGiftStoreSetupReadiness` est réservée à `platformProcedure`, comme les aperçus privés. Elle appelle un calculateur pur et retourne seulement des états `prêt`, `à compléter` ou `à vérifier`. Le suivi ne remplace pas le prévol d’activation animalier existant : il permet de piloter la préparation des trois univers sans étendre l’autorisation d’ouvrir une boutique publiquement.

> Le choix d’une boutique dans le suivi ne produit aucun effet. La boutique demeure en `setup`, le storefront demeure fermé, et aucune action Stripe Test, Odoo, CJ, fournisseur, e-mail ou domaine n’est effectuée.

Les tests dédiés garantissent notamment que `publicStorefront` reste toujours `false`, qu’un univers non pris en charge ne peut pas être considéré prêt pour l’aperçu et qu’un administrateur de boutique cliente est refusé par la frontière Studio.


---

## Aperçu Studio du futur panneau propriétaire

**Statut :** prêt à publier. Depuis le suivi privé de préparation, l’opérateur peut désormais ouvrir `/admin/studio/espace-proprietaire/:storeId` pour visualiser la forme du futur panneau quotidien d’une boutique offerte en `setup`.

| Zone de l’aperçu | Ce qui est visualisé | Ce qui demeure exclu |
|---|---|---|
| Navigation propriétaire | Pilotage, catalogue, marque et contenu, commandes et réglages de boutique. | MAZIGHO Studio, infrastructure, autres boutiques, secrets et contrôles de plateforme. |
| Données de boutique | Identité visuelle, catégories, fiches non commerciales, devise et états synthétiques de préparation. | Coordonnées, membres, clients, commandes réelles, prix, stock, fournisseurs, transport et paiements. |
| Frontière publique | Lien vers l’aperçu storefront privé déjà existant. | Domaine public, panier, checkout, pixels marketing et actions de vente. |

Cette page ne dispose d’aucune mutation et réutilise exclusivement les snapshots `getPrivateStorefrontPreview` et `getGiftStoreSetupReadiness`, tous deux protégés par `platformProcedure`. Le garde visuel de `DashboardLayout` couvre également cette sous-route Studio, mais la protection côté serveur reste l’autorité.

> L’aperçu permet de démontrer la séparation cible : le propriétaire gérera uniquement sa boutique et son équipe, tandis que l’opérateur conserve MAZIGHO Studio et les décisions de plateforme. Cette étape ne crée ni compte, ni rôle, ni permission, ni invitation, ni ouverture publique.


---

## Remplacement contrôlé du domaine interne d’une boutique offerte

**Statut :** prêt à publier. MAZIGHO Studio propose maintenant le remplacement contrôlé du domaine interne d’une boutique offerte, via `admin.studio.updateGiftStorePrimaryDomain`.

| Garde-fou | Règle appliquée |
|---|---|
| Rôle | La mutation est strictement limitée à `platformProcedure`. |
| Éligibilité | La boutique doit être non plateforme, provenir du parcours « offerte » et être encore en état `setup`. |
| Domaine | Seul un nom de domaine public valide est accepté ; `.local` et `.test` sont explicitement refusés. |
| Collision | Le domaine ne peut pas être déjà attribué à une autre boutique enregistrée. |
| Confirmation | L’opérateur doit recopier exactement le nom de la boutique et cocher une confirmation explicite. |
| Effet | Seul `stores.primaryDomain` est remplacé ; le statut reste `setup`. |

La mutation génère une trace d’audit non sensible contenant les anciens et nouveaux noms de domaine, sans donnée de client ou de secret. Elle ne rend pas le storefront public, ne touche pas au panier, à Stripe Test, Odoo, CJ, fournisseur, e-mail ou commande.

> Le raccordement Vercel et le certificat HTTPS sont prérequis techniques distincts. Même après remplacement du domaine local, une boutique reste privée tant que l’opérateur ne confirme pas ultérieurement l’activation publique séparée.


---

## Historique privé de préparation d’une boutique offerte

**Statut :** prêt à publier. MAZIGHO Studio dispose d’un historique de préparation en lecture seule par boutique offerte. Il est disponible via `admin.studio.getGiftStoreActivityTimeline` et est protégé par `platformProcedure`.

| Élément | Règle appliquée |
|---|---|
| Éligibilité | Seules les boutiques non plateforme, issues du parcours « offerte », peuvent être consultées. |
| Sources | L’historique ne retient que les jalons Studio explicitement reconnus : préparation, parcours propriétaire, kit, profil légal, domaine et éventuelle bascule de statut. |
| Données retournées | Nom de la boutique, statut, type de jalon, libellé fixe, description fixe et date. |
| Données exclues | Résumés bruts d’audit, métadonnées, acteur, utilisateur, e-mail, coordonnées légales, client, commande, prix, paiement, fournisseur et intégration. |
| Effet | Lecture seule : aucun statut, domaine, accès, panier, paiement, e-mail, Stripe, Odoo, CJ ou fournisseur n’est modifié. |

Les libellés affichés sont contrôlés par le code et ne reprennent jamais les textes bruts de journalisation. Cette règle évite qu’une donnée ajoutée à un audit ultérieur soit exposée automatiquement dans Studio.


---

## Correctif prioritaire — fermeture globale des domaines de boutiques en `setup`

**Statut :** prêt à publier. Une vérification sur `animalerie.mazigho.ch` a montré qu’une procédure storefront refusait déjà correctement une boutique en `setup`, mais que l’application cliente continuait de rendre ses valeurs visuelles par défaut MAZIGHO après cette erreur. Ce comportement pouvait donner l’impression que la boutique plateforme était servie par le sous-domaine d’une boutique non ouverte.

| Couche | Correctif appliqué |
|---|---|
| Signal serveur | `storefront.getAvailability` retourne uniquement deux indicateurs techniques : boutique résolue et storefront publiquement servable. Il ne retourne ni marque, ni domaine, ni catalogue, ni donnée client ou opérationnelle. |
| Garde global client | Le routeur attend ce signal avant de rendre une page publique **ou** d’administration. Si le storefront n’est pas servable ou si la lecture échoue, il échoue fermé sur une page neutre de préparation. |
| Interface et suivi | L’écran fermé ne monte ni en-tête, ni pied de page, ni panneau administratif MAZIGHO. Les pixels et la bannière de consentement ne sont plus montés avant la validation de disponibilité. |
| Résolution serveur | Le repli de compatibilité vers la boutique plateforme est limité à ses hôtes reconnus, au développement local et aux alias Vercel du projet. Tout domaine personnalisé inconnu échoue fermé. |
| Activation | Aucun état n’est modifié. Les boutiques `setup`, `suspended` et `closed` restent non servables ; seules `active` et `limited` peuvent servir le storefront. |

Les tests couvrent le signal « storefront fermé » pour une boutique `setup`, le refus du catalogue, du panier et du checkout, ainsi que l’interdiction de repli d’un sous-domaine personnalisé vers la boutique plateforme.


### Durcissement complémentaire des procédures de panneau

Le correctif de fermeture est complété par un refus côté serveur des procédures `adminProcedure` et des procédures de personnel. Si la boutique résolue est absente, en `setup`, `suspended` ou `closed`, ces procédures retournent `FORBIDDEN` avant toute lecture métier. Cette seconde barrière protège les appels tRPC directs, même si un ancien navigateur ou un cache tente encore d’afficher une page administrative.

Les tests valident à la fois le fonctionnement normal d’une boutique `active` et le refus d’un administrateur ou collaborateur placé dans le contexte d’une boutique `setup`.


### Exception explicite de la boutique plateforme

La boutique plateforme MAZIGHO est toujours considérée comme publiquement servable, y compris si un ancien statut technique reste `setup` dans la base. Cette exception ne s’applique jamais aux boutiques clientes : celles-ci doivent être `active` ou `limited` pour servir leur storefront ou leur panneau. Ce traitement évite qu’un garde-fou de pré-lancement n’interrompe le domaine principal tout en conservant une fermeture stricte des sous-domaines non ouverts.


---

## Gestion opérateur des brouillons de futures boutiques

Les brouillons de mise en service Studio sont maintenant gérables avant toute création réelle : l’opérateur peut les **modifier**, les **supprimer après recopie du nom**, ou ouvrir leur prévol. Ces actions restent réservées à MAZIGHO Studio et ne créent ni boutique, domaine, invitation, paiement, synchronisation Odoo, commande ni action fournisseur.

| État du brouillon | Modification | Suppression | Provisionnement |
|---|---:|---:|---:|
| `draft` ou revue locale à compléter | Oui | Oui, après confirmation du nom | Seulement après prévol local complet et confirmation distincte |
| Archivé ou déjà provisionné | Non | Non | Non, protection contre l’écrasement ou le doublon |

Lorsque l’opérateur sélectionne **« Autre univers »**, le champ **« Thématique ou niche »** devient obligatoire. La revue locale reste bloquée tant que cette précision n’est pas renseignée. Lors du provisionnement ultérieur, la thématique est conservée uniquement dans les réglages isolés de cette boutique ; elle n’ouvre aucun storefront et ne déclenche aucune intégration.

### Correctif de résolution du domaine plateforme (10 septembre 2026)

La boutique plateforme `primary-store` utilise désormais `mazigho.ch` comme domaine canonique lors de l’initialisation multi-boutique. Une réparation idempotente ne met à jour que l’ancienne valeur interne `primary.local` et réaffirme son marqueur `isPlatformStore`. Cette correction est nécessaire pour que `mazigho.ch` et `www.mazigho.ch` résolvent toujours la boutique plateforme, tout en laissant les domaines de boutiques clientes en `setup` fermés. Elle ne modifie jamais le statut, le domaine ou les réglages d’une boutique cliente.

---

## Atelier privé « Créer et personnaliser ma boutique »

MAZIGHO Studio comprend désormais un premier créateur guidé réservé à l’opérateur, accessible depuis l’aperçu de panneau propriétaire d’une boutique offerte en `setup`. Il enregistre par boutique, et uniquement dans son périmètre isolé : le nom de marque, le message court, la niche, le modèle de présentation, les pages à préparer, la palette et la typographie. L’aperçu visuel se met à jour immédiatement dans l’atelier et un lien mène vers le storefront privé Studio.

L’atelier reste délibérément **non public** et ne crée aucun compte client. Il ne crée ni page publique, ni domaine, ni produit, ni image, ni membre, ni invitation, ni commande, ni paiement ou intégration fournisseur. Toute consultation et sauvegarde est protégée par `platformProcedure`; une boutique cliente, même administrée par un utilisateur authentifié, reçoit `FORBIDDEN`.

Les futures étapes pourront étendre cette base vers l’édition effective de pages, médias et navigation, toujours avant une activation explicite et distincte de la boutique.

---

## Éditeur privé de pages par blocs

Le créateur Studio comprend désormais une seconde étape : l’éditeur privé de pages. Il prépare quatre pages de marque — **À propos**, **Questions fréquentes**, **Nous contacter** et **Inspiration** — chacune composée de trois blocs éditoriaux guidés. Pour chaque bloc, l’opérateur peut contrôler la visibilité, le titre et le texte, puis vérifier le rendu dans un aperçu immédiat.

Les brouillons sont enregistrés par boutique dans le réglage isolé `owner_page_drafts`. Ils ne sont lus par aucune route publique, procédure storefront, panier, paiement ou pixel marketing. Les routes tRPC de lecture et de sauvegarde sont protégées par `platformProcedure`; un administrateur d’une boutique cliente reçoit `FORBIDDEN` et ne peut jamais accéder aux brouillons d’une autre boutique.

Cet éditeur ne crée aucune page publique ni média, et ne modifie ni domaine, catalogue, prix, commande, paiement, fournisseur, membre ou invitation. L’intégration éventuelle de ces pages à un storefront restera une décision ultérieure, distincte de leur rédaction et soumise aux gardes d’ouverture existants.

---

## Médias privés des pages en préparation

L’éditeur de pages Studio permet désormais de préparer une image de couverture par page. Seuls les formats **JPEG**, **PNG** et **WebP** sont acceptés, avec une taille maximale de **5 Mo**. Le fichier est stocké sous un chemin rattaché à l’identifiant de la boutique et son URL est enregistrée uniquement dans le brouillon isolé de la page.

Le téléversement et la sauvegarde restent protégés par `platformProcedure`. Le média n’est consommé par aucune route publique, aucun storefront, panier, paiement, pixel marketing ou intégration fournisseur tant que la boutique reste en `setup`. L’opérateur doit sauvegarder le brouillon de page après l’envoi de l’image ; retirer l’image retire sa référence du brouillon sans toucher au domaine ou au statut de boutique.

---

## Checklist privée de préparation par boutique

MAZIGHO Studio comprend une checklist visuelle par boutique offerte en `setup`. Elle calcule des états réels et minimisés pour l’identité sauvegardée, les pages de présentation enregistrées, les images de couverture éventuellement préparées, le catalogue de démonstration et le domaine renseigné. Chaque carte fournit uniquement un lien vers son étape Studio correspondante ; aucune carte ne modifie une donnée.

Le snapshot de checklist ne retourne ni domaine en clair, contenu des pages, URL de médias, coordonnées de propriétaire, profil légal détaillé, commandes, clients ou secrets. Il est protégé par `platformProcedure` et refuse les administrateurs de boutiques clientes. L’étape **Ouverture publique** reste volontairement manuelle : la checklist ne vérifie ni DNS, ni certificat, ni paiement, ni panier, ni activation.

---

## Navigation privée de la boutique en préparation

Le créateur Studio comprend un atelier de navigation privé. Il organise un menu limité à **Accueil**, **À propos**, **FAQ**, **Contact** et **Inspiration**. L’accueil reste toujours présent et en première position ; les autres entrées peuvent être renommées, affichées, masquées et ordonnées uniquement lorsqu’elles font partie de la structure de pages préparée dans le créateur.

Le réglage `owner_navigation_draft` ne stocke que l’identifiant fermé de la page, un libellé court et sa visibilité. Il ne contient ni URL libre, ni lien externe, ni action de panier, paiement ou publication. Il est lu et sauvegardé uniquement par `platformProcedure` pour une boutique offerte en `setup`; son rendu actuel est strictement un aperçu privé Studio.

---

## Aperçu complet privé des pages préparées

MAZIGHO Studio fournit un aperçu complet en lecture seule qui rassemble, pour une même boutique offerte en `setup`, l’identité préparée, la palette choisie, la navigation privée, l’accueil de démonstration, les pages éditoriales et leurs images de couverture. Il lit exclusivement `owner_builder_configuration`, `owner_navigation_draft` et `owner_page_drafts` via un snapshot `platformProcedure` dédié.

Cette vue ne peut être atteinte par une boutique cliente et n’est référencée par aucune route storefront publique. Les boutons de navigation ne font que changer la page affichée dans la maquette Studio : ils n’exécutent pas de navigation publique. Aucun domaine, pixel, panier, paiement, commande, fournisseur, compte ou statut de boutique ne peut être modifié depuis cet aperçu.

---

## Modèles d’accueil privés du créateur

Le choix de modèle déjà enregistré par le créateur est maintenant rendu de manière distincte dans l’aperçu complet privé : **Boutique directe** privilégie un appel vers les pages préparées, **Histoire de marque** met le message et la promesse au premier plan, et **Catalogue essentiel** organise une lecture sobre autour des futures collections et pages clés.

Ces variantes ne constituent pas trois thèmes publics et n’écrivent aucune donnée supplémentaire. Elles utilisent exclusivement le modèle privé `owner_builder_configuration` et les pages préparées déjà isolées. Le rendu reste rendu dans Studio, sans domaine de boutique, pixel, panier, paiement, commande, fournisseur ni activation.

---

## Centre de lancement guidé privé

Le centre de lancement MAZIGHO Studio consolide les états réels de préparation d’une boutique offerte en `setup` : identité enregistrée, pages préparées, médias éventuels, catalogue de démonstration, domaine renseigné et aperçu privé. Il s’appuie sur les snapshots existants de checklist et de préparation, puis renvoie des étapes et liens Studio minimisés.

Le dernier jalon, **Décider de l’ouverture publique**, est délibérément informatif et manuel. Aucun bouton du centre ne vérifie automatiquement le DNS ou le certificat, n’écrit un domaine, ne crée un panier ou un paiement, ni ne modifie le statut de la boutique. L’activation reste uniquement disponible via la revue Studio séparée et avec confirmation explicite.


## Atelier privé de collections — préparation de catalogue

L’atelier **« Préparer les collections »** est accessible uniquement depuis MAZIGHO Studio pour les boutiques offertes en état `setup`. Il enregistre, sous la clé `owner_collection_drafts`, une liste ordonnée de une à huit collections. Chaque collection contient exclusivement un titre, une accroche et un indicateur « à la une » ; les valeurs restent dans un brouillon de préparation isolé par boutique.

Cette brique n’écrit aucune catégorie réelle et ne crée aucun produit, variante, image de produit, prix, stock, fournisseur, panier, domaine ou publication. La checklist et le centre de lancement affichent les collections comme une étape éditoriale privée distincte du catalogue opérationnel. Les actions de lecture et de sauvegarde sont protégées par `platformProcedure`; les administrateurs de boutiques clientes n’y ont pas accès.

Chemin opérateur : **Panneau propriétaire — simulation → Créer et personnaliser → Préparer les collections**.

> Les ateliers Produits, Prix, Stock, Fournisseurs et Panier sont des jalons ultérieurs et devront être implémentés séparément avec leurs propres règles d’isolement, validations et confirmations. L’enregistrement de collections ne constitue jamais une publication.
