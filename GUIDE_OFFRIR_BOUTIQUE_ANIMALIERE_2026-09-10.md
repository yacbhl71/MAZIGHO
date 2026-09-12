# Guide pratique — offrir et mettre en service une boutique animalière

**Document opérateur MAZIGHO Studio**
**Périmètre :** boutique offerte, univers animalier, sans abonnement ni paiement automatique.

> Ce guide décrit le parcours complet, de la préparation jusqu’à l’ouverture publique. Les actions importantes sont volontairement séparées : créer la boutique, préparer le propriétaire et ouvrir au public ne sont jamais une seule action automatique.

## 1. Ce que MAZIGHO Studio sait faire aujourd’hui

MAZIGHO Studio permet de préparer une boutique, de la créer en état sécurisé `setup`, de préparer le propriétaire et, une fois toutes les vérifications complètes, de la passer volontairement en état `active`.

| Étape | État de la boutique | Visible publiquement | Paiement ou abonnement |
|---|---|---:|---:|
| Brouillon Studio | Aucune boutique créée | Non | Non |
| Boutique offerte créée | `setup` | Non | Non |
| Propriétaire préparé | `setup` | Non | Non |
| Boutique activée | `active` | Oui, si le domaine est correctement raccordé | Non |

Une boutique offerte ne crée ni abonnement, ni licence payante, ni facture, ni prélèvement. Elle est simplement créée comme une boutique cliente indépendante dans votre plateforme.

## 2. Préparer les informations avant de commencer

Avant d’ouvrir MAZIGHO Studio, préparez les informations suivantes. Il est préférable d’utiliser un vrai nom de boutique et un vrai domaine : une boutique créée est une donnée réelle de votre plateforme, même tant qu’elle reste fermée au public.

| Information | Exemple | Pourquoi elle est nécessaire |
|---|---|---|
| Nom de marque | `Pattes & Compagnie` | Sert au brouillon, au slug et à la confirmation finale. |
| Domaine souhaité | `pattescompagnie.ch` | Identifie la future boutique. Il doit être contrôlé avant l’ouverture. |
| Nom du bénéficiaire | Nom réel du futur propriétaire | Sert à la préparation de son accès. |
| E-mail du bénéficiaire | Son e-mail réel | Sert à rattacher un compte existant ou préparer une invitation manuelle. |
| Univers | **Animalier** | C’est l’univers retenu pour votre première boutique offerte. |
| Devise de départ | CHF, EUR, USD ou GBP | Définit le réglage de boutique initial. |
| Notes | Particularités de marque, produits ou pays | Restent visibles uniquement dans la préparation Studio. |

## 3. Créer le brouillon dans MAZIGHO Studio

Connectez-vous avec votre compte opérateur puis ouvrez **`/admin/studio`**. Dans le bloc **« Préparer une future boutique »**, renseignez les informations de la future marque et choisissez **Animalier** comme univers.

Cochez la case de compréhension, puis enregistrez le brouillon. Cette première action ne crée pas encore de boutique, ne réserve aucun domaine et n’envoie aucun e-mail.

Après l’enregistrement, le brouillon apparaît dans la file de préparation. Vous pouvez le relire et corriger ses informations avant toute création réelle.

## 4. Lire la revue de préparation et le prévol cadeau

Pour le brouillon créé, consultez d’abord la **revue locale** puis le **prévol de boutique offerte**.

La revue locale vérifie notamment le nom, le domaine, le propriétaire, l’univers et la devise. Le prévol signale les collisions internes éventuelles avec un slug ou un domaine déjà utilisés par votre plateforme.

> Le prévol ne réserve pas le domaine et ne vérifie pas Internet. Il signale seulement que les informations sont cohérentes à l’intérieur de MAZIGHO Studio.

Corrigez tout élément signalé avant de poursuivre. Une fois la revue locale cohérente, la création de la boutique offerte devient disponible.

## 5. Créer la boutique offerte en état `setup`

Dans le prévol, utilisez **« Créer la boutique offerte en préparation »**. Studio vous demandera de recopier exactement le nom de la boutique et de confirmer que vous comprenez le résultat.

À cette étape, MAZIGHO Studio crée une vraie boutique locale avec le statut **`setup`**. Son domaine et son slug sont enregistrés, mais elle reste fermée au public.

| Ce qui est créé | Ce qui ne se produit pas |
|---|---|
| Boutique indépendante en état `setup` | Aucun storefront public accessible |
| Réglages initiaux de devise | Aucun paiement, licence ou abonnement |
| Lien avec le brouillon Studio | Aucun e-mail ni invitation expédiée |
| Trace opérateur d’audit | Aucun produit, commande ou action fournisseur |

Ne créez pas deux fois la même boutique : le brouillon est protégé contre un second provisionnement.

### Visualiser la boutique avant le domaine public

Dès qu’une boutique offerte est en état `setup`, ouvrez le bloc **« Aperçu privé des boutiques offertes »** dans **`/admin/studio`**, puis cliquez sur **« Ouvrir l’aperçu »**. Cette vue permet de vérifier l’identité visuelle, les catégories et les fiches de démonstration réellement enregistrées pour la boutique.

> L’aperçu est réservé à l’opérateur Studio. Il ne passe pas par le domaine de la boutique et n’active rien : aucun visiteur ne peut y accéder, aucun panier ou paiement n’est affiché, et le statut reste `setup`.

## 6. Préparer le propriétaire de la boutique

La nouvelle boutique apparaît dans le bloc **« Préparer l’accès, sans l’envoyer »**. Sélectionnez-la afin de consulter le bénéficiaire prévu.

Deux situations sont possibles.

| Situation du bénéficiaire | Résultat après confirmation |
|---|---|
| Il possède déjà un compte actif sur la plateforme | Il devient propriétaire de cette boutique. Aucun e-mail n’est envoyé. |
| Il ne possède pas encore de compte | Studio crée un compte local en attente, lui attribue le rôle propriétaire et prépare un lien d’invitation manuel valable 24 heures. |

Pour déclencher cette préparation, recopiez l’e-mail du bénéficiaire, cochez la confirmation, puis cliquez sur **« Préparer le lien »**. Si un lien est généré, copiez-le immédiatement et transmettez-le vous-même au bénéficiaire par le canal que vous choisissez.

Le lien n’est jamais envoyé automatiquement. Si vous le perdez ou le fermez avant de le copier, cliquez sur **« Régénérer le lien manuel »**. L’ancien lien sera invalidé et un nouveau lien de 24 heures sera créé après une nouvelle confirmation de l’e-mail.

## 7. Ce que doit faire le bénéficiaire

Le bénéficiaire utilise le lien manuel pour finaliser son compte. Une fois son accès confirmé, il doit compléter sa boutique depuis son panneau d’administration : identité visuelle, informations légales, catalogue, catégories et réglages adaptés à son activité.

Pour une boutique animalière, demandez-lui de vérifier que les contenus correspondent réellement à son univers. Les catégories et produits doivent être pertinents pour les animaux ; la simple présence d’un produit actif ne remplace pas cette vérification éditoriale.

| Élément à compléter | Exigence avant ouverture |
|---|---|
| Identité de marque | Nom et profil visuel propres à la boutique, distincts de MAZIGHO |
| Informations légales | Société ou identité commerciale et e-mail de support renseignés |
| Catalogue | Au moins une catégorie et un produit actif, cohérents avec l’univers animalier |
| Devise | Devise de boutique enregistrée |
| Propriétaire | Compte activé et rôle propriétaire effectif |

## 8. Raccorder et vérifier le domaine

Cette étape reste manuelle. Elle n’est pas automatisée par Studio afin d’éviter de déclarer un domaine actif alors qu’il ne l’est pas réellement.

Configurez le domaine chez son registrar et dans Vercel selon votre procédure de domaine habituelle. Attendez que le DNS soit propagé, puis vérifiez vous-même que le domaine ouvre bien la bonne boutique et que les pages attendues sont accessibles.

Ne passez pas à l’activation si le domaine est encore provisoire, utilise `.local` ou `.test`, ou ne résout pas correctement. La revue d’activation accepte seulement un format de domaine public, mais elle ne peut pas vérifier la propagation DNS à votre place.

## 9. Lire la revue finale d’activation

Dans MAZIGHO Studio, ouvrez le bloc **« Activation publique contrôlée — Revue finale, univers animalier »** et sélectionnez la boutique créée.

La revue affiche trois types de résultats :

| Couleur / état | Signification | Action à faire |
|---|---|---|
| Vert | Critère local validé | Aucune correction nécessaire pour ce critère. |
| Rouge | Critère bloquant | Corriger l’identité, le propriétaire, le catalogue ou le domaine avant de continuer. |
| Ambre | Vérification manuelle | Confirmer vous-même le domaine et l’ouverture voulue. |

Le bouton **« Ouvrir la confirmation d’activation »** apparaît uniquement quand tous les critères locaux sont verts. Les éléments ambres demeurent intentionnellement manuels : le raccordement réel du domaine et votre décision finale d’ouverture.

## 10. Activer la boutique publiquement

> Cette étape rend la boutique éligible à l’exposition publique. Ne l’utilisez que lorsque le domaine, le propriétaire, la marque et le catalogue sont réellement prêts.

Dans la fenêtre de confirmation, vous devrez :

1. recopier exactement le **nom de la boutique** ;
2. recopier l’**e-mail du propriétaire actif** ;
3. cocher la confirmation que le domaine, son DNS, son rattachement Vercel et son accès ont été vérifiés ;
4. cocher la confirmation d’ouverture publique ;
5. cliquer sur **« Activer la boutique »**.

La plateforme relit tous les critères dans une transaction avant de changer le statut. Si l’un des éléments a changé entre la revue et le clic, l’activation est refusée et la boutique reste en `setup`.

Lorsqu’elle réussit, seule la valeur de statut passe de **`setup`** à **`active`**, avec une trace d’activation non sensible. L’action ne crée toujours aucun paiement, abonnement, facture, e-mail, produit, commande, synchronisation Odoo ou opération fournisseur.

## 11. Contrôles juste après ouverture

Après l’activation, effectuez une vérification simple et prudente depuis le domaine réel de la boutique.

| Contrôle après ouverture | Résultat attendu |
|---|---|
| Page d’accueil | Bonne identité de marque et contenus de la boutique animalière |
| Navigation | Catégories et liens propres à cette boutique |
| Fiche produit | Produit, prix, images et variantes cohérents |
| Panier | Ajout possible seulement pour un produit actif et disponible |
| Panneau du propriétaire | Accès limité à sa boutique, sans visibilité sur MAZIGHO Studio |
| MAZIGHO Studio | La boutique apparaît comme active dans votre parc opérateur |

Pour la première vérification, ne déclenchez pas de commande fournisseur et ne changez pas Stripe vers le mode réel. La boutique reste dans les garde-fous existants : Stripe Test, CJ sandbox et validations humaines.

## 12. Dépannage rapide

| Situation | Cause la plus probable | Action recommandée |
|---|---|---|
| Le bouton de création n’apparaît pas | Brouillon local incomplet ou collision interne | Revoir les critères du brouillon et du prévol. |
| La boutique n’apparaît pas pour le propriétaire | Son compte n’est pas activé ou l’invitation n’a pas été préparée | Préparer ou régénérer le lien manuel depuis Studio. |
| La revue d’activation est rouge | Profil, légal, propriétaire, catalogue ou domaine incomplet | Corriger le critère indiqué, puis actualiser la revue. |
| Le bouton d’activation n’apparaît pas | Un blocage local demeure | Ne pas contourner la règle : corriger le prévol. |
| L’activation est refusée après confirmation | Le nom, l’e-mail propriétaire ou les critères ont changé | Vérifier les valeurs, le propriétaire actif et le domaine, puis recommencer. |
| Le domaine ne sert pas la boutique après activation | DNS ou rattachement Vercel incomplet | Corriger le domaine avant toute autre action commerciale. |

## 13. Règles de sécurité à conserver

Ne partagez jamais un lien d’invitation dans un espace public. Transmettez-le uniquement au bénéficiaire vérifié et régénérez-le si vous avez le moindre doute. Ne mettez aucune clé Stripe, Odoo, TiDB, CJ ou autre secret dans les formulaires Studio ou dans les brouillons de boutique.

La création d’une boutique offerte, l’accès propriétaire et l’ouverture publique sont volontairement séparés. Cette séparation protège votre plateforme contre les erreurs de domaine, les mauvais destinataires et les ouvertures accidentelles.

---

**Résumé :** préparez → créez en `setup` → préparez le propriétaire → configurez marque, légal et catalogue → vérifiez le domaine → lisez le prévol → confirmez l’activation → testez l’ouverture.


---

### Note pour les prochains univers bijoux et vêtements

Le parcours de brouillon puis de création en `setup` est identique pour une boutique bijoux ou vêtements. Une fois la boutique réellement créée, MAZIGHO Studio peut proposer un **kit de démonstration** correspondant à son univers. Il installe seulement une identité, trois catégories et une fiche non commerciale, après recopie du nom et confirmation explicite.

Le kit ne peut être installé qu’une fois afin de ne pas écraser une personnalisation ultérieure. Comme pour la boutique animalière, il ne crée pas de domaine public, paiement, fournisseur, livraison, e-mail, commande ni activation. L’aperçu privé Studio permet ensuite de visualiser cette boutique tant qu’elle demeure en `setup`.


### Suivre la préparation sans ouvrir la boutique

Dans **`/admin/studio`**, le bloc **« Suivi privé de préparation »** permet de sélectionner une boutique offerte encore en `setup` et de voir l’état de ses bases : univers, identité, catalogue, devise, accès propriétaire et informations légales. Le bloc ne montre aucune coordonnée ni donnée commerciale ; il indique simplement ce qui est prêt, à compléter ou à vérifier.

Cette lecture aide à organiser plusieurs boutiques de démonstration, par exemple animalier, bijoux et vêtements. Elle ne contrôle pas le domaine ou le DNS, ne remplace pas le prévol final d’activation et ne rend jamais une boutique publique.


### Visualiser le futur panneau du propriétaire

Après avoir sélectionné une boutique dans le **« Suivi privé de préparation »**, choisissez **« Voir le panneau propriétaire »**. Cette vue, réservée à l’opérateur Studio, montre l’organisation cible du panneau quotidien de cette boutique : pilotage, catalogue, identité, commandes et réglages de boutique.

Elle sert uniquement à vérifier la séparation des rôles. Le futur propriétaire ne verra pas MAZIGHO Studio, les autres boutiques, les secrets ou les réglages de plateforme. À ce stade, cette page reste une **simulation en lecture seule** : elle ne crée pas d’accès, ne change aucun rôle, n’envoie pas d’invitation et ne rend pas la boutique publique.


### Remplacer le domaine interne avant l’ouverture

Lorsqu’un vrai domaine public est prêt dans Vercel, ouvrez la revue de préparation de la boutique dans Studio et utilisez **« Remplacer le domaine interne »**. Saisissez le nouveau domaine, recopiez le nom de la boutique et cochez la confirmation. Cette étape remplace uniquement l’adresse interne `.local` enregistrée au moment de la création.

Avant de valider ce remplacement, attendez que Vercel reconnaisse le domaine et que le certificat HTTPS soit prêt. Le changement de domaine ne rend pas le site public : la boutique reste en `setup`, sans panier ou paiement, jusqu’à la confirmation d’activation distincte.


### Consulter les jalons de préparation

Dans **MAZIGHO Studio**, sélectionnez la boutique dans **« Suivi privé de préparation »**, puis consultez **« Historique privé de préparation »**. Cette vue affiche seulement les jalons Studio utiles — création, préparation de l’accès propriétaire, kit de démonstration, profil légal et domaine — avec leur date.

Elle ne révèle aucun e-mail, acteur, détail juridique, client, commande, paiement, fournisseur ou métadonnée. Elle est informative uniquement : elle ne vérifie pas automatiquement le DNS, ne modifie aucun état et ne permet pas d’ouvrir une boutique.


### Domaine préparé, boutique encore fermée

Après le rattachement d’un domaine public à une boutique qui est toujours en `setup`, le domaine ne doit pas afficher la boutique MAZIGHO ni son administration. Il affiche uniquement une page neutre indiquant que la boutique est en préparation. Le catalogue, le panier, le paiement, les routes d’administration et les pixels marketing restent fermés.

Ce comportement est volontaire et constitue un garde-fou : le domaine peut être techniquement prêt dans Vercel avant que l’opérateur décide séparément d’ouvrir la boutique. L’activation publique reste l’unique étape qui peut rendre le storefront accessible.


### Reprendre ou annuler un brouillon

Dans **MAZIGHO Studio**, chaque brouillon non provisionné possède désormais trois actions : **Modifier le brouillon**, **Supprimer le brouillon** et **Prévol de boutique offerte**. La modification réouvre le formulaire avec les valeurs enregistrées. La suppression demande de recopier le nom de la future boutique et ne supprime que la fiche de préparation.

Si vous sélectionnez **Autre univers**, renseignez obligatoirement une thématique ou niche précise — par exemple « décoration artisanale » ou « accessoires de voyage ». Sans cette information, le brouillon est enregistré ou modifiable mais son prévol reste à compléter et aucune boutique réelle ne peut être créée.

### Préparer l’identité et la structure dans l’atelier privé

Depuis le **panneau propriétaire — simulation** d’une boutique offerte encore en `setup`, choisissez **Créer et personnaliser**. L’atelier permet de préparer le nom de marque, un message, l’univers ou niche, le modèle de présentation, les pages souhaitées, la palette et la typographie. Cliquez sur **Enregistrer la préparation privée** lorsque les choix vous conviennent, puis consultez l’**aperçu storefront** pour vérifier le rendu.

Cette étape ne publie pas le site, ne modifie pas le domaine, ne donne pas d’accès au propriétaire et ne rend pas le panier ou le paiement disponibles. Ces décisions restent séparées et sont toujours contrôlées depuis MAZIGHO Studio.

### Rédiger les pages en brouillon

Dans l’atelier **Créer et personnaliser**, choisissez **Préparer les pages**. Sélectionnez une page, ajustez les trois blocs de texte, cochez ou décochez leur visibilité, puis enregistrez le brouillon. L’aperçu à droite sert uniquement à relire la page avant toute mise en ligne.

Les pages **À propos**, **Questions fréquentes**, **Nous contacter** et **Inspiration** restent privées. Cette étape ne publie aucun contenu, n’ajoute pas de média ou de lien, ne modifie pas le domaine et ne rend pas les fonctions de vente disponibles.

### Ajouter une image de couverture privée

Dans l’éditeur de pages, utilisez **Choisir une image** pour ajouter une couverture à la page sélectionnée. Les formats acceptés sont JPEG, PNG et WebP, dans une limite de 5 Mo. L’image apparaît d’abord dans l’aperçu privé ; cliquez ensuite sur **Enregistrer le brouillon** pour conserver ce choix dans la boutique.

Cette image n’est pas publiée sur le domaine de la boutique tant que celle-ci reste en `setup`. Évitez donc d’y déposer une image qui ne pourrait pas être rendue publique plus tard, et utilisez **Retirer** pour supprimer sa référence du brouillon avant l’ouverture.

### Utiliser la checklist de préparation

Depuis le **panneau propriétaire — simulation**, ouvrez **Suivi de préparation**. Cette page indique les étapes déjà sauvegardées — identité, pages, médias, catalogue et domaine — puis propose un lien vers l’atelier correspondant. Elle est utile pour reprendre la préparation sans chercher dans les différents écrans Studio.

La checklist ne met rien en ligne. Sa dernière carte rappelle que l’ouverture publique, le contrôle DNS, le certificat, le panier et le paiement restent des décisions distinctes à confirmer ultérieurement.

### Organiser le menu privé

Dans le créateur de boutique, choisissez **Organiser le menu**. Vous pouvez renommer les entrées de page, masquer celles qui ne doivent pas apparaître et changer l’ordre des pages. La page **Accueil** reste toujours présente afin que le futur menu conserve un point de départ clair.

Le menu n’accepte pas de lien externe et reste visible uniquement dans son aperçu privé Studio. Il ne change pas la navigation publique, le domaine, le panier ou le paiement tant que la boutique reste en `setup`.

### Vérifier le rendu complet avant ouverture

Après avoir préparé les pages, les images et le menu, cliquez sur **Voir l’aperçu complet** depuis l’atelier de navigation. Cette maquette rassemble l’accueil, le menu et les pages éditoriales comme les verraient de futurs visiteurs, mais reste strictement dans MAZIGHO Studio.

Les entrées du menu de cette maquette ne changent que la page affichée à l’intérieur de l’aperçu. Elles ne rendent aucune page publique et ne modifient ni le domaine, ni le statut de la boutique, ni le panier ou le paiement.

### Comparer les modèles d’accueil

Dans le créateur, choisissez l’un des modèles proposés puis enregistrez la préparation : **Boutique directe** pour guider rapidement vers les pages, **Histoire de marque** pour privilégier le message et les valeurs, ou **Catalogue essentiel** pour une lecture plus structurée autour des collections. Ouvrez ensuite **Voir l’aperçu complet** pour comparer la composition.

Ce choix change uniquement la maquette privée et reste réversible. Il ne publie pas l’accueil, ne modifie pas le domaine et n’active aucune vente.

### Utiliser le centre de lancement guidé

Depuis le panneau propriétaire simulé, ouvrez **Centre de lancement**. Les six étapes présentent les actions à effectuer dans l’ordre et proposent un lien direct vers le bon atelier Studio. Les états proviennent des préparations réellement enregistrées, et non d’une simple liste à cocher.

La dernière étape, **Décider de l’ouverture publique**, reste volontairement sans bouton d’activation. Utilisez la revue Studio d’activation séparée uniquement lorsque tous les contrôles manuels, notamment le DNS et le certificat, ont été confirmés.


### Préparer les collections de présentation

Depuis **Créer et personnaliser**, choisissez **Préparer les collections**. Ajoutez, renommez, réorganisez ou retirez les collections que vous souhaitez présenter, puis ajoutez une courte accroche et indiquez celles à mettre à la une. L’aperçu à droite permet de vérifier la structure avant toute ouverture.

Les collections enregistrées ici sont un brouillon éditorial privé : elles ne créent aucune catégorie réelle, aucun produit, prix, stock, fournisseur, panier ou lien public. Les futurs ateliers Produits, Prix, Stock, Fournisseurs et Panier les reprendront comme étapes distinctes, avec leurs contrôles propres.


---

## Préparer des fiches produits sans rendre la boutique vendable

Depuis le créateur, ouvrez **Collections**, puis **Fiches produits**. Cette étape permet de rédiger une sélection de travail : nom, description courte, collection de présentation, prix de travail et mise en avant. Enregistrez les brouillons lorsque la sélection vous convient.

Ces fiches sont visibles uniquement dans Studio. Elles ne créent pas encore de produit public, stock, SKU, variante, fournisseur, livraison, panier, paiement, commande ou synchronisation externe. Les ateliers stock, fournisseur et panier restent des étapes distinctes de la feuille de route.

## Reprendre un brouillon sans se bloquer sur tablette

Dans **Brouillons enregistrés**, la règle est la suivante :

| État de la ligne | Action à utiliser |
|---|---|
| Brouillon non créé | Appuyez sur **Reprendre et modifier**. Le formulaire remonte automatiquement ; modifiez les champs, cochez la confirmation et enregistrez. |
| Brouillon à abandonner | Appuyez sur **Supprimer le brouillon**, recopiez son nom, puis confirmez. |
| Brouillon prêt à contrôler | Appuyez sur **Vérifier avant création**. Ce prévol ne crée rien. |
| Boutique déjà créée en `setup` | Appuyez sur **Continuer la préparation**. N’essayez plus de modifier ou supprimer l’ancien brouillon : il est désormais l’historique de cette vraie boutique. |

Les boutons de reprise, suppression et vérification ont une hauteur tactile accrue. Une vraie boutique `setup` reste privée et non vendable tant qu’une ouverture publique distincte n’est pas confirmée.


## Préparer stock et fournisseur sans déclencher d’action externe

Après avoir enregistré les **Fiches produits**, cliquez sur **Stock et fournisseur**. Pour chaque fiche, choisissez un état de préparation — à confirmer, disponible, stock limité ou indisponible — puis, si nécessaire, indiquez une quantité de travail, un nom de fournisseur de référence et un code interne. Enregistrez ensuite la préparation.

Ces informations servent uniquement à préparer un futur test privé de panier. Elles ne mettent à jour aucun stock réel, n’envoient aucune demande à un fournisseur et n’acceptent ni URL, contact, prix d’achat, accès API, transport, variante, commande ou synchronisation CJ, AliExpress ou Odoo. Tant que la boutique reste en `setup`, aucune de ces données n’est exposée publiquement.


### Simulation privée de panier

Après avoir préparé des **Fiches produits**, puis renseigné leur disponibilité dans **Stock et fournisseur**, ouvrez **Tester le panier privé**. Ajoutez ou retirez des unités pour vérifier les quantités admises et le total de présentation.

Cette page est uniquement une maquette Studio : elle ne crée pas de panier persistant, client, paiement, commande, facture ni action fournisseur. Les produits sans disponibilité préparée ou marqués indisponibles ne peuvent pas être retenus. Les frais de livraison, taxes et remises ne sont volontairement pas calculés à ce stade.


### Revue commerciale privée

Depuis la page **Tester le panier privé**, choisissez **Revoir la préparation commerciale**. Cette page indique ce qui est prêt, ce qui manque et les étapes qui devront être revues manuellement avant toute publication. Elle reste disponible uniquement dans MAZIGHO Studio pour une boutique offerte en `setup`.

Même lorsqu’elle indique que les brouillons sont prêts pour une revue, elle ne publie aucun produit, n’ouvre ni storefront ni panier réel, et n’active pas la boutique. La future publication de catalogue et l’ouverture publique restent deux décisions séparées, après contrôle des visuels, variantes, règles de livraison, stock et éléments commerciaux nécessaires.


### Vérification d’étanchéité

Depuis **Revoir la préparation commerciale**, cliquez sur **Vérifier l’étanchéité**. L’écran rappelle que la boutique en `setup` ne sert pas de storefront public et que panier, checkout et publication catalogue restent indisponibles. Il propose ensuite les contrôles manuels à faire dans une session privée ; il ne teste pas le domaine automatiquement et ne change ni statut ni contenu.


### Revue manuelle de passage commercial

Après la vérification d’étanchéité, cliquez sur **Préparer la revue de passage**. La page distingue ce qui est préparé de ce qui doit être confirmé manuellement : visuels, variantes, livraison, stock, retours, éléments légaux et domaine. Son résultat ne publie aucun catalogue, n’ouvre aucun panier ou paiement et n’active jamais la boutique.


### Publier le catalogue après visualisation

Depuis **Revue manuelle de passage commercial**, choisissez **Visualiser la publication contrôlée**. Vérifiez les catégories et les fiches affichées. Pour créer réellement le catalogue, cochez les trois confirmations et recopiez exactement le nom de la boutique. La publication ne peut pas remplacer un catalogue déjà existant ; elle crée uniquement les champs présents dans les brouillons et signale donc explicitement l’absence éventuelle d’images ou de variantes.

Après publication, la boutique reste en `setup` et demeure fermée au public. Le second bloc **Ouvrir la boutique** lance le prévol d’activation déjà existant. Son bouton ne devient disponible qu’après validation des contrôles, de la vérification manuelle du domaine, de l’e-mail du propriétaire actif, de la recopie du nom et de la confirmation finale. Ces deux actions sont indépendantes.


### Conserver et compléter le catalogue animalier

Lorsque la publication contrôlée indique qu’un catalogue réel existe déjà, choisissez **Compléter le catalogue existant**. Vous pouvez modifier les catégories et la fiche de démonstration, ou ajouter de nouvelles fiches ; aucune suppression n’est proposée dans ce parcours. Les enregistrements restent non publics tant que la boutique est en `setup`.


### Ajouter images et variantes

Dans chaque fiche du catalogue existant, ajoutez jusqu’à huit images par URL ou par téléversement JPEG, PNG ou WebP ; la première image est la principale et son ordre est ajustable. Ajoutez ensuite des variantes client telles que **Couleur** ou **Taille**, avec leurs valeurs séparées par des virgules. Ces modifications restent privées tant que Pattes & Compagnie est en `setup`.
