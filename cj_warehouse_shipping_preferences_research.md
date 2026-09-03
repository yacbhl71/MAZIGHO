# Préférences d’entrepôt et de transport CJ — notes techniques

**Consulté le :** 3 septembre 2026

## Sources officielles

- [CJ Docs — Logistics](https://developers.cjdropshipping.cn/en/api/api2/api/logistic.html)
- [CJ Docs — Product](https://developers.cjdropshipping.cn/en/api/api2/api/product.html)

## Constats à préserver

1. `product/listV2` accepte `countryCode` comme **filtre d’inventaire dans le pays**, et non comme validation de livraison au client. Il ne doit donc jamais recevoir le pays commercial de destination par défaut ; cela avait produit des résultats à zéro pour la Suisse.

2. `globalWarehouseList` retourne les entrepôts globaux disponibles avec `areaId`, `countryCode`, `nameEn` et libellés traduits. Cette liste peut alimenter l’interface administrateur, sans valeur figée dans le client.

3. Le calcul de fret `freightCalculate` exige séparément `startCountryCode` (pays d’origine / entrepôt) et `endCountryCode` (pays de destination client), et retourne notamment `logisticName`, `logisticAging` et `logisticPrice`.

4. Pour le sourcing MAZIGHO, la préférence d’entrepôt doit être appliquée en sélectionnant les options de fret dont `fromCountryCode` correspond à l’entrepôt choisi. La destination commerciale reste le pays choisi dans le formulaire. Un produit reste visible seulement là où un profil de livraison est effectivement validé.

5. L’API de devis simple expose le nom du transporteur et le délai, mais pas un booléen universel de suivi. Les familles de transport doivent donc utiliser une politique de noms prudente, avec exclusions explicites des termes `Postal`, `Economy`, `Ordinary`, `Untracked`, et une limite de délai. Le formulaire ne doit jamais promettre officiellement un suivi si le devis ne l’atteste pas.

6. Le paramètre `shippingMode` documenté par CJ distingue la logistique plateforme de la logistique vendeur et ne correspond pas à un choix de transport client dans MAZIGHO. Il ne doit pas être confondu avec les familles de transport affichées à l’administrateur.

## Choix de conception prévu

- **Entrepôts :** aucune préférence (défaut), Chine, ou les entrepôts globaux compatibles récupérés chez CJ ; le sourcing ne filtre pas le catalogue initial par destination commerciale.
- **Transport :** sélection de familles de noms de méthodes ; l’option par défaut conserve le filtre strict `CJPacket rapide`. Les familles choisies sont revalidées sur le devis réel de chaque produit et pays.
- **Sécurité :** stock positif, poids maximal, prix tout compris, profils de livraison pays par pays, brouillons seulement, aucun paiement CJ ni publication automatique.

## Références d’implémentation

- `server/cjDropshipping.ts` : token CJ, liste des produits, détail, stock et devis.
- `server/cjBatchImport.ts` : moteur du sourcing personnalisé et filtrage final des profils de livraison.
- `server/adminRouter.ts` : contrat tRPC et journalisation d’administration.
- `client/src/pages/admin/AdminSuppliers.tsx` : champs et aides du générateur.

> Ne jamais réintroduire la confusion « pays de destination client = filtre d’entrepôt CJ ».
