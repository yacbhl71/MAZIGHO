# MAZIGHO Fulfillment — Extension Chrome (Mode A)

Automatise la préparation des commandes AliExpress depuis l'admin MAZIGHO, en
utilisant **votre session AliExpress** (compte connecté). Le script sélectionne
la variante, ajoute au panier, ouvre le tunnel de commande et remplit l'adresse,
puis **s'arrête AVANT le paiement** : vous validez et payez vous-même.

## Installation (mode développeur)
1. Ouvrez Chrome → `chrome://extensions`.
2. Activez « **Mode développeur** » (en haut à droite).
3. Cliquez « **Charger l'extension non empaquetée** » et sélectionnez ce dossier
   `chrome-extension/`.
4. L'icône « MAZIGHO Fulfillment » apparaît. Épinglez-la si besoin.
5. Connectez-vous à AliExpress dans le même navigateur (session partagée).

## Utilisation
1. Ouvrez **Admin MAZIGHO → Commandes**.
2. Sur une commande **payée**, cliquez **« Commander (via Extension Chrome) »**.
3. Un onglet AliExpress s'ouvre au premier plan et se prépare automatiquement.
4. En cas de **captcha / connexion**, résolvez-le dans l'onglet : le script
   reprend tout seul juste après.
5. Vérifiez la commande et cliquez **vous-même** sur « Payer ».

## Maintenance (quand AliExpress change son design)
Toute la logique dépend d'un **seul fichier** : `selectors.js`.
Si un bouton/champ n'est plus trouvé, mettez à jour les sélecteurs
correspondants dans `selectors.js` (chaque champ accepte plusieurs sélecteurs
séparés par des virgules). Vous pouvez confier ce fichier à une IA pour qu'elle
le mette à jour à partir du HTML actuel d'AliExpress, sans toucher au reste.

## Fichiers
- `manifest.json` — déclaration MV3 + permissions.
- `background.js` — service worker (ouvre l'onglet, relaie les données).
- `content-mazigho.js` — pont sur les pages MAZIGHO (postMessage ↔ extension).
- `content-aliexpress.js` — automatisation sur AliExpress (+ overlay de statut).
- `selectors.js` — **sélecteurs centralisés** (le seul fichier à maintenir).
- `popup.html` / `popup.js` — petit panneau de statut.

## Sécurité
- Aucun jeton/API key n'est stocké dans l'extension : les données de commande
  sont fournies par la page admin déjà authentifiée, via `postMessage`.
- Le script ne clique **jamais** sur « Payer ».
