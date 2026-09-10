# Vision MAZIGHO : console opérateur et panneaux clients

**Auteur :** Manus AI  
**Statut :** vision produit — aucune modification technique associée  
**Objet :** transformer MAZIGHO en solution e-commerce hébergée, vendable et administrable pour plusieurs boutiques clientes.

## 1. Le principe : deux niveaux totalement distincts

MAZIGHO ne doit pas devenir une seule grande administration où tous les acheteurs se croisent. Il faut séparer nettement la **console opérateur**, réservée à vous et à votre future équipe, du **panneau de boutique**, remis à chaque acheteur.

> **Votre console pilote la plateforme. Le client pilote uniquement sa boutique.**

| Niveau | Utilisateur | Finalité | Ce qui ne doit jamais être visible |
|---|---|---|---|
| **Console MAZIGHO Studio** | Vous, puis éventuellement vos collaborateurs de confiance | Gérer les boutiques clientes, licences, abonnements, accès, support et santé technique | Les mots de passe, clés privées Stripe/Odoo/TiDB et données inutiles des clients |
| **Panneau de la boutique cliente** | Propriétaire de la boutique et son équipe | Vendre, gérer catalogue, commandes, contenu, communication et configuration métier | Les autres boutiques, vos données de plateforme, les contrôles de licence internes et les secrets d’un tiers |

Votre boutique actuelle **MAZIGHO** deviendra une boutique cliente particulière : elle utilisera le même moteur et le même panneau opérationnel que les futurs acheteurs. Vous disposerez en plus de votre console MAZIGHO Studio, invisible pour eux.

## 2. Votre futur portail central : MAZIGHO Studio

La page d’accueil de votre console doit vous donner une vue immédiate de l’activité commerciale et du risque d’abonnement, sans vous obliger à entrer dans chaque boutique.

### Tableau de bord global

| Bloc | Information affichée | Utilité opérationnelle |
|---|---|---|
| **Boutiques** | Nombre total, actives, en démarrage, suspendues et résiliées | Voir la taille réelle du parc de boutiques |
| **Abonnements** | Actifs, à échéance proche, en période de grâce, impayés | Agir avant une suspension non souhaitée |
| **Revenu récurrent** | Nombre d’abonnements par formule et statut de paiement | Piloter l’offre, sans mélanger les ventes des boutiques clientes |
| **Alertes** | Déploiement en erreur, configuration incomplète, domaine non validé, webhook de licence en échec | Résoudre les problèmes techniques prioritairement |
| **Support** | Demandes ouvertes, boutiques bloquées, dernières actions d’administration | Ne pas perdre de demande client |

### Registre des boutiques

La vue principale peut être une table filtrable, complétée par une fiche détail par boutique.

| Colonne | Exemple de contenu |
|---|---|
| Boutique | Nom commercial, logo et domaine public |
| Propriétaire | Nom, e-mail professionnel, date de création |
| Formule | Essentiel, Pro, Agence ou formule personnalisée |
| Statut d’accès | Démarrage, actif, grâce, limité, suspendu ou résilié |
| Abonnement | Prochaine échéance, état de paiement et lien de gestion d’abonnement |
| Santé de configuration | Identité prête, domaine lié, paiement configuré, e-mail configuré, intégrations facultatives prêtes — sans révéler les valeurs secrètes |
| Activité | Dernière connexion administrateur, dernière commande, dernier événement technique |
| Actions | Ouvrir la fiche, contacter, prolonger la grâce, limiter, suspendre, réactiver ou préparer une exportation |

Chaque fiche de boutique devrait afficher un journal d’audit : qui a changé un statut, quand, pourquoi et selon quelle règle. Cela est essentiel pour résoudre un litige ou comprendre une suspension.

## 3. Abonnements, renouvellements et accès limité

Le statut de paiement ne doit jamais être un simple interrupteur caché. Il doit produire une politique visible, compréhensible et réversible.

| Statut | Boutique publique | Panneau client | Objectif |
|---|---|---|---|
| **Démarrage** | Non publiée ou page d’attente | Accès complet au Setup Wizard et aux réglages de contenu | Permettre l’onboarding avant mise en ligne |
| **Active** | Vente normale | Accès complet selon la formule | Exploitation normale |
| **Échéance proche** | Vente normale | Accès complet avec rappel discret | Prévenir, pas punir |
| **Grâce** | Vente normale | Accès complet avec bannière et lien de régularisation | Laisser le temps de payer ou de résoudre un incident |
| **Accès limité** | Choix de politique : vente maintenue temporairement ou checkout en pause | Consultation, export et régularisation possibles ; modifications et nouvelles intégrations bloquées | Éviter la perte de données tout en limitant l’usage non payé |
| **Suspendue** | Page publique neutre indiquant une indisponibilité temporaire ; aucun checkout | Lecture seule, export de données et lien de régularisation ; aucune modification métier | Stopper l’exploitation sans supprimer les données |
| **Résiliée** | Hors ligne après délai annoncé | Accès limité à l’export selon la politique contractuelle | Clôturer proprement l’instance |

La **période de grâce** et la durée avant suspension doivent être configurables par votre politique commerciale. Une bonne pratique produit est de garder l’accès aux données et à l’export, même en suspension, mais de bloquer les actions qui créent de nouvelles obligations : nouveaux paiements, nouvelles campagnes, nouvelles intégrations ou nouveaux opérateurs.

La suspension doit être décidée par une règle claire : webhook de facturation signé, expiration confirmée et journal d’audit. Une action manuelle de votre part doit demander une justification et éventuellement une confirmation renforcée.

## 4. Le panneau remis à chaque client

Le client ne doit pas recevoir votre console. Il doit voir une version ciblée sur sa boutique, plus simple et plus rassurante.

| Rubrique client | Ce que le client peut faire | Ce qui diffère de votre panneau actuel |
|---|---|---|
| **Vue d’ensemble** | Voir ses ventes, commandes, panier, produits et actions à réaliser | Aucun chiffre d’autres boutiques, aucun indicateur de licences globales |
| **Boutique & marque** | Changer logo, nom, couleurs, textes, images, bannières et navigation | Réutilise les outils déjà construits : Personnalisation, Contenu et Éditeur simple |
| **Catalogue** | Créer, importer, organiser, traduire, archiver et publier ses produits et catégories | Ne voit que ses produits, ses fournisseurs et ses images |
| **Commandes & service** | Gérer commandes, remboursements, retours, avis et support client | Ne peut pas consulter les commandes d’une autre boutique |
| **Marketing** | Configurer promotions, bannières, SEO, e-mails, pixels Meta/TikTok et consentement | Les pixels restent inactifs sans consentement visiteur |
| **Opérations** | Configurer devise, politique de livraison, taxes applicables, factures et intégrations autorisées | Les valeurs sont isolées par boutique et soumises au rôle utilisateur |
| **Équipe** | Inviter un gestionnaire, un éditeur catalogue, un préparateur ou un comptable | Chaque rôle reçoit des droits limités, jamais l’accès de propriétaire plateforme |
| **Abonnement** | Voir la formule, la date de renouvellement, l’état et ouvrir le portail de facturation | Le client peut régulariser ; il ne peut pas modifier une licence ou suspendre une boutique |
| **Démarrage sécurisé** | Finaliser identité, coordonnées et étapes non sensibles | Les secrets d’hébergement restent hors de ce formulaire |

Le panneau client actuel de MAZIGHO est déjà une excellente base. Pour un futur acheteur, il faudra **masquer les écrans qui ne relèvent pas de sa formule ou de son rôle**, adapter les exemples, puis remplacer les valeurs de démonstration par son identité et son catalogue.

## 5. Rôles à prévoir

Un panneau client ne doit pas reposer sur un seul compte administrateur partagé. Les rôles suivants offrent un équilibre entre autonomie et sécurité.

| Rôle | Droits principaux | Restrictions importantes |
|---|---|---|
| **Propriétaire de boutique** | Tous les réglages métier, équipe, marque, catalogue, commandes et abonnement | Ne voit pas la console plateforme ni les données des autres boutiques |
| **Gestionnaire** | Catalogue, commandes, contenu, promotions et service client | Ne change pas le propriétaire, le plan, les secrets ni les accès sensibles |
| **Éditeur catalogue** | Produits, catégories, textes, images, traductions et brouillons | Pas d’accès aux commandes, remboursements, abonnements ou intégrations |
| **Préparateur / fulfillment** | Commandes attribuées, préparation et suivi autorisé | Pas de prix, contenus de marque, équipe ni facturation |
| **Comptable** | Exports, factures, remboursements et rapports | Pas de fournisseurs, marketing, identité ou utilisateurs |
| **Lecture seule** | Consultation des tableaux et rapports nécessaires | Aucune modification, export sensible ou action de commande |
| **Opérateur plateforme** | Support technique sur boutiques attribuées, selon mandat | Pas de lecture automatique des secrets ; accès justifié et journalisé |
| **Propriétaire plateforme** | Gestion globale des instances, licences, suspension et conformité | Réservé à vous et à un nombre très limité de personnes |

## 6. Ce que vous pourrez faire sans entrer dans la boutique client

Depuis MAZIGHO Studio, vous devriez pouvoir :

- créer une boutique et envoyer une invitation de premier propriétaire ;
- attribuer une formule, un domaine et un état de démarrage ;
- voir si les prérequis sont complets, mais jamais les secrets eux-mêmes ;
- recevoir les alertes d’échéance et déclencher une période de grâce ;
- basculer une boutique en accès limité ou en suspension ;
- réactiver immédiatement la boutique après régularisation ;
- accompagner le client via une note support ou une prise en charge explicitement autorisée ;
- exporter les données selon la politique de résiliation ;
- consulter le journal d’audit de la plateforme.

Vous ne devez pas pouvoir, par défaut, acheter à la place du client, voir ses moyens de paiement, lire ses clés privées, ni modifier son catalogue sans une action de support clairement tracée.

## 7. Architecture cible

La première version vendable devrait privilégier une architecture **multi-tenant isolée logiquement** : une table `stores` représente chaque boutique et chaque donnée métier porte un `storeId`. Toutes les requêtes serveur doivent filtrer ce `storeId`, y compris produits, images, commandes, utilisateurs, réglages, contenus, journaux et fichiers.

| Couche | Règle de conception |
|---|---|
| **Données métier** | Chaque enregistrement est associé à une boutique ; les contrôles sont côté serveur, jamais seulement dans l’interface |
| **Authentification** | L’utilisateur est associé à une boutique et à un rôle ; le propriétaire plateforme est distinct |
| **Fichiers** | Logos, images et exports sont rangés par boutique, avec contrôle d’autorisation à chaque lecture |
| **Secrets** | Stockage dans le coffre de secrets de l’hébergement ou un gestionnaire de secrets externe ; jamais en clair dans la base ni dans le navigateur |
| **Facturation / licences** | Service central de licences, webhook signé de Lemon Squeezy ou équivalent, et journal d’état par boutique |
| **Domaines** | Association d’un domaine à une boutique, validation de propriété et résolution vers l’instance concernée |
| **Observabilité** | Journal de plateforme et alertes identifiables par boutique sans révéler le contenu sensible |

Une isolation physique — base ou projet distinct par client — peut être envisagée plus tard pour une offre premium. Elle est plus coûteuse à exploiter. Une isolation logique rigoureuse est généralement le meilleur premier jalon, à condition que le contrôle de `storeId` soit systématique et testé.

## 8. Ordre de mise en œuvre recommandé

| Étape | Livrable | Dépendance |
|---|---|---|
| **1. Décisions commerciales** | Formules, durée de grâce, politique de suspension, maintien ou pause du checkout, export en résiliation | Aucun code avant ces règles |
| **2. Noyau multi-boutique** | `stores`, rôles par boutique, filtres serveur systématiques, fichier isolé et tests d’étanchéité | Fondation indispensable |
| **3. Console MAZIGHO Studio** | Liste des boutiques, fiche, états d’accès, audit, alertes et actions manuelles sécurisées | Noyau multi-boutique |
| **4. Portail abonnement** | Intégration Lemon Squeezy ou équivalent, webhook signé, période de grâce et réactivation | Console + politique commerciale |
| **5. Provisionnement** | Création d’instance, invitation du premier propriétaire, Setup Wizard et domaine | Abonnement et noyau multi-boutique |
| **6. Panneau client par rôle** | Masquage fonctionnel des écrans et vérification serveur des permissions | Rôles et boutique active |
| **7. Support et conformité** | Centre d’aide, export, sauvegardes testées, procédures de résiliation et réponse aux incidents | Instances clientes actives |
| **8. Pilote restreint** | Une ou deux boutiques tests, avec paiement fournisseur toujours humain | Tous les garde-fous précédents |

## 9. Ce qui est déjà une base solide

MAZIGHO possède déjà de nombreux éléments que le futur panneau client pourra réutiliser : personnalisation de marque, contenu administrable, éditeur simple, catalogue, variantes, traductions, politique de livraison, devise active, pixels conditionnés au consentement, page 404, commandes, Odoo et Setup Wizard non sensible.

La prochaine grande différence n’est donc pas l’interface visuelle : c’est l’**isolation rigoureuse entre boutiques** et l’ajout de la **console plateforme / abonnement**. Tant que cette séparation n’est pas faite, MAZIGHO reste votre boutique très complète, pas encore une application SaaS multi-client prête à vendre.

## 10. Décisions à prendre ensemble avant le développement

| Décision | Exemple de choix |
|---|---|
| Formules | Une formule unique au départ, puis Essentiel / Pro / Agence |
| Grâce | 3, 7 ou 14 jours après l’échéance |
| Accès limité | Consultation + export seulement, ou accès complet avec checkout gelé |
| Suspension | Page de maintenance neutre ou page expliquant l’indisponibilité sans détailler l’abonnement |
| Support | Support e-mail, messagerie intégrée ou priorité selon plan |
| Hébergement | Instances réellement gérées par vous ou déploiements séparés avec console centrale |
| Secrets | Coffre de secrets par boutique ou secrets d’hébergement gérés lors du provisionnement |

La direction recommandée est claire : commencer par un **pilote avec une seule formule et deux boutiques maximum**, puis faire évoluer le portail de licences lorsque les parcours d’onboarding, support et suspension sont réellement éprouvés.

> Aucun de ces mécanismes n’est encore activé. Ce document définit une cible de produit et une progression sûre, sans modifier les accès, les abonnements, les données ou la production actuelle.
