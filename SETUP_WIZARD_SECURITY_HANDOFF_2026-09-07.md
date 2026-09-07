# Setup Wizard — règles de sécurité et reprise

## Portée publiée

La page **Admin → Démarrage sécurisé** permet à un administrateur déjà authentifié de finaliser les éléments non sensibles d’une instance MAZIGHO : nom de boutique, e-mail de support et checklist d’ouverture. Elle réutilise les réglages existants `site_name`, `contact_email` et l’état non sensible `setup_wizard_status`.

## Règle absolue sur les secrets

> Les clés Stripe, jetons Odoo, identifiants TiDB, clés de webhook et sessions fournisseur ne doivent jamais être saisis, conservés, affichés ou renvoyés par le Setup Wizard ou la table `settings`.

Ils doivent être fournis pendant le déploiement de chaque instance et stockés exclusivement dans le coffre de secrets de l’hébergeur. La page de démarrage indique cette frontière sans révéler la présence, la valeur ou le nom précis d’un secret.

## Accès

La page est placée sous `/admin/demarrage` et utilise `DashboardLayout`; elle est donc réservée aux utilisateurs ayant le rôle `admin`. Aucun parcours public de premier démarrage n’a été ajouté, afin qu’une instance déployée sans propriétaire ne puisse pas être revendiquée par un visiteur anonyme.

## Évolution nécessaire pour une offre multi-tenant

Une version SaaS devra ajouter un coffre de secrets par locataire, du chiffrement avec clés gérées par l’hébergeur, des journaux d’accès, une réauthentification avant action sensible et un mécanisme de propriété d’instance au déploiement. Cette évolution doit être conçue et auditée séparément.
