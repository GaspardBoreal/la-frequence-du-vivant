# Herbier du moment — une espèce, plusieurs instants

## Expérience proposée
- Dans la ligne de chaque espèce, conserver la photo principale, mais rendre visible le nombre de **photos d’observation disponibles** à côté du nombre d’observations. Ne jamais déduire « 3 photos » de « 3 points » : une observation peut ne pas avoir de photo.
- Au clic sur l’espèce, déployer un petit **carnet chronologique** : une vignette par observation photographiée, classée de la plus récente à la plus ancienne, avec sa date et sa provenance. Les observations sans photo restent accessibles dans la chronologie, signalées sobrement « Sans photo », avec leur action « Situer sur le plan ».
- Un clic sur une vignette ouvre la photo en grand, avec navigation précédente/suivante limitée aux photos de **cette espèce**. Afficher « photo 1/3 » et la date de chaque observation pour rendre lisibles les changements au fil des saisons ; laisser la photo de référence iNaturalist clairement distincte des clichés du lieu.
- Garder le survol qui révèle les points sur la carte, et permettre depuis chaque observation de situer son point précis. Sur téléphone, les vignettes doivent défiler horizontalement sans élargir le tiroir. Si une seule photo existe, le carnet reste simple ; si aucune n’existe, ne pas afficher une galerie artificielle.

## Détails techniques
- S’appuyer sur les observations déjà filtrées et regroupées par nom scientifique dans `useVivantSpeciesRoster`, en conservant leur date, leur identifiant, leur source et leur photo propres. La vignette de référence ou une photo terrain agrégée au niveau de l’espèce ne doit jamais être présentée comme le cliché d’une observation précise.
- Faire évoluer la présentation dépliée de `HerbierDuMomentDrawer` et le passage de contexte depuis `PaletteStudio` vers `RevealPhotoLightbox` : la navigation ouverte depuis l’herbier reçoit uniquement les observations photographiées de l’espèce choisie ; une ouverture depuis la carte conserve son comportement actuel.
- Vérifier le cas « wei » sur le jardin visible : trois observations, nombre réel de photos, navigation, dates et sources correctes ; vérifier aussi une espèce sans photo, les filtres, le mobile et la fermeture de la visionneuse sans fermer l’Atelier.
