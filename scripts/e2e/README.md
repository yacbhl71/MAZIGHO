# Tests Stripe Connect — cas limites MAZIGHO

Script : `stripe_checkout_edge_cases.py`. **Ne lance jamais de paiement Live.** Il refuse d’agir si `storefront.getPaymentAvailability` ne renvoie pas explicitement `enabled: true` et `mode: stripe_connect_test`. Il teste une boutique à la fois (par défaut `https://www.mazigho.ch`, hôte canonique après redirection de `mazigho.ch`) et exige un compte client dédié, trois produits de test *distincts*, achetables, chacun avec au moins deux unités de stock. Chaque scénario utilise un contexte navigateur propre, mais le même compte client peut être réutilisé.

## Préparation

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
export MAZIGHO_E2E_BASE_URL=https://www.mazigho.ch
export MAZIGHO_E2E_EMAIL='compte-client-de-test@example.invalid'
export MAZIGHO_E2E_PASSWORD='...'
export MAZIGHO_E2E_PRODUCT_DECLINE_URL='https://www.mazigho.ch/produit/ID1'
export MAZIGHO_E2E_PRODUCT_ABANDON_URL='https://www.mazigho.ch/produit/ID2'
export MAZIGHO_E2E_PRODUCT_WEBHOOK_URL='https://www.mazigho.ch/produit/ID3'
python3 scripts/e2e/stripe_checkout_edge_cases.py --scenario all
```

Ne placez jamais les identifiants dans Git, les journaux ou le chat. Le compte doit être **un client**, pas un administrateur redirigé vers son panneau. La boutique doit servir les trois produits et la destination de livraison par défaut doit être configurée, avec informations légales complètes et Stripe Connect **Test** opérationnel. Le test des webhooks exige la livraison des événements signés `checkout.session.completed` sur le compte connecté. Pour reproduire un échec, la carte Stripe officielle **fonds insuffisants** est `4000 0000 0000 9995`, expiration future `12/30`, CVC `931` ; `4000 0056 2003` fourni dans la demande ne contient que 12 chiffres et ne peut pas servir de carte de test valide. Le paiement réussi utilise `4242 4242 4242 4242` en environnement Test uniquement. [Cartes officielles Stripe](https://docs.stripe.com/testing).

**État de la production au moment de la création du script :** `https://mazigho.ch/api/trpc/storefront.getPaymentAvailability` indiquait `enabled:false`, `mode:stripe_connect_test`, `reason:platform_test_mode_disabled`. Le script ne peut donc pas terminer un run réel sur ce domaine aujourd’hui et **n’active pas** lui-même ce verrou. Il est prêt à être lancé sur un environnement Test explicitement autorisé.

## Assertions et durée

| Cas | Vérification |
| --- | --- |
| Carte refusée | Message d’erreur Stripe visible ; article conservé dans `boutique_premium_cart` ; **commande technique `pending/unpaid`** (pas `paid`) ; réservation de stock temporaire. MAZIGHO crée intentionnellement la commande avant d’ouvrir Stripe : l’assertion « aucune commande ajoutée » demandée serait fausse pour le code actuel. |
| Fermeture brute | Ferme l’onglet sur Stripe ; rouvre `/panier` avec le même contexte ; attend `checkout.session.expired` et la commande `cancelled/unpaid` puis vérifie la **libération** du stock. Ce n’est pas une libération immédiate : session ~31 min, récupération de secours après ~33 min ; attendre jusqu’à 40 min. |
| Coupure de redirection | Bloque explicitement toute navigation `/commandes?stripe_session_id=...` (le client ne peut donc pas appeler `getSessionStatus` et « réparer » la commande), puis ferme l’onglet ; interroge **uniquement** `shop.orders.getMyOrders` et charge `/commandes` sans paramètre ; exige `processing/paid` et « En préparation ». |

Le script compare les commandes avec un état de référence par compte et scénario, et ne conserve pas de numéro de carte ni de mot de passe dans un fichier. Si le webhook prend plus de 90 secondes, il échoue ; il ne prétend pas avoir prouvé la confirmation. Les captures d’échec sont **facultatives** (`--screenshot-dir`), peuvent contenir des données sensibles et doivent être conservées localement hors Git. Les commandes techniques créées pendant les tests restent dans l’historique (annulées ou payées en Test) ; utiliser des produits dédiés, jamais des commandes de vrais clients.

Tests ciblés : `--scenario decline`, `--scenario abandon` ou `--scenario webhook`. Un échec non résolu d’un scénario arrête la suite. L’exécution complète prend au moins le temps d’expiration du scénario d’abandon ; ne pas raccourcir `--expiry-timeout` si l’on veut vérifier l’absence de blocage durable du stock. L’examen du stock via `products.getById` suppose un produit isolé du trafic concurrent et une quantité de un. Une évolution des champs hébergés par Stripe peut exiger d’adapter les sélecteurs du script : aucun iframe n’est contourné, Playwright inspecte ses frames normalement.
