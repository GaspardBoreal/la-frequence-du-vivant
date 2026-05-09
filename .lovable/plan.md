## Objectif

Différencier les Marcheurs ayant peu de contributions de ceux qui s'investissent réellement (Marie‑Josée 9 photos + témoignage ne doit plus être à égalité avec Nathan / Jean‑paul qui n'ont qu'1 témoignage), et rendre la composition du score lisible au survol.

## 1. Refonte du plancher dans `src/lib/sentinelleIndex.ts`

Remplacer le plancher fixe à 15 pts par un **plancher dégressif** proportionnel à l'engagement réel :

```text
totalContribs = photos + sons + textes + (témoignage ? 1 : 0)
plancher =
  0                       si totalContribs == 0
  5                       si totalContribs == 1   (geste isolé)
  8                       si totalContribs == 2   (deux gestes)
  12                      si totalContribs entre 3 et 5
  15                      si totalContribs ≥ 6  OU  ≥ 2 piliers débloqués
```

Conséquences attendues sur l'écran actuel :

| Marcheur | Contribs | Score actuel | Nouveau score |
|---|---|---|---|
| Marie‑Josée (9 photos + 1 témoignage) | 10 | 15 | ~15 (atteint le plancher haut, mais aussi son score brut ~10 → reste 15 grâce aux 2 piliers) |
| Nathan / Jean‑paul (1 témoignage) | 1 | 15 | **5** |
| Karine (1 obs + témoignage) | 2 | 18 | 18 (inchangé, déjà au‑dessus) |

Ajuster également les seuils de paliers `eveil` (≥1) et `curieux` (≥6) pour rester cohérents avec le nouveau plancher (les marcheurs à 5 pts restent « Éveil »).

## 2. Popover « détail au survol » sur la liste Marcheurs

Fichier : `src/components/community/exploration/MarcheursTab.tsx` → composant `SentinelleChip`.

- Envelopper la pastille de score avec un `<HoverCard>` (shadcn) ; sur mobile (touch) garder le comportement actuel `onActivate` (ouverture de la fiche). Le `HoverCard` ne se déclenche pas au tap, donc pas de conflit.
- Contenu du HoverCard : réutiliser `<ScoreBreakdown breakdown={...} total={...} />` déjà existant, dans une carte compacte (largeur ~ 280 px) avec en‑tête « Fréquence X/100 — Label » + petite ligne « Astuce : nextTip.text ».
- Style : `bg-popover/95 backdrop-blur border-border` pour rester cohérent avec le thème glass.

## 3. Fiche Marcheur (panneau d'impact)

Fichier : `src/components/community/exploration/impact/MarcheurImpactPanel.tsx`.

- À côté du gros score affiché en tête de panneau, ajouter une icône `Info` (lucide) avec le même `<HoverCard>` ouvrant la même décomposition. (`<ScoreBreakdown />` y est probablement déjà rendu plus bas — dans ce cas ne pas dupliquer, juste rajouter l'icône Info qui scrolle/focus la section existante via `aria-describedby`.)
- Vérifier après lecture du fichier s'il y a déjà un bloc `ScoreBreakdown` ; si oui, l'icône Info ouvre simplement un `Tooltip` rappelant « Voir détail plus bas ».

## 4. Pas d'impact attendu sur

- Photos / volume : poids inchangés (volume reste à 10 pts max, √64).
- Pratiques emblématiques, voix singulière, sensibles, espèces : formules inchangées.
- Tri de la liste et BDD : aucune migration nécessaire, tout est calculé côté client.

## Fichiers modifiés

- `src/lib/sentinelleIndex.ts` (logique plancher + commentaire d'en‑tête mis à jour)
- `src/components/community/exploration/MarcheursTab.tsx` (HoverCard sur `SentinelleChip`)
- `src/components/community/exploration/impact/MarcheurImpactPanel.tsx` (icône Info + HoverCard)

## Validation

1. Sur l'exploration DEVIAT, vérifier que Nathan / Jean‑paul tombent à **5 — Éveil** et que Marie‑Josée reste **15 — Curieux** (ou Éveil suivant nouveau seuil).
2. Au survol de la pastille (desktop), la décomposition apparaît avec piliers, volume, espèces, sensible, voix, pratiques + astuce.
3. Au tap (mobile), comportement inchangé : ouvre la fiche Marcheur.
4. La fiche détaillée affiche également l'accès rapide à la décomposition.
