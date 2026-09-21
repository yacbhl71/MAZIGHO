# MAZIGHO

**MAZIGHO** est une plateforme e-commerce multi-boutique en cours de consolidation. Elle sépare la boutique publique, le cockpit opérateur **MAZIGHO Studio** et le panneau propriétaire de chaque boutique cliente. Chaque requête est résolue dans un périmètre de boutique, afin qu’un propriétaire n’accède qu’à ses données, à sa vitrine et à son équipe.

> Cette base est prête à être démontrée et configurée boutique par boutique. Elle ne doit pas encore être présentée comme un service d’encaissement multi-boutique ou de fulfillment automatisé : ces décisions exigent une conception juridique, produit et technique séparée.

## Ce que le projet fournit aujourd’hui

La vitrine publique affiche le catalogue, les pages de marque, les informations légales et les règles de livraison propres à la boutique résolue par son domaine. **MAZIGHO Studio** reste réservé à l’opérateur de la plateforme. Il permet de préparer, piloter et suivre les boutiques sans devenir un panneau client partagé.

Chaque boutique cliente dispose d’un panneau propriétaire isolé. Les rôles actifs permettent de distinguer le propriétaire, le manager et des rôles métier limités. Le panneau couvre notamment la vitrine, les produits, catégories, images, variantes préparatoires, stock, livraison, retours, SEO, informations légales, menu et aperçu des parcours publics.

Les fondations de sécurité incluent l’authentification locale par mot de passe haché, la limitation des tentatives sensibles, des en-têtes HTTP de sécurité et une limite de taille des requêtes. La politique de sécurité de contenu est actuellement publiée en **mode observation** afin d’identifier les ressources externes utilisées sans bloquer les vitrines, Stripe ou les pixels optionnels.

## Architecture

| Couche | Rôle |
| --- | --- |
| `client/` | Application React, Vite et Tailwind. Elle contient la vitrine, Studio et le panneau propriétaire. |
| `server/` | API Express et tRPC, authentification, règles métier et intégrations optionnelles. |
| `drizzle/` | Schéma et migrations MySQL/TiDB. Les données métier portent un périmètre de boutique. |
| `.github/workflows/ci.yml` | Validation automatique TypeScript, tests et build sur `main` et les pull requests. |

Les procédures tRPC constituent l’interface interne de l’application. Les écrans propriétaires doivent utiliser les procédures de gestion de boutique ; les opérations Studio doivent utiliser les procédures plateforme. Cette séparation ne doit jamais être remplacée par une simple condition côté navigateur.

## Démarrage local

Le projet est validé avec **Node.js 22** et npm. Copiez d’abord le modèle de variables, puis renseignez seulement les valeurs nécessaires à votre environnement local.

```bash
cp .env.example .env
npm ci
npm run check
npm test
npm run build
```

La base de données de développement doit être distincte de la production. Les variables d’environnement sont décrites dans [`.env.example`](.env.example). Ne copiez jamais de clé Stripe, Brevo, Odoo, CJ, TiDB ou mot de passe dans un fichier suivi par Git.

## Scripts utiles

| Commande | Usage |
| --- | --- |
| `npm run dev` | Lance le serveur de développement. |
| `npm run check` | Vérifie TypeScript sans produire de fichiers. |
| `npm test` | Exécute la suite Vitest. |
| `npm run security:secrets` | Refuse les motifs de clés sensibles dans les fichiers suivis par Git, sans afficher leur valeur. |
| `npm run build` | Produit le build client et le bundle serveur. |
| `npm run db:push` | Génère puis applique les migrations Drizzle. À exécuter avec une cible de base contrôlée. |
| `npm run format` | Applique Prettier sur les fichiers du projet. |

## Qualité et publication

La CI GitHub exécute `npm ci`, `npm run check`, `npm test` et `npm run build` à chaque push sur `main` et à chaque pull request vers `main`. Un changement doit rester limité à un sujet, passer les validations localement et rester lisible dans son diff avant publication.

Le déploiement de production est relié à la branche `main`. Les paramètres Vercel, les domaines et les variables sensibles doivent être gérés hors du dépôt. Une mise à jour qui touche des cookies, un paiement, une migration, le checkout, l’authentification ou la résolution de boutique exige une revue plus prudente qu’un changement visuel.

## Sécurité et limites connues

La limitation de tentatives d’authentification est une première barrière locale au processus serveur. Pour une protection strictement partagée entre plusieurs instances Vercel, une solution de stockage centralisée devra être ajoutée ultérieurement. La CSP reste en mode observation tant que les origines réellement chargées par les vitrines clientes ne sont pas relevées et validées.

Les paiements multi-boutique, les reversions, les remboursements, les e-mails transactionnels de production, le fulfillment fournisseur, les intégrations AliExpress/CJ actives et les abonnements ne doivent pas être activés pour un nouveau client sans décision explicite, tests isolés et responsabilités définies.

Avant toute publication commerciale, il faut aussi organiser une revue des secrets présents dans l’historique Git, une stratégie de sauvegarde/restauration, une observabilité des erreurs et une décision documentée sur l’encaissement par boutique.

## Documents complémentaires

Le dépôt contient des documents de travail plus détaillés. Les principaux sont [l’état des lieux SaaS](ETAT_DES_LIEUX_MAZIGHO_SAAS_2026-09-13.md), le [modèle de référence multi-boutique](docs/MAZIGHO_REFERENCE_TEMPLATE.md), la [configuration Brevo](brevo_email_setup.md) et les [notes de déploiement](memory/DEPLOYMENT.md). Certains documents historiques décrivent des décisions temporaires : ils doivent être relus avant de devenir une procédure de production.

## Licence

Le paquet déclare une licence MIT. Un fichier `LICENSE` canonique doit être ajouté et revu avant toute distribution publique du code.

## Références

[1]: https://docs.github.com/actions/writing-workflows "GitHub Actions workflow syntax"
[2]: https://docs.npmjs.com/cli/v10/commands/npm-ci "npm ci command documentation"
