# Guide de Déploiement Final sur Vercel - MAZIGHO

Ce guide vous accompagne pas à étape pour mettre en ligne votre boutique **MAZIGHO** sur Vercel de manière professionnelle et sécurisée.

---

## 1. Préparation du Code
L'archive **MAZIGHO_V2_PRODUCTION.zip** jointe contient déjà le fichier `vercel.json` configuré pour votre architecture Fullstack (React + Express).

1.  Décompressez l'archive sur votre ordinateur.
2.  Mettez à jour votre dépôt GitHub avec ces fichiers :
    ```bash
    git add .
    git commit -m "chore: ready for Vercel deployment"
    git push origin main
    ```

---

## 2. Configuration de la Base de Données (Production)
Votre projet nécessite une base de données MySQL ou TiDB accessible en ligne.

1.  **Option recommandée** : Utilisez [TiDB Cloud](https://pingcap.com/tidb-cloud/) (gratuit) ou [Aiven](https://aiven.io/).
2.  Une fois votre base créée, récupérez l'**URL de connexion** (elle ressemble à `mysql://user:password@host:port/dbname`).

---

## 3. Déploiement sur Vercel

1.  Connectez-vous à [Vercel](https://vercel.com).
2.  Cliquez sur **"Add New"** > **"Project"**.
3.  Importez votre dépôt GitHub **MAZIGHO**.
4.  Dans l'onglet **"Environment Variables"**, ajoutez les variables suivantes :

| Clé | Valeur |
| :--- | :--- |
| `DATABASE_URL` | Votre URL de base de données récupérée à l'étape 2 |
| `NODE_ENV` | `production` |
| `VITE_APP_TITLE` | `MAZIGHO` |
| `VITE_APP_LOGO` | `https://votre-logo-url.com` |
| `VITE_OAUTH_PORTAL_URL` | `https://oauth.manus.im` |
| `VITE_APP_ID` | `mazigho-app` |

5.  Cliquez sur **"Deploy"**.

---

## 4. Initialisation des Tables
Une fois le déploiement terminé, vous devez créer les tables sur votre nouvelle base de données de production.

Depuis votre ordinateur, dans le dossier du projet, lancez :
```bash
DATABASE_URL="votre_url_de_production" pnpm db:push
```

---

## 5. Accès Final
Votre site est maintenant en ligne ! 
- **Client** : `https://mazigho.vercel.app`
- **Admin** : `https://mazigho.vercel.app/admin` (connectez-vous avec `[ancienne-adresse-supprimee]`)

*Félicitations pour le lancement de votre plateforme !*
