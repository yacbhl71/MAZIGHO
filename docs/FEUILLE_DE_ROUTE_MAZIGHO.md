# Feuille de route d’exécution — MAZIGHO

**Décision de pilotage :** la plateforme continue d’abord à gagner en qualité, en réutilisabilité et en autonomie propriétaire. **Stripe et l’ouverture commerciale publique à grande échelle restent volontairement le dernier lot.**

> Cette feuille de route sert de référence pour les prochains travaux. Chaque lot doit être terminé, contrôlé et publié avant de passer au suivant, sauf correction urgente d’un défaut bloquant.

## Principes non négociables

- Préserver l’isolation stricte par `storeId`, les accès propriétaires et l’impersonation Studio en lecture seule.
- Ne pas modifier une brique validée sans nécessité directe, test et contrôle de non-régression.
- Toute création de boutique reste privée ou en préparation tant qu’une ouverture explicite n’est pas décidée.
- Les offres officielles restent inchangées : **FREE 0 CHF + 2,5 %**, **BASIC 7,90 CHF + 1 %**, **PRO 12,90 CHF + 1 % + Dropshipping**. Lifetime reste une action manuelle Studio, hors landing publique.
- Studio peut attribuer exceptionnellement plan, commission et quotas par boutique, sans générer paiement, facture ou e-mail.
- Le marché Algérie ne s’affiche et ne s’active que lorsqu’il est configuré pour la boutique ; DZD, COD et wilayas restent séparés du parcours Stripe.
- Aucun paiement réel, domaine personnalisé, publication publique ou action irréversible n’est déclenché silencieusement.

## État de départ — octobre 2026

| Domaine | État | Décision |
|---|---|---|
| Multi-boutique, Studio, vitrines et panels propriétaires | Avancé et publié | Continuer par petits lots vérifiés |
| Fiches produit propriétaire | Enrichies : promotions, options, livraison, traductions, fournisseur | Stabiliser les retours terrain et corriger les défauts bloquants en priorité |
| Quotas, commissions et plans exceptionnels | Pilotables depuis Studio | Réserver les dérogations aux boutiques offertes / pilotes ou cas validés |
| Assistant IA et centre documentaire | Fonctionnalités publiées ; import documentaire PDF/DOCX/TXT/CSV corrigé | Validation manuelle progressive avant promesse commerciale forte |
| Stripe Connect | Parcours Test préparé, non finalisé | **Reporter à la fin de la feuille de route** |
| Backups, alerting et conformité | Configurations préparées, ressources réelles à activer | Traiter avant toute ouverture commerciale élargie |

---

## Lot 1 — Fabrique de boutiques et modèles réutilisables

**Objectif :** préparer une boutique professionnelle en quelques minutes, sans recopier manuellement les réglages à chaque fois.

### Avancement — première brique publiée

- Studio permet maintenant de sélectionner une **structure sûre** : Base libre / pilote, Atelier créatif, Mode & accessoires, Bijoux & cadeaux, Animalerie, Beauté & bien-être, Maison & décoration, ou Café, thé & saveurs.
- Le modèle dépose seulement le **thème suggéré** et des **catégories vides propres à la nouvelle boutique** ; il se combine avec la base Standard ou **Algérie** (DZD, wilayas et COD préparé).
- Aucun produit, image, fournisseur, client, commande, donnée légale, domaine, paiement, e-mail ou publication n’est copié ou activé.
- Le choix est enregistré sur le brouillon Studio et visible avant le prévol de création.
- Un **aperçu avant création** indique immédiatement la structure, le thème modifiable, la base géographique et les catégories qui seront préparées ; il rappelle explicitement ce qui ne sera jamais copié.

**Reste du lot :** valider les modèles avec les prochaines boutiques réellement demandées, puis ajouter menus ou blocs d’accueil composables seulement lorsqu’un besoin terrain précis le justifie.

### À construire

- Écran Studio **« Créer depuis un modèle »**.
- Modèles initiaux :
  1. **Créations & univers** — galerie, univers créatifs, demande sur mesure.
  2. **Mode, beauté & accessoires** — collections, tailles/couleurs, promotions.
  3. **Algérie — COD & wilayas** — DZD, livraison par wilaya, COD, pages adaptées.
  4. **Thé & infusions** — sous-menus, collections, vitrines ou commerce.
  5. **Boutique cadeau / pilote** — privée par défaut et paramétrable depuis Studio.
- Choix précis lors de la duplication : thème, menu, catégories, blocs d’accueil, réglages de marché et livraison, textes de base, configuration de commerce.
- Aperçu de ce qui sera copié avant validation.

### Ce qui ne doit jamais être copié sans action explicite

- Produits, images et fournisseurs réels.
- Commandes, paniers, clients, avis ou données personnelles.
- Coordonnées légales, domaine personnalisé, Stripe, e-mails ou clés externes.
- Publication publique et ouverture à la vente.

### Critère de fin

Une boutique de démonstration peut être créée depuis chaque modèle, reste totalement isolée et peut être complétée par son propriétaire sans réglage technique.

---

## Lot 2 — Commandes, livraison et après-vente opérationnels

**Objectif :** permettre à un propriétaire de traiter une vente du début à la fin sans revenir vers Studio.

### Avancement — briques publiées

- La file de commandes devient **tactile sur téléphone et tablette** : cartes lisibles, prochaine étape explicite, filtres de traitement et actions adaptées au statut réel.
- Le parcours conserve les mêmes protections par boutique : accepter/refuser, préparer, enregistrer un suivi, marquer livrée et, pour l’Algérie, confirmer l’encaissement COD uniquement après livraison.
- Les articles et l’**historique horodaté** restent accessibles par commande ; l’adresse et le bon de préparation nécessitent toujours une ouverture propriétaire séparée et tracée.
- La table détaillée reste disponible sur grand écran ; aucun transporteur, fournisseur, remboursement, e-mail ou paiement n’est ajouté automatiquement.
- Le centre **Retours & service après-vente** propose maintenant une file tactile priorisée : « À décider », « En retour », « Réceptionnés » et « Terminés », avec la prochaine action explicitée dans chaque dossier. Le tri reste local à la boutique et purement visuel : il ne modifie ni décision, ni remboursement, ni prestataire.
- L’audit du stock confirme que le réglage de seuil, la vue consolidée produits + variantes, les compteurs rupture / faible stock et les éditions par quantité existent déjà, avec une logique qui privilégie les variantes actives. Aucune duplication n’a été ajoutée.
- Le propriétaire peut désormais imprimer un **bordereau de remise** une fois la commande marquée manuellement « Expédiée ». La consultation est limitée au propriétaire, liée au `storeId` et auditée ; le document ne contient ni e-mail, ni prix, ni paiement, ni facture, et ne crée ni transporteur, ni notification, ni preuve de livraison.
- Le suivi manuel peut enregistrer, au moment de l’expédition, un **transporteur**, un numéro et un **lien HTTP(S)**. Le lien est seulement mémorisé puis ouvert sur action explicite ; MAZIGHO ne contacte ni API, ni transporteur, ni fournisseur. Les données restent attachées à la boutique concernée et le bordereau imprimé ne reprend jamais le lien.

### Contrôle de mise en service à conserver

- Sur tablette, vérifier humainement une commande de recette sans créer de paiement : accepter, préparer, saisir le suivi, marquer expédiée, imprimer le bordereau, marquer livrée et, en Algérie/COD, confirmer l’encaissement après remise réelle.
- Les actions groupées restent volontairement hors Lot 2 : elles ne seront évaluées que si une sélection explicite, une confirmation par lot et une séparation stricte des commandes non éligibles apportent un réel gain. Aucune décision, livraison ou remboursement ne deviendra silencieux.

### Critère de fin

**Clôture technique atteinte :** un scénario de commande non-Stripe et un scénario COD disposent de toutes les étapes manuelles nécessaires sur tablette, avec un historique clair dans la boutique concernée. La validation terrain humaine ci-dessus reste un contrôle de mise en service, sans nouveau développement ni action Stripe.

---

## Lot 3 — Marketing et fidélisation utiles

**Objectif :** aider chaque boutique à obtenir et convertir ses premières ventes, sans complexité excessive.

### Jalon publié — campagnes de vitrine propriétaire

- Le panneau **Marketing** propose désormais un centre de campagnes isolé par `storeId` : brouillon, période, emplacement, visuels, lien, compte à rebours et code promotionnel lié.
- La diffusion publique reste une décision humaine : une confirmation explicite est demandée à l’enregistrement ou à l’activation. L’arrêt est immédiat et réversible.
- La mesure affiche uniquement les **utilisations agrégées** et les **remises associées** au code de la campagne, sur sa période. Aucun visiteur, identifiant, clic, appareil, adresse ou paiement n’est suivi ou exposé.
- Un texte prêt à copier est fourni pour un partage manuel sur Instagram, Facebook ou WhatsApp. Aucune publication sur un réseau social, e-mail, pixel ou relance n’est envoyée par MAZIGHO.
- Les seuils de stock et alertes visuelles produits / variantes sont déjà couverts dans **Gestion du stock** ; les promotions propriétaire existantes couvrent dates, seuil, limite, première commande, catégories et produits précis.
- Les suggestions **« Vous aimerez aussi »** existent déjà sur chaque fiche produit : elles restent dans la même boutique et catégorie, excluent la fiche consultée, et ne proposent que des produits disponibles pour le pays de livraison sélectionné.

### Jalon publié — sélections duo/trio sans stock virtuel

- Le panneau **Marketing** permet au propriétaire de composer jusqu’à 12 sélections locales de 2 ou 3 **produits actifs de sa boutique**, avec un brouillon, un texte court et, facultativement, un code promotionnel existant à communiquer au client.
- Une activation demande une confirmation humaine explicite. La sélection est visible uniquement dans les fiches françaises concernées ; elle reste masquée dans les autres langues tant qu’un vrai workflow de traduction dédié n’est pas construit.
- Une sélection ne crée ni SKU, ni prix groupé, ni stock propre, ni réservation, ni paiement. Lorsque le client choisit **Ajouter la sélection**, seuls les produits réels, sans variante ni option à choisir, sont ajoutés séparément au panier ; les autres restent accessibles individuellement.
- Le checkout conserve donc sa réservation atomique par produit ou variante et sa validation des prix, stocks et livraisons. Un produit archivé ou absent empêche automatiquement la diffusion de la sélection.
- La persistance, la lecture publique et les journaux d’audit sont tous bornés au `storeId` résolu. Aucun produit, code, client, tarif ou stock d’une autre boutique ne peut être sélectionné ou révélé.

### Jalon publié — promotions précises et repères de vente

- Un code promotionnel peut désormais cibler jusqu’à **30 produits actifs** d’une même boutique. La liste est validée côté serveur avec le `storeId` résolu, stockée sans prix client et recalculée au checkout à partir des lignes réelles du panier ; elle ne modifie ni prix catalogue, ni stock, ni réservation.
- Le panneau **Marketing** affiche aussi des repères strictement agrégés : commandes localement marquées réglées, montant, panier moyen, rythme sur 30 jours et cinq produits les plus vendus. Les devises restent séparées.
- Cette lecture ne sélectionne ni nom, e-mail, adresse, instrument de paiement, compte bancaire ni versement. Elle n’ajoute aucun pixel, visite, panier abandonné, segment ni automatisation.
- Le tableau de conversion complet (visites, paniers et taux) reste volontairement hors de ce jalon : il exige un choix explicite de consentement, de rétention et de métriques avant toute collecte.

### À compléter par petites briques séparées

- Prix pack réellement fixe, stock groupé et annulation : uniquement après validation d’un modèle comptable, inventaire et remboursement dédié. Le jalon actuel ne prétend pas offrir ce mécanisme.
- Tableau de conversion complet : seulement après définition du consentement, de la rétention et des métriques agrégées nécessaires. Le jalon actuel ne prétend pas mesurer les visites ou paniers.
- Relances de paniers : seulement avec accord explicite, modèles éditables et procédure de désinscription ; aucune relance automatique n’est activée en attendant.

### À construire

- Alertes de retour en stock.
- Relances de paniers abandonnés par e-mail, avec accord et modèles éditables.
- Mesure de conversion complète : visites, paniers, taux, produits vus et vendus, uniquement après cadre de consentement et rétention.

### Critère de fin

Un propriétaire peut créer une campagne, un code ciblé ou une sélection duo/trio, suivre des repères de ventes confirmées, vérifier leur impact ou leur présentation et les arrêter sans affecter les autres boutiques.

**Statut : Lot 3 clôturé pour son socle marketing/fidélisation utile.** Les compléments listés ci-dessus restent autonomes et seront traités séparément, sans ouvrir Stripe ni automatiser une communication externe.

---

## Lot 4 — Expérience client et créations sur mesure

**Objectif :** rendre les vitrines plus rassurantes et adaptées aux boutiques créatives, cadeaux et artisanales.

### À construire

- **Suivi et historique client :** la page *Mes commandes* présente le statut, le suivi, le récapitulatif et les retours activables ; les favoris permettent de retrouver et remettre rapidement un article disponible au panier, sans commande automatique.
- **Avis et questions encadrés :** les avis sont soumis à modération dans la boutique concernée. Les questions restent guidées par les FAQ éditables et le contact de la boutique, plutôt qu’une discussion publique non contrôlée ou automatisée.
- **Guides de décision produit :** options/variantes, descriptions, caractéristiques, dimensions et profils de livraison avec délais par destination sont déjà éditables par fiche.
- **Jalon publié — demandes sur mesure :** chaque propriétaire peut activer ou désactiver son propre formulaire, puis choisir séparément si le raccourci est visible dans le menu public et lui donner un libellé adapté à son activité (par défaut **« Sur mesure »**, sans imposer « Dessin sur demande » aux autres boutiques). Le client connecté dépose une demande générale (personnalisation, produit, article, animal, maison, textile ou autre) ; il suit sa demande et la réponse manuelle de la boutique dans son espace. Le budget facultatif est désormais un montant chiffré, avec la devise de la boutique affichée à côté, et l’échéance est sélectionnée dans un calendrier ; ni devise libre ni formule vague ne sont conservées. La file propriétaire est tenant-scopée, ne révèle aucune donnée de contact client, ne reçoit aucun fichier, ne crée ni devis, ni commande, ni stock, ni paiement, ni e-mail automatique. Les catégories vides sont distinguées d’une vraie indisponibilité de livraison ; les boutiques servies dans un seul pays ne répètent pas inutilement ce pays dans le catalogue ni dans le bloc de produits vedettes de l’accueil.

### Critère de fin

Un client peut faire une demande sur mesure, le propriétaire peut la traiter dans sa boutique, et aucune donnée n’est exposée à une autre boutique.

**Statut : Lot 4 clôturé pour le socle d’expérience client et demandes sur mesure.** Les exemples de saisie sont volontairement neutres et réutilisables par toute activité ; chaque boutique décide ensuite manuellement de ce qu’elle accepte.

---

## Lot 5 — Pilotage commercial et relation client dans Studio

**Objectif :** permettre à MAZIGHO de gérer des dizaines puis centaines de boutiques de façon professionnelle.

### À renforcer

- Pipeline : **nouveau projet → à analyser → à préparer → prêt → remis au propriétaire**.
- Notes internes, checklist de remise, support et rappels ciblés.
- Suivi lisible des boutiques offertes, commissions offertes et quotas exceptionnels.
- Vue consolidée et filtrable : statut, modèle, marché, propriétaire, préparation, domaine et alertes.
- Modèles de devis, de contrat de création et de remise de boutique — préparés, jamais envoyés sans validation.
- Contrôle et réparation sécurisée d’accès propriétaire.

### Critère de fin

Le Studio permet de retrouver, filtrer et préparer une boutique sans parcourir une liste interminable ni mélanger les données clients.

**Jalon publié — pilotage opérationnel Studio :** la fiche Studio de chaque boutique cliente comporte désormais un **bureau de suivi** tactile avec le pipeline `nouveau projet → à analyser → à préparer → prêt → remis au propriétaire`, des notes internes chiffrées au repos, des rappels locaux manuels et une checklist de remise. Les modèles de devis, contrat de création et remise sont des textes prêts à copier puis à adapter : ils ne sont ni envoyés, ni signés, ni transformés en facture. Cette fiche reste strictement isolée par boutique ; elle n’affiche aucune donnée client, n’active ni domaine, ni paiement, ni publication et ne remplace pas les contrôles d’accès existants.

**Couverture consolidée :** le registre Studio déjà publié assure la recherche et les filtres sur les statuts, les offres, les modèles, les marchés, les signaux de préparation, les domaines et les alertes. Les dérogations de commissions et quotas, les boutiques offertes, le centre de tickets, le portefeuille de domaines, les intentions d’intégration et la réparation d’accès restent des modules séparés, à confirmation humaine lorsque l’action a une conséquence.

**Statut : Lot 5 clôturé pour le pilotage commercial et la relation client dans Studio.**

---

## Lot 6 — Validation qualité de l’Assistant IA

**Objectif :** faire de l’IA un vrai copilote fiable, sans surpromesse.

### À contrôler et améliorer

- Scénarios concrets : fiche produit, SEO, traduction, FAQ, image, URL et recherche interne.
- Centre documentaire privé : PDF, DOCX, TXT et CSV, citations et recherche isolée par boutique.
- Conversations, modèles Workspace, exports et partage lecture seule.
- Réponses affichées, copiables, téléchargeables et compréhensibles sur mobile/tablette.
- Recherche web explicite avec citations et validation humaine avant toute action.
- Mesure des quotas FREE / BASIC / PRO et messages clairs en cas de limite.

### Critère de fin

Chaque scénario clé fonctionne manuellement sur une boutique pilote avec une réponse visible, utile, sourcée lorsque nécessaire et sans publication automatique.

---

## Lot 7 — Résilience, exploitation et conformité

**Objectif :** sécuriser l’exploitation avant d’ouvrir largement les ventes.

### À activer réellement

- Snapshots base de données chiffrés, rétention de 30 jours et restauration testée.
- Versionnage / verrouillage du stockage média et contrôle des quotas.
- Alertes : 5xx, webhooks, CPU/RAM, DNS et échecs de sauvegarde.
- Canal d’incident et procédure de réaction courte.
- Revue juridique, fiscale et de protection des données pour chaque marché actif.
- Validation des mentions légales, retours, livraison, information prix/taxes et règles COD.

### Critère de fin

Une restauration isolée a été réussie, les alertes arrivent sur un canal réel et les obligations de marché sont validées avant une ouverture élargie.

---

## Lot 8 — Stripe et ouverture publique à grande échelle **(dernier)**

**Décision explicite :** aucun travail Stripe ne devient prioritaire avant la fin des lots précédents, sauf correction de sécurité urgente. La boutique peut continuer à être préparée, utilisée en vitrine ou vendue avec des moyens non-Stripe adaptés à son marché.

### À faire seulement au moment de l’ouverture

1. Finaliser une recette Stripe Connect Test complète sur boutique isolée : refus, abandon, paiement webhook sans redirection et remboursement.
2. Vérifier les responsabilités vendeur : chaque boutique reste vendeuse, porte remboursements et litiges ; MAZIGHO reçoit seulement la commission décidée, éventuellement 0 % pour une boutique offerte.
3. Ajouter les secrets Live dans Vercel et configurer les webhooks Live uniquement après validation finale.
4. Réaliser une revue humaine des écrans, e-mails transactionnels, retours, commissions et conditions de vente.
5. Activer progressivement, boutique par boutique — jamais toutes les boutiques d’un coup.
6. Ouvrir la communication commerciale publique seulement après une validation finale du propriétaire de MAZIGHO.

### Critère de fin

La première boutique commerciale est validée en conditions réelles avec une ouverture volontaire, traçable et réversible ; l’ouverture générale n’est envisagée qu’après cette preuve.

---

## Méthode de travail continue

1. Choisir **un seul lot actif**.
2. Auditer l’existant avant toute modification.
3. Construire par petites briques visibles et tactiles.
4. Tester la logique métier, le typage, le build et au moins le parcours visuel concerné.
5. Publier seulement lorsque le contrôle est positif.
6. Mettre à jour cette feuille de route avec le résultat et la prochaine priorité.

## Prochain lot actif

**Lot 2 — Commandes, livraison et après-vente opérationnels.**

La prochaine priorité est une **validation manuelle connectée**, sur tablette, d’une commande de recette et de son après-vente : décisions, préparation, suivi, livraison / COD puis retour. Aucun achat, paiement, e-mail, remboursement ou publication ne sera créé sans décision humaine explicite.
