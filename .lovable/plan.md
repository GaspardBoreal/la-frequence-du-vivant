## Diagnostic (vérifié dans le code)

Trois défauts cumulés expliquent la réponse de la copie 1.

**1. Le périmètre de l'ouvrage n'est jamais utilisé — l'IA ne voit qu'un disque autour du centroïde.**
Dans `useProprieteChatProviders.ts` (l. 61-71), le scope se calcule ainsi :
```ts
const focusCenter = geometryCenter(focusObjet.geometry);
wps.filter((w) => distanceM(focusCenter, [w.lat, w.lng]) <= focus.radiusM);
```
Le polygone dessiné (copie 2) est très allongé. Un disque de 25 m posé sur son centre **coupe les deux extrémités du massif** (les Thyms, l'Achillée, l'Hysope… situés en bout de bande) tout en **ratissant largement hors du massif** (d'où les 144 espèces / 194 observations : Lézard des murailles, Belle-Dame, Escargot petit-gris…). Le tracé « Massif couvert » n'entre à aucun moment dans le filtrage.

**2. « Espèces retenues » est un champ structurellement toujours vide.**
`buildOuvrageSoilDossier()` (`src/lib/soilLinkEngine.ts` l. 300-351) reçoit `selectedSpecies = []` par défaut, et **aucun appelant ne le renseigne** (`useProprieteChatProviders.ts` ne passe que `objet` et `samples`). Aucune UI ne permet aujourd'hui d'attacher des espèces à un ouvrage. Le modèle lit donc `especesRetenues: []` et conclut, à juste titre selon ses données, « aucune espèce n'est encore enregistrée ».

**3. Le résumé du vivant est tronqué au top 15 par nombre d'observations.**
`vivant.resume` n'envoie que `top: speciesRows.slice(0, 15)`. Une plante vue 1 fois dans le massif (Verveine citronnelle, Pivoine de Chine) **ne peut pas apparaître**, même si le scope était correct. Et `vivant.liste` (200 lignes) n'est pas auto-activée au cadrage.

## Correction proposée

### A. Périmètre géométrique réel — « dedans / lisière / voisinage »
- Nouveau module `src/lib/ouvrageScope.ts` réutilisant les primitives éprouvées de `src/lib/geofence.ts` (`buildGeofence`, `isInsideGeofence`, `distanceToGeofenceM`, ray casting + distance au bord).
- Classement de chaque observation par rapport à la géométrie de l'ouvrage :
  - **dedans** — point dans le polygone (ou ≤ 2 m d'une ligne / d'un point) ;
  - **lisière** — hors polygone mais à ≤ 3 m du bord (marge d'imprécision GPS) ;
  - **voisinage** — hors polygone mais dans le rayon d'écoute, **mesuré à partir du bord**, plus du centroïde.
- Pour un point/une ligne (sans surface), on garde le disque, mais autour du tracé.

### B. Un contexte dédié « Espèces dans l'ouvrage »
- Nouveau provider `ouvrage.especes`, auto-activé au cadrage (ajouté à `FOCUS_AUTO_CONTEXT_IDS`), payload structuré :
  ```
  { ouvrage, surfaceM2, rayonEcouteM,
    dedans: [ {n, c, k, obs, vu} … liste COMPLÈTE, non tronquée ],
    lisiere: [ … ],
    voisinage: { especes: N, observations: N, top: [15] } }
  ```
  La liste « dedans » n'est jamais tronquée (un massif contient au plus quelques dizaines d'espèces) — c'est précisément la donnée que le modèle doit pouvoir énumérer intégralement. Le voisinage reste résumé, pour la frugalité.
- `vivant.resume` reprend la même partition (dedans / voisinage) quand un ouvrage est cadré, au lieu d'un unique compte de disque.

### C. Lever l'ambiguïté « retenues » vs « observées »
- Renommer le champ du dossier en `especesRetenuesPalette` avec une note explicite (`"palette de plantation choisie par le propriétaire — vide = aucun choix saisi ; ne pas confondre avec les espèces observées"`).
- Ajouter au super-prompt de l'edge `propriete-chat` une règle : distinguer explicitement **espèces observées dans le périmètre** (données terrain) et **palette retenue** (projet de plantation), et ne jamais répondre « aucune espèce » quand la liste `dedans` est non vide.

### D. Lisibilité côté carte (cohérence visuelle)
- Le halo doré de rayon d'écoute devient un **contour de l'ouvrage + anneau de rayon mesuré au bord**, pour que l'utilisateur voie exactement ce que l'IA écoute.
- Le bandeau `GardenFocusBanner` affiche `N espèces dedans · M en voisinage` au lieu du seul compte global.

## Détails techniques

- `src/lib/ouvrageScope.ts` (nouveau) : `classifyObservations(geometry, waypoints, radiusM)` → `{ inside, edge, around }`, distances au bord, gestion Polygon / LineString / Point.
- `src/hooks/propriete/useProprieteChatProviders.ts` : remplacer le filtre centroïde par `classifyObservations`, ajouter le provider `ouvrage.especes`, repartitionner `vivant.resume`.
- `src/components/propriete/chatbot/proprieteChatFocus.ts` : ajouter `ouvrage.especes` aux contextes auto-activés.
- `src/lib/soilLinkEngine.ts` : renommer/annoter `especesRetenues`.
- `supabase/functions/propriete-chat/index.ts` : règle de vocabulaire dedans/voisinage/palette dans le system prompt.
- `PaletteStudio.tsx` / `GardenFocusBanner.tsx` : visualisation du périmètre écouté et compteurs dedans/voisinage.

Aucun changement de schéma de base, aucun appel réseau supplémentaire : tout se calcule sur les observations déjà chargées.
