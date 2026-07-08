## Diagnostic

Chaque module de l'onglet **Analyse IA** (`AnalyseIAStepper.tsx`) affiche un gros bloc `StepHero` :

```text
[Pastille catégorie] DÉCOUVERTE / TROPHIQUE / INDICATEURS / ORIGINES
[Icône flottante 56–64px]
[Titre H2 24–30px] Partons à la découverte du vivant
[Sous-titre]        Des parcours sensibles révèlent…
```

Ce bandeau (~180–220 px) répète ce que le stepper sticky affiche déjà (pastille emoji + nom court) et retarde l'accès au contenu réel — carrousel, chaînes trophiques, indices, flux d'origines.

## Proposition

Supprimer intégralement `StepHero`, et enrichir légèrement le **header sticky** existant pour ne rien perdre en contexte, tout en gagnant ~200 px de hauteur utile par module.

### Cible visuelle

```text
┌─ sticky header (compact, ~54 px) ─────────────────────────────────────┐
│  🌿 Découverte  🔗 Trophique  📊 Indicateurs  🌍 Origines   1/4      │
│  Partons à la découverte du vivant · liens cachés entre espèces      │  ← ligne subtile, animée entre étapes
│  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ progress bar            │
└───────────────────────────────────────────────────────────────────────┘
[Contenu du module directement, sans bandeau intermédiaire]
```

- Le stepper reste tel quel (pastilles emoji + nom court, déjà présents).
- Ajout d'une **micro-baseline** sous les pastilles, animée en fondu (`AnimatePresence key=activeIdx`) qui affiche : `{title} · {subtitle-condensé}`. Une seule ligne, `text-xs text-muted-foreground truncate`, ~18 px de haut.
- Sur mobile (< sm) la baseline se raccourcit à `{title}` seul (le `subtitle` disparaît en `hidden sm:inline`).
- Progress bar conservée.

### Fichier touché

`src/components/community/analyse/AnalyseIAStepper.tsx` :
1. Supprimer l'appel `<StepHero step={s} />` dans le map des sections + supprimer la définition du composant `StepHero` en fin de fichier (et l'`emoji` field devient inutile mais on le garde pour les pastilles du stepper).
2. Enrichir le header sticky : sous la rangée `[pastilles] [compteur]`, ajouter une baseline animée avec `AnimatePresence`, `key={STEPS[activeIdx].key}`, fade + petit slide.
3. Retirer les imports Lucide devenus inutiles (`Compass`, `Network`, `Gauge`, `Globe2` si plus utilisés — vérifier avant suppression) ; les `Icon` sur `StepDef` peuvent rester non-utilisés ou être supprimés proprement.
4. Ajuster le `pt-6` des sections en `pt-3` puisque le hero disparaît.

### Bénéfice

- ~200 px gagnés par module → le contenu (carrousel Découverte, chaînes, indices, flux) apparaît immédiatement sous le stepper.
- Zéro perte d'info : titre + accroche restent visibles en permanence via la baseline animée.
- Cohérent avec la sobriété informationnelle du projet (memory Core).

Aucun changement de logique métier ni des 4 panels enfants (`EcologicalJourneyCarousel`, `TrophicChainPanel`, `TaxonsIndicesPanel`, `OriginsFluxPanel`).