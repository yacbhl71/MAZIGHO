# Connexion CJdropshipping — procédure sécurisée MAZIGHO

Ce document décrit la préparation de la connexion officielle entre MAZIGHO et CJdropshipping. Il ne contient **aucune clé** et aucune clé ne doit être ajoutée à Git, dans la base de données ou dans une conversation.

## État préparé côté MAZIGHO

Le panel **Hub fournisseurs** contient une carte « Connexion CJdropshipping ». Elle indique si la variable serveur `CJ_API_KEY` est absente, prête à être vérifiée ou validée. Le contrôle serveur appelle uniquement l’endpoint d’authentification officiel de CJ et ne renvoie jamais de token ou de clé au navigateur.

La première étape d’intégration est volontairement limitée à l’authentification et à l’import contrôlé de catalogue. Les produits doivent toujours être vérifiés et publiés manuellement. La création de commandes fournisseurs n’est pas activée.

## Étapes à effectuer lorsque MAZIGHO est prêt

1. Dans CJdropshipping, ouvrir **Apps > API**. L’application interne « API » doit être installée.
2. Dans l’onglet où s’affiche **« Ajouter une API »**, créer une entrée nommée par exemple `MAZIGHO Production` et sélectionner le type **API Key**.
3. Copier la clé uniquement pour l’ajouter aussitôt dans le tableau de bord Vercel, projet MAZIGHO, section **Settings > Environment Variables**.
4. Créer la variable `CJ_API_KEY` avec cette valeur, pour les environnements Production, Preview et Development si nécessaire. Ne jamais la coller dans le chat, dans le code ou dans un fichier Git.
5. Redéployer Vercel, puis ouvrir **MAZIGHO Admin > Hub fournisseurs** et utiliser **« Vérifier la connexion »**.
6. Si l’état est « Vérifiée », continuer avec l’import de produits en brouillon, puis valider chaque produit avant publication.

## Sécurité et exploitation

La clé CJ est un secret de serveur. Elle doit être remplacée immédiatement depuis CJ et Vercel en cas de copie accidentelle ou de doute. Les jetons d’accès éventuels restent côté serveur et ne doivent jamais être affichés dans le panel.

Avant toute commande réelle, vérifier le produit, la conformité, les variantes, le prix fournisseur, les frais et délais de livraison vers le pays ciblé, l’emballage, le suivi et les retours. Tester au moins une commande échantillon pour les produits retenus.

## Référence officielle

- [Authentification CJ API](https://developers.cjdropshipping.cn/en/api/api2/api/auth.html)
- [Vue d’ensemble CJ Developer Platform](https://developers.cjdropshipping.cn/en/summary/)
