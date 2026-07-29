## Intention

Avec 3 à 7 emplacements, la page « Palette végétale » devient un mur infini. On la transforme en **partition d'emplacements** : chaque carte est repliée par défaut et se lit d'un coup d'œil grâce à un bandeau-signature dense en indicateurs vivants. Un clic la déplie pour le travail de sélection.

## 1. Carte pliable (`ZonePaletteCard.tsx`)

Le `<header>` devient un bouton de bascule complet (accessible : `aria-expanded`, `aria-controls`, activation clavier), avec chevron animé à droite. Nouvelles props : `open`, `onToggle`, `forceOpen` (impression / lecture seule figée).

Le corps (chips d'ambiance, champ intention, listes d'espèces par strate) est animé par `AnimatePresence` + `motion.div` (height auto, 0.3 s) — jamais de saut brutal.

## 2. Le bandeau replié — la signature de l'emplacement

En état replié, sous le nom, une **barre d'indicateurs** calculée depuis la sélection réelle de cet emplacement :

```text
 ( A )  Massif à Papillons                                    ▾
        MI-OMBRE · « nourrir les abeilles »
        ▉▉▉▉▉▉▉▉▉ 12 espèces   ● 78 % indigène   ⛨ 5 végétal local
        Arb 3 · Arbu 4 · Grim 1 · Herb 3 · Sol 1     🐝 mellifère 7  🍒 fruits 4
```

Composants du bandeau :
- **Pastille lettre** colorée (déjà présente) + nom en serif italique.
- **Chip d'ambiance** (Plein soleil / Mi-ombre / …) reprenant le libellé de `ZONE_AMBIANCES`, en pastille teintée.
- **Intention** en italique tronquée sur une ligne, si renseignée.
- **Ruban de strates** : mini-barre horizontale segmentée, un segment par strate aux couleurs de `STRATE_TINT`, largeur proportionnelle au nombre d'espèces retenues — lecture instantanée de l'équilibre arbre/arbuste/herbacée. Infobulle au survol par segment.
- **Trois indicateurs chiffrés** : nombre d'espèces retenues, part d'indigènes (%), nombre de labels « Végétal local ».
- **Top services** : les 2-3 services les plus fréquents parmi les espèces retenues (mellifère, fruits, haie, ombre, faune…) avec leur compte.
- **État vide inspirant** : si 0 espèce retenue, le bandeau affiche « Emplacement à composer — 14 espèces proposées » en doré, pour inciter à ouvrir plutôt qu'afficher des zéros.

Les valeurs sont dérivées dans un `useMemo` local à partir de `recommendations` + `selectedIds` — aucune nouvelle requête, aucun changement de données.

## 3. Barre de contrôle de la section « Emplacements » (`TabPalette.tsx`)

Au-dessus de la liste des cartes : compteur d'emplacements + **« Tout déplier » / « Tout replier »**, plus un résumé global discret (total d'espèces retenues, emplacements encore vides).

État d'ouverture géré dans `TabPalette` (`Set<string>` d'ids), **replié par défaut**, mémorisé en `localStorage` par propriété (`palette-zones-open:{proprieteId}`) pour que l'utilisateur retrouve son contexte. Ouverture automatique d'un emplacement quand on le sélectionne depuis la carte ou le chip de la barre « Emplacements de la palette ».

## 4. Impression et synthèse

`PaletteSummary.tsx` passe `forceOpen` : le rendu papier et la synthèse restent intégralement dépliés, sans chevron ni bouton — aucune régression sur le cahier imprimé.

## Détails techniques

- Aucune modification de schéma, de hook de données ni de moteur de palette ; travail purement présentation dans `ZonePaletteCard.tsx`, `TabPalette.tsx` et un passage de prop dans `PaletteSummary.tsx`.
- Un petit module d'agrégation (`zoneSignature(recommendations, selectedIds)`) placé à côté du composant retourne `{ total, byStrate, indigenePct, vegetalLocal, topServices, proposedTotal }` — réutilisable ensuite par l'Atelier si besoin.
- Couleurs exclusivement issues des tokens `--ds-*` et de `STRATE_TINT` existant ; classes `print-exact` conservées sur les pastilles.

## Vérification

Sur `/propriete/jardin-monde-deviat`, onglet « Palette végétale » : les emplacements s'affichent repliés avec leur signature, « Tout déplier » ouvre tout, le pli persiste après rechargement, et la simulation d'impression du cahier montre toujours les palettes complètes.
