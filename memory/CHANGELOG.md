# MAZIGHO — Journal des changements

## 2026-06 — Roadmap P1/P2 : 3 modules livrés (commit local 56eaa4c, build vérifié, à déployer via PAT)
- **Mode Maintenance** (`/admin/maintenance`) : toggle + titre + message (settings maintenance.*). Garde dans App.tsx `Router()` → visiteurs voient MaintenancePage « Revenez bientôt » ; staff connecté + /login + /admin* exemptés ; aperçu ?preview_maintenance=1. Endpoints admin.system.getMaintenance/setMaintenance + public content.getMaintenance. Vérifié end-to-end (admin voit le site, visiteur bloqué, login accessible).
- **Campagnes & bannières + Compte à rebours** (`/admin/campagnes`) : table `campaigns` (ensureCampaignsSchema, auto au runtime). CRUD admin.campaigns.*. Public content.getActiveCampaign (fenêtre temporelle + promo lié). Storefront components/CampaignBar.tsx dans Header : barre d'annonce ou bannière image (desktop/mobile URL) + compte à rebours FOMO live, disparition auto à l'échéance. Vérifié (bar + countdown + CRUD UI).
- **Analyse conversion** (`/admin/conversion`) : ventes réelles (getStats) + graphique + encart honnête « Vercel Web Analytics non connecté » (KPIs visiteurs/conversion en attente du token). Vérifié.
- Fichiers : server/db.ts (getMaintenanceStatus/setMaintenance, campaigns CRUD, getActiveCampaign, ensureCampaignsSchema), server/adminRouter.ts (system.getMaintenance/setMaintenance + campaigns router + campaignInputSchema), server/routers.ts (content.getMaintenance/getActiveCampaign), drizzle/schema.ts (table campaigns), client: MaintenancePage.tsx, CampaignBar.tsx, AdminMaintenance/AdminCampaigns/AdminConversion.tsx, App.tsx (routes + garde), Header.tsx (CampaignBar), DashboardLayout.tsx (nav).

## 2026-06 — Roadmap P1 : 3 modules livrés (build pod vérifié, à déployer via PAT)
- **Santé du Système** (`/admin/sante`, nav Configuration) : endpoint `admin.system.health` (adminProcedure). Pastilles vert/rouge — TiDB (SELECT 1 chronométré + hôte), Odoo (configuré + `odoo.last_sync_at` écrit dans stripeWebhook au sync réussi), version du site (`VERCEL_GIT_COMMIT_SHA`/ENV). Auto-refresh 30s. Vérifié : DB Connecté 151ms, Odoo non configuré (preview), version « local / dev ».
- **Export Comptable & TVA** (`/admin/comptabilite`, nav Pilotage) : endpoints `admin.accounting.getVatReport/getVatConfig/setVatConfig`. Filtre période (mois/trimestre/année/perso), tableau (Date, Réf transaction=stripeSessionId, Brut, TVA, Net, Pays via `detectDeliveryCountry`), export CSV (`;` + BOM) et Excel (.xls HTML). Franchise TVA par défaut (0%, « Exonéré de TVA selon l'art. 10 LTVA », Brut=Net). Toggle TVA + taux (8.1%) persistés dans `settings` (vat.enabled/vat.rate) — vérifié persistance puis remis en franchise. Barre de seuil 100'000 CHF (alerte 80k, dépassement 100k). CA annuel encaissé = `getYearToDatePaidSales`.
- **Aperçu du brouillon** : bouton œil dans `/admin/produits` → `/produit/{slug}?preview=1`. Endpoint `admin.products.preview` (catalogEditorProcedure) + `db.getProductForPreview` (sans filtre status). Product.tsx : mode preview (query admin, pas de redirection canonique, bandeau ambre « Mode aperçu — statut … »). Vérifié : brouillon #120001 visible en aperçu, « non trouvé » pour un visiteur.
- Fichiers clés : server/adminRouter.ts (system + accounting VAT + products.preview + detectDeliveryCountry), server/db.ts (getSettingValue/setSettingValue, pingDatabase, getVatConfig/setVatConfig, getPaidOrdersBetween, getYearToDatePaidSales, getLastOdooSync, getProductForPreview), server/stripeWebhook.ts (écrit odoo.last_sync_at), client: AdminSystemHealth.tsx, AdminComptabilite.tsx, App.tsx (routes), DashboardLayout.tsx (nav), AdminProducts.tsx (bouton Aperçu), Product.tsx (mode preview).


## ⏸️ ARRÊT DEMANDÉ PAR L'UTILISATEUR — état stable = commit 885931c (déployé, prod OK)
> Aucune modif de code non déployée. Les points ci-dessous ont été SIGNALÉS (retour Manus) mais NON encore corrigés. À reprendre plus tard (budget crédits utilisateur bas).

### Retour Manus — TOUT CORRIGÉ ✅ (2026-06, build pod vérifié, à déployer via PAT)
1. FAIT ✅ — « Produit de test Stripe — ne pas vendre » (#120001) : passé en `draft`.
2. NON REPRODUIT ✅ — **Bascule de langue** : sur le build actuel, FR→AR et AR→FR changent bien les NOMS de produits ET catégories, avec une requête réseau tRPC relancée à chaque changement (vérifié Playwright, DIR ltr/rtl OK). La clé tRPC inclut `locale` → refetch correct. Aucun changement de code nécessaire ; si le problème réapparaît en prod c'est probablement un cache navigateur côté visiteur → un redeploy le purge.
3. FAIT ✅ — **Cartes catalogue** : bloc livraison retiré des cartes sur Shop.tsx, Home.tsx (featured), Category.tsx, Nouveautes.tsx, BestSellers.tsx, Promos.tsx (le bandeau pays en haut suffit).
4. FAIT ✅ — **Fiche produit** : badges de confiance refaits (Product.tsx). Clés i18n `paymentSoon`/`noPaymentNow`/`orderReview`/`rechecked` (7 langues) → « Paiement sécurisé / Transactions chiffrées et protégées » (icône Shield) + « Livraison suivie / Numéro de suivi pour chaque commande » (icône Truck).
5. FAIT ✅ — **Mode sombre** : ajout d'overrides CSS dans `client/src/index.css` mappant les fonds crème arbitraires (`bg-[#fbf7f2]`, `#fffaf7`, `#f2eee9`, etc.) vers `var(--card)`/`var(--muted)` et bordures crème vers `var(--border)` en `.dark`. Les titres de cartes redeviennent lisibles (vérifié Playwright, boutique en mode sombre).


## 2026-06 — Modération avis + badge Nouveau + filtres boutique (commit 885931c, prod OK)
- **Modération des avis** : les nouveaux avis passent en statut `pending` (plus d'auto-publication). Seuls les avis `approved` sont affichés ET comptés dans la moyenne (`getAverageRating`, `getProductReviews`, `getProductReviewsForProducts` filtrent `status='approved'`). Le back-office `/admin/avis` (page + routeur `admin.reviews` déjà présents) est désormais opérationnel : `getAllReviewsAdmin` corrigé pour renvoyer le nom d'auteur invité + statut ; `updateReviewStatus` publie/masque. Message storefront mis à jour : « votre avis sera publié après validation » (7 langues).
- **Badge « Nouveau »** : étiquette verte sur les produits créés il y a < 30 jours. Helper `client/src/lib/isNewProduct.ts`, libellés `client/src/lib/shopControlsCopy.ts` (7 langues). Rendu sur Boutique (Shop.tsx) et pages catégories (Category.tsx).
- **Filtres boutique** : sur `/boutique`, filtre par catégorie + tri (Populaires / Nouveautés / Prix croissant / Prix décroissant), côté client, avec affichage de tous les produits filtrés (au lieu de 8). Vérifié en prod.
- **Nettoyage** : produit « test Stripe — ne pas vendre » (#120001) passé en brouillon (caché de la boutique).

## 2026-06 — Avis clients + produits similaires (commit 475cc23)
- Dépôt d'avis invité (note + nom + commentaire), endpoint public `products.submitReview`. Schéma `reviews` : `authorName` ajouté, `userId` nullable (`ensureReviewsSchema`).
- Carrousel « Produits similaires » (déjà codé) visible car catalogue rempli.

## 2026-06 — Traductions 100 %
- 56/56 produits traduits en 6 langues (DE, IT, EN, ES, NL, AR) via la clé LLM Emergent (gpt-4.1-mini). Universal Key rechargée par l'utilisateur.

## 2026-06 — Catalogue réel + fixes variantes/traduction/perf (commit 4b8be9a)
- 45 produits CJ dans 11 catégories, prix (.90), livraison 8 pays, stock 60, fiches FR HTML générées par LLM. Variantes en français.
- BUG variantes : `ProductOptions.tsx` réécrit ({name,values}). BUG langue : repli FR dans `routers.ts`. PERF : N+1 éliminé (helpers bat* dans db.ts + `enrichPublicProducts`), listes 43-60s → ~1-2s. `placeholderData` sur toutes les listes storefront. Admin : filtre/tri par catégorie. Proxy LLM Emergent dans `_core/llm.ts`.

## À FAIRE (côté utilisateur)
- Vercel : ajouter `BUILT_IN_FORGE_API_URL=https://integrations.emergentagent.com/llm` + `BUILT_IN_FORGE_API_KEY=sk-emergent-...` puis Redeploy → active le bouton « Générer » de l'admin en ligne (nécessite du solde Universal Key).
- Révoquer le PAT GitHub après déploiement.

## Déploiement
Push manuel via PAT (yacbhl71) sur `main` → Vercel prod www.mazigho.ch. Voir memory/DEPLOYMENT.md. NE PAS utiliser « Save to Github » d'Emergent.

## Scripts de maintenance (pod, non déployés)
`scripts/`: catalogLib.ts, populate_catalog.ts, translate_all.ts, fix_store.ts, refrenchify_options.ts, trans_coverage.ts, list_reviews.ts, hide_stripe_test.ts, etc.
