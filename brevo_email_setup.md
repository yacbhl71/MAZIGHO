# E-mails transactionnels Brevo — MAZIGHO

MAZIGHO utilise Brevo pour deux usages clairement séparés. Les messages transactionnels couvrent les invitations créées explicitement par un administrateur et les demandes de réinitialisation de mot de passe. L’administration peut également créer un **brouillon de campagne marketing** dans Brevo à partir d’une liste sélectionnée. Aucun e-mail commercial, SMS, scénario automatisé ou pixel n’est envoyé automatiquement depuis MAZIGHO : la revue finale, le lien de désinscription et l’envoi restent dans Brevo.

## Variables sécurisées du déploiement

Ajoutez les valeurs suivantes dans les variables d’environnement sécurisées de Vercel, pour les environnements **Production**, **Preview** et **Development** si ces environnements doivent envoyer des e-mails. Ne placez jamais ces valeurs dans Git, dans un fichier `.env` versionné ou dans une interface de boutique.

| Variable | Valeur attendue |
| --- | --- |
| `BREVO_API_KEY` | Clé API transactionnelle Brevo, commençant généralement par `xkeysib-`. |
| `BREVO_SENDER_EMAIL` | Adresse expéditrice déjà vérifiée dans Brevo, par exemple `securite@notifications.mazigho.ch`. |
| `BREVO_SENDER_NAME` | Nom affiché de l’expéditeur, par exemple `MAZIGHO Sécurité`. |
| `MAZIGHO_PUBLIC_URL` | `https://www.mazigho.ch`, pour créer les liens d’activation et de réinitialisation publics. |

Le code accepte provisoirement `MAZIGHO_EMAIL_FROM` comme compatibilité avec une ancienne configuration, au format `MAZIGHO <securite@notifications.mazigho.ch>`. Pour une nouvelle installation, utilisez les variables Brevo explicites ci-dessus.

## Vérification prudente

Dans Brevo, l’adresse ou le domaine expéditeur doit être validé avant tout envoi. Après le prochain déploiement, testez d’abord la réinitialisation de mot de passe avec une adresse que vous contrôlez. Vérifiez ensuite les indésirables et le journal **Transactional** de Brevo. Une invitation est toujours préparée dans l’administration, puis envoyée uniquement après un clic explicite sur **Envoyer par e-mail** ; ce clic produit un nouveau lien et invalide tout lien antérieur.

Pour une campagne commerciale, créez d’abord une liste Brevo dédiée aux personnes ayant expressément consenti à recevoir vos offres. Dans **E-mails & campagnes > Campagnes Brevo**, la sélection de liste et le bouton disponible dans MAZIGHO créent seulement un brouillon Brevo. Ouvrez ensuite Brevo pour contrôler les destinataires, la désinscription et l’apparence, puis choisissez vous-même si et quand l’envoyer.

## Garde-fous

Les liens d’invitation et de réinitialisation sont personnels, à usage unique et expirent. En cas de refus Brevo — notamment si l’expéditeur n’est pas vérifié — MAZIGHO affiche un échec et ne prétend jamais que l’e-mail a été envoyé. Les contacts transactionnels ne doivent pas être assimilés à des abonnés marketing : les campagnes doivent utiliser des listes Brevo avec consentement commercial traçable.

## Références

Brevo requiert une clé API, un expéditeur autorisé, et un corps `sender`, `to`, `subject`, `htmlContent` ou `textContent` pour son endpoint transactionnel.[1]

[1]: https://developers.brevo.com/docs/send-a-transactional-email "Brevo — Send a transactional email"
