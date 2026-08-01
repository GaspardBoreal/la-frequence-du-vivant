## Constat (vérifié sur le PDF fourni)

Pages 3 et 4 : les vignettes affichent l'icône « image cassée ». Les `src` sont bien présents, mais les images ne se chargent pas à l'impression. Deux causes identifiées dans le code :

1. **`crossOrigin="anonymous"`** est posé sur les `<img>` des planches (`ChantierPrintLayout.tsx`). Les photos iNaturalist sont servies depuis un bucket S3 qui ne renvoie pas systématiquement d'en-tête CORS → le navigateur refuse l'image alors qu'elle s'afficherait sans cet attribut. À l'écran (Herbier) l'`<img>` n'a pas `crossOrigin`, d'où la photo visible dans le Scénographe mais cassée à l'impression.
2. **La source des photos est un appel iNaturalist live côté navigateur** (`useInatThumbs`), sensible au rate-limit, au fuzzy-match et aux URLs `square/medium` variables. Le projet dispose déjà d'une infrastructure fiable et inutilisée ici : table `species_thumb_cache` + RPC `get_species_thumbs` + edge `resolve-species-thumb` (cascade iNat exact → iNat fuzzy → GBIF), exposée par `useSpeciesThumbs`.
3. La relance d'image de `usePrintCombined` ajoute un paramètre `_r=` de cache-busting, ce qui peut invalider certaines URLs signées/CDN — à ne pas appliquer aux domaines externes.

## Correction

**1. Source unique et robuste des photos**
- Dans `ScenographeFullscreen.tsx`, remplacer `useInatThumbs` par `useSpeciesThumbs` (cache serveur) pour toutes les entrées d'herbier, avec repli sur la photo terrain déjà connue (observation marcheur) puis sur le cache.
- Ordre de priorité par espèce : photo terrain locale → `species_thumb_cache.photo_url` (iNat/GBIF/manuel) → glyphe de strate dessiné (pas d'image cassée possible).

**2. Résolution garantie avant impression**
- Dans `ChantierPrintDialog.tsx`, ajouter une étape « Recherche des photographies d'espèces » avant le lancement du rendu : appel de l'edge `resolve-species-thumb` sur tous les noms scientifiques du dossier (plantings + en place + proposées, par lots de 50), attente de la réponse, relecture du cache, puis passage à la phase existante de préchargement `usePrintCombined`. Barre de progression réutilisée (`PrintPreparationOverlay`).

**3. Chargement d'image fiable à l'impression**
- Retirer `crossOrigin="anonymous"` des `<img>` du dossier (aucun canvas n'est utilisé, l'attribut n'apporte rien et casse le chargement).
- `printImageUrl` ne transforme que les URLs Supabase ; pour les URLs externes, ne pas appliquer le cache-buster `_r=` dans `usePrintCombined` (repli : recharger l'URL d'origine telle quelle).
- Repli visuel propre : si aucune photo après résolution, vignette « herbier » (fond teinté strate + glyphe + mention discrète « photo non disponible ») au lieu d'un cadre vide.

**4. Design des planches 3 et 4**
- Vignettes agrandies : grille 3 colonnes (au lieu de 4), image en 34 mm de haut, cadrage `object-cover`, filet crème et coin arrondi conservés.
- Bandeau bas de vignette enrichi : nom français en gras, *nom scientifique* en sérif italique, puce de strate, envergure adulte, nombre d'observations (planche « en place ») ou n° du plan (planche « apports retenus ») pour relier la photo au plan et au tableau.
- Mention d'attribution en pied de planche : « Photographies : iNaturalist / GBIF — usage documentaire », avec la source réelle par vignette en micro-texte.
- Pagination ajustée à 9 vignettes par page (au lieu de 12) pour respecter la hauteur A4.

## Détails techniques

- Fichiers touchés : `src/components/propriete/scenographe/print/ChantierPrintLayout.tsx`, `src/components/propriete/scenographe/print/ChantierPrintDialog.tsx`, `src/components/propriete/scenographe/ScenographeFullscreen.tsx`, `src/components/propriete/print/usePrintCombined.ts` (garde cache-buster), et retrait du même `crossOrigin` parasite dans `PortraitPrintLayout.tsx` / `FloraAtlasPrintPlates.tsx` qui souffrent du même défaut.
- Aucune nouvelle table ni nouvelle edge function : réutilisation de `species_thumb_cache`, `get_species_thumbs`, `resolve-species-thumb`.
- Vérification finale : régénération du dossier et contrôle visuel des pages 3 et 4 (conversion en images) avant de conclure.

## Hors périmètre

Pas de téléversement de photos d'espèces par l'utilisateur depuis le dossier, pas de moteur PDF serveur.
