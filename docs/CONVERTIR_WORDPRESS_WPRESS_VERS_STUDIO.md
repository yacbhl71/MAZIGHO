# Convertir une sauvegarde WordPress `.wpress` vers MAZIGHO Studio

> **État : expérimentation privée, hors ligne et réservée à MAZIGHO Studio.**
>
> Le convertisseur produit une archive d’aperçu. Il ne restaure jamais WordPress, n’exécute pas PHP ou SQL, ne contacte aucun service externe et n’importe rien directement dans une boutique.

## Objectif

Le script [`../scripts/wordpress_wpress_to_mazigho.py`](../scripts/wordpress_wpress_to_mazigho.py) lit une sauvegarde créée par **All-in-One WP Migration** (`.wpress`, ou un ZIP contenant exactement un `.wpress`) et la transforme vers le format **MAZIGHO Import Archive** déjà lu par **Studio → Importer une boutique**.

Il est destiné à une migration préparée par le propriétaire de la sauvegarde. L’import effectif reste une action Studio séparée : sélection de la boutique cible, contrôle de l’aperçu et confirmation des droits.

## Données prises en charge

| Origine WordPress | Donnée extraite | Traitement MAZIGHO |
|---|---|---|
| WooCommerce | Produits WordPress publiés (`product`) | Fiches catalogue brouillon : nom, descriptions, prix, stock et mise à la une lorsque la donnée est lisible |
| SureCart | Produits WordPress publiés (`sc_product`) | Même cible catalogue ; prix minimal, stock disponible et mise à la une lorsque présents |
| WordPress Media | Image explicitement reliée par miniature, galerie ou parent produit | Copiée dans `images/` uniquement si la liaison est vérifiable |
| Options WordPress | Devise explicite à trois lettres | Information portée dans le manifeste ; **jamais de conversion de prix** |

Les descriptions HTML deviennent du texte simple. Les catégories métier propres à WooCommerce/SureCart ne sont pas déduites de façon risquée dans cette première version : les fiches reçoivent la catégorie provisoire **« Catalogue WordPress »**, modifiable dans Studio.

> Si les médias ne sont pas formellement reliés aux produits dans le dump, le script les **écarte**. Il ne sélectionne jamais des images au hasard dans les centaines de fichiers `uploads/`.

## Données volontairement exclues

Le convertisseur ne copie pas :

- comptes WordPress, mots de passe, rôles, profils, e-mails ou adresses ;
- clients, commandes, paniers, abonnements, remboursements, avis et coupons ;
- paiements, tokens, clés API, webhooks, domaines ou réglages de messagerie ;
- extensions, thèmes, PHP, CSS ou configuration WordPress ;
- pages éditoriales, logo, couleurs et polices.

## Utilisation

```bash
python3 scripts/wordpress_wpress_to_mazigho.py \
  /chemin/vers/sauvegarde.zip \
  /chemin/vers/wordpress-mazigho-import.zip
```

Si la devise source est connue de façon certaine, elle peut être déclarée sans conversion :

```bash
python3 scripts/wordpress_wpress_to_mazigho.py \
  /chemin/vers/sauvegarde.wpress \
  /chemin/vers/wordpress-mazigho-import.zip \
  --currency EUR
```

Le ZIP de sortie contient :

```text
wordpress-mazigho-import.zip
├── manifest.json
├── catalogue.csv
├── images/                         # seulement les images produit liées et vérifiées
└── marque/
    └── wordpress-conversion-report.json
```

Le champ `rightsConfirmed` du manifeste est toujours défini à `false` : le script ne présume jamais la propriété des contenus.

## Limites de sûreté

- source `.wpress` ou ZIP externe : **2 Gio** maximum ;
- analyse : **30 000 entrées** et **1 Gio** de contenu déclaré maximum ;
- `database.sql` : **64 Mio** maximum ;
- sortie compatible avec l’atelier Studio : **100 fiches** et **40 images** maximum ;
- image : **5 Mio** maximum ;
- chemins absolus, `..`, `.` et antislashs : refusés ;
- fichier de sortie existant : refusé pour éviter tout écrasement.

## Essai contrôlé

1. Créer ou sélectionner une **boutique de test** dans Studio.
2. Exécuter le script en local/sandbox ; conserver la sauvegarde d’origine intacte.
3. Ouvrir **Studio → Importer une boutique** et charger le ZIP créé.
4. Vérifier le nombre de produits, les prix et la devise déclarée ; aucune conversion n’est automatique.
5. Examiner les images, si elles sont présentes, puis compléter les catégories et le contenu nécessaire.
6. Sélectionner explicitement la boutique cible et confirmer les droits avant l’application.
7. Vérifier le catalogue et l’aperçu privé ; la publication reste un parcours distinct.

## Validation technique

Le script n’emploie que la bibliothèque standard Python. Ses tests sont exécutables ainsi :

```bash
python3 scripts/test_wordpress_wpress_to_mazigho.py
```

Ils vérifient notamment la conversion SureCart/WooCommerce, l’absence de données privées dans l’archive produite, le refus de chemins traversants et l’absence d’écrasement de sortie.
