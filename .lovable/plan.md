## Modifications onglet « J'observe » + « J'identifie »

### A + B — Compteur sur 8 blocs incluant l'analyse sensorielle
Dans `src/components/propriete/tabs/TabObserve.tsx` :
- Remplacer le dénominateur `OBSERVE_BLOCKS.length` (=7) par `OBSERVE_BLOCKS.length + 1` (=8).
- Calculer `sensorialFilled` = true si **au moins un champ texte** de `state.sensorial` (hors `intensity`) est non-vide.
- `totalAnswered` devient : nb de blocs 1-7 avec au moins 1 choix + (sensorialFilled ? 1 : 0).
- Affichage : `X / 8 blocs renseignés`.

### C — Lisibilité bouton « Marquer l'étape comme terminée »
Toujours dans `TabObserve.tsx`, sur le `Button variant="outline"` :
- Passer la couleur de texte par défaut à blanc (`text-white`) avec fond vert forêt léger, et garder le hover actuel — OU plus fidèle au design system : `bg-[hsl(var(--ds-forest))]/80 text-[hsl(var(--ds-cream))] hover:bg-[hsl(var(--ds-forest))]`.
- Objectif : texte lisible hors survol.

### D — Déplacer « Ce que la Fréquence du Vivant sait déjà » vers l'étape 3
Deux sous-tâches :
1. **Retirer** la `<motion.section>` "Empreinte biodiversité mesurée ici" (et le composant local `StatCard`) de `TabObserve.tsx`.
2. **Ajouter** ce même bloc **en haut** du composant qui rend l'étape 3 « J'identifie » dans `src/pages/ProprieteEspace.tsx` (ou l'onglet dédié s'il existe déjà — à confirmer par lecture rapide en mode build).
   - Le bloc reçoit déjà `bio` via `usePropertyBiodiversity` ; il faudra passer la prop `bio` à l'onglet Identifier.
   - Factoriser dans un composant partagé `src/components/propriete/BiodiversityEvidenceBlock.tsx` pour éviter la duplication et faciliter la réutilisation.

### Détails techniques
- Fichiers touchés :
  - `src/components/propriete/tabs/TabObserve.tsx` (A, B, C, suppression bloc D)
  - `src/components/propriete/BiodiversityEvidenceBlock.tsx` *(nouveau)*
  - `src/pages/ProprieteEspace.tsx` ou fichier onglet Identifier (ajout bloc D en tête)
- Pas de changement DB, pas de nouveau hook.
