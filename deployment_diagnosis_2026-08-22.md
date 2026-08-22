# Diagnostic Vercel — 22 août 2026

## Cause de la régression
Le déploiement du commit `32a8f4f` échouait pendant l'installation : `npm ci` signalait que `package.json` et `package-lock.json` n'étaient pas synchronisés, avec des dépendances optionnelles multi-plateformes manquantes. Le déploiement précédent servait `dist/index.js` à la racine : sa réponse HTTP avait `Content-Type: application/javascript` et affichait le bundle backend au lieu de l'interface.

## Correction appliquée
Le frontend Vite est maintenant généré dans `dist/` (`dist/index.html`, `dist/assets/*`) et le bundle backend dans `server-dist/`. Express utilise `dist/` en production. `vercel.json` utilise `buildCommand: npm run build`, `installCommand: npm install --include=dev --include=optional --legacy-peer-deps`, `outputDirectory: dist`, ainsi que les rewrites `/api` puis SPA `/index.html`.

## Vérifications
Le build local après installation propre passe avec `npm run check` et `npm run build`. Le déploiement du commit `b624e7e` est en succès via GitHub/Vercel, cible `https://mazigho-shop-h0dopwseu-mazigho.vercel.app`. Le domaine de production `https://mazigho-shop.vercel.app/` répond en `200`, `Content-Type: text/html`, avec `<!doctype html>` et un script Vite sous `/assets/`. La route `https://mazigho-shop.vercel.app/admin` répond également avec l'application SPA et demande la connexion, au lieu d'une 404.

## Référence
La documentation officielle Vercel confirme que `vercel.json` peut définir `buildCommand`, `installCommand`, `outputDirectory` et `rewrites`, et recommande de ne pas combiner la configuration legacy `builds` avec les réglages modernes : [Static Configuration with vercel.json](https://vercel.com/docs/project-configuration/vercel-json), mise à jour le 17 juin 2026.

## Contrôle final après le correctif `c3fcca3`
Le déploiement Vercel associé au commit `c3fcca3` est en succès, cible `https://mazigho-shop-ahhy29ex2-mazigho.vercel.app`. Le domaine de production répond avec du HTML et l'interface MAZIGHO est visible. `/admin` charge l'écran « Veuillez vous connecter pour continuer ». L'endpoint `/api/trpc/auth.me` répond `HTTP 200` en `application/json` avec `{"result":{"data":{"json":null}}}` lorsqu'aucune session n'est présente.

L'erreur runtime précédente provenait du paquet natif Rollup manquant dans la fonction serverless. Le bridge charge désormais `server-dist/index.js`, et l'entrée serveur configure `configureApi(app)` ; les imports Vite ont été isolés du runtime production via `server/_core/static.ts`.

## Tests de fumée API
Les endpoints publics `/api/trpc/products.getFeatured`, `/api/trpc/categories.getAll` et `/api/trpc/products.getAll` répondent tous `HTTP 200` avec des listes vides, ce qui confirme que tRPC atteint la base TiDB (le catalogue n'est simplement pas encore alimenté). La route protégée `/api/trpc/admin.getStats` répond `HTTP 403` avec `FORBIDDEN` sans session, ce qui confirme que la protection d'administration fonctionne.
