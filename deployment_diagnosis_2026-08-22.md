# Diagnostic Vercel — 22 août 2026

## Cause de la régression
Le déploiement du commit `32a8f4f` échouait pendant l'installation : `npm ci` signalait que `package.json` et `package-lock.json` n'étaient pas synchronisés, avec des dépendances optionnelles multi-plateformes manquantes. Le déploiement précédent servait `dist/index.js` à la racine : sa réponse HTTP avait `Content-Type: application/javascript` et affichait le bundle backend au lieu de l'interface.

## Correction appliquée
Le frontend Vite est maintenant généré dans `dist/` (`dist/index.html`, `dist/assets/*`) et le bundle backend dans `server-dist/`. Express utilise `dist/` en production. `vercel.json` utilise `buildCommand: npm run build`, `installCommand: npm install --include=dev --include=optional --legacy-peer-deps`, `outputDirectory: dist`, ainsi que les rewrites `/api` puis SPA `/index.html`.

## Vérifications
Le build local après installation propre passe avec `npm run check` et `npm run build`. Le déploiement du commit `b624e7e` est en succès via GitHub/Vercel, cible `https://mazigho-shop-h0dopwseu-mazigho.vercel.app`. Le domaine de production `https://mazigho-shop.vercel.app/` répond en `200`, `Content-Type: text/html`, avec `<!doctype html>` et un script Vite sous `/assets/`. La route `https://mazigho-shop.vercel.app/admin` répond également avec l'application SPA et demande la connexion, au lieu d'une 404.
