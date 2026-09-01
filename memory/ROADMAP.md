# MAZIGHO — Roadmap demandée (cahier des charges utilisateur, juin 2026)

> À exécuter module par module (idéalement chacun dans une session fraîche pour un contexte complet). Ne pas poser de questions ; si un module est bloqué (ex : clé API manquante), passer au suivant et le noter.
> App = /app/mazigho (React + tRPC + Drizzle + TiDB, déploiement Vercel via PAT, voir DEPLOYMENT.md). Admin nav = client/src/components/DashboardLayout.tsx ; routes admin = client/src/App.tsx ; procédures = server/adminRouter.ts (adminProcedure/catalogEditorProcedure/orderOperatorProcedure).

## P0 — Bug en cours (à finir d'abord)
- **Bascule de langue (accueil/boutique)** : au changement de langue, `dir` change (RTL en arabe) mais les requêtes produits/catégories (`products.getFeatured/getAll`, `categories.getAll`) NE se relancent PAS (0 requête réseau) → noms restent en français. Backend OK (curl getFeatured(ar)=arabe). tRPC v11, QueryClient par défaut. Investiguer : Home re-render vs clé de requête tRPC incluant `locale` ; tester `key={locale}` sur la racine des pages pour forcer le remount ; vérifier LocaleContext. Fichiers : Home.tsx, Shop.tsx, Category.tsx, contexts/LocaleContext.tsx, main.tsx.

## P1 — Modules demandés
1. **[FAIT ✅] PILOTAGE → Export Comptable & TVA** (/admin/comptabilite)
   - Filtrer ventes encaissées par période (Mois en cours, Trimestre, Année, plage perso). Export CSV + Excel.
   - Colonnes : Date commande, Réf. transaction (Stripe/PayPal), Montant Brut (CHF), Montant TVA (auto selon taux CH), Montant Net, Pays de livraison.
   - **Franchise TVA par défaut** : taux 0%, mention « Exonéré de TVA selon l'art. 10 LTVA », Brut = Net.
   - **Toggle « Activer TVA »** : taux (8.1% par défaut) stocké en DB TiDB (settings vat.enabled / vat.rate), désactivé par défaut → bascule calcul auto (net = brut/(1+taux), TVA incluse).
   - **Alerte seuil 100 000 CHF** : barre de progression du CA annuel encaissé ; alerte à 80k et dépassement à 100k.
   - Endpoints : admin.accounting.getVatReport / getVatConfig / setVatConfig. Détection pays via detectDeliveryCountry(shippingAddress).
2. **[FAIT ✅] CONFIGURATION → Santé du Système** (/admin/sante)
   - Pastilles vert/rouge : TiDB (Connecté + temps réponse ms via SELECT 1), synchro Odoo (configuré + dernière synchro depuis settings odoo.last_sync_at, écrite dans stripeWebhook), version du site (VERCEL_GIT_COMMIT_SHA/ENV).
   - Endpoint adminProcedure `admin.system.health`. Rafraîchi auto toutes les 30s.
3. **[FAIT ✅ (placeholder)] Analyse du Taux de Conversion** (/admin/conversion)
   - Page avec ventes RÉELLES (getStats.revenueTrend, graphique barres CHF), KPI Visiteurs/Conversion en attente. Encart honnête « Vercel Web Analytics non connecté ». À finaliser avec un token Vercel Analytics.
4. **[FAIT ✅] Mode Maintenance Évolué** (/admin/maintenance)
   - Toggle + titre + message personnalisables (settings maintenance.enabled/title/message). Garde côté client dans App.tsx `Router()` : visiteurs → page « Revenez bientôt » (components/MaintenancePage.tsx) ; staff connecté (admin/catalog_editor/order_operator/support_agent) et /login + /admin* exemptés. Aperçu via ?preview_maintenance=1. Endpoints admin.system.getMaintenance/setMaintenance + public content.getMaintenance.
5. **[FAIT ✅] Gestionnaire de Bannières Temporelles + Compte à rebours** (/admin/campagnes)
   - Table `campaigns` (ensureCampaignsSchema, auto-créée au runtime). CRUD admin (admin.campaigns.getAll/create/update/delete/toggle). Champs : nom, message, début/fin, visuels desktop+mobile (URL), lien, code promo lié, compte à rebours (on/off), emplacement, actif. Public content.getActiveCampaign (fenêtre temporelle heure serveur + promo lié). Storefront : components/CampaignBar.tsx en haut du Header → barre d'annonce OU bannière image, avec compte à rebours FOMO live qui disparaît tout seul à l'échéance (invalidation auto).
   - NB (choix utilisateur) : le prix « barré » vient du CODE PROMO lié (dates identiques), PAS de réécriture des prix produit en DB. Emplacement « fiches produits » = pour l'instant même barre site-wide (pas de compte à rebours par carte).
6. **[FAIT ✅] CRÉATION/FICHE PRODUIT → Aperçu du brouillon**
   - Bouton « Aperçu » (icône œil) dans /admin/produits → ouvre /produit/{slug}?preview=1. Endpoint admin.products.preview (catalogEditorProcedure) via db.getProductForPreview (sans filtre status). Bandeau ambre « Mode aperçu ». Visiteurs : produit brouillon reste « non trouvé ».

## Notes
- Uploads (bannières) : utiliser Emergent Object Storage (playbook via integration_expert), pas de base64.
- Toujours prefixer les routes API par /api/trpc ; ne jamais committer .env ; déployer via PAT (DEPLOYMENT.md), pas « Save to Github ».
