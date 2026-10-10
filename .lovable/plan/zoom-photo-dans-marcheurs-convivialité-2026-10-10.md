# Zoom photo dans Marcheurs → Convivialité

## Diagnostic (confirmé)

La photo ouverte depuis Marcheurs → Convivialité passe par une visionneuse distincte, propre à la mosaïque de Convivialité. Ce n'est pas la visionneuse corrigée la dernière fois (Contributions). Celle de Convivialité affiche une simple image ajustée à l'écran : elle n'a ni zoom à la molette, ni boutons −/+. C'est pourquoi la correction précédente n'a rien changé ici.

## Ce qui change pour vous

Quand vous cliquez sur une photo de Convivialité :
- la molette zoome sous le pointeur, progressivement (pas d'à-coups) ;
- pincement à deux doigts sur téléphone et tablette, double-clic ou double-tap pour agrandir la zone visée ;
- la photo agrandie se déplace à la souris ou au doigt ;
- une petite barre discrète en bas à droite de la photo : −, niveau en %, +, Ajuster (retour immédiat à la taille d'origine) ;
- passer à la photo suivante ou précédente la remet automatiquement à sa taille d'origine ;
- un clic sur la photo ne ferme plus la visionneuse ; la croix, Échap et un clic sur le fond noir la ferment toujours ;
- les flèches précédent/suivant, le nom de l'auteur, la date et la réattribution restent à leur place.

Le Diaporama reste inchangé (défilement automatique, pas de zoom).

## Vérification

Test réel dans le navigateur sur cette visionneuse : molette sous le pointeur, + puis Ajuster revient à 100 %, changement de photo remis à 100 %, page derrière qui ne défile pas.

## Détails techniques

- Extraire `ZoomablePhoto` et `PhotoZoomToolbar` de `src/components/community/contributions/MediaLightbox.tsx` vers un composant partagé `src/components/media/ZoomablePhoto.tsx` (react-zoom-pan-pinch, écouteur wheel natif non passif en capture, `safeZoomSrc` / `computeSafeMaxScale`), puis le réimporter dans `MediaLightbox`.
- Dans `ConvivialiteMosaic.tsx`, remplacer le `motion.img` de la visionneuse par un conteneur `max-w-[92vw] h-[85vh]` contenant `<ZoomablePhoto key={photo.id} />` (remise à zéro par `key`), avec `stopPropagation` sur le conteneur pour éviter la fermeture au clic.
- Ignorer les flèches clavier gauche/droite pendant qu'une photo est agrandie (le déplacement prime), comme dans `MediaLightbox`.
- Repérer les autres visionneuses plein écran encore sans zoom (ex. `insights/curation/MediaLightbox`, `roadmap/MediaLightbox`) et les lister pour un passage ultérieur sur le même composant partagé, sans les modifier maintenant.
