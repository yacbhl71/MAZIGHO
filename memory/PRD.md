# MAZIGHO — PRD / Journal de travail

## Problème initial (fourni par l'utilisateur)
Dépôt GitHub `yacbhl71/MAZIGHO` (boutique e-commerce multi-niches). L'utilisateur signalait
une erreur de connexion : `Failed query: select ... from users where LOWER(users.email) = ? ...`
et souhaitait « analyser tout, finir le travail et faire en sorte que tout fonctionne ».

## Stack (existante, conservée à la demande de l'utilisateur — option 1a)
- Backend : Node.js + Express + tRPC + Drizzle ORM
- Base de données : MySQL/TiDB Cloud (serverless, `mazigho`)
- Frontend : React 19 + Vite + Tailwind v4 + Radix + wouter
- Déploiement : Vercel (domaines mazigho-shop.vercel.app / mazigho.ch)
- Intégrations : Stripe (mode test), CJ Dropshipping, AliExpress, OpenAI, Resend, Make.com, AWS S3

## Personas
- **Admin/propriétaire** (yacbhll@gmail.com) : gère produits, catégories, commandes, utilisateurs, avis, contenu.
- **Client** : navigue le catalogue, panier, checkout Stripe.
- **Staff** (rôles : catalog_editor, support_agent, order_operator) : accès partiel au panel.

## Cause racine du bug de login (diagnostiquée)
Le mot de passe de la base TiDB était **invalide/expiré** (identifiants codés en dur et périmés
dans `server/diag_db.ts`). Conséquence : TOUTES les requêtes SQL échouaient (`Access denied for user`),
d'où l'erreur `Failed query` sur la recherche `users`. Ce n'était pas un bug de logique de login.

## Travaux réalisés (2026-08-29)
- Diagnostic complet : reproduit `Access denied` sur toutes configs SSL → mot de passe DB périmé.
- Nouveau mot de passe TiDB obtenu (reset par l'utilisateur) ; connexion validée sur la vraie base
  (19 tables intactes, 11 produits, 3 utilisateurs).
- Vérifié bout-en-bout via le serveur de prod local (port 3100) :
  - `auth.login` (admin) OK + cookie de session émis + `auth.me` OK
  - `admin.getStats` OK (accès admin)
  - `products.getAll` (catalogue public) OK
  - mauvais mot de passe → UNAUTHORIZED (correct)
- Réinitialisé le mot de passe admin (`yacbhll@gmail.com`) à une valeur temporaire pour garantir l'accès.
- Sécurité : suppression des identifiants DB codés en dur dans `server/diag_db.ts` (lecture via `DATABASE_URL`).
- Ajout du chargement `.env` (`import "dotenv/config"`) dans `server/_core/index.ts` et `diag_db.ts` (dev local).
- `npm run build` validé (frontend + backend), comme sur Vercel.
- Guidé l'utilisateur pour mettre à jour `DATABASE_URL` (Production + Preview) et ajouter `JWT_SECRET` sur Vercel,
  puis redéployer → **mazigho.ch réparé et login confirmé par l'utilisateur**.
- Commit local prêt (non poussé — en attente d'un token GitHub) : correctif sécurité + dotenv + script reset admin.

## Backlog / À faire
### Itération 2026-08-31 — Lot B (P1) + Lot C (P2) livrés
**Lot B — Croissance & fidélisation**
- **Moteur de codes promo avancés** : portées `all` / `first_order` / `category`, limite par client (`perUserLimit`), suivi des utilisations (`promotionRedemptions`), comptage des rédemptions. Validation enrichie (`validatePromotion` avec userId + cartItems). Câblé au checkout Stripe (coupon Stripe `amount_off` + enregistrement de la rédemption au paiement via webhook / getSessionStatus) ET au flux legacy `createOrder`. Champ code promo ajouté au `Checkout.tsx` (aperçu remise). Admin : `AdminPromotions` étendu (portée, catégorie ciblée, limite/client, badges).
- **Paniers abandonnés** : détection `getAbandonedCarts(hours)` (colonne `carts.reminderSentAt`), page `/admin/paniers-abandonnes` (stats, seuil réglable, relance e-mail 1-clic). Dégradation gracieuse si e-mail non configuré.
- **E-mails transactionnels personnalisables** : modèles stockés en `settings` (`email_template_*`), variables `{{prenom}} {{commande}} {{total}} {{lignes}} {{suivi}} {{panier}}`, page `/admin/emails` (onglets, éditeur, activation, réinitialisation). Service `server/emails.ts` (rendu + layout + envoi Resend). Confirmation de commande envoyée au paiement, e-mail d'expédition envoyé au passage « expédiée ».

**Lot C — Opérations & SAV**
- **Retours / RMA** : table `returnRequests`, demande côté client (page `/commandes` reconstruite en liste réelle via `shop.orders.getMyOrders`), gestion admin `/admin/retours` (approuver/refuser). Accès order_operator + admin.
- **Remboursement Stripe 1-clic** : `admin.orders.refund` (retrieve session → payment_intent → `refunds.create`), double confirmation `REMBOURSER #id`, marque la commande `refunded`. Admin uniquement, gracieux si Stripe absent.
- **Timeline commande** : `getOrderTimeline` calculée depuis les données réelles (créée, payée, décisions, expédition+suivi, livrée, retours, remboursement). Affichée dans un modal sur `/admin/retours`.
- **Suivi CJ côté client** : n° de suivi affiché sur chaque commande de `/commandes`.
- **Aperçu SEO live** : `admin.seo` get/save (`seo_default_title` / `seo_default_description`), carte « Aperçu moteur de recherche » (Google + réseaux sociaux) dans `/admin/seo`.

**Vérifications (local, port 3100)** : `npm run build` + `tsc` OK. Curl : promos avancées (first_order/category/perUserLimit), validate, e-mail templates CRUD, paniers abandonnés + relance gracieuse, RMA (demande→approbation), timeline (créée→payée→expédiée CJ→retour), refund gracieux, SEO get. Screenshots : promotions, paniers abandonnés, e-mails, commandes client, retours, aperçu SEO — tous rendus.
**Non testable en local** (clés absentes, dégradation gracieuse) : paiement Stripe réel + application coupon promo, envoi e-mail Resend réel, remboursement Stripe réel. À valider en prod après ajout des clés.
**Déploiement** : via « Save to Github » → build/déploiement Vercel automatique.

### Itération 2026-08-30 — Lot A « Pro Features » finalisé (Analytics + Audit)
- **Smart Pricing (fait précédemment)** : prix CJ importés arrondis en .90 CHF.
- **Dashboard analytique enrichi** (`getAdminStats` dans `server/db.ts`, UI `AdminDashboard.tsx`) :
  - KPI « Panier moyen » (moyenne `totalAmount` des commandes payées).
  - KPI + courbe « Chiffre d'affaires 30 derniers jours » (agrégation JS pour contourner `only_full_group_by` de TiDB — NE PAS remettre de `GROUP BY DATE()`).
  - Bloc « Top 5 des ventes » (jointure `orderItems`/`orders`/`products`, commandes payées).
- **Journal d'audit staff** :
  - Nouvelle table `auditLogs` (schema + `ensureAuditLogSchema`, auto-migrée à chaud).
  - Helpers `recordAuditLog`, `getAuditLogs` (filtres + pagination), `getAuditLogFilterOptions` dans `server/db.ts`.
  - Router tRPC `admin.audit.getLogs` / `admin.audit.getFilters` (adminProcedure — admin uniquement).
  - Helper `logAudit(ctx, entry)` fire-and-forget dans `adminRouter.ts`, jamais bloquant.
  - Instrumentation complète : produits (create/update/delete/import CJ), catégories (CRUD), commandes (decide/status), utilisateurs (invite/profil/rôle/statut/suppression), personnalisation (design.update), promotions (CRUD).
  - Nouvelle page `/admin/audit` (`AdminAudit.tsx`) : table filtrable (type, membre, recherche) + pagination. Entrée de menu « Journal d'audit » (section Configuration, admin only).
- **Vérifié en local (port 3100)** : `npm run build` OK ; login admin OK ; `getStats` renvoie averageCart/topProducts/revenueTrend(30j) ; audit enregistré et lu pour product/category/promotion ; filtres peuplés ; pages Dashboard + Audit rendues (captures OK).
- **Déploiement** : à pousser via « Save to Github » → build/déploiement Vercel automatique.


- **Odoo (Task 1)** : `server/services/odoo.ts` (JSON-RPC : auth, upsert `res.partner`, création `sale.order`). Synchro déclenchée sur le webhook Stripe `checkout.session.completed` via `syncPaidOrderToOdoo` (jamais bloquant). Helper `getOrderForStripeSession`. Endpoints admin `suppliers.odooStatus` / `verifyOdoo`. Dégrade proprement si `ODOO_*` absents. Variables documentées dans `.env.example`.
- **CJ (Task 2)** : `prepareCjProductImport` lit le stock réel par VID via `stock/queryByVid` quand `product/query` n'expose pas les inventaires (+ flag `stockConfirmed`) → fin des « À confirmer » en boucle. Gate d'import assoupli (bloque seulement si CJ confirme 0). Taille de recherche catalogue augmentée. Taux USD→CHF amorcé (`VITE_CJ_USD_CHF_RATE`, défaut 0.90).
- **Vérifié** : `npm run build` OK ; testing_agent backend 9/9 (auth, catalogue, admin stats, Odoo/CJ dégradation gracieuse, aucun crash). Poussé sur `main` (`e313e4b`) → **déploiement Vercel production réussi**, mazigho.ch et mazigho-shop.vercel.app répondent 200, catalogue + login OK en prod.
- **À faire côté utilisateur pour activer Odoo en prod** : ajouter `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY` (et éventuellement `ODOO_DEFAULT_PRODUCT_ID`) dans Vercel, puis vérifier via le Hub fournisseurs.

## Backlog / À faire (initial)
### P0 (bloquant / sécurité)
- [ ] Pousser le commit correctif sur GitHub `main` (nécessite un token GitHub de l'utilisateur).
- [ ] (Recommandé) Ajouter `JWT_SECRET` aussi en environnement **Production** sur Vercel.
- [ ] Restaurer `MAKE_WEBHOOK_API_KEY` (Preview) écrasée par erreur, si l'automatisation Make est utilisée.

### P1 (fonctionnel)
- [ ] Corriger les erreurs TypeScript préexistantes (`Cart.tsx` prop `available`, `cjDropshipping.ts` params) — n'empêchent pas le build Vercel.
- [ ] Finaliser todo.md : générer des images produits, ajouter des avis clients de démonstration.

### P2 (améliorations)
- [ ] Ajouter des clés API réelles quand disponibles (Stripe live, OpenAI, Resend).
- [ ] Faire tourner `drizzle-kit migrate` pour aligner l'enum `role`/`accountStatus` (sinon géré à chaud par les fonctions `ensure*`).

## Accès admin (temporaire)
- Email : `yacbhll@gmail.com`
- Mot de passe temporaire : `Mazigho2026!` (à changer via `/parametres` → section Sécurité)

## Notes environnement
- Variables Vercel requises pour le fonctionnement de base : `DATABASE_URL` (obligatoire), `JWT_SECRET` (recommandé),
  `NODE_ENV`. Les intégrations (Stripe, CJ, Make, OpenAI, Resend) ont leurs propres variables déjà présentes.
- Le secret de session dérive de `DATABASE_URL` si `JWT_SECRET` absent → tout changement de mot de passe DB déconnecte les sessions.


## 2026-06 — Phase 1 : correctifs UI (retour Manus) — build pod vérifié, à déployer
- Bug langue : NON REPRODUIT sur le build actuel (refetch tRPC OK). Voir CHANGELOG.
- Détails de livraison retirés des cartes catalogue (6 pages storefront).
- Badges de confiance fiche produit refaits (7 langues) : Paiement sécurisé + Livraison suivie.
- Mode sombre : fonds crème des cartes mappés vers surfaces sombres (index.css) → contraste OK.
- Vérifié via Playwright (boutique clair + sombre, fiche produit, bascule FR↔AR). `yarn build` OK.
- Roadmap 7 modules en attente : voir memory/ROADMAP.md (P1 : Santé Système → Aperçu brouillon → Export TVA → Maintenance → Bannières/Countdown → Analytics).

## 2026-06 — Phase 2 : 3 modules roadmap P1 livrés (build pod vérifié, à déployer)
- Santé du Système (/admin/sante), Export Comptable & TVA (/admin/comptabilite), Aperçu brouillon (bouton œil produits + /produit/{slug}?preview=1). Détails : voir CHANGELOG.md et ROADMAP.md.
- Restant roadmap : Mode Maintenance (P1), Bannières temporelles + Compte à rebours (P1), Analyse conversion Vercel Analytics (P2, token requis).

## 2026-06 — Phase 3 : roadmap P1 finalisée (commit 59303d2, à déployer)
- Mode Maintenance (/admin/maintenance), Campagnes & bannières + Compte à rebours FOMO (/admin/campagnes), Analyse conversion placeholder (/admin/conversion). Détails : CHANGELOG.md / ROADMAP.md.
- Les 6 modules de la roadmap sont livrés (Analyse conversion en placeholder : à connecter à Vercel Web Analytics quand le token sera fourni).

## 2026-06 — Phase 4 : Fulfillment AliExpress — réconciliation Git + greffe extension Chrome
### Contexte Git (RÉSOLU, aucune perte)
- Un fork précédent avait force-pushé par erreur ; recovery effectuée. État constaté au démarrage de cette session :
  - `origin/main = f88e1d5` = travail manuel de l'utilisateur/Manus (CJ sandbox, Odoo, adresse structurée Stripe, `selectedOptions` par ligne, `supplierVariantMappings`, générateur de manifeste AliExpress, imports/exports CSV brouillons) — **intact sur GitHub**.
  - Travail agent "Brick 1" (extension Chrome) préservé sur `origin/agent-chrome-extension-brick1` + backup local `agent-brick1-local` (93a1087).
- Décision utilisateur (option a) : **repartir de la base Manus (`f88e1d5`)** et n'y greffer QUE le dossier `chrome-extension/`, branché sur le manifeste de Manus. `main` local réaligné sur `f88e1d5` (`git reset --hard origin/main`), puis dossier `chrome-extension/` re-greffé depuis le backup.
### Livré
- Extension Chrome adaptée pour consommer le **manifeste canonique de Manus** (`admin.orders.getAliExpressPreparationManifest`). Backend dupliqué de l'agent (addressFormat.ts, getReadyToFulfill, colonne supplierVariantMap) **abandonné** (Manus a mieux). Voir `memory/FULFILLMENT_ARCHITECTURE.md`.
- `client/src/pages/admin/AdminOrders.tsx` : bouton « Commander (via Extension Chrome) » (data-testid `fulfill-chrome-extension-btn`) + détection extension (badge `extension-status-badge`) + handler `startChromeExtensionFulfillment` (postMessage du manifeste). Bouton activé seulement si `state===ready_for_human_review` ET extension détectée. S'arrête toujours avant le paiement.
- Vérifié (preview) : `yarn build` OK, `tsc` 0 erreur, extension `node --check` OK ; commande CJ → pas de bouton (scope OK) ; manifeste "ready" mocké → bouton affiché/activé + clic envoie le manifeste exact.
### À faire / différé
- **Mode B (worker tablette/iPad)** : DIFFÉRÉ (accord utilisateur). Impossible sur Vercel serverless (Playwright persistant + WebSocket). Nécessiterait Railway/Render/Fly.io.
- Peupler `supplierVariantMappings` AliExpress à l'import et/ou via éditeur admin pour un mapping variante→SKU complet (aujourd'hui manuel/à vérifier sur la fiche).
- Déploiement : via « Save to Github » → build/déploiement Vercel automatique. **Ne PAS force-push.**

## 2026-06 — Phase 5 : procédure AliExpress COMPLÈTE (sourcing produit + pipeline validé sur données réelles)
- Ajout du maillon manquant : **sourcing produit AliExpress** dans l'admin. Onglet « Fournisseur » du produit : champ `ID produit fournisseur (AliExpress)` (`supplierProductId`, data-testid `product-supplier-id-input`) + **auto-extraction depuis l'URL** (`.../item/<ID>.html`) + bouton « Extraire de l'URL ». Ajout de `supplierProductId` aux inputs `admin.products.create/update` (`server/adminRouter.ts`). Persistance vérifiée en base.
- **Procédure de bout en bout validée sur données RÉELLES** : produit AliExpress → commande payée/processing + adresse structurée + selectedOptions → manifeste `ready_for_human_review` (endpoint réel) → bouton admin activé → envoi du manifeste à l'extension → l'extension ouvre AliExpress, sélectionne variante/quantité, remplit l'adresse et **s'arrête avant le paiement**. Détails et preuves : `memory/FULFILLMENT_ARCHITECTURE.md`.
- ⚠️ Seul reste non testable automatiquement : l'automatisation réelle du navigateur AliExpress (extension installée dans un vrai Chrome + session AliExpress) — validation manuelle par l'utilisateur.

## 2026-06 — Phase 6 : améliorations fulfillment (4 features)
1. **Mapping variantes → SKU AliExpress** : éditeur dans le formulaire produit (onglet Fournisseur) listant chaque combinaison d'options, stocké dans `products.supplierVariantMappings` (format Manus). Fait passer `optionStatus` de « human_selection_required » à « mapped » (vérifié : manifeste réel → optionStatus=mapped, supplierVariantId résolu). Routeur `admin.products.create/update` accepte `supplierVariantMappings`. Pré-remplissage à l'édition (ajout de `supplierVariantMappings` à la projection `getAllProductsAdmin`).
2. **Import AliExpress en masse** : bouton « Importer AliExpress (URLs) » + dialog (catégorie + textarea d'URLs) → `admin.products.bulkImportAliExpress` → crée des produits en **brouillon** avec `supplierProductId` extrait (vérifié : created=1/skipped=1 sur URL invalide).
3. **Journal de préparation** : réutilise la table `auditLogs`. `admin.orders.logFulfillmentEvent` (extension_sent/started/error) + `getFulfillmentLog`. Affiché dans le panneau AliExpress (data-testid `fulfillment-log`). Vérifié insert+lecture + affichage UI.
4. **Guide d'installation extension** : bouton « Comment installer ? » (data-testid `install-guide-btn`) → dialog en 3 étapes (data-testid `install-guide-dialog`). Vérifié UI.
- Vérifs : `yarn build` OK, `tsc` 0 erreur, 4 features validées en UI (screenshots) + backend (curl/tsx). Données de démo/test seedées puis SUPPRIMÉES.
