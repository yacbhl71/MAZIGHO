# État des lieux MAZIGHO — plateforme e-commerce et SaaS multi-boutique

**Date : 13 septembre 2026**  
**Périmètre : MAZIGHO principal, MAZIGHO Studio et les boutiques clientes offertes ou vendues**

> **Lecture importante.** Ce document distingue trois niveaux : **implémenté et publié**, **ossature prête mais non configurée**, et **à construire**. Une ossature visible dans un panneau n’implique pas l’activation d’un paiement, d’un fournisseur, d’un e-mail ou d’une opération commerciale.

## 1. Position actuelle de MAZIGHO

MAZIGHO a déjà franchi le stade d’une seule boutique. La base est désormais celle d’une **plateforme multi-boutique** : MAZIGHO principal reste la boutique plateforme, tandis que chaque boutique cliente possède un identifiant, un domaine, un catalogue, une identité et des droits séparés.

| Axe | Situation actuelle |
|---|---|
| Architecture multi-boutique | **Implémentée** avec isolation par `storeId` et résolution par domaine |
| MAZIGHO Studio | **Implémenté** comme espace opérateur plateforme, distinct des boutiques clientes |
| Boutiques offertes / vendues | **Préparées** par un parcours contrôlé, avec états `setup`, `active`, `limited`, `suspended` et `closed` |
| Pattes & Compagnie | **Boutique réelle active**, avec son domaine animalier et un premier catalogue pilote |
| Panneau propriétaire par boutique | **Implémenté comme socle**, isolé de Studio et réutilisable pour chaque nouvelle boutique |
| Commerce réel multi-boutique | **Non finalisé** : aucune activation générale de paiement, de fournisseur ou de fulfillment dans les nouveaux panneaux |

## 2. Ce que MAZIGHO sait déjà faire

### 2.1 Fondations SaaS et sécurité multi-boutique

La plateforme sépare les données et les droits de chaque boutique. Un propriétaire de boutique ne peut pas atteindre MAZIGHO Studio, les données d’une autre boutique, les réglages globaux de plateforme ou les données sensibles d’un autre client. Les ateliers Studio restent protégés par une autorité plateforme côté serveur, et non uniquement par les routes de l’interface.

| Fonction | Niveau | Commentaire |
|---|---|---|
| Isolation par boutique (`storeId`) | Implémenté | Catalogue, contenu, réglages, relations et opérations sont structurés par boutique |
| Résolution par domaine | Implémenté | Le domaine sert la boutique associée sans faire retomber une boutique cliente sur MAZIGHO principal |
| États de boutique | Implémenté | `setup`, `active`, `limited`, `suspended`, `closed` |
| Fermeture des boutiques `setup` | Implémenté | Pas de storefront, panier public, checkout ou pixels tant que la boutique n’est pas ouverte |
| Rôles par boutique | Implémenté | Propriétaire, manager, éditeur catalogue, support, opérateur commande, comptable, lecteur |
| Journal d’audit | Implémenté en base | Les actions sensibles peuvent être rattachées à la bonne boutique |
| Secrets | Protégés | Les clés et mots de passe ne doivent pas apparaître dans les écrans ou les réglages de boutique |

### 2.2 MAZIGHO Studio — le cockpit opérateur

MAZIGHO Studio sert à créer, préparer, surveiller et remettre les boutiques. Il n’est pas destiné aux propriétaires clients.

| Fonction Studio | Situation |
|---|---|
| Registre central des boutiques | Implémenté |
| Actions adaptées à l’état réel de chaque boutique | Implémenté |
| Raccourcis sous « MAZIGHO Studio » | Implémenté : gestion des boutiques, priorités, santé |
| Synthèse des priorités opérateur | Implémentée, sans données clientes |
| Santé structurelle du parc | Implémentée : préparation, propriétaire, catalogue et accès à surveiller |
| Brouillons de futures boutiques | Implémentés, avec thème / niche / devise de départ |
| Créateur de marque et vitrine privée | Implémentés |
| Édition de pages, médias, navigation et modèles d’accueil | Implémentée dans le parcours Studio |
| Préparation de collections, produits, prix, variantes et visuels | Implémentée |
| Stock et fournisseur de préparation | Implémenté, sans intégration fournisseur automatique |
| Simulation privée de panier | Implémentée, sans créer de panier réel ou de checkout |
| Prévol commercial, revue d’étanchéité et revue manuelle | Implémentés |
| Publication contrôlée du catalogue | Implémentée, avec confirmations et refus d’écrasement |
| Activation publique séparée | Implémentée avec prévol renforcé et confirmations explicites |
| Gestion de contenu d’une boutique active | Implémentée : identité, bannières, textes, images, logo |
| Mot de passe temporaire opérateur | Implémenté pour les boutiques offertes, affiché une seule fois et stocké sous forme de hash |

### 2.3 Catalogue, vitrine et navigation

Chaque boutique possède ses propres données de vitrine et de catalogue. Les propriétaires ne reçoivent pas MAZIGHO Studio : ils utilisent un espace limité à leur boutique.

| Fonction propriétaire | Situation actuelle |
|---|---|
| Vue d’ensemble de la boutique | Implémentée |
| Produits, catégories, prix et stock | Implémentés |
| Images et variantes produit | Implémentées |
| Vitrine : nom, logo, textes, images et contenus | Implémentée |
| Téléversement d’images propres à la boutique | Implémenté |
| Menu et onglets | Implémenté : renommage, visibilité, ordre, ajout et suppression d’onglets personnalisés |
| Responsive ordinateur / tablette / mobile | Pris en compte pour le menu et les écrans de gestion |
| Domaine, statut et devise | Visibles dans les réglages du propriétaire |

### 2.4 Panneau propriétaire de chaque boutique

Le panneau propriétaire est accessible sur le domaine de la boutique via le chemin `/gestion-boutique`, après connexion du propriétaire. Il constitue le socle commun qui sera réutilisé pour les boutiques futures.

| Groupe | Fonction disponible | Limite actuelle |
|---|---|---|
| Pilotage | Vue d’ensemble | Indicateurs de catalogue et vitrine uniquement |
| Catalogue | Produits, catégories, prix, stock, images, variantes | Aucun sourcing ou fournisseur automatique |
| Vitrine | Marque, textes, visuels | Pas de générateur automatique de campagnes |
| Menu | Onglets système masquables et onglets personnalisés | Les destinations système restent verrouillées pour la sécurité |
| Commandes | Lecture synthétique par boutique | Pas d’acceptation, remboursement, expédition ou fournisseur |
| Clients | Vue anonymisée | Aucun nom, e-mail, adresse, export ou campagne |
| Livraison & retours | État de préparation | Pas de règles actives, transporteur ou retour automatique |
| Marketing | État des contenus visibles | Pas de pixel, e-mail, promotion ou campagne active |
| Réglages | Domaine, statut, devise et présence de structures | Pas de modification de domaine, paiement ou fournisseur |

## 3. Ce qui est volontairement non activé

MAZIGHO contient des briques historiques et de test, mais le nouveau modèle multi-boutique ne doit pas être présenté comme un commerce automatique déjà actif.

| Élément | État à conserver actuellement |
|---|---|
| Stripe Live | Non activé pour la nouvelle architecture multi-boutique |
| Paiement réel par boutique | À concevoir et valider séparément |
| Fournisseurs CJ, AliExpress ou autres | Aucun déclenchement automatique depuis les nouveaux panneaux |
| Commande fournisseur / fulfillment | Non activé dans le panneau propriétaire |
| Odoo pour chaque boutique cliente | À définir par un modèle explicite et isolé |
| E-mails d’invitation / réinitialisation transactionnels | Parcours à finaliser avant remise autonome à grande échelle |
| Campagnes marketing, pixels et newsletters | Non configurés |
| Abonnements, licences et blocage automatique par impayé | À construire pour le SaaS commercial |

## 4. Ce qu’il reste à construire pour finaliser MAZIGHO SaaS

### Priorité 1 — Stabilisation et expérience de gestion

Avant d’élargir le commerce, il faut terminer la fiabilité de l’expérience opérateur et propriétaire : toutes les routes doivent ouvrir les bons écrans, les anciens ateliers `setup` ne doivent plus apparaître pour une boutique active, et les parcours de connexion doivent être simples.

| Chantier | Objectif | Risque à maîtriser |
|---|---|---|
| Stabiliser routes et déploiements | Aucun lien Studio ou propriétaire ne doit afficher 404 ou un atelier obsolète | Confusion entre `setup`, actif et ancienne navigation |
| Finaliser l’accès propriétaire | Invitation, création de mot de passe et réinitialisation réellement autonomes | Ne jamais exposer de mot de passe ou token |
| Rôles délégués | Manager, catalogue, support et comptabilité par boutique | Réduction stricte des droits par rôle |
| Tableau de bord opérationnel | Mesures utiles sans données personnelles inutiles | Éviter les tableaux artificiels ou non vérifiables |

### Priorité 2 — Configuration commerciale par boutique

Les écrans de pilotage existent maintenant ; la prochaine étape fonctionnelle consiste à permettre une configuration par boutique, avec validation explicite et aperçu avant publication.

| Chantier | Ce qu’il doit permettre |
|---|---|
| Livraison & retours | Livraison offerte / payante, seuils, pays, délais, politique de retour et aperçu public |
| Informations légales | Opérateur, contact, conditions, confidentialité, TVA et conformité locale |
| Devise et prix | Devise de vente, taux, arrondis et affichage clair sans modifier le prix fournisseur de référence |
| Réglages de vitrine | Pages, SEO, favicon, langues, menus et contenu avec aperçu |
| Marketing conforme | Pixels avec consentement, coupons, bannières et campagnes opt-in |

### Priorité 3 — Commerce réel et cycle de commande

Cette étape ne doit démarrer qu’après la configuration commerciale, les mentions légales et l’acceptation explicite du modèle de paiement.

| Chantier | Décision à prendre avant développement |
|---|---|
| Paiements par boutique | Compte Stripe / connectivité, mode test d’abord, propriété des fonds et responsabilités |
| Checkout | Taxes, livraison, consentement, documents légaux et tests de bout en bout |
| Commandes | Acceptation, annulation, remboursement, preuves et notifications |
| Fulfillment | Validation humaine, fournisseurs autorisés, suivi et gestion d’exception |
| Odoo | Déterminer si chaque client apporte son Odoo ou utilise une intégration gérée par la plateforme |

### Priorité 4 — Produit SaaS vendable

Pour vendre MAZIGHO comme solution, les éléments ci-dessous doivent être traités comme un produit séparé du storefront.

| Chantier SaaS | Résultat attendu |
|---|---|
| Plans et abonnements | Offre d’essai, abonnement, échéance, suspension et réactivation contrôlées |
| Provisionnement | Création guidée d’une boutique, d’un domaine et d’un propriétaire sans intervention technique répétitive |
| Facturation de la plateforme | Choix du prestataire, licences, reçus et gestion des impayés |
| Support et assistance | Journal lisible, demandes, transfert de propriété et récupération d’accès |
| Sauvegardes et restauration | Export des contenus de boutique, règles de rétention et procédure de reprise |
| Observabilité | Alertes techniques, erreurs de paiement, erreurs de domaine et suivi de déploiement |

## 5. Ordre recommandé pour la suite

> L’objectif est de transformer une bonne ossature en produit fiable, sans brûler les étapes vers le paiement ou les fournisseurs.

1. **Stabiliser définitivement les parcours Studio et propriétaire**, notamment les routes déjà signalées comme confuses ou inaccessibles.
2. **Finaliser l’accès propriétaire autonome** : invitation, mot de passe, réinitialisation et changement de mot de passe réel.
3. **Construire la configuration Livraison & retours**, avec aperçu public mais sans fournisseur automatique.
4. **Construire les réglages légaux, devise et SEO**, séparés par boutique.
5. **Définir le modèle de paiement multi-boutique** avant toute activation réelle de checkout par client.
6. **Ajouter le cycle de commande contrôlé** : acceptation, notifications, remboursement et suivi.
7. **Choisir le modèle SaaS commercial** : plans, abonnements, provisioning et suspension.
8. **Connecter les fournisseurs et ERP uniquement après validation humaine**, avec journal et limites précises.

## 6. Repères de version récents

| Livraison | Commit |
|---|---|
| Prévol commercial privé | [`99a3795`](https://github.com/yacbhl71/MAZIGHO/commit/99a3795) |
| Publication catalogue contrôlée | [`1a6d697`](https://github.com/yacbhl71/MAZIGHO/commit/1a6d697) |
| Prévol final d’activation | [`51bd038`](https://github.com/yacbhl71/MAZIGHO/commit/51bd038) |
| Contenu propre par boutique | [`a851760`](https://github.com/yacbhl71/MAZIGHO/commit/a851760) |
| Cockpit Studio : navigation, priorités et santé | [`47f457e`](https://github.com/yacbhl71/MAZIGHO/commit/47f457e), [`7ccf36d`](https://github.com/yacbhl71/MAZIGHO/commit/7ccf36d), [`fc68664`](https://github.com/yacbhl71/MAZIGHO/commit/fc68664) |
| Panneau propriétaire générique | [`cb8ac9f`](https://github.com/yacbhl71/MAZIGHO/commit/cb8ac9f) |
| Commandes et clients anonymisés | [`11102e8`](https://github.com/yacbhl71/MAZIGHO/commit/11102e8), [`5b106a4`](https://github.com/yacbhl71/MAZIGHO/commit/5b106a4) |
| Menu par boutique | [`46e473d`](https://github.com/yacbhl71/MAZIGHO/commit/46e473d) |
| Réglages, opérations et marketing propriétaire | [`8376d7c`](https://github.com/yacbhl71/MAZIGHO/commit/8376d7c), [`2a1707f`](https://github.com/yacbhl71/MAZIGHO/commit/2a1707f) |

## Conclusion

MAZIGHO possède aujourd’hui une **fondation SaaS multi-boutique sérieuse** : séparation des boutiques, Studio opérateur, vitrine et catalogue isolés, préparation contrôlée, activation distincte, panneau propriétaire réutilisable et premiers modules de pilotage. Le travail restant est moins celui d’une maquette que celui d’une mise en production commerciale : configuration par boutique, accès autonome, paiement, commandes, conformité, support et abonnement SaaS.

La priorité n’est donc pas d’ajouter de nouveaux écrans au hasard. Elle est de compléter, dans l’ordre, les modules déjà posés afin qu’une boutique puisse être créée, remise à son propriétaire, configurée, ouverte, exploitée et — plus tard — facturée comme un service SaaS fiable.
