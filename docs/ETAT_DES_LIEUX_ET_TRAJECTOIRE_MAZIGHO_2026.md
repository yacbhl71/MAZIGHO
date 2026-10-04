# MAZIGHO — État des lieux, trajectoire d’ouverture et base de pilotage

- **Date de référence :** 5 octobre 2026
- **Périmètre :** plateforme SaaS e-commerce multi-boutique, Studio opérateur, vitrines clientes et panneaux propriétaires
- **Révision technique de référence :** `ea82f64` sur `origin/main`
- **Statut global :** socle applicatif avancé et publié ; l’ouverture de ventes en ligne à grande échelle reste conditionnée par la résilience réelle, la conformité par marché et la recette Stripe Live.

> **Décision de pilotage** — MAZIGHO ne doit pas accélérer l’ouverture commerciale en compensant les contrôles manquants. La plateforme est déjà utilisable pour préparer des boutiques, les ouvrir comme vitrines, traiter des commandes manuelles ou COD lorsque le marché le permet, et piloter plusieurs propriétaires. Les paiements Stripe Live, la sauvegarde réellement exécutée et l’ouverture à grande échelle demeurent des décisions distinctes, volontaires et progressives.

---

## 1. Résumé exécutif

MAZIGHO est aujourd’hui une plateforme multi-boutique concrète : une même personne peut posséder plusieurs boutiques isolées ; chaque propriétaire dispose de son panneau ; Studio supervise sans prendre le contrôle des données commerciales des boutiques. Les parcours essentiels de catalogue, livraison, commande, retours, marketing, demandes sur mesure, IA et pilotage Studio ont été construits et publiés par petits lots contrôlés.

La plateforme n’est **pas** encore dans une phase de vente Stripe Live généralisée. Ce n’est ni une panne ni un retard caché : c’est la dernière étape prévue, car elle exige simultanément :

1. une sauvegarde externe et une restauration réellement testées ;
2. une surveillance d’incident réellement raccordée ;
3. une validation juridique, fiscale et commerciale adaptée à chaque marché et vendeur ;
4. une recette complète Stripe Connect Test puis Live ;
5. l’ouverture contrôlée d’une première boutique commerciale avant toute généralisation.

### Lecture rapide

| Axe | État | Conclusion de pilotage |
|---|---|---|
| Produit SaaS multi-boutique | **Avancé et publié** | Utilisable pour créer, administrer et faire évoluer des boutiques séparées. |
| Catalogue, livraison, commandes et retours | **Socle terminé techniquement** | Conserver une validation humaine terrain avant promesse commerciale large. |
| Marketing, demandes sur mesure, Studio | **Socle terminé techniquement** | Exploitable sans automatisation externe silencieuse. |
| IA et centre documentaire | **Validés sur le socle** | Les réponses restent des brouillons à valider ; quotas et coûts doivent être suivis à l’usage. |
| Sauvegardes, alertes et restauration | **Préparés, non activés** | Priorité absolue juste avant l’ouverture réelle, avec dépenses externes autorisées. |
| Stripe Live / ouverture à grande échelle | **Volontairement non ouvert** | Dernier lot ; ne pas l’activer avant les critères de passage. |

---

## 2. Ce qui est réellement construit et publié

### 2.1. Architecture SaaS et isolation des boutiques

- **Multi-boutique propriétaire :** un même compte peut détenir et piloter plusieurs boutiques, avec un sélecteur de boutique propriétaire et des memberships isolés.
- **Isolation systématique :** les opérations métier importantes sont bornées par `storeId` ; produits, commandes, retours, promotions, demandes sur mesure, documents IA et données Studio ne sont pas censés circuler entre boutiques.
- **Studio opérateur :** la supervision est séparée des panneaux propriétaires ; l’impersonation Studio reste lecture seule et les actions sensibles demandent une confirmation explicite.
- **Plans et dérogations :** les offres publiques restent fixes : **FREE 0 CHF/mois + 2,5 %**, **BASIC 7,90 CHF/mois + 1 %**, **PRO 12,90 CHF/mois + 1 % et Dropshipping**. Studio peut attribuer, pour une boutique offerte ou pilote, des quotas ou une commission exceptionnels — y compris 0 % — sans créer de facture, paiement ou e-mail.
- **Fabrique de boutiques :** des modèles réutilisables permettent de préparer un socle sûr par activité et par marché sans copier les produits, médias, clients, commandes, données légales, paiements ou domaines d’une autre boutique.

### 2.2. Vitrine et catalogue propriétaire

Les propriétaires peuvent gérer notamment :

- produits, catégories, images et SEO ;
- prix barré, promotion, options et matrice de variantes ;
- profils de livraison par produit ;
- traductions et contenu de vitrine ;
- stock produit et stock de variantes, avec seuil de faible stock ;
- navigation, pages, thèmes et blocs d’accueil ;
- fournisseur privé et informations de préparation sans exposition publique.

Le parcours mobile et tablette a été travaillé sur les zones opérationnelles. La fiche produit propriétaire a été élargie et réorganisée pour l’édition tactile ; la vitrine reste distincte de l’administration.

### 2.3. Marché Algérie

Le socle Algérie est configurable par boutique :

- devise **DZD** ;
- wilayas et profils de livraison ;
- paiement à la livraison (**COD**) ;
- traitement de commande et confirmation de l’encaissement COD après livraison réelle ;
- affichage conditionnel des éléments Algérie seulement quand ce marché est activé.

> Le socle technique Algérie ne constitue pas une validation juridique, fiscale, bancaire ou réglementaire automatique. Chaque vendeur reste responsable de son activité et de son cadre de vente local.

### 2.4. Commandes, livraison et après-vente

Le Lot 2 est techniquement clôturé sur son périmètre manuel :

- file de commandes tactile, filtres et prochaine action claire ;
- décisions d’acceptation ou de refus ;
- préparation, expédition, livraison et encaissement COD Algérie ;
- consultation séparée des articles, de l’historique et des coordonnées de livraison ;
- bon de préparation et bordereau de remise imprimables sous contrôle propriétaire ;
- suivi manuel avec transporteur, numéro et lien HTTPS ;
- centre de retours priorisé : à décider, en retour, réceptionné, terminé.

Aucun transporteur, fournisseur, remboursement, e-mail ou paiement ne se déclenche automatiquement par ces écrans. C’est une limite volontaire : elle conserve la maîtrise humaine sur les décisions commerciales et les données sensibles.

### 2.5. Marketing et fidélisation utiles

Le Lot 3 est clôturé pour son socle :

- campagnes de vitrine avec brouillon, période, emplacement, visuel, lien, compte à rebours et code promotionnel ;
- activation et arrêt explicitement confirmés ;
- messages prêts à copier pour partage manuel, sans publication automatique sur les réseaux ;
- promotions par date, seuil, première commande, catégorie ou jusqu’à 30 produits précis ;
- sélections duo/trio : ajout au panier des produits réels uniquement, sans faux stock ni prix groupé artificiel ;
- repères commerciaux agrégés : commandes réglées, montant, panier moyen, rythme sur 30 jours et produits les plus vendus ;
- recommandations de produits disponibles dans la même boutique et catégorie.

Les relances de paniers, pixels, campagnes e-mail automatisées et mesure complète de conversion ne sont pas ouverts à ce stade : ils exigent d’abord un choix explicite de consentement, de rétention des données et de désinscription.

### 2.6. Expérience client et service sur mesure

Le Lot 4 est clôturé pour son socle :

- suivi client des commandes et retours ;
- favoris et remise volontaire d’articles disponibles au panier ;
- options, descriptions, caractéristiques, dimensions et profils de livraison éditables ;
- formulaire de demande sur mesure activable boutique par boutique ;
- raccourci de navigation configurable : visibilité et libellé adaptés à chaque activité ;
- demande structurée, avec budget facultatif sous forme de montant dans la devise de la boutique et échéance via calendrier ;
- file propriétaire isolée, réponse manuelle, sans génération automatique de devis, commande, stock, paiement, e-mail ou fichier.

Le service sur mesure est donc une **prise de contact commerciale structurée**, pas une commande automatique.

### 2.7. Studio commercial et relation client

Le Lot 5 est clôturé pour son socle :

- portefeuille et filtres Studio par statut, modèle, marché, préparation, domaine et alertes ;
- pipeline opérationnel : `nouveau projet → à analyser → à préparer → prêt → remis au propriétaire` ;
- notes internes chiffrées au repos ;
- rappels manuels et checklist de remise ;
- modèles de devis, contrat de création et remise prêts à adapter ;
- tickets, réparation d’accès, transfert de propriété, dérogations de plan / quotas / commission et intentions d’intégration sous contrôle humain.

Ces outils facilitent le pilotage de plusieurs boutiques sans confondre une note interne avec un document juridiquement envoyé, une facture ou un contrat signé.

### 2.8. Assistant IA et espace documentaire privé

Le Lot 6 est clôturé pour la validation qualité du socle :

- assistant de rédaction, SEO, FAQ, traduction et analyse de visuel ;
- réponses lisibles en Markdown et copiables sur téléphone, tablette et ordinateur ;
- sauvegarde volontaire dans un Workspace privé chiffré, puis export PDF/DOCX ;
- import de PDF, DOCX, TXT et CSV, limité à **3 Mio** par document ;
- recherche documentaire et citations internes isolées par boutique ;
- recherche web explicite : liens et extraits proposés, lecture de la source uniquement après choix du propriétaire ;
- aucune publication, modification de prix, commande, e-mail ou contact fournisseur automatisé par l’IA.

Les quotas fonctionnels affichés sont **40 actions/mois en FREE, 400 en BASIC et 1 200 en PRO**. Ils sont un mécanisme de maîtrise d’usage ; leur coût réel devra être mesuré avant toute promesse de marge sur l’IA.

---

## 3. Ce qui reste à faire, sans ambiguïté

### 3.1. Validations humaines à réaliser sans développement majeur

Ces points ne demandent pas nécessairement une nouvelle brique, mais doivent être vérifiés dans une boutique de recette avant l’ouverture commerciale :

| Contrôle | Ce qui doit être vérifié | Niveau |
|---|---|---|
| Commande manuelle / COD | Accepter, préparer, saisir le suivi, expédier, imprimer le bordereau, livrer et confirmer le COD après remise réelle. | Prioritaire |
| Retours | Créer une demande de retour, la décider et vérifier l’historique côté client/propriétaire. | Prioritaire |
| Catalogue | Sauvegarder des fiches produit, catégories, variantes, images et promotions sur plusieurs boutiques. | Prioritaire |
| Documents IA | Importer un vrai PDF de moins de 3 Mio, vérifier extraction, citation et suppression/gestion. | Prioritaire |
| Interface tactile | Tester les écrans propriétaires sur tablette connectée, en particulier commandes, retours et marketing. | Important |
| Ouverture de boutique | Contrôler identité légale, catalogue, livraison, politique de retours, domaine et rôle propriétaire avec la checklist Studio. | Bloquant avant vente |

### 3.2. Lot 1 : validation terrain des modèles de boutiques

La fabrique de boutiques est livrée, mais elle doit être confrontée à de nouvelles créations réelles. Les améliorations futures ne doivent être ajoutées qu’en réponse à un besoin répété : nouveaux menus composables, blocs d’accueil ou modèle métier réellement demandé.

### 3.3. Lot 7 : résilience, exploitation et conformité — préparé mais non terminé

La conception est déjà livrée dans le dépôt : scripts, workflows GitHub Actions, chiffrement de sauvegarde, politique S3, contrôle DNS, drill de restauration et règles d’alerting. **Aucune ressource payante n’a été créée ni activée.**

Les quatre prérequis d’activation sont :

1. un coffre S3 dédié avec versionnage et Object Lock ;
2. des secrets GitHub à droits minimaux ;
3. une instance TiDB distincte pour le test de restauration ;
4. un canal réel de notification d’incident, ainsi qu’une source durable de métriques.

Le critère de clôture est concret : une restauration isolée réussie, une alerte reçue réellement et une revue juridique/fiscale par marché actif. Tant que cela n’est pas réalisé, MAZIGHO ne doit pas se présenter comme bénéficiant de sauvegardes opérationnelles, de PITR actif ou d’alertes 5xx/CPU/RAM réellement reçues.

### 3.4. Lot 8 : Stripe et ouverture commerciale à grande échelle — dernier lot

Le travail Stripe Test existe mais reste incomplet sur l’onboarding/vérification Connect. Les secrets Live ne sont pas configurés et ne doivent pas l’être avant la décision d’ouverture.

Le passage se fera obligatoirement dans cet ordre :

1. recette Connect Test isolée : refus de carte, abandon de checkout, succès confirmé par webhook malgré fermeture de la redirection et remboursement ;
2. responsabilité vendeur clairement définie : vendeur, retours, litiges, compte de versement et commission MAZIGHO ;
3. activation Live de façon contrôlée ;
4. première boutique commerciale volontaire ;
5. revue complète des e-mails, conditions, retours et réconciliation ;
6. ouverture progressive, jamais simultanée sur toutes les boutiques.

---

## 4. Priorités d’ouverture : ordre de passage obligatoire

### Niveau 0 — Avant tout paiement Live

| Priorité | Action | Critère de passage |
|---|---|---|
| P0 | Activer le coffre de sauvegarde et le snapshot chiffré quotidien. | Première archive SQL et média contrôlée ; manifeste vérifié. |
| P0 | Exécuter un drill de restauration sur une instance distincte. | Restauration isolée validée sans écriture en production. |
| P0 | Raccorder les alertes d’incident. | Test réel de notification et procédure de réaction courte. |
| P0 | Revue légale/fiscale / données personnelles du ou des marchés ouverts. | Décision écrite du professionnel compétent et documents vendeurs prêts. |
| P0 | Recette Stripe Connect Test de bout en bout. | Les cas limite sont vérifiés, notamment le webhook sans retour navigateur. |

### Niveau 1 — Première boutique commerciale contrôlée

| Priorité | Action | Règle |
|---|---|---|
| P1 | Choisir une seule boutique pilote volontaire. | Ne pas basculer toutes les boutiques. |
| P1 | Vérifier propriétaire, catalogue, stock, livraison, retours, mentions et domaine. | Checklist de lancement complète. |
| P1 | Ouvrir Stripe Live seulement pour cette boutique. | Secrets et webhooks Live confirmés humainement. |
| P1 | Suivre quotidiennement commandes, webhook, livraison, retours et rapprochement. | Toute anomalie est corrigée avant élargissement. |

### Niveau 2 — Extension maîtrisée

- Ajouter les boutiques une par une ou par petits groupes homogènes.
- Mesurer l’usage réel de stockage, base, fonctions, IA et e-mail avant de relever les budgets.
- Décider séparément de l’automatisation marketing, de la collecte analytique et des intégrations fournisseurs.
- Ne financer le PITR natif, l’observabilité avancée ou l’augmentation des limites qu’après un besoin démontré par les ventes et le risque opérationnel.

---

## 5. Budget d’ouverture : ce à quoi s’attendre

### 5.1. Principe de lecture

Les montants ci-dessous sont des **enveloppes de décision**, pas des devis ni des engagements. Ils ne comprennent ni TVA, ni conseil juridique/fiscal, ni comptabilité, ni frais de transport, ni coût fournisseur, ni achat de noms de domaine, ni marketing publicitaire.

Le taux indicatif utilisé pour convertir les estimations USD est **1 USD = 0,82664 CHF**, taux consulté le 2 octobre 2026. Les fournisseurs peuvent modifier leurs grilles ; chaque prix devra être recontrôlé au jour de l’achat.

### 5.2. Coûts fixes techniques recommandés

| Phase | Enveloppe mensuelle indicative | Composition et logique |
|---|---:|---|
| **Préparation actuelle** | **0 CHF additionnel** | Les scripts et workflows existent, mais aucune ressource externe de résilience n’est activée. |
| **Ouverture commerciale prudente** | **25 à 60 CHF/mois** | Vercel Pro, TiDB Starter avec plafond de dépense, archive S3 chiffrée et versionnée, suivi d’usage minimal. |
| **Croissance initiale** | **100 à 250 CHF/mois** | Hausse de trafic/fonctions/stockage, archives plus volumineuses, base de données et e-mail transactionnel plus actifs. |
| **Résilience/PITR renforcé** | **550 à 800 CHF/mois** | Vercel et stockage plus larges, alerting durable, et surtout TiDB Essential ou équivalent permettant le PITR natif. |

#### Détail des postes à anticiper

| Poste | Référence actuelle | Décision recommandée |
|---|---|---|
| **Vercel Pro** | 20 USD/mois, plus les usages hors crédit ; le plan Pro permet également budget et limite dure de dépense. | Passer sur Pro juste avant l’ouverture commerciale. Définir un plafond strict dès le premier jour. |
| **TiDB Cloud Starter** | Quota gratuit annoncé : jusqu’à 5 GiB de données lignes et 50 millions de RU par mois, sous conditions d’instances. | Démarrer avec un plafond bas et une alerte de consommation. Ne passer à Essential que si le PITR natif devient justifié. |
| **Sauvegarde S3** | S3 facture stockage, opérations et transferts ; Object Lock active aussi le versionnage. | Budgéter une petite enveloppe au lancement, puis mesurer l’archive réelle et sa croissance. |
| **Observabilité** | Les alertes Vercel avancées et le Log Drain demandent des capacités payantes ; les règles exactes 5xx/CPU/RAM nécessitent un collecteur durable. | Commencer simple, mais seulement après un test de notification réel. |
| **E-mails transactionnels** | Un palier gratuit peut convenir au démarrage selon le fournisseur et le volume. | Mesurer le volume et la délivrabilité avant un abonnement marketing ou une automatisation. |
| **IA** | Le coût varie selon le modèle, le volume, les images et la longueur de contexte. | Les quotas limitent l’usage, mais un tableau de coût réel par boutique doit être établi avant de garantir une marge IA. |
| **Noms de domaine** | Variable selon TLD, registrar, renouvellement et services associés. | Refacturer ou valider au cas par cas ; ne pas absorber silencieusement le coût dans un plan. |

### 5.3. Frais Stripe : variables et à séparer des frais d’infrastructure

Pour la Suisse, Stripe publie actuellement :

- **2,9 % + 0,30 CHF** pour une carte émise en Suisse ;
- **3,25 % + 0,30 CHF** pour une carte étrangère ;
- **+ 2 %** lorsqu’une conversion de devise est nécessaire ;
- **20 CHF** pour la réception d’une contestation, avec conditions particulières pour sa défense ;
- un coût Connect à confirmer au moment du paramétrage final si la plateforme applique sa propre tarification de paiement.

Exemples indicatifs pour des cartes suisses :

| Panier moyen | Frais Stripe par paiement | Taux effectif approximatif |
|---:|---:|---:|
| 25 CHF | 1,03 CHF | 4,10 % |
| 50 CHF | 1,75 CHF | 3,50 % |
| 75 CHF | 2,48 CHF | 3,30 % |
| 100 CHF | 3,20 CHF | 3,20 % |

**Règle économique à retenir :** les commissions MAZIGHO de 1 % ou 2,5 % ne suffisent pas à absorber des frais de carte proches de 3 % à 4 %. Le paramétrage Stripe Connect devra donc faire supporter les frais de paiement au vendeur — ou les intégrer clairement dans son prix de vente — tandis que MAZIGHO conserve sa commission explicite. Cette répartition sera validée durant le Lot 8, jamais supposée.

### 5.4. Dépenses non incluses et nécessaires à anticiper

- conseil juridique, fiscal et protection des données par marché ;
- comptabilité, facturation réelle et gestion de TVA de MAZIGHO ;
- transporteurs, tarifs de livraison, emballage, fournisseurs et éventuels abonnements dropshipping ;
- création/renouvellement de noms de domaine ;
- publicité, création de contenu, photographie, influence et support client humain ;
- coûts inattendus liés aux litiges, chargebacks ou conversions de devise.

---

## 6. Objectifs des six premiers mois après la première vente réelle

Les six premiers mois ne sont pas un objectif de volume à tout prix. C’est une phase de **preuve opérationnelle**.

### Mois 0 — décision d’ouverture

- Activer les prérequis P0 et documenter qui reçoit les alertes.
- Choisir la boutique pilote, le vendeur responsable et le marché exact.
- Réaliser la recette Stripe Live ou, si elle n’est pas activée, documenter le parcours de vente alternatif réellement utilisé.
- Fixer des plafonds de dépense Vercel, TiDB, archive et IA.
- Préparer une procédure simple : incident, remboursement/litige, restauration, indisponibilité et contact propriétaire.

### Mois 1 à 2 — pilotage rapproché

- Ouvrir une première boutique commerciale contrôlée.
- Réconcilier chaque commande : panier, paiement ou COD, stock, livraison, statut et éventuel retour.
- Vérifier l’arrivée effective des alertes et la lisibilité des historiques.
- Collecter les difficultés propriétaires : édition produit, livraison, commandes et support — sans lancer de fonctionnalités non nécessaires.
- Évaluer les coûts réels : stockage, base, trafic, e-mail, IA, sauvegarde et support.

### Mois 3 à 4 — validation du modèle d’exploitation

- Définir une checklist de passage réutilisable pour chaque nouvelle boutique.
- Ajouter une nouvelle boutique seulement si le pilote est stable et que les incidents sont compris.
- Tester la restauration planifiée et vérifier la rétention réelle de sauvegarde.
- Mettre à jour les conditions, modèles et procédures selon les retours terrain et la revue professionnelle.
- Décider, sur preuves, si les automatisations marketing ou fournisseurs apportent un gain supérieur à leur risque.

### Mois 5 à 6 — décision de montée en puissance

- Fixer une cible raisonnable de boutiques actives, à partir du support réellement absorbable et non d’un chiffre arbitraire.
- Mesurer la rentabilité par boutique : abonnement/commission encaissés moins infrastructure, support, e-mail, IA et charge de gestion.
- Déterminer si l’infrastructure Starter suffit encore ou si une montée de plan est justifiée.
- Évaluer séparément : relances consenties, analytics respectueux de la vie privée, alertes de retour en stock et automatisation fournisseur.
- Produire un bilan de six mois : incidents, ventes, retours, litiges, coûts, satisfaction propriétaire et décisions de correction.

### Indicateurs à suivre dès le premier jour

| Domaine | Indicateur simple | Usage de décision |
|---|---|---|
| Fiabilité | Succès de sauvegarde / test de restauration | Ne pas élargir si un contrôle échoue. |
| Paiement | Événements Stripe ou COD non réconciliés | Résoudre avant d’ajouter des boutiques. |
| Commerce | Commandes livrées, retours, annulations, litiges | Ajuster les règles opérationnelles. |
| Adoption propriétaire | Boutiques actives, produits publiés, opérations réalisées sans Studio | Mesurer l’autonomie réelle. |
| Économie | Coût infra + support + IA par boutique active | Fixer les budgets et la trajectoire de plan. |
| Expérience | Difficultés répétées sur un écran ou une étape | Construire uniquement les petites briques justifiées. |

---

## 7. Objectifs des douze mois suivants (mois 7 à 18)

La deuxième période sert à transformer une preuve de fonctionnement en activité durable, sans perdre la simplicité initiale.

### Axe 1 — Exploitation professionnelle

- Garder les sauvegardes, les exercices de restauration et les alertes sous revue mensuelle.
- Passer au PITR natif seulement si l’exposition commerciale, la dépendance aux données et le coût d’une indisponibilité le justifient.
- Formaliser une gestion d’incident, un journal de changement et une revue régulière des accès.
- Séparer clairement les environnements de test, recette et production commerciale lorsque le volume l’exige.

### Axe 2 — Déploiement commercial progressif

- Intégrer les nouvelles boutiques par vagues contrôlées, chacune avec une checklist d’ouverture.
- Préserver la logique : le vendeur connaît ses obligations, ses livraisons, ses retours et son compte de paiement.
- Utiliser Studio pour standardiser l’accompagnement, pas pour centraliser secrètement les responsabilités des vendeurs.
- Réviser plans, quotas et dérogations à partir des coûts mesurés et non d’une hypothèse.

### Axe 3 — Économie et marge

- Construire un tableau mensuel de revenus MAZIGHO : abonnements, commissions, éventuelles prestations de création.
- Séparer les coûts pass-through des coûts plateforme : Stripe, domaine, expédition, fournisseur, e-mail et dépenses exceptionnelles.
- Mesurer spécifiquement le coût de l’IA par plan et adapter les quotas si les usages réels le rendent nécessaire.
- Réserver les prestations et plans avancés à des fonctionnalités dont le coût et le support sont connus.

### Axe 4 — Produit et confiance

- Ajouter les fonctionnalités à partir d’un besoin récurrent documenté : non à la multiplication de modules hypothétiques.
- Encadrer les analytics, relances et notifications par consentement, rétention définie et désinscription.
- Renforcer les parcours de support, retour, litige et transfert de boutique selon l’expérience pilote.
- Améliorer l’accessibilité, la vitesse et les contenus SEO à partir des boutiques réellement utilisées.

---

## 8. Risques à conserver visibles

| Risque | Réponse actuelle | Décision requise |
|---|---|---|
| Perte de données / indisponibilité | Scripts prêts mais aucune sauvegarde externe active. | Activer Lot 7 avant vente Stripe Live étendue. |
| Paiement mal réconcilié | Stripe Test préparé mais recette complète non achevée. | Finaliser les scénarios avant Live. |
| Responsabilité juridique confuse | Écrans et prévols existent, mais une revue professionnelle par marché reste nécessaire. | Valider vendeur, taxes, retours, COD et information client. |
| Dépassement de coût cloud | Vercel/TiDB/IA sont à l’usage. | Définir plafonds, alertes et suivi mensuel. |
| Automatisation prématurée | Les actions sensibles sont humaines par défaut. | N’automatiser que les flux testés, réversibles et explicitement autorisés. |
| Croissance sans support | Studio est préparé mais le support humain devient le goulot. | Ajouter des boutiques au rythme de l’opération réelle. |

---

## 9. Décisions de pilotage actées

1. **Aucun frais externe supplémentaire n’est engagé immédiatement.** Le Lot 7 reste préparé et verrouillé jusqu’à l’autorisation d’ouvrir réellement les ventes.
2. **Les lots 2 à 6 sont clôturés pour leur socle technique**, avec des validations humaines terrain à conserver.
3. **Le Lot 1 est livrable mais reste à valider par l’usage** de nouvelles boutiques, sans enrichissement spéculatif.
4. **Le Lot 7 est le prochain lot actif.** Il constitue le passage nécessaire avant la commercialisation à grande échelle.
5. **Le Lot 8 Stripe reste le dernier.** Aucun secret Live, paiement réel, domaine, e-mail d’activation ou publication commerciale générale ne doit être activé sans décision humaine explicite.
6. **La croissance doit financer sa résilience.** Les premiers revenus servent d’abord à couvrir les sauvegardes, alertes, base, stockage, support et contrôle, avant d’augmenter les automatisations.

---

## 10. Conclusion

MAZIGHO n’est plus une simple maquette de vitrine : c’est un socle SaaS e-commerce multi-boutique avec des parcours propriétaires, Studio, Algérie/COD, catalogue avancé, commandes, retours, marketing prudent, demandes sur mesure et assistant IA privé.

La priorité n’est donc pas de rajouter beaucoup de fonctionnalités. La priorité est de transformer ce socle publié en **première exploitation commerciale maîtrisée** : protéger les données, tester la restauration, surveiller réellement la production, valider les responsabilités vendeur et lancer Stripe sur une boutique pilote seulement.

> La bonne trajectoire est : **préparer → sécuriser → tester réellement → ouvrir une boutique pilote → mesurer → élargir progressivement**.

Cette méthode protège la réputation de MAZIGHO, limite les coûts prématurés et garantit que chaque abonnement ou service ajouté répond à un besoin concret.

---

## Sources et hypothèses de ce document

### Sources internes MAZIGHO

- [Feuille de route d’exécution](./FEUILLE_DE_ROUTE_MAZIGHO.md) — statut des lots, périmètres et décisions de pilotage.
- [Plan de sauvegarde, restauration et alerting](./INFRA_BACKUP_ALERTING.md) — architecture préparée, limites et prérequis d’activation.
- [Notes Stripe Connect Accounts v2](./STRIPE_ACCOUNTS_V2_MIGRATION_NOTES.md) — périmètre Test, limites et séparation Test/Live.
- Révision Git de référence `ea82f64` : dépôt propre, 81 fichiers de tests serveur recensés et statut GitHub du commit de référence `success` au 5 octobre 2026.

### Sources fournisseurs, consultées le 5 octobre 2026

- [Vercel Pricing](https://vercel.com/pricing) et [documentation de tarification Vercel](https://vercel.com/docs/pricing).
- [TiDB Cloud Starter Pricing Details](https://www.pingcap.com/tidb-cloud-starter-pricing-details/) et [documentation TiDB Cloud Backup & Restore](https://docs.pingcap.com/tidbcloud/backup-and-restore-serverless/).
- [Amazon S3 Pricing](https://aws.amazon.com/s3/pricing/) et [Amazon S3 Object Lock](https://aws.amazon.com/s3/features/object-lock/).
- [Stripe Suisse — tarifs](https://stripe.com/ch/pricing).
- [Brevo — tarifs](https://www.brevo.com/pricing/).
- [Frankfurter — taux USD/CHF](https://api.frankfurter.app/latest?from=USD&to=CHF), taux du 2 octobre 2026 utilisé uniquement pour les conversions illustratives.

### Hypothèses explicites

- Les enveloppes de coût sont des estimations d’exploitation hors TVA et hors frais métier externes ; elles ne constituent pas une offre fournisseur.
- Les frais Stripe sont illustrés avec des cartes suisses et ne préjugent pas de la tarification Connect finale, des cartes étrangères, de la conversion de devise ou des litiges.
- Aucun chiffre de revenu, de vente, de marge ou de capacité commerciale n’est inventé dans ce document.
- Ce document est une base de pilotage opérationnelle, pas un avis juridique, fiscal, comptable ou financier personnalisé.
