# Importer une boutique — format universel privé MAZIGHO

> **État : expérimentation réservée à MAZIGHO Studio.**
>
> Cet outil prépare une copie contrôlée dans une **nouvelle boutique isolée** créée depuis son propre parcours. Il ne peut pas modifier une boutique existante et n’active aucun panier, paiement, domaine, abonnement ou e-mail.

## 1. Objectif

Le format **MAZIGHO Import Archive** permet de préparer une migration quel que soit le point de départ : Shopify, WooCommerce, PrestaShop, Wix, Squarespace, Etsy, CSV/Excel ou ancien site développé sur mesure.

L’archive n’est pas traitée comme un fichier magique : elle est lue **localement dans Studio**, contrôlée, puis appliquée uniquement après que l’opérateur a :

1. préparé un brouillon de **nouvelle boutique** depuis l’archive ;
2. réalisé le prévol et confirmé séparément sa création en état `setup` ;
3. rechargé l’archive et sélectionné cette nouvelle boutique, seule destination proposée ;
4. confirmé qu’il détient les droits sur les contenus ;
5. confirmé l’ajout des fiches dans cette destination isolée.

Les boutiques existantes, pilotes, actives ou limitées ne sont jamais présentées comme destination et la procédure serveur refuse une autre cible.

## 2. Périmètre de la première expérimentation

| Élément détecté dans le ZIP | Traitement actuel | Garde-fou |
|---|---|---|
| `catalogue.csv` / `products.csv` | **Importé** : catégories issues du catalogue, produits, prix, stock, descriptions, dimensions, URL HTTPS | Produit du même nom : mise à jour contrôlée dans la boutique cible uniquement |
| `images/` | **Importées** si reliées par chemin relatif au catalogue ou au manifeste | Confirmation de droits, max. 5 Mio/image, 8 images/fiches maximum |
| `variations.csv` / `variants.csv` | **Importées** comme variantes locales et SKU | Le produit correspondant doit exister dans le catalogue |
| `categories.csv` | Détecté, présenté comme élément à examiner | Les catégories réellement créées proviennent actuellement de `catalogue.csv` |
| `contenus/` | Détecté seulement | Aucun écrasement de page éditoriale automatique |
| `marque/` | Détecté seulement | Aucun remplacement automatique de logo, palette ou police |
| `manifest.json` | Lu et présenté | La devise est informative : aucune conversion de prix n’est faite |

Un premier adaptateur **WordPress `.wpress`** est disponible en expérimentation privée : il prépare hors ligne une archive MAZIGHO à partir de produits WooCommerce/SureCart, sans restaurer WordPress ni copier les données clients. Son usage et ses limites sont décrits dans [`CONVERTIR_WORDPRESS_WPRESS_VERS_STUDIO.md`](./CONVERTIR_WORDPRESS_WPRESS_VERS_STUDIO.md). Les autres adaptateurs d’origine (Shopify, PrestaShop, Wix, etc.) suivront seulement après des essais concluants, chacun convertissant son export vers ce contrat universel au lieu de donner au ZIP des droits implicites.

### Convertisseur WordPress directement dans Studio

La carte **« Convertir un `.wpress` »**, placée à côté du chargeur ZIP/CSV dans **Studio → Importer une boutique**, traite le fichier **dans le navigateur de l’opérateur** : la sauvegarde brute n’est ni téléversée ni stockée sur MAZIGHO. Elle accepte un fichier `.wpress` jusqu’à **512 Mio**, ou un ZIP jusqu’à **256 Mio** qui contient exactement un seul `.wpress`. Le ZIP MAZIGHO généré est ouvert immédiatement dans l’aperçu normal ; il peut aussi être téléchargé.

La conversion n’importe rien à elle seule. L’opérateur contrôle ensuite les prix et la devise, prépare une nouvelle boutique, confirme les droits et confirme l’application. Les mêmes garde-fous de l’atelier s’appliquent au ZIP converti : maximum 100 fiches, 40 images liées et 5 Mio par image. Au-delà, la conversion hors ligne assistée reste le parcours approprié.

## 3. Structure recommandée

```text
ma-boutique-export.zip
├── manifest.json
├── catalogue.csv
├── categories.csv              # optionnel, détecté pour revue
├── variations.csv              # optionnel, importé
├── images/
│   ├── robe-bleue-1.webp
│   ├── robe-bleue-2.jpg
│   └── sac-cuir.webp
├── contenus/                   # optionnel, jamais appliqué automatiquement
│   ├── accueil.md
│   ├── a-propos.md
│   └── faq.md
└── marque/                     # optionnel, jamais appliqué automatiquement
    ├── logo.png
    ├── couleurs.json
    └── police.txt
```

## 4. `manifest.json`

Le manifeste est facultatif mais recommandé. Il documente l’origine et les droits ; il n’active aucun comportement commercial.

```json
{
  "source": "WooCommerce",
  "currency": "EUR",
  "language": "fr",
  "rightsConfirmed": true,
  "catalogue": "catalogue.csv",
  "imageMappings": {
    "Robe bleue": ["images/robe-bleue-1.webp", "images/robe-bleue-2.jpg"],
    "Sac cuir": "images/sac-cuir.webp"
  }
}
```

| Clé | Rôle |
|---|---|
| `source` / `origin` / `platform` | Plateforme ou origine déclarée, à titre informatif |
| `currency` | Devise déclarée. Elle ne déclenche aucune conversion. |
| `language` / `locale` | Langue déclarée, à titre informatif |
| `rightsConfirmed` | Déclaration de droits. L’opérateur doit tout de même confirmer dans Studio. |
| `catalogue` / `cataloguePath` / `productsFile` | Chemin exact du CSV catalogue dans le ZIP |
| `imageMappings` | Correspondance facultative produit → chemin(s) d’image |

## 5. `catalogue.csv`

Le CSV utilise une virgule comme séparateur et accepte les champs entourés de guillemets. Les colonnes minimales sont :

```csv
category,name,shortDescription,longDescription,price,stock,dimensions,imageUrl,featured
"Robes","Robe bleue","Coupe fluide","Description complète de la robe.",59.90,12,"S | M | L","images/robe-bleue-1.webp",oui
```

### Colonnes

| Colonne | Obligatoire | Règle |
|---|---:|---|
| `category` | Oui | 2 à 100 caractères |
| `name` | Oui | 2 à 200 caractères ; identifiant fonctionnel de mise à jour dans la boutique choisie |
| `shortDescription` | Oui | Jusqu’à 2 000 caractères |
| `longDescription` | Oui | Jusqu’à 6 000 caractères |
| `price` | Oui | Nombre décimal, avec `.` ou `,` ; aucune conversion automatique |
| `priceChf` | Alternative historique | Acceptée si `price` est absent ; le nom ne convertit pas la devise |
| `stock` | Oui | Entier de 0 à 999 999 |
| `dimensions` | Oui | Valeurs séparées par `|` ou `;` |
| `imageUrl` | Non | URL `https://` ou chemin relatif sûr dans le ZIP |
| `imagePaths` | Non | Chemins d’images supplémentaires séparés par `|` ou `;` |
| `featured` | Oui | `oui`, `yes`, `true` ou `1` pour la mise à la une |

Les chemins locaux doivent correspondre **exactement** aux fichiers du ZIP, par exemple `images/robe-bleue-1.webp`. Les chemins avec `..`, `.` ou `\` sont refusés.

## 6. `variations.csv`

```csv
productName,label,sku,priceAdjustment,stock,status
"Robe bleue","Taille : S","ROBE-BLEUE-S",0,4,active
"Robe bleue","Taille : M","ROBE-BLEUE-M",0,5,active
"Robe bleue","Taille : L","ROBE-BLEUE-L",5,3,active
```

| Colonne | Règle |
|---|---|
| `productName` | Nom exact de la fiche présente dans `catalogue.csv` |
| `label` | Libellé de variante affichable |
| `sku` | Facultatif, maximum 120 caractères |
| `priceAdjustment` | Différence de prix en devise de la boutique, avec `.` ou `,` |
| `stock` | Entier positif ou nul |
| `status` | `active` par défaut, `inactive` pour une variante désactivée |

## 7. Limites de sécurité

- **30 Mio** maximum pour le ZIP ou le CSV chargé ;
- **120 fichiers** maximum dans le ZIP ;
- **42 Mio** maximum après décompression ;
- **40 images** au maximum dans l’essai ;
- **5 Mio** maximum par image ;
- **2 Mio** maximum par CSV ;
- **120 Kio** maximum par fichier éditorial détecté ;
- pas de ZIP chiffré, endommagé, ambigu ou contenant un chemin dangereux ;
- un catalogue de **100 produits maximum** par opération.

## 8. Procédure d’essai conseillée

1. Ouvrir **Studio → Importer une boutique**.
2. Charger le ZIP : l’aperçu s’affiche avant toute écriture.
3. Vérifier le nombre de fiches, les chemins d’images et la devise déclarée.
4. Renseigner la nouvelle boutique, son propriétaire, sa base visuelle et son marché, puis choisir **Préparer la nouvelle boutique**.
5. Ouvrir les brouillons Studio ; réaliser le prévol puis confirmer la création de cette boutique en état `setup`.
6. Revenir dans l’atelier, recharger le même ZIP et sélectionner la nouvelle boutique proposée dans l’étape 3.
7. Confirmer les droits sur les contenus et l’application de l’import.
8. Ouvrir **Vérifier le catalogue**, puis l’**aperçu privé**.
9. Corriger les contenus détectés ; ne lancer l’ouverture publique qu’au moyen du parcours de publication séparé.

## 9. Ce qui ne doit jamais être implicitement importé

- comptes, mots de passe, clients, e-mails ou carnets d’adresses ;
- commandes, paiements, remboursements, factures ou abonnements ;
- clés API, secrets Stripe, accès fournisseur ou domaine ;
- publication, activation d’un panier, d’un checkout ou d’un e-mail ;
- contenu pour lequel le propriétaire ne détient pas les droits.
