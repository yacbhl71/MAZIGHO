# Feuille de route future — fulfillment AliExpress assisté

**Statut :** document de cadrage uniquement. **Aucun code, aucune extension, aucune automatisation AliExpress et aucune commande fournisseur ne sont lancés par ce document.**

## Objet

MAZIGHO souhaite pouvoir préparer une commande fournisseur AliExpress depuis son administration, tout en conservant MAZIGHO comme source de vérité pour les commandes et en exigeant une validation humaine avant tout paiement.

Le projet doit fonctionner pour les pays actuels de vente et rester extensible à de nouvelles destinations, avec une représentation d’adresse internationale normalisée et des règles fiscales/logistiques séparées du mécanisme de commande fournisseur.

## Architecture cible, à réaliser ultérieurement

| Brique | Rôle futur | Garde-fou obligatoire |
|---|---|---|
| Données fournisseur | Conserver l’URL AliExpress source, l’identifiant produit et le mapping MAZIGHO-variant → SKU/variant fournisseur. | Aucun identifiant de session, mot de passe ou cookie AliExpress ne doit être enregistré dans MAZIGHO. |
| API d’administration | Exposer à un administrateur autorisé le manifeste de préparation : lignes, quantités, choix de variantes et adresse normalisée. | L’API ne doit être disponible qu’après paiement MAZIGHO confirmé et contrôle d’autorisation serveur. |
| Extension Chrome | Sur ordinateur, lire un manifeste approuvé et préparer le panier dans la session AliExpress déjà ouverte par l’opérateur. | L’extension doit s’arrêter avant le paiement final : le paiement reste un clic humain explicite. |
| Pont tablette | Donner une visibilité et un contrôle de statut depuis l’administration, sans déporter ni stocker la session privée AliExpress de l’opérateur sur Vercel. | Toute déconnexion, défi de sécurité ou CAPTCHA doit suspendre le flux et demander une reprise humaine dans le navigateur concerné ; aucun contournement automatique. |
| Sélecteurs fournisseur | Centraliser les sélecteurs et variantes dans un module versionné et testable. | Une modification de sélecteur ne doit jamais déclencher une commande ni un paiement. |
| Journalisation | Conserver l’état, le manifeste, l’opérateur, les erreurs et l’horodatage. | Ne jamais journaliser les coordonnées client au-delà de la finalité d’exécution ni les secrets de connexion. |

## Parcours utilisateur futur envisagé

1. Une commande MAZIGHO devient éligible seulement après paiement client confirmé et vérification des données fournisseur.
2. L’administrateur choisit **« Préparer via l’extension »** depuis un ordinateur connecté à son propre compte AliExpress.
3. L’extension récupère le manifeste de préparation à usage unique, ouvre/actualise AliExpress, sélectionne les variantes et renseigne l’adresse.
4. À la moindre page de sécurité, CAPTCHA, perte de session, variante indisponible, prix/fret inattendu ou divergence de pays, le traitement s’arrête et exige une décision humaine.
5. Le flux s’arrête obligatoirement avant le paiement. L’administrateur vérifie le panier, le vendeur, l’adresse, le transport et le montant, puis décide lui-même de payer ou non.
6. MAZIGHO enregistre uniquement le résultat déclaré par l’opérateur et les références nécessaires au suivi, sans automatiser de paiement fournisseur.

## Découpage recommandé lorsque le projet sera demandé

| Étape | Livrable | Décision humaine requise |
|---|---|---|
| 1 | Audit du modèle de données existant, import AliExpress et mappings variantes. | Validation du schéma et de la politique de conservation. |
| 2 | Tables/migrations et API `ready-to-fulfill` protégée, en lecture seulement. | Validation sur données de test. |
| 3 | Extension Chrome MV3 minimale : authentification MAZIGHO, lecture du manifeste et affichage de prévisualisation. | Aucun clic AliExpress automatisé à ce stade. |
| 4 | Ajout progressif de la préparation du panier et de l’adresse sur commandes tests. | Test visuel sur ordinateur, arrêt avant paiement. |
| 5 | Interface de suivi tablette et mécanisme de reprise manuelle en cas de blocage. | Aucun traitement de CAPTCHA ni de paiement automatisé. |
| 6 | Tests de sécurité, variations de pays/adresses et journalisation, puis pilote limité. | Accord explicite avant extension à de vraies commandes. |

## Principes non négociables

> Le paiement fournisseur AliExpress ne doit jamais être automatisé. Une commande ne doit jamais être passée à la suite d’un CAPTCHA, d’une déconnexion ou d’un changement de prix non validé. MAZIGHO reste le système maître ; les données fournisseur sont des données d’exécution limitées à l’administration.

## Décision actuelle

Le projet est **faisable par étapes**, principalement via une extension Chrome assistée pour ordinateur. Le « serveur déporté » doit être conçu comme une aide de suivi et de reprise humaine, non comme un moyen de contourner les contrôles de connexion ou de sécurité d’AliExpress. Aucun développement ne doit commencer sans une demande explicite ultérieure du propriétaire.
