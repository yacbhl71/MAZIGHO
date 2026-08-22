# Guide d'Utilisation : Contournement des Captchas AliExpress sur MAZIGHO

**Auteur** : Manus AI  
**Projet** : MAZIGHO (E-commerce & Dropshipping)  
---

## 1. Pourquoi ce contournement ?
Les plateformes comme **AliExpress** déploient des systèmes de protection stricts (anti-bot et Captchas) qui bloquent les requêtes automatiques provenant des serveurs cloud (comme Vercel). 

Pour vous permettre d'importer n'importe quel produit AliExpress sans être bloqué par ces sécurités, nous avons mis en place une méthode intelligente d'**importation par code source HTML**.

---

## 2. Étapes pour importer un produit AliExpress en 30 secondes

1. **Ouvrir la fiche produit sur AliExpress** :  
   Rendez-vous normalement sur le site d'AliExpress depuis votre navigateur (sur votre ordinateur ou tablette) et ouvrez la page du produit que vous souhaitez vendre.

2. **Afficher le code source de la page** :  
   - Faites un **clic droit** n'importe où sur la page du produit.
   - Sélectionnez **"Afficher le code source de la page"** (ou utilisez le raccourci clavier `Ctrl + U` sur Windows / `Cmd + Option + U` sur Mac).
   - Une page remplie de code va s'ouvrir.

3. **Copier le code source** :  
   - Sélectionnez tout le texte (`Ctrl + A` puis `Ctrl + C`).

4. **Coller dans MAZIGHO Admin** :  
   - Rendez-vous dans votre panel d'administration MAZIGHO : **[https://mazigho-shop.vercel.app/admin/importation](https://mazigho-shop.vercel.app/admin/importation)**.
   - Sélectionnez votre catégorie et indiquez votre marge.
   - Cliquez sur l'option **"▶ Contourner le Captcha AliExpress (Coller le Code Source HTML)"**.
   - Collez le code source dans la grande zone de texte qui apparaît.
   - Cliquez sur **"Analyser"**.

5. **Vérification et Validation** :  
   - Le système va instantanément extraire le titre, les images, le prix fournisseur et calculer votre prix de vente.
   - Vérifiez les informations dans le formulaire de prévisualisation.
   - Cliquez sur **"Enregistrer en brouillon"**.

---

## 3. Avantages de cette méthode
- **100% Fiable** : Puisque c'est votre navigateur personnel qui charge la page (et résout le Captcha si besoin), le serveur ne subit aucun blocage d'AliExpress.
- **Extraction complète** : Récupération automatique des images haute résolution, du titre et du prix de départ.
- **Sécurité** : Intégration transparente avec la base de données TiDB Cloud et le déploiement Vercel.
