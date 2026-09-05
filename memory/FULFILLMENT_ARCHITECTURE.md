# MAZIGHO — Order Fulfillment (AliExpress) — Architecture

## Objectif
Automatiser la préparation des commandes AliExpress (façon DSers, custom & évolutif,
international). Le client paie sur MAZIGHO → l'admin déclenche la préparation de la
commande fournisseur, **avec arrêt obligatoire avant le paiement AliExpress**.

## Contrainte majeure (hébergement)
MAZIGHO tourne en **serverless sur Vercel** :
- ✅ Endpoints REST/tRPC courts → OK (Mode A + endpoint de données).
- ❌ Navigateur Playwright persistant + WebSocket temps réel + streaming captcha
  (Mode B) → **IMPOSSIBLE sur Vercel**. Nécessite un service Node **toujours actif**
  (Railway / Render / Fly.io / VPS). Donc Mode B = worker séparé (déféré).
L'exemple fourni par l'utilisateur (express + socket.io autonome sur :3000) a été
volontairement **écarté** au profit de l'intégration dans la vraie stack.

## Deux modes
- **Mode A — Extension Chrome (principal, stable)** : livré (v0.1.0). Utilise la
  session AliExpress de l'utilisateur sur son ordinateur. L'onglet est au premier
  plan → captcha résolu à la main, le script reprend. Dossier `chrome-extension/`.
- **Mode B — Serveur déporté (tablette)** : squelette prévu. Worker Node+Playwright
  hébergé ailleurs, relais captcha via WebSocket/screenshots vers une modale admin.
  Activé via env `FULFILLMENT_WORKER_URL` (non configuré → message explicite).

## Flux Mode A (sans jeton exposé)
1. Admin (React, déjà authentifié) clique « Commander (Extension Chrome) ».
2. Le front appelle tRPC `admin.fulfillment.getReadyToFulfill({orderId})`.
3. Le front `window.postMessage({source:'MAZIGHO_ADMIN', type:'MAZIGHO_FULFILL_ORDER', payload})`.
4. `content-mazigho.js` (content script) → `chrome.runtime.sendMessage` → `background.js`.
5. `background.js` ouvre l'onglet AliExpress (URL fournisseur) au premier plan et
   mémorise le payload par tabId.
6. `content-aliexpress.js` demande le payload (`AE_CONTENT_READY`) puis exécute :
   variante → panier/buy now → checkout → adresse (adaptée au pays) → livraison
   standard → **STOP avant paiement** (surlignage du bouton, jamais cliqué).
Détection de l'extension : `document.documentElement[data-mazigho-fulfillment-ext]`.

## Backend
- `admin.fulfillment.getReadyToFulfill(orderId)` (orderOperator/admin) : renvoie
  `{ orderId, status, paymentStatus, eligible, missing[], customer, shippingAddress(structuré), items[] }`.
  items = `{ productId, productName, quantity, supplier, aliexpressProductUrl,
  aliexpressProductId, supplierVariantMap, productOptions, aliexpressSkuId }`.
- `admin.fulfillment.setVariantMap(productId, map)` (catalogEditor) : stocke le
  mapping variante MAZIGHO → SKU fournisseur dans `products.supplierVariantMap` (JSON).
- `admin.fulfillment.startServerFulfillment(orderId)` : Mode B (renvoie
  WORKER_NOT_CONFIGURED tant que `FULFILLMENT_WORKER_URL` absent).
- `server/services/addressFormat.ts` : parse best-effort de l'adresse texte →
  structuré + registre par pays (`FIELD_ORDER`, `COUNTRY_ALIASES`) → **modulaire**
  pour ouvrir de nouveaux marchés sans toucher la logique.
- `db.getOrderForFulfillment`, `db.setProductSupplierVariantMap`,
  `ensureFulfillmentSchema` (ADD COLUMN products.supplierVariantMap au runtime).
- `drizzle/schema.ts` : `products.supplierVariantMap TEXT`.

## PRÉREQUIS / GAPS identifiés (à combler pour un fonctionnement complet)
1. **Adresse structurée au checkout** — MANQUANT (bloquant #1). Aujourd'hui Stripe ne
   collecte pas d'adresse (`shipping_address_collection` absent) et il n'y a pas de
   formulaire. `orders.shippingAddress` est du texte libre → parsé best-effort.
   ➜ À faire : activer la collecte d'adresse + téléphone (Stripe ou formulaire) et
   stocker les champs structurés (nom, rue, CP, ville, pays ISO, téléphone).
2. **Variante choisie par ligne de commande** — MANQUANT. `orderItems` ne stocke que
   `productId, quantity, priceAtPurchase` (pas la couleur/taille choisie).
   ➜ À faire : ajouter `selectedOptions` sur orderItems pour résoudre le bon SKU.
3. **Mapping variante → SKU AliExpress** — colonne ajoutée (`supplierVariantMap`),
   mais pas encore peuplée à l'import ni via UI admin.
   ➜ À faire : capter le SKU au scraping (dropshipping.ts) et/ou éditeur admin.
4. **URL produit d'origine** — ✅ déjà stockée (`products.supplierUrl`) à l'import.

## Fichiers
- Extension : `chrome-extension/` (manifest.json, background.js, content-mazigho.js,
  content-aliexpress.js, selectors.js, popup.html/js, README.md).
- Backend : server/adminRouter.ts (routeur `fulfillment`), server/db.ts,
  server/services/addressFormat.ts, drizzle/schema.ts.
- Admin UI : client/src/pages/admin/AdminOrders.tsx (2 boutons + modale serveur).

## Maintenance
Tous les sélecteurs AliExpress sont dans `chrome-extension/selectors.js` (fichier
unique). En cas de changement de design AliExpress, mettre à jour ce seul fichier.
