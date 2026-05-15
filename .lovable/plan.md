## Chaîne trophique — Panneau Synthèse

Nouveau panneau ajouté **sous `TaxonsIndicesPanel`** dans l'onglet **Synthèse → Synthèse** d'un événement. Trois directions visuelles cohabitent dans un même panneau, sous forme d'onglets. On commence par la première : **Constellation Trophique**.

---

### 1. Modèle trophique (5 niveaux + décomposeurs en orbite)

| Niveau | Nom | Couleur sémantique | Exemples |
|---|---|---|---|
| L1 | Producteurs primaires | `--primary` (vert tendre) | Plantes, algues, lichens |
| L2 | Consommateurs primaires | ambre doux | Herbivores, pollinisateurs, granivores |
| L3 | Consommateurs secondaires | corail | Insectivores, petits prédateurs |
| L4 | Consommateurs tertiaires | violet profond | Carnivores moyens, piscivores |
| L5 | Prédateurs supérieurs | or sombre | Rapaces, grands carnivores |
| ⟲ | **Décomposeurs & recycleurs** | brun mycélium, en orbite | Champignons, détritivores, bactéries |

Les décomposeurs sont rendus comme un **anneau orbital** qui traverse tous les niveaux, jamais comme un L0 ou L6.

---

### 2. Attribution trophique (hybride KB + heuristique)

**Étape A — Knowledge base curée** (prioritaire)
Extension de `src/data/species-knowledge-base.json` avec un champ optionnel :
```json
"Buteo buteo": { "primary": "patrimoniale", "trophic_level": 5 }
```

**Étape B — Fallback heuristique** par règne / classe / ordre, encodé dans `src/lib/trophicClassification.ts` :
- `Plantae`, `Chromista` (algues), lichens → L1
- `Fungi`, `Annelida` (vers de terre), `Isopoda` (cloportes), `Collembola` → décomposeurs
- Insectes pollinisateurs (`Apidae`, `Syrphidae`, `Lepidoptera` adultes), herbivores (`Orthoptera`, chenilles) → L2
- Insectes prédateurs (`Coccinellidae`, `Carabidae`, `Aranae`), amphibiens, petits passereaux insectivores → L3
- Reptiles, oiseaux insectivores moyens, petits mustélidés → L4
- Rapaces (`Accipitriformes`, `Strigiformes`, `Falconiformes`), carnivores (`Carnivora`) → L5
- Inconnu → marqué `unclassified`, affiché en gris discret hors constellation, listé dans le panneau pédagogique

**Statut transparent** : chaque espèce porte un flag `source: 'kb' | 'heuristic'`, affiché par une micro-icône au survol (étoile pleine = KB, étoile contour = heuristique).

---

### 3. Visualisation — Onglet 1 « Constellation Trophique »

**Métaphore** : carte du ciel nocturne. Chaque espèce est une étoile, regroupée en 5 anneaux concentriques (L1 au centre = base de la pyramide énergétique, L5 en périphérie = sommet rare).

**Composition SVG** (responsive, ratio 1:1, max 720×720) :
- Fond dégradé radial profond (theme-aware : nuit pour dark, papier crème teinté pour light)
- 5 anneaux concentriques très subtils (1px, opacité 0.15)
- Labels d'anneaux en typographie fine, sur l'axe vertical droit
- Anneau orbital incliné (~15°) traversant L2-L4 pour les décomposeurs
- Étoiles : taille = log(abondance), luminosité = halo CSS
- **Flux d'énergie** : traits courbes lumineux entre proies (intérieur) et prédateurs (extérieur), animés en `<animate>` SVG (pulse de particules, 3s loop)
- Niveau vide = anneau marqué d'une icône d'alerte douce + tooltip « Aucune espèce détectée à ce niveau — signal écologique fort »

**Interactions (pédagogique complet)** :
1. **Hover étoile** → halo + carte flottante : nom FR (`<SpeciesName />`), niveau, source d'attribution, miniature
2. **Clic étoile** → isole la chaîne trophique (proies + prédateurs probables mis en avant, le reste passe à 0.15 d'opacité), drawer latéral avec :
   - Définition pédagogique du niveau
   - Liste des espèces du même niveau
   - Score d'équilibre trophique (ratio L1/L5, indice de Lindeman simplifié)
   - Niveaux manquants ou sous-représentés sur le territoire
3. **Clic anneau** → focus sur tout un niveau, panneau pédagogique
4. **Bouton « Légende »** → panneau bas dépliable expliquant les 5 niveaux + décomposeurs
5. **Bouton « Espèces non classées »** → liste les espèces au statut `unclassified` (incite à la curation)

**Score d'équilibre trophique** affiché en header du panneau :
- Pyramide complète (L1>L2>L3>L4>L5) → « Équilibre solide »
- Pyramide tronquée → « Chaîne incomplète, prédateurs absents »
- Forme inversée → « Anomalie : signaler un biais d'observation »

---

### 4. Architecture du composant

```
src/components/community/synthese/
├── TrophicChainPanel.tsx              ← conteneur, 3 onglets, header pédagogique
├── trophic/
│   ├── ConstellationTab.tsx           ← onglet 1 (livré maintenant)
│   ├── SpiralTab.tsx                  ← onglet 2 (placeholder « Bientôt »)
│   ├── NetworkTab.tsx                 ← onglet 3 (placeholder « Bientôt »)
│   ├── TrophicLegendDrawer.tsx        ← panneau pédagogique 5 niveaux
│   ├── SpeciesStarTooltip.tsx
│   └── TrophicBalanceBadge.tsx        ← score d'équilibre trophique en header
src/lib/
└── trophicClassification.ts           ← KB lookup + fallback heuristique
src/data/
└── species-knowledge-base.json        ← + champ optionnel trophic_level
src/hooks/
└── useTrophicChain.ts                 ← memoize : species[] → { levels, edges, balance }
```

Branchement dans `EventBiodiversityTab.tsx`, juste après `<TaxonsIndicesPanel />` :
```tsx
<TaxonsIndicesPanel species={species} explorationId={...} />
<TrophicChainPanel species={species} />
```

---

### 5. Détails techniques

- **Génération des arêtes proie→prédateur** : règles trophiques inter-niveaux par taxon (carte statique dans `trophicClassification.ts`). Ex : `Accipitriformes` mange `Passeriformes` + `Rodentia`. Pas de simulation complexe — quelques règles éditoriales suffisent pour l'effet visuel.
- **Performance** : `useMemo` pour le layout étoile, max 200 étoiles affichées, regroupement automatique au-delà (« +12 autres » en cluster).
- **Animation** : Framer Motion pour entrées (stagger 0.02s par étoile), `<animate>` SVG natif pour les flux pulsants (pas de re-render React).
- **Theming** : tous les couleurs via tokens HSL (`--trophic-l1` à `--trophic-l5`, `--trophic-decomposer`) ajoutés dans `index.css` light + dark.
- **Mobile** : sous 640px, la constellation passe en mode « pyramide horizontale empilée » (5 bandes), les interactions au tap remplacent le hover.
- **Accessibilité** : `aria-label` sur chaque étoile, fallback liste textuelle accessible derrière un `<details>`.

### 6. Onglets 2 et 3 (mentionnés dans l'UI, livrés ultérieurement)

Affichés mais désactivés avec une carte « Bientôt — Spirale du Vivant » et « Bientôt — Réseau Vivant ». Cela pose dès maintenant la trame des 3 directions visuelles à venir.

### 7. Hors scope (ce que ce plan NE fait pas)

- Pas de modification des tables Supabase
- Pas de calcul d'indice écologique avancé (Lindeman complet) — version simplifiée ratio L1/L5
- Pas de curation trophique batch dans l'admin (à prévoir plus tard si volume justifie)
- Pas de génération d'illustrations d'espèces — réutilise photos existantes via `useSpeciesPhoto`
