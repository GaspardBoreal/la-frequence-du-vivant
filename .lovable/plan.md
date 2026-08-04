# Atlas du cortège : que toutes les photos s'impriment, à chaque fois

Sur la planche imprimée, seules les vignettes portant le badge « Terrain » affichent une image. Toutes les espèces dont la photo vient de la base de référence (Camérisier, Prunellier, Ronce, Chèvrefeuille, Clématite, Chêne vert) restent vides.

## Cause confirmée

Deux problèmes cumulés :

1. **Blocage réseau.** Lors du dernier passage, les images de l'atlas ont reçu l'attribut `crossOrigin="anonymous"`. Les photos de référence (iNaturalist / GBIF) ne renvoient pas les en-têtes qui autorisent ce mode : le navigateur refuse donc l'image et la vignette bascule sur le fond vide. Les photos de terrain, hébergées chez nous, ne sont pas concernées — d'où le fait que seules les vignettes « Terrain » s'affichent. Les autres planches d'impression (Chantier, Portrait) n'ont volontairement jamais mis cet attribut.
2. **Repli invisible.** Quand l'image échoue, le pictogramme de famille est bien rendu mais reste quasi invisible sur le fond crème : la case paraît vide plutôt que « photo indisponible ».

Vérification faite en base : les 6 espèces manquantes ont toutes une photo valide en cache (`species_thumb_cache`, source iNaturalist, aucune en échec). Ce n'est donc pas un problème de données.

## Ce qui change

- Les photos de référence se chargent de nouveau : suppression de l'attribut bloquant, alignement sur la politique déjà utilisée par les autres impressions (`referrerPolicy="no-referrer"`).
- Fiabilité renforcée : si une photo de référence tombe malgré tout, la vignette essaie la photo suivante disponible pour la même espèce (terrain, puis cache) avant de renoncer.
- Repli lisible : le pictogramme de famille devient nettement visible, accompagné d'une mention discrète « photo indisponible ». Plus jamais de case vide sans explication.
- Attente avant impression : la préparation du PDF attend que les images de l'atlas soient réellement chargées (ou en échec) avant d'ouvrir la fenêtre d'impression, pour éviter les planches partiellement vides selon la vitesse du réseau.

## Détails techniques

- `src/components/propriete/identify/print/FloraAtlasPrintPlates.tsx`
  - retirer `crossOrigin="anonymous"` sur `<img>`, ajouter `referrerPolicy="no-referrer"` ;
  - `photoOf` renvoie une **liste ordonnée** de candidats (terrain exact → genre → vernaculaire → `useSpeciesThumbs`) ; le composant `Vignette` avance dans cette liste à chaque `onError` et n'affiche le picto qu'après épuisement ;
  - le badge « Terrain » reste conditionné à la source réellement affichée ;
  - `flora-atlas-photo-fallback` : picto agrandi et contrasté + libellé « photo indisponible ».
- `src/index.css` : styles du repli (contraste, libellé 4,5 pt) — aucun changement de grille ni de gabarit, la planche 20 vignettes reste identique.
- Aucune modification de données ni de RPC.
