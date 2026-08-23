# Activation e-mail transactionnel MAZIGHO

## Exigences Resend vérifiées

Resend exige un domaine possédé et vérifié avant l’envoi d’e-mails transactionnels. Sa documentation recommande l’utilisation d’un sous-domaine dédié afin de séparer la réputation d’envoi des messages transactionnels du domaine principal. Pour MAZIGHO, le choix recommandé est `notifications.mazigho.ch`, avec une adresse d’expédition telle que `MAZIGHO <securite@notifications.mazigho.ch>`.[1] [2]

Après avoir ajouté le sous-domaine dans Resend, les enregistrements DNS exacts fournis dans l’onglet **Records** doivent être recopiés chez Swizzonic. Resend indique qu’il peut s’agir notamment d’enregistrements TXT, MX, SPF et DKIM, qui doivent correspondre exactement aux valeurs générées par le tableau de bord. La vérification se produit souvent sous quinze minutes, mais une propagation peut prendre jusqu’à soixante-douze heures.[2]

Le code MAZIGHO attend les variables de production suivantes, à ajouter uniquement dans les variables sécurisées de Vercel, jamais dans le dépôt ou le chat : `RESEND_API_KEY`, `MAZIGHO_EMAIL_FROM` et, facultativement, `MAZIGHO_PUBLIC_URL=https://www.mazigho.ch`. Le fournisseur doit renvoyer un identifiant de livraison ; en cas d’échec, l’application doit signaler l’erreur sans prétendre qu’un e-mail a été envoyé.[3]

## Sources

[1]: https://resend.com/docs/dashboard/domains/introduction "Resend — Verified Domains"
[2]: https://resend.com/docs/add-a-domain "Resend — Add and verify a domain"
[3]: https://resend.com/docs/send-with-nodejs "Resend — Send emails with Node.js"

## État de publication associé

Le 23 août 2026, le domaine officiel a été vérifié après publication : la route `/admin` affiche le titre de navigateur `MAZIGHO Admin | Tableau de bord` après chargement de l’application. Le titre HTML de repli est `MAZIGHO | Boutique en ligne`.

## Blocage Swizzonic — 23 août 2026

La tentative d’ajout du TXT DKIM `resend._domainkey.notifications.mazigho.ch` dans l’éditeur DNS Swizzonic a retourné l’erreur générique allemande « Ein unbekannter Fehler ist aufgetreten ». Une vérification DNS publique a confirmé que le record n’avait pas été créé. Un ticket Swizzonic a été soumis avec une autorisation strictement limitée à la zone DNS et une demande explicite de ne pas accéder aux boîtes e-mail ni aux autres services. Attendre leur réponse avant de modifier de nouveau les enregistrements Resend.
