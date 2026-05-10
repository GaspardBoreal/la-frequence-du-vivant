## Objectif

Rendre chaque critère du popover **Fréquence /100** cliquable depuis *Marcheurs → Marcheurs*, avec une vue détaillée "wahouhh" qui :
1. **Explique la formule** (le calcul, la pondération, le plafond)
2. **Liste les éléments comptés** (espèces, photos, textes, pratiques…)
3. **Révèle ce qui n'est PAS compté** — ex. les 5 contributions iNat de Laurence Karki n'alimentent pas son score parce que `m.stats` n'inclut que les médias locaux, pas les `biodiversity_snapshots`. Cette transparence est le cœur de la fonctionnalité.
4. **Propose un prochain pas** chiffré ("+4 pts si tu détectes 1 bio-indicateur")

## Diagnostic préalable (à mentionner dans la vue)

Le calcul actuel de `computeSentinelleIndex` (MarcheursTab.tsx L.1452) prend `m.stats.photos/sons/textes/speciesCount` qui proviennent des médias **locaux** de la marche. Les **observations iNaturalist remontées via `biodiversity_snapshots`** (visibles dans l'onglet Contributions) ne sont **pas injectées**. C'est pourquoi Laurence affiche `Diversité 1/10 · 2 espèces` alors que ses Contributions montrent **5 espèces**.

## Plan UX — Drawer "Comprendre ce critère"

### 1. Rendre chaque ligne de `ScoreBreakdown` cliquable
Ajouter un bouton (toute la ligne) qui ouvre un Sheet/Drawer latéral contextuel.

### 2. Contenu du Drawer (template uniforme par critère)

```text
┌─────────────────────────────────────────┐
│ 🌿 Détections précieuses      6 / 35    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│ ▸ COMMENT ON CALCULE                    │
│   bio×1.5 + aux×1.0 + EEE×2.0           │
│   plafonné à 15 pondérés → ×35          │
│                                         │
│ ▸ CE QUI EST COMPTÉ (1 bio · 1 aux)     │
│   • Lichen vert commun  (bio)  +1.5     │
│   • Sphaeroderma rouge  (aux)  +1.0     │
│                                         │
│ ▸ CE QUI N'EST PAS (ENCORE) COMPTÉ      │
│   ⚠ 3 espèces iNaturalist sans          │
│     curation : Lotier, Immortelles,     │
│     Araignée nursery → demander         │
│     curation à un Ambassadeur           │
│                                         │
│ ▸ PROCHAIN PAS                          │
│   +4 pts si 1 bio-indicateur de plus    │
└─────────────────────────────────────────┘
```

### 3. Templates par critère

| Critère | Compté | Non compté à révéler |
|---|---|---|
| **Détections précieuses** | espèces curées bio/aux/EEE | espèces non encore curées (lien "demander curation") |
| **Voix singulière** | textes éco-poétiques + sons + témoignage | brouillons, descriptions audio |
| **Variété des gestes** | 5 piliers cochés | piliers manquants listés (photo/son/texte/témoignage/sensible) |
| **Volume** | photos+vidéos+sons+textes+témoignage **locaux** | **⚠ Observations iNat (n=X) non comptées** — c'est ici que le bug Laurence est rendu visible |
| **Diversité d'espèces** | espèces issues des médias locaux | **⚠ X espèces iNat non comptées dans le score** |
| **Pratiques emblématiques** | curations `sense='main'` liées au marcheur | "À relier par un curateur" + CTA |

### 4. Animation "wahouhh"
- Ouverture en spring depuis la ligne cliquée (layoutId framer-motion)
- Compteur qui s'incrémente pour la valeur (ex. `0 → 6`)
- Petite barre de progression animée vers le palier suivant
- Émoji de tête en grand format avec léger glow

## Plan technique

### Fichier nouveau : `src/components/community/exploration/impact/ScoreCriterionDrawer.tsx`
- Sheet shadcn (side="right") ou Dialog responsive
- Reçoit : `criterion` (clé : sensible/voix/pillars/volume/species/pratiques), `breakdown`, `details` (espèces nommées, items)
- Affiche les 4 sections : formule / compté / non compté / prochain pas

### Modifier `ScoreBreakdown.tsx`
- Convertir chaque ligne `motion.div` en `motion.button`
- Ajouter prop optionnelle `onCriterionClick(key)` (rétro-compatible : pas obligatoire pour ImpactStoriesViewer)
- État local d'ouverture du Drawer

### Source des données "compté/non compté"
Pour chaque marcheur (déjà dans `MarcheursTab.tsx`) il faut enrichir `metricsById` avec :
- `localSpeciesNames` : depuis `m.speciesObserved`
- `inatSpeciesNames` : croiser `biodiversity_snapshots` × aliases (déjà dispo via `useExplorationContributionsCounts` + `useMarcheurAliases`) → liste des noms iNat absents des médias locaux
- `pillarsMissingLabels` : déjà dans `breakdown.pillars.missing`
- `sensibleNamedList` : noms des espèces curées (via `curationByName`)

### Révélation honnête du bug iNat
Dans le drawer **Volume** et **Diversité d'espèces**, afficher un encart ambré :
> "⚠ X observations iNaturalist sont visibles dans Contributions mais n'alimentent pas encore ce score. Une évolution est en cours pour les inclure."

Cela transforme un bug en **feature de transparence** et prépare le terrain pour le futur fix d'inclure les snapshots dans `SentinelleInputs`.

## Fichiers touchés
- ✏️ `src/components/community/exploration/impact/ScoreBreakdown.tsx` — lignes cliquables + état drawer
- 🆕 `src/components/community/exploration/impact/ScoreCriterionDrawer.tsx` — drawer détaillé
- ✏️ `src/components/community/exploration/MarcheursTab.tsx` — passe `details` enrichis (listes nommées + counts iNat) à `ScoreBreakdown`

## Hors scope (à confirmer)
- Le **fix structurel** consistant à injecter les espèces iNat dans `SentinelleInputs` n'est **pas** dans ce plan (il modifierait le score de tous les marcheurs et nécessite validation produit). Le drawer **rend visible** l'écart en attendant.

## Questions pour valider

1. **Format** : Drawer latéral droite (Sheet) ou Modal centré (Dialog) ? *(recommandé : Sheet droite, plus immersif sur desktop)*
2. **Faut-il aussi un CTA action** dans le drawer (ex. "Demander curation à un Ambassadeur" qui notifie) ou rester purement explicatif pour cette V1 ?
3. **Le fix iNat-dans-le-score** : tu veux qu'on planifie aussi l'injection des espèces iNat dans le calcul de Fréquence (changera le score de tous les marcheurs concernés rétroactivement), ou on garde la transparence "non compté" en V1 et on traite le fix dans un second temps ?
