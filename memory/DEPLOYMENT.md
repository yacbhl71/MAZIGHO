# Déploiement MAZIGHO — procédure & incident (à lire avant tout déploiement)

## ⚠️ Règle d'or
NE PAS utiliser « Save to Github » d'Emergent pour ce projet.
Cette app est un dépôt git IMBRIQUÉ dans `/app/mazigho` (repo GitHub: https://github.com/yacbhl71/MAZIGHO).
« Save to Github » capture la RACINE `/app` (l'enveloppe Emergent standard: `backend/` FastAPI + `frontend/` CRA)
et écrase `main` avec la mauvaise arborescence -> build Vercel cassé (404).

## ✅ Procédure de déploiement correcte (push manuel depuis /app/mazigho)
1. Le dépôt distant attend les fichiers à la RACINE (`vercel.json`, `client/`, `server/`, `api/`),
   PAS sous un dossier `mazigho/` ni `backend/`/`frontend/`.
2. Il faut un jeton GitHub (PAT fine-grained du compte **yacbhl71**, repo MAZIGHO, permission Contents: Read and write).
   (La connexion Emergent est sur `yacineb71` qui n'a pas les droits d'écriture -> `git push` échoue "could not read Username".)
3. Vérifier le build local: `npm run build` (doit finir sans erreur; l'unique erreur TS pré-existante Cart.tsx(44) n'affecte pas vite build).
4. Pousser d'abord sur une BRANCHE DE TEST (jamais main direct):
   `git -c credential.helper= push "https://x-access-token:<PAT>@github.com/yacbhl71/MAZIGHO.git" HEAD:deploy-test`
   (URL inline = le token n'est PAS stocké dans la config git)
5. Vercel (projet **mazigho-shop**) construit un Preview pour cette branche -> vérifier qu'il fonctionne.
   NB: les Preview sont protégés par Vercel Auth -> seul le propriétaire connecté peut les ouvrir.
6. Si OK -> pousser en force sur main:
   `git -c credential.helper= push --force "https://x-access-token:<PAT>@github.com/yacbhl71/MAZIGHO.git" HEAD:main`
7. Vercel déploie `main` = production automatiquement (le domaine www.mazigho.ch est attaché à la branche main).
   « Promote » sera grisé car le déploiement main devient direct la production.
8. Révoquer le PAT après usage.

## Notes
- Base de données (TiDB) et variables .env ne sont JAMAIS incluses dans un push git.
  Les nouvelles tables/colonnes se créent automatiquement au runtime (fonctions `ensure*` dans server/db.ts).
- Env vars Vercel optionnelles (mode dégradé sinon): RESEND_API_KEY + MAZIGHO_EMAIL_FROM (emails),
  STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (paiement/remboursement).
- Points de restauration GitHub connus (mentionnés par support): branche `restore-backup-2026-08-27`,
  tag `restore/mazigho-validated-2026-08-24`.

## Historique
- 2026-06-01: Déploiement roadmap P1 (commit 1d47891) via PAT fine-grained yacbhl71.
  Note: 1er PAT fourni était Contents=Read-only (git push 403 « denied to yacbhl71 » alors que l'API repo montrait push:true — le champ permissions API = rôle utilisateur, PAS les scopes du PAT). Résolu avec un PAT Contents=Read and write.
  Push deploy-test (Preview validé) -> force push main -> prod OK. www.mazigho.ch en ligne (Santé système, Export TVA, Aperçu brouillon, Mode maintenance, Campagnes/Countdown, Analyse conversion + correctifs UI Manus). Table `campaigns` auto-créée au runtime sur TiDB prod.
- 2026-08-31: Incident "Save to Github" (push de l'enveloppe -> 404). Résolu par rollback Vercel (2c38505)
  puis push manuel du vrai code (commit 3245e5b, Lots A/B/C) via PAT -> branche deploy-lots-abc (Preview validé)
  -> force push main -> production OK. www.mazigho.ch en ligne avec tous les Lots A/B/C.
