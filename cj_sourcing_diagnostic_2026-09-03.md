# Diagnostic de sourcing CJ — 3 septembre 2026

## Constat en production

La vérification administrative `verifyCj` a confirmé que l’authentification CJ est fonctionnelle : la réponse tRPC est `200`, avec `configured: true` et `verified: true`. Aucun secret ni jeton n’est conservé dans ce document.

Les recherches de catalogue réalisées depuis le Hub fournisseurs ont donné les résultats suivants :

| Requête | Résultat observé |
|---|---|
| Pocket thermal printer | HTTP 200, `total: 0`, `products: []` |
| Magic cleaning foam | HTTP 502, message MAZIGHO générique : « Impossible de lire le catalogue CJ pour le moment. » |
| Compression packing cubes | HTTP 200, `total: 0`, `products: []` |
| Astronaut galaxy projector | HTTP 502, message MAZIGHO générique : « Impossible de lire le catalogue CJ pour le moment. » |

## Première interprétation

Le zéro ne provient donc pas exclusivement des règles de poids ou de livraison : la recherche catalogue elle-même renvoie parfois zéro et parfois une erreur masquée par le routeur. L’accès CJ a toutefois été vérifié. La prochaine étape est de rendre l’erreur catalogue observable côté administration et d’ajouter une stratégie de recherche de repli, avant d’assouplir un filtre de transport ou de créer de nouveaux brouillons.

Aucun brouillon, produit public, ordre CJ ni paiement fournisseur n’a été créé au cours de ce diagnostic.

## Référence officielle CJ

La documentation officielle indique que `product/listV2` accepte un mot-clé (`keyWord`), un pays pour filtrer un stock d’entrepôt (`countryCode`) et jusqu’à 100 résultats par page. Elle indique également qu’un endpoint catalogue historique `product/list` accepte une recherche anglaise floue (`productNameEn`) et documente un quota de 1 000 requêtes par jour pour les comptes gratuits ou V1. Cette seconde route peut donc être utilisée comme repli contrôlé lorsque V2 renvoie une erreur ou aucun candidat pour un libellé commercial trop précis.

Source : https://developers.cjdropshipping.cn/en/api/api2/api/product.html

La documentation ne promet pas qu’un terme de recherche particulier soit toujours indexé dans V2. Une stratégie de recherche doit donc distinguer « aucun résultat catalogue » d’une erreur technique et éviter d’interpréter un zéro comme une non-disponibilité définitive.

## Confirmation de la cause

Après suppression du filtre `countryCode=CH` de la requête catalogue de diagnostic, la recherche `Pocket thermal printer` a répondu HTTP 200 avec un total plafonné à 6 000 et vingt candidats dans la première page, notamment « Thermal Pocket Portable Bluetooth Printer ». La fiche globale de ce candidat a aussi été lue avec succès et expose des variantes, dont une de 70 g.

À l’inverse, lorsqu’un pays de destination est transmis à l’étape de lecture de la fiche ou de calcul de fret, CJ peut renvoyer une variante absente dans ce contexte. Le flux corrigé doit donc réutiliser la fiche globale pour identifier la variante, puis évaluer le fret sans réinterpréter la destination comme un entrepôt.

La tentative de devis sur une variante en utilisant l’ancienne logique a échoué `CJ_VARIANT_NOT_FOUND`, confirmant que ce comportement bloquait avant même l’évaluation du transport CJPacket. Le filtre de transport n’est donc pas la cause principale des zéros actuels ; aucun assouplissement n’est appliqué à ce stade.

## Pagination renforcée — vérification officielle

La documentation CJ Product List V2 indique que `page` accepte les valeurs de 1 à 1000 et que `size` accepte les valeurs de 1 à 100. Le nombre total retourné est plafonné par CJ à 6000. Le générateur MAZIGHO utilise donc des pages de 50 candidats, sous le plafond officiel, et limite explicitement un sourcing manuel à 500 candidats. Les détails et devis sont ensuite traités en sous-vagues séparées afin que chaque requête d’administration reste brève.

Source : https://developers.cjdropshipping.cn/en/api/api2/api/product.html
