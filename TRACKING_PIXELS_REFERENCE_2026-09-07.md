# Références — pixels Meta et TikTok

**Consultées le :** 7 septembre 2026

| Service | Référence officielle | Point retenu |
|---|---|---|
| Meta Pixel | https://developers.facebook.com/documentation/meta-pixel/get-started | Le code de base utilise l’identifiant de Pixel, charge `https://connect.facebook.net/en_US/fbevents.js`, puis déclenche `PageView`. Meta signale que le pixel s’appuie sur des cookies et que des obligations de conformité, notamment RGPD selon la zone d’activité, peuvent s’appliquer. |
| TikTok Pixel | https://ads.tiktok.com/help/article/how-to-create-and-access-tiktok-pixel-id | Le Pixel TikTok est créé dans TikTok Ads Manager via la source Web et un paramétrage manuel. L’identifiant du Pixel est ensuite utilisé lors de l’installation du code de base. |

## Décision d’implémentation

MAZIGHO ne charge aucun script Meta ou TikTok tant que le visiteur n’a pas donné un consentement marketing explicite. Les identifiants de pixels sont configurables dans l’administration, validés côté serveur et rendus disponibles au navigateur uniquement après ce choix. Aucun événement commercial avancé, aucune API de conversion serveur, aucune campagne et aucune audience ne sont configurés par cette version.
