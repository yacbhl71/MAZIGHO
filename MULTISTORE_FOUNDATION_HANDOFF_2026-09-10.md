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
