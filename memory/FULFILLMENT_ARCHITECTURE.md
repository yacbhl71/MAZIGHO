# MAZIGHO — Fulfillment AliExpress (architecture intégrée)

## État actuel (2026-06)
L'extension Chrome (Mode A) est livrée ET **branchée sur le manifeste canonique de
Manus**. L'ancien backend dupliqué de l'agent (addressFormat.ts, endpoint
`getReadyToFulfill`, colonne `supplierVariantMap`) a été **abandonné** : Manus avait
déjà des équivalents supérieurs (adresse structurée Stripe, `selectedOptions` par
ligne, `supplierVariantMappings`, générateur de manifeste). Aucune duplication.

## Source de vérité côté serveur
- tRPC : `admin.orders.getAliExpressPreparationManifest({ orderId })`
  (`orderOperatorProcedure`) → `db.getAliExpressPreparationManifestAdmin` →
  `server/services/aliExpressManifest.ts` (`buildAliExpressPreparationManifest`).
- Type `AliExpressPreparationManifest` :
  `{ orderId, state: "not_eligible"|"blocked"|"ready_for_human_review", reason,
     paymentConfirmed, customerSaleTotalCents,
     shipping: { name, line1, line2, city, state, postalCode, countryCode, phone, email } | null,
     lines: [{ orderItemId, productName, quantity, customerLineAmountCents,
               supplierProductId, supplierVariantId, supplierUrl,
               selectedOptions (Record<string,string>), optionStatus, intendedCountryCode, urlSource }],
     nonAliExpressItemCount, warnings[], paymentPolicy: "human_checkout_only" }`
- Le manifeste est en **lecture seule** : aucun appel AliExpress, aucun panier,
  aucune URL de paiement. Il n'est "ready_for_human_review" que si la commande est
  payée, en `processing`, avec adresse structurée complète et au moins une ligne
  AliExpress référencée (snapshot `provider:"aliexpress"`).

## Flux Mode A (extension Chrome)
1. Admin ouvre une commande dans **Administration → Commandes**. Le panneau
   « Préparation AliExpress assistée » affiche le manifeste (Manus).
2. Le bouton **« Commander (via Extension Chrome) »** (data-testid
   `fulfill-chrome-extension-btn`) est activé uniquement si
   `state === "ready_for_human_review"` ET l'extension est détectée.
3. Détection extension : `content-mazigho.js` écrit l'attribut DOM partagé
   `data-mazigho-fulfillment-ext` et émet `postMessage({source:"MAZIGHO_EXT",type:"EXT_READY"})`.
   `AdminOrders.tsx` sonde l'attribut (toutes les 1,5 s) + écoute les messages →
   bascule le badge « Extension détectée ».
4. Au clic : `window.postMessage({source:"MAZIGHO_ADMIN", type:"MAZIGHO_FULFILL_ORDER", payload: <manifest>})`.
5. `content-mazigho.js` → `chrome.runtime.sendMessage` → `background.js` ouvre
   `payload.lines[].supplierUrl` (1re ligne exploitable) au premier plan, mémorise
   le manifeste par tabId (refuse si `state !== ready_for_human_review`).
6. `content-aliexpress.js` lit le manifeste : sélectionne la variante depuis
   `line.selectedOptions`, quantité `line.quantity`, remplit l'adresse depuis
   `payload.shipping` (name/line1/line2/postalCode/city/state/countryCode/phone),
   livraison standard, puis **STOP avant paiement** (surligne le bouton, jamais cliqué).
7. Captcha/connexion : l'onglet est au premier plan → l'humain résout, le script
   reprend automatiquement (`ensureNotBlocked`).

## Contraintes
- **Vercel serverless** : OK pour l'endpoint manifeste (court). Un worker Playwright
  persistant + WebSocket (Mode B tablette) reste **IMPOSSIBLE sur Vercel** → différé
  (accord utilisateur). Le « pont tablette » de la roadmap Manus = suivi/reprise
  humaine seulement, jamais un contournement de sécurité AliExpress.
- Le paiement fournisseur AliExpress n'est **jamais** automatisé.

## Fichiers
- Extension : `chrome-extension/` (manifest.json, background.js, content-mazigho.js,
  content-aliexpress.js, selectors.js, popup.html/js, README.md).
  → Sélecteurs AliExpress centralisés dans `chrome-extension/selectors.js` (seul
    fichier à maintenir si AliExpress change son HTML).
- Backend (Manus, conservé) : `server/services/aliExpressManifest.ts`,
  `server/db.ts` (`getAliExpressPreparationManifestAdmin`), `server/adminRouter.ts`
  (`admin.orders.getAliExpressPreparationManifest`).
- Admin UI : `client/src/pages/admin/AdminOrders.tsx` (panneau AliExpress + bouton
  extension + détection + handler `startChromeExtensionFulfillment`).

## Sourcing produit AliExpress (admin) — prérequis pour qu'une commande devienne « prête »
Pour qu'une commande atteigne `ready_for_human_review`, il faut un produit sourcé AliExpress :
- **Admin → Produits → (éditer/créer) → onglet « Fournisseur »** :
  - `Nom du fournisseur` = `AliExpress` (insensible à la casse ; le manifeste fait `.toLowerCase()`).
  - `Lien direct vers le produit (Source)` = l'URL AliExpress (`.../item/<ID>.html`).
  - `ID produit fournisseur (AliExpress)` = `supplierProductId` (data-testid `product-supplier-id-input`). **Auto-extrait** de l'URL (regex `/item/(\d+)\.html`) à la saisie de l'URL, ou via le bouton « Extraire de l'URL ». **Requis** : sans lui, la ligne est ignorée par le manifeste.
  - Onglet « Livraison » : au moins un profil de livraison pour le pays cible (sinon le checkout jette `DELIVERY_NOT_AVAILABLE`).
- Champs persistés par `admin.products.create/update` → `db.createProduct/updateProduct` → colonnes `products.supplier`, `products.supplierUrl`, `products.supplierProductId`.
- Au checkout, `getStripeCheckoutCart` (db.ts) fige un snapshot immuable par ligne : `provider = product.supplier`, `supplierProductId`, `supplierVariantId` (via `resolveSupplierVariantForOptions`), `supplierUrl`, `countryCode`, + `selectedOptions`. C'est ce snapshot que lit le manifeste — jamais les champs catalogue mutables.
- `optionStatus = "human_selection_required"` (avertissement, non bloquant) quand des options client existent sans `supplierVariantId` mappé. Pour passer à `"mapped"`, renseigner `supplierVariantMappings` (pas encore d'UI — TODO).

## Vérifié (2026-06, preview — données RÉELLES)
- `yarn build` OK, `tsc --noEmit` 0 erreur, JS extension `node --check` OK.
- Sourcing : `admin.products.update` avec `supplierProductId` persiste bien (test HTTP tRPC → colonne `products.supplierProductId`). Auto-extraction depuis l'URL vérifiée dans l'UI (`1005006789012345`).
- Pipeline réel de bout en bout : produit AliExpress sourcé → commande payée/processing + adresse structurée + selectedOptions → endpoint réel `getAliExpressPreparationManifest` renvoie `ready_for_human_review` avec lignes/adresse/options correctes (testé via :8001).
- UI réelle : panneau « Prête à vérifier », bouton activé + badge « Extension détectée » (après injection de l'attribut DOM comme le fait content-mazigho.js), clic → postMessage envoie le manifeste réel. Commande CJ → aucun bouton (scope OK).
- Données de test seedées puis SUPPRIMÉES (produit #600001 + commande #120001) pour ne pas polluer le CA/TVA.
- ⚠️ Non automatisable ici : l'automatisation réelle du navigateur AliExpress (nécessite l'extension installée dans un vrai Chrome + session AliExpress).
- ⚠️ Serveur local : l'app mazigho n'est PAS gérée par supervisor (supervisord pointe vers le template /app/backend|/app/frontend, STOPPED). Deux instances node lancées manuellement : `PORT=3000` (frontend) et `PORT=8001` (API via ingress). Après un `yarn build`, RELANCER ces deux instances (kill + `setsid nohup node server-dist/index.js`) pour charger le nouveau backend. Le frontend (dist/) est servi depuis le disque → pas de relance nécessaire pour le front.
