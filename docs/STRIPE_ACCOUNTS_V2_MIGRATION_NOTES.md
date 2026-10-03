# Migration Stripe Connect — Accounts v2

**Date :** 3 octobre 2026  
**Périmètre :** création de comptes Connect de test MAZIGHO uniquement. Aucun secret n’est consigné dans ce document.

## Déclencheur

Stripe refuse désormais la création de nouveaux comptes via `POST /v1/accounts` pour ce compte plateforme et recommande `POST /v2/core/accounts`. La création v1 existante reste bloquée par une politique Stripe de compatibilité.

## Références officielles consultées

- [Connect et Accounts v2](https://docs.stripe.com/connect/accounts-v2) — les comptes v2 utilisent une configuration `merchant` pour accepter les paiements ; leurs identifiants peuvent encore être utilisés avec les endpoints v1 compatibles.
- [Créer un compte Accounts v2](https://docs.stripe.com/api/v2/core/accounts/create) — endpoint `POST /v2/core/accounts`, avec version d’API v2 explicite, `configuration.merchant.capabilities.card_payments.requested` et récupération des champs de configuration/requirements nécessaires.
- [Migration depuis Accounts v1](https://docs.stripe.com/connect/accounts-v2/migrate-integration) — confirme la compatibilité transitoire : un compte créé en v2 peut être référencé par des endpoints v1 tels que les liens d’onboarding et les flux de paiement existants.

## Décision technique

1. Créer les nouveaux comptes Connect avec Accounts v2, uniquement côté serveur.
2. Conserver les liens d’onboarding et les paiements directs existants, compatibles avec l’identifiant `acct_…` retourné par Accounts v2.
3. Conserver le stockage minimal existant : identifiant opaque, état d’onboarding et capacités ; aucune donnée bancaire ni identité n’est persistée par MAZIGHO.
4. Préserver les séparations Test/Live : aucune variable Live ni route Live ne sera activée ou modifiée.
5. Tester la construction de requête, les retours de statut et le maintien des garde-fous Stripe avant publication.
