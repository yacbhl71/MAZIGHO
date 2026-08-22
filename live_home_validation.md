# Contrôle visuel public — 22 août 2026

- La page d'accueil déployée affiche le hero avec l'image originale MAZIGHO, le texte éditorial, les CTA, les catégories dynamiques et l'état vide des produits phares.
- Les catégories restaurées sont visibles sur `/boutique` et dans le menu de navigation.
- Le produit actif apparaît sur `/categorie/beaute-bien-etre` avec une image distante, un prix de 59,99 CHF, un prix barré de 76,90 CHF, un stock limité et un lien vers sa fiche.
- L'administration des promotions permet de créer un code `TEST10` à 10 %, sans minimum de commande. La création a été confirmée par l'interface et le code est affiché comme actif.
- Point à tester ensuite : ajout du produit au panier, évolution du compteur, application de `TEST10` et calcul du seuil de livraison gratuite à 100 CHF.

Captures générées par le navigateur :
- `/home/ubuntu/screenshots/mazigho-shop_vercel__2026-08-22_13-48-04_7107.webp` — accueil avec hero
- `/home/ubuntu/screenshots/mazigho-shop_vercel__2026-08-22_13-48-57_8608.webp` — code promo créé
- `/home/ubuntu/screenshots/mazigho-shop_vercel__2026-08-22_13-49-18_2147.webp` — produit actif en catégorie

## Parcours panier

La fiche produit publique s'est chargée avec l'image AliExpress, le prix de vente de 59,99 CHF, le prix barré de 76,90 CHF et 3 unités disponibles. Le clic sur « Ajouter au panier » a réussi : le bouton est passé à « Ajouté ! », une notification a confirmé l'ajout et le panier indique 1 article.

## Checkout

L'ajout au panier fonctionne, mais le clic sur « Procéder au paiement » redirige vers le domaine OAuth Manus, qui renvoie `DNS_PROBE_FINISHED_NXDOMAIN` dans le navigateur de test. Le checkout n'a donc pas pu être testé jusqu'au code promo. Il faut vérifier la protection de la route `/commander` et prévoir un parcours invité ou corriger la configuration OAuth avant de considérer le tunnel comme validé.
