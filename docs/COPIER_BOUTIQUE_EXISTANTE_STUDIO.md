# Copier une boutique existante — MAZIGHO Studio

> **État : parcours privé réservé aux opérateurs MAZIGHO Studio.**
>
> Ce parcours prépare une **nouvelle boutique indépendante**. Il ne modifie jamais la source et ne remplace jamais l’import ZIP/WPRESS.

## Objectif

L’atelier **Studio → Préparer une boutique → Depuis une boutique existante** évite de reconstruire une base visuelle ou un catalogue autorisé tout en conservant une isolation stricte entre boutiques.

La destination suit obligatoirement ce cycle :

1. sélectionner une boutique source éligible ;
2. consulter son aperçu agrégé en lecture seule ;
3. choisir explicitement les éléments copiables ;
4. remplir le nom, le domaine souhaité, le propriétaire et la base de marché de la **nouvelle** boutique ;
5. créer un brouillon uniquement ;
6. ouvrir le prévol Studio et confirmer séparément le nom de la boutique ;
7. créer la destination en état `setup`, non publique ;
8. vérifier la destination, puis suivre le parcours de publication distinct si nécessaire.

Aucun domaine n’est activé, aucun e-mail n’est envoyé et aucun paiement, fournisseur ou publication n’est créé par le brouillon ni par la copie.

## Sources éligibles

Seules les boutiques clientes en état `setup`, `active` ou `limited` peuvent être proposées comme source. La boutique plateforme MAZIGHO, ainsi que les boutiques suspendues ou clôturées, sont refusées par le serveur.

L’aperçu ne montre que le nom, le domaine, l’état et des compteurs agrégés de catalogue. Il ne divulgue aucun client, membre, commande, fournisseur, fichier privé ou secret.

## Éléments copiables, uniquement sur choix explicite

| Élément | Contenu copié | Limite appliquée |
|---|---|---|
| Style storefront | Palette, typographies, disposition et ordre des sections | Jamais logo, identité, textes, bannières, images ou URL externe |
| Navigation | Libellés et destinations internes | Liens externes exclus |
| Collections privées | Plans de collections du créateur | Pas de publication automatique |
| Pages privées | Brouillons de pages | Les images demandent aussi l’option médias |
| Catégories | Structure et contenus de catégories | Visuels uniquement avec l’option médias |
| Produits | Fiches, prix, stock, descriptions et options | Aucun fournisseur, coût ou lien fournisseur |
| Images catalogue | Références de visuels pour catégories et produits | Aucun octet brut copié dans la base |
| Variantes | Libellés, SKU, ajustements de prix et stock | Aucun mapping fournisseur |

Les dépendances sont imposées : sélectionner les images ou les variantes sélectionne les produits et catégories nécessaires. Les produits sélectionnés sélectionnent les catégories nécessaires.

### Quota catalogue

La destination ne récupère **ni plan, ni quota, ni dérogation**. Elle conserve la protection FREE par défaut. Si le nombre de produits actifs dépasse ce plafond, les produits excédentaires sont copiés en `draft` : aucun produit n’est supprimé, mais aucun dépassement d’entitlement n’est contourné.

## Exclusions définitives

Les éléments suivants ne sont jamais copiés, même si l’opérateur les demande :

- utilisateurs, memberships, comptes propriétaires, invitations, mots de passe ou e-mails ;
- clients, adresses, données personnelles, paniers, favoris et avis privés ;
- commandes, retours, remboursements, paiements, Stripe ou Lemon Squeezy ;
- domaines, DNS, clés API, secrets et identifiants externes ;
- fournisseurs, dropshipping, coûts, liens et mappings fournisseur ;
- plans SaaS, commissions, dérogations, facturation et quotas ;
- profil légal, livraison, retours, fiscalité, marchés et méthodes de paiement ;
- documents privés, conversations IA, audit, statistiques et réglages internes.

## Garde-fous techniques

- La provenance (`copySourceStoreId`) et le périmètre retenu sont enregistrés dans le brouillon, puis dans la destination à des fins d’audit opérateur.
- La source est revalidée lors du prévol puis **dans la transaction de création**.
- La destination est refusée si elle n’est pas une nouvelle boutique cliente `setup` distincte.
- Les nouveaux enregistrements de catégories, produits, images et variantes portent tous le `storeId` de destination.
- Toute erreur de cohérence annule la transaction complète : aucune copie partielle n’est conservée.
- La création effective nécessite toujours la confirmation humaine du nom dans le prévol Studio.

## Relation avec l’import ZIP/WPRESS

L’import universel reste l’outil adapté à une archive externe. Il prépare lui aussi une nouvelle boutique `setup`, puis applique le catalogue après confirmations séparées. Les archives brutes ne sont pas conservées en base ; les médias passent par le stockage approprié seulement après contrôles et consentement.
