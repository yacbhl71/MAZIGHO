# MAZIGHO — feuille de route « solution clé en main »

**Date :** 7 septembre 2026  
**Objectif :** faire évoluer MAZIGHO d’une boutique individuelle vers une solution e-commerce et dropshipping vendable à des e-commerçants, sans transférer de secrets, de données clients ou de responsabilité fournisseur de manière non maîtrisée.

## 1. Réponse sur le test du Setup Wizard

Le Setup Wizard est accessible dans **Administration → Configuration → Démarrage sécurisé**. Il est possible de l’ouvrir, de parcourir les étapes et de vérifier les messages **sans rien enregistrer**.

> Ne pas enregistrer une adresse e-mail fictive dans la production actuelle : le champ remplace réellement l’e-mail de support global de la boutique. Aucun e-mail n’est envoyé par l’assistant, mais la nouvelle valeur peut apparaître dans les informations de contact publiques.

Pour tester le bouton de sauvegarde sans effet sur MAZIGHO, il faut prévoir une **instance Preview** isolée, avec une base de données de test et des variables d’environnement de test. Ce test ne doit jamais être réalisé en modifiant les coordonnées de la boutique actuellement en ligne.

| Élément du Wizard publié | État | Limite volontaire |
|---|---|---|
| Accès administrateur | Disponible | Aucun accès public d’initialisation n’est autorisé. |
| Nom de boutique et e-mail de support | Configurables | Ces valeurs sont réelles lorsqu’elles sont enregistrées. |
| Checklist d’ouverture | Disponible | Elle ne remplace pas les validations techniques ou légales. |
| Secrets Stripe, Odoo et TiDB | Exclus | Ils ne sont ni affichés, ni collectés, ni stockés dans la base. |

## 2. Socle déjà construit

MAZIGHO possède déjà de nombreuses briques réutilisables. Les fonctionnalités ci-dessous sont disponibles, mais certaines doivent encore faire l’objet d’un test d’intégration dans une instance Preview avant d’être considérées comme prêtes à être vendues à un tiers.

| Domaine | Fonctions disponibles | Référence technique |
|---|---|---|
| Identité visuelle | Logo, nom de marque et message administrables ; en-tête public responsive. | [1] |
| Livraison | Livraison offerte par défaut, ou frais fixes uniques avec seuil de gratuité, persistés dans chaque commande. | [2] |
| Devise | CHF par défaut, EUR et USD configurables avec taux manuel ; devise et montant de référence figés à la vente. | [3] |
| Marketing | Identifiants Meta et TikTok configurables ; aucun chargement avant consentement marketing explicite. | [4] |
| Parcours d’erreur | Page 404 multilingue, identitaire et responsive, avec liens sûrs de récupération. | [5] |
| Administration | Rôles, changement de mot de passe local, journalisation et panneau de personnalisation. | [6] |
| Catalogue | Brouillons, catégories, variantes, profils de livraison, import/export CSV, sourcing CJ et contrôles groupés. | [7] |
| Paiement et back office | Stripe **Test**, persistance locale, miroir Odoo idempotent et TVA Odoo neutralisée selon la règle actuelle. | [8] |
| Fulfillment CJ | Prévalidation et sandbox strictement humaine ; aucun débit ou paiement CJ réel. | [9] |
| Préparation AliExpress | Manifeste local, export JSON et gardes-fous avant paiement ; pas de commande ou paiement fournisseur. | [10] |

## 3. Chantiers obligatoires avant une première vente de boutique clé en main

### 3.1 Stabiliser les fonctions récemment ajoutées

Les cinq évolutions récentes — identité de marque, livraison globale, pixels, page 404, devises et Setup Wizard — doivent être testées ensemble dans une **instance Preview isolée**. Il faut vérifier que les migrations de données sont appliquées, que les valeurs par défaut conservent le comportement MAZIGHO, et que les options ne modifient pas l’historique d’anciennes commandes.

| Vérification | Attendu | Risque évité |
|---|---|---|
| Livraison offerte par défaut | Aucun frais nouveau sur MAZIGHO. | Facturer accidentellement un client. |
| Frais fixes et seuil | Même montant dans panier, checkout, Stripe Test, commande et Odoo. | Écart comptable ou litige client. |
| Devise EUR / USD en Stripe Test | Prix affiché, montant Stripe et e-mail identiques. | Double conversion ou mauvais symbole monétaire. |
| Pixel sans consentement | Aucun appel Meta ou TikTok avant acceptation. | Suivi non consenti. |
| Pixel avec consentement | Seul l’identifiant validé est chargé, jamais dans l’administration. | Exposition inutile du panneau ou d’un réglage invalide. |
| Wizard | Aucun secret ne transite par le navigateur, aucune valeur réelle n’est écrasée. | Fuite de clé ou modification du site en ligne. |

### 3.2 Rendre l’instance réellement installable par un acheteur

Une boutique vendue ne doit pas être un dépôt GitHub que l’acheteur configure à la main. Il faut un processus de **provisionnement d’instance** : une nouvelle boutique, un domaine, une base dédiée ou un locataire isolé, un premier administrateur et un coffre de secrets configuré au déploiement.

| Fonction à construire | Règle de conception |
|---|---|
| Création d’instance | Une instance par acheteur, avec identifiant propriétaire et environnement isolé. |
| Attribution du premier propriétaire | Effectuée lors de la livraison ou par invitation signée ; jamais par une page ouverte à tous. |
| Base de données et migrations | Créées et migrées au déploiement avec un procédé contrôlé, jamais depuis des identifiants saisis dans un navigateur. |
| Coffre de secrets | Clés Stripe, Odoo, TiDB, CJ et webhooks conservées par l’hébergeur, chiffrées et jamais renvoyées par une API. |
| Réauthentification sensible | Mot de passe ou facteur additionnel avant modification d’un secret, d’un compte bancaire, d’un domaine ou d’une licence. |
| Prévisualisation | Une instance Preview distincte par acheteur, sans données clients de production. |

### 3.3 Préparer l’offre commerciale et les licences

La licence doit être une couche serveur distincte de la boutique. Un code livré en clair peut toujours être modifié ; l’obfuscation ne constitue pas une protection suffisante.

| Bloc | À prévoir |
|---|---|
| Vente et abonnement | Produit, checkout, facture et portail client chez le prestataire retenu, par exemple Lemon Squeezy. |
| Service de licences | États active, suspendue, expirée et révoquée ; association contrôlée à l’instance et au domaine. |
| Webhooks commerciaux | Vérification cryptographique, déduplication, journalisation et reprise en cas d’échec. |
| Droits applicatifs | Les fonctions premium sont contrôlées côté serveur, avec une tolérance courte en cas d’indisponibilité du service de licence. |
| Support | Écran propriétaire, procédure de transfert de domaine, réinitialisation d’accès et export de données. |

## 4. Chantiers dropshipping nécessaires

### 4.1 Opérations catalogue

Chaque vendeur doit pouvoir importer, vérifier et publier des produits sans créer de promesse de livraison ou de marge impossible à tenir.

| Priorité | Action restante | Décision humaine nécessaire |
|---|---|---|
| Élevée | Mettre en place une validation éditoriale avant publication : titre, images, variantes, prix, marge, pays et délais. | Oui, responsable catalogue. |
| Élevée | Conserver la révision régulière des variantes CJ et marquer les fiches devenues obsolètes. | Oui, sélection du catalogue à réviser. |
| Élevée | Corriger les importations AliExpress dont le lien source ou l’ID fournisseur est incomplet ; ne jamais publier une fiche qui ouvre une page 404. | Oui, vérification de la fiche source. |
| Moyenne | Créer des règles de prix globales par fournisseur, catégorie, devise et pays. | Oui, stratégie de marge du vendeur. |
| Moyenne | Mettre en place un archivage automatique **proposé**, jamais imposé, lors d’un changement de prix, de stock ou de variante fournisseur. | Oui, validation avant archivage. |

### 4.2 Fulfillment CJ et AliExpress

L’état actuel est volontairement prudent. Il doit le rester dans toute offre vendable.

| Chantier | État actuel | Suite sûre |
|---|---|---|
| CJ sandbox | Disponible, paiement réel absent. | Réussir un test sandbox sur une variante fraîchement révisée, sans débit. |
| Tracking CJ | Non implémenté. | Récepteur HTTPS signé, corps brut, déduplication et outbox ; aucun webhook non signé. |
| Paiement CJ réel | Non implémenté. | Option future, soumise à une approbation écrite par commande, montant maximal et journal d’audit. |
| Extension AliExpress | Socle de manifeste disponible. | Packager et auditer une extension locale qui charge un manifeste choisi par l’opérateur et s’arrête avant paiement. |
| Panier AliExpress | Ne doit jamais être créé à partir d’une page produit isolée. | Lancer uniquement depuis une commande MAZIGHO payée et manifestée ; contrôle humain des variantes, adresse et fret. |
| Paiement AliExpress | Interdit dans la version actuelle. | Toujours effectué manuellement par le propriétaire dans son propre compte, après vérification complète. |

## 5. Conformité, service client et lancement commercial

La technologie ne suffit pas pour vendre une boutique à des tiers. Chaque propriétaire reste responsable de son marché, de ses fournisseurs et de ses obligations. Les points suivants doivent être intégrés au parcours d’onboarding, puis validés avec ses propres conseils juridiques et comptables.

| Sujet | Fonction ou procédure nécessaire |
|---|---|
| Mentions légales | Fiche entreprise complète, contrôlée avant publication, par pays du vendeur. |
| TVA et factures | Paramétrage comptable Odoo, devises et taux à faire valider par le fiduciaire de chaque propriétaire. |
| Cookies et publicité | Politique de confidentialité et bannière de consentement cohérentes avec Meta/TikTok, par territoire. |
| Retours et remboursements | Politique publique, workflow administratif de retour, règles de remboursement Stripe et historique client. |
| Support client | E-mail expéditeur vérifié, modèles d’e-mail multilingues, réponses de suivi et gestion de réclamations. |
| Produits et conformité | Contrôle humain de sécurité produit, restrictions de vente, garanties, informations de livraison et responsabilités importateur. |
| Données personnelles | Export, suppression, rétention, accès opérateur limité et journalisé. |

## 6. Sécurité et exploitation

| Priorité | Action | Objectif |
|---|---|---|
| Critique | Rotation des secrets, restriction des accès et révocation de sessions administrateur. | Limiter l’impact d’un identifiant compromis. |
| Critique | Sauvegardes testées et plan de restauration base / fichiers. | Reprise après erreur de manipulation ou incident. |
| Critique | Environnement Preview isolé. | Tester sans toucher au site ou aux clients en production. |
| Haute | Double authentification ou passkeys pour les administrateurs propriétaires. | Protéger les réglages sensibles. |
| Haute | Alertes d’erreurs, disponibilité, échecs de webhooks et paiements. | Détecter les anomalies sans attendre un signal client. |
| Haute | Limitation de débit, protection CSRF et revue des droits par rôle. | Réduire les abus et les erreurs de configuration. |
| Moyenne | Journal d’audit exportable et conservation définie. | Prouver qui a modifié une configuration ou une commande. |
| Moyenne | Analyse antivirus et règles de taille/type sur les fichiers téléversés. | Sécuriser les logos, images et futurs documents. |

## 7. Priorités proposées par étapes

### Étape A — Rendre MAZIGHO stable comme modèle de référence

1. Exécuter un test Preview complet de livraison, devise, pixel, page 404 et Setup Wizard.
2. Finaliser la page 404 et vérifier la production correspondante.
3. Ajouter les tests de parcours de bout en bout pour checkout Stripe **Test** et migrations.
4. Corriger les références source AliExpress et maintenir le catalogue publié propre.

### Étape B — Rendre la boutique exploitable par un vendeur unique

1. Valider le choix commercial des frais de port, pays et devise.
2. Préparer les mentions, retours, e-mails et procédures de support.
3. Réussir une boucle CJ sandbox sur une référence à jour.
4. Mettre en place le tracking fournisseur signé, sans paiement automatique.

### Étape C — Transformer le produit en offre clé en main

1. Construire le provisionnement de nouvelles instances.
2. Créer le coffre de secrets et le parcours de propriétaire initial.
3. Ajouter une licence serveur et le raccordement au prestataire de vente choisi.
4. Mettre en place la gestion des abonnements, suspension, réactivation et support propriétaire.
5. Décider entre instances isolées par client et véritable architecture multi-tenant, après une étude de coûts, de sécurité et de support.

### Étape D — Industrialiser l’offre

1. Modèles visuels et préréglages de marque par secteur.
2. Onboarding guidé avec prévisualisation, checklist et aide contextualisée.
3. Documentation client, centre d’aide, démonstration et processus de transfert.
4. Observabilité, sauvegardes, procédure d’incident et politique de mise à jour.

## 8. Décisions à prendre avant le prochain développement

| Décision | Choix à confirmer |
|---|---|
| Mode de vente | Instance hébergée et gérée, ou code remis au client. La première option est nettement plus sécurisable. |
| Prestataire de licence | Lemon Squeezy ou autre, après vérification de son offre de licences, abonnements, webhooks et pays pris en charge. |
| Architecture client | Une base isolée par client, ou une base mutualisée avec isolation stricte. |
| Fournisseur principal | CJ, AliExpress assisté, ou combinaison avec règles distinctes. |
| Politique transport | Prix tout compris, frais fixes, ou frais par zone. |
| Marchés de départ | Suisse uniquement, ou Suisse + UE dès le lancement. Ce choix conditionne devise, taxes, langue, paiement et conformité. |

## 9. Conclusion

MAZIGHO dispose déjà d’une base e-commerce et dropshipping solide, avec une attention rare portée aux garde-fous de paiement et de fournisseur. La prochaine difficulté n’est pas une interface supplémentaire : c’est de transformer cette boutique unique en **instances isolées, provisionnées, licenciées et exploitables par des propriétaires différents**, tout en gardant les secrets hors du code et hors de la base applicative.

La progression la plus sûre est : **tester l’ossature récente en Preview**, fiabiliser les opérations catalogue et fulfillment, puis construire séparément la plateforme de provisionnement et de licences.

## Références

[1]: https://github.com/yacbhl71/MAZIGHO/blob/main/client/src/pages/admin/AdminCustomization.tsx "Personnalisation de marque"
[2]: https://github.com/yacbhl71/MAZIGHO/blob/main/server/services/checkoutShippingPolicy.ts "Politique de livraison appliquée côté serveur"
[3]: https://github.com/yacbhl71/MAZIGHO/blob/main/server/services/storeCurrency.ts "Contrat de devise et conversion"
[4]: https://github.com/yacbhl71/MAZIGHO/blob/main/client/src/components/MarketingPixels.tsx "Chargement conditionnel des pixels"
[5]: https://github.com/yacbhl71/MAZIGHO/blob/main/client/src/pages/NotFound.tsx "Page 404 MAZIGHO"
[6]: https://github.com/yacbhl71/MAZIGHO/blob/main/server/authRouter.ts "Authentification et changement de mot de passe"
[7]: https://github.com/yacbhl71/MAZIGHO/blob/main/client/src/pages/admin/AdminProducts.tsx "Gestion catalogue"
[8]: https://github.com/yacbhl71/MAZIGHO/blob/main/server/stripeWebhook.ts "Paiement Stripe Test et synchronisation"
[9]: https://github.com/yacbhl71/MAZIGHO/blob/main/server/services/cjFulfillment.ts "Fulfillment CJ sandbox"
[10]: https://github.com/yacbhl71/MAZIGHO/blob/main/server/services/aliExpressManifest.ts "Manifeste AliExpress assisté"
