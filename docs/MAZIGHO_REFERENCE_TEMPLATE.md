# Modèle de référence MAZIGHO

Ce document décrit les principes réutilisables de MAZIGHO pour les futurs projets e-commerce. Il sert de **modèle d’inspiration**, pas de copie complète : chaque nouvelle boutique doit recevoir son propre nom, sa propre identité, ses contenus, ses informations légales, ses fournisseurs et ses règles commerciales.

## Expérience publique à préserver

La boutique privilégie une présentation aérée, éditoriale et chaleureuse. Les pages publiques utilisent une palette orange/ambre cohérente dans l’en-tête et le pied de page, une hiérarchie typographique nette, des bannières visuelles, des catégories illustrées et des blocs de réassurance. Les grands visuels occupent la largeur disponible ; les contenus de lecture restent contenus et confortables.

| Élément | Principe de référence |
|---|---|
| Navigation | Menu clair, espacé, avec recherche, pays de livraison et langue séparés. |
| Accueil | Bannières, univers de catégories, histoire éditoriale, témoignages réels lorsqu’ils existent et sélection de produits. |
| Responsive | Le document racine, l’application et les grands visuels utilisent toute la largeur disponible ; les grilles se replient sur mobile. |
| Identité | Conserver une identité propre à chaque marque ; ne pas réintroduire le monogramme « M » de MAZIGHO dans un autre projet. |
| Contenu | Préférer des textes courts, vérifiables et des images cohérentes avec les catégories. |

## Internationalisation professionnelle

La destination de livraison et la langue d’affichage sont deux paramètres indépendants. La source produit reste en français ; les contenus clients peuvent être traduits en allemand, italien, anglais, espagnol, néerlandais et arabe, avec une prise en charge RTL pour l’arabe.

> La devise affichée doit rester distincte de la devise de paiement. Dans le modèle MAZIGHO, les prix officiels restent en CHF tant qu’un paiement multi-devise fiable n’est pas activé.

Chaque traduction est liée à la date de mise à jour française. Une modification de la source rend les traductions précédentes obsolètes jusqu’à leur régénération ou correction.

## Administration simple et protégée

Le panneau administrateur sépare les actions commerciales et techniques des changements éditoriaux sans risque.

| Espace | Usage de référence |
|---|---|
| **Langues & traductions** | Voir les fiches prêtes, absentes ou à régénérer, puis corriger une version produit si nécessaire. |
| **Éditeur simple** | Modifier des libellés français du menu et accéder aux textes d’accueil, bannières et catégories sans toucher au code. |
| **Studio de contenu** | Gérer les bannières, leurs titres, accroches, images, liens et visibilité. |
| **Personnalisation** | Ajuster les textes éditoriaux, les images et les sections visibles avec des champs guidés. |
| **Produits** | Gérer les fiches françaises, prix, stock, photos, catégories et états de publication. |

Les prix, profils de livraison, commandes, comptes, pages légales, secrets et intégrations doivent rester exclus de l’éditeur simple.

## Règles commerce et fournisseurs

Toute disponibilité commerciale dépend d’un devis de livraison vérifié pour le produit, la variante et le pays ciblé. Aucun pays ne doit être annoncé comme livrable sans profil validé. Les actions fournisseurs, paiements, commandes, remboursements et synchronisations restent contrôlés manuellement tant qu’un flux testé et explicitement approuvé n’est pas en place.

## Démarrer un futur projet à partir de ce modèle

1. Créer un dépôt distinct et reprendre seulement les composants et principes utiles.
2. Remplacer avant publication l’identité, les textes, les visuels, les mentions légales et les coordonnées.
3. Définir les pays, langues, devises et règles de livraison adaptés au nouveau commerce.
4. Configurer séparément les secrets, services d’e-mail, stockage, fournisseurs et domaine du nouveau projet.
5. Exécuter les contrôles TypeScript, tests, build et validation responsive avant la première mise en ligne.

## Point de restauration

Le tag Git `restore/mazigho-validated-2026-08-24` désigne l’état validé associé à ce modèle. Il constitue un repère de code ; il ne remplace pas une sauvegarde complète de la base, des médias hébergés et de la configuration de production.
