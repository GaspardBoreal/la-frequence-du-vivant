## Réorganisation de l'onglet "Analyse IA" — Stepper immersif mobile-first

### Objectif
Fusionner trois contenus dans **Analyse IA**, organisés en stepper plein écran swipable :
1. **Partons à la découverte du vivant** (carrousel existant `EcologicalJourneyCarousel`)
2. **Chaîne trophique** (`TrophicChainPanel` déplacé depuis Synthèse — NON modifié)
3. **Indicateurs** (`TaxonsIndicesPanel` déplacé depuis l'onglet Indicateurs)

### Changements de structure

**Barre principale des sous-onglets** (`EventBiodiversityTab.tsx`)
- Retirer `Indicateurs` de `subTabs`
- Retirer `TrophicChainPanel` du bloc Synthèse
- Retirer la branche `activeSubTab === 'indicateurs'`
- Retirer le teaser « Bientôt disponible » (bloc Sparkles)
- L'onglet **Analyse IA** ne contient plus que `<AnalyseIAStepper />`

**Barre finale :** Synthèse · Taxons observés · Témoignages · (Textes écrits) · Analyse IA

### Nouveau composant : `AnalyseIAStepper`

Fichier : `src/components/community/analyse/AnalyseIAStepper.tsx`

**Layout mobile-first immersif**
- Container `relative` avec `min-h-[calc(100vh-14rem)]` plein écran utile
- Snap horizontal natif : `flex overflow-x-auto snap-x snap-mandatory scroll-smooth` + `snap-center` sur chaque step
- Chaque step : `w-full shrink-0` (mobile) / `w-full` (desktop, on garde le stepper même pattern, max-w container)
- Swipe gestuel natif iOS/Android via overflow scroll + `touch-pan-x`
- IntersectionObserver détecte le step visible → met à jour `activeStep`

**Header sticky (top)**
- Pills compact des 3 modules avec emoji + label court, `sticky top-0 z-20 backdrop-blur-xl bg-background/70`
- Click = `element.scrollIntoView({ behavior: 'smooth', inline: 'start' })`
- Sous les pills : **barre de progression segmentée** (3 segments, l'actif s'illumine via `motion.div` width animée + gradient emerald→violet)
- Compteur « Module 1 / 3 » en petit à droite

**Chaque step**
- Hero d'entrée : grande icône animée (`motion` float `y: [-4, 0]`), titre `text-2xl sm:text-3xl font-semibold`, sous-titre poétique, badge module
- Gradient d'arrière-plan unique par module :
  - Découverte : `from-emerald-500/10 via-amber-500/5 to-transparent`
  - Trophique : `from-violet-500/10 via-cyan-500/5 to-transparent`
  - Indicateurs : `from-sky-500/10 via-emerald-500/5 to-transparent`
- Blob radial flou en fond (`absolute inset-0 -z-10 blur-3xl`)
- Contenu du module rendu après le hero (les composants existants restent intacts)
- Bouton « Module suivant → » en bas qui scroll au step suivant (sauf le 3e)

**Navigation desktop (≥sm)**
- Mêmes pills sticky en haut
- Flèches latérales `‹` `›` ancrées en `fixed` discrètes pour navigation clavier/souris
- Support flèches clavier `ArrowLeft` / `ArrowRight`

**Animations clés** (Framer Motion)
- Hero icône : `animate={{ y: [0, -6, 0] }}` infinite
- Titre : `initial={{ y: 20, opacity: 0 }}` → `whileInView` avec stagger des enfants
- Progress bar : `layoutId` partagé pour glisser entre segments
- Transition de step : `AnimatePresence` n'est pas nécessaire (les 3 sont en DOM pour le snap-scroll), mais chaque hero a un `whileInView` pour rejouer l'entrée

### Fichiers à créer / modifier

**Créer**
- `src/components/community/analyse/AnalyseIAStepper.tsx`
- `src/components/community/analyse/StepHero.tsx` (hero réutilisable : icône, gradient, titre, sous-titre)
- `src/components/community/analyse/StepperProgress.tsx` (3 segments + pills)

**Modifier**
- `src/components/community/EventBiodiversityTab.tsx`
  - Supprimer `'indicateurs'` de `SubTab` et de `subTabs`
  - Supprimer `<TrophicChainPanel>` de la branche Synthèse
  - Supprimer la branche `indicateurs`
  - Remplacer le contenu de la branche `analyse` par `<AnalyseIAStepper species={allSpeciesWithFrNames} explorationId={explorationId} totalSpecies={stats.total} />`
  - Conserver `EcologicalJourneyCarousel`, `TrophicChainPanel`, `TaxonsIndicesPanel` (imports déplacés)

### Garanties
- **Zéro changement** sur `TrophicChainPanel`, `TaxonsIndicesPanel`, `EcologicalJourneyCarousel`
- **Zéro changement** de logique métier / données / hooks
- Responsive natif : snap horizontal sur mobile, même UX agréable sur desktop
- Accessible : `role="tablist"`, `aria-selected`, focus visible, navigation clavier

### Diagramme

```text
┌─────────────────────────────────────┐
│ [🌿 Découverte] [🔗 Trophique] [📊 Indicateurs]   1/3 │ ← pills sticky
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← progress
├─────────────────────────────────────┤
│   gradient blob + hero icon         │
│   "Partons à la découverte du..."   │
│                                     │
│   [EcologicalJourneyCarousel]       │
│                                     │
│   [ Module suivant → ]              │
└─────────────────────────────────────┘
  ← swipe →   ← swipe →   ← swipe →
```
