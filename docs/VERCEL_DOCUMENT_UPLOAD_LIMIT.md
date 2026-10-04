# Import documentaire privé — limite de transport Vercel

**Décision :** les documents importés dans le Centre documentaire privé sont limités à **3 Mio bruts** (PDF, DOCX, TXT ou CSV).

## Pourquoi

L’API tRPC transmet actuellement le document en `data:` URL base64. Vercel limite la charge d’une Function à **4,5 MB** pour le corps de requête ou de réponse. L’encodage base64 augmente la taille d’un fichier d’environ un tiers ; un fichier annoncé à 5 Mio pouvait donc dépasser la limite de transport avant même d’atteindre le parseur.

La limite de 3 Mio produit environ 4 Mio de données base64, ce qui laisse une marge pour l’enveloppe tRPC et les métadonnées.

> Les documents restent traités en mémoire, leur texte est chiffré avant persistance, et aucun fichier source n’est rendu public.

## Référence officielle

- Vercel, [Vercel Functions Limits — Request body size](https://vercel.com/docs/functions/limitations), consulté le 4 octobre 2026 : charge maximale de **4,5 MB**.

## Évolution future

Pour accepter des sources supérieures à 3 Mio, mettre en œuvre un téléversement client direct vers un stockage privé, puis transmettre seulement une référence sécurisée à l’API. Ne pas remonter la limite de l’API base64 seule.
