## Correction : retirer les observations marcheurs de « J'analyse · Prélèvements »

### Constat
- `SamplesMapBlock.tsx` (J'analyse · 2) affiche actuellement le toggle « Vivant observé » + filtres Plantae/Animalia/Fungi + pastilles d'observations marcheurs. Ce n'est pas souhaité ici.
- `RevealMapBlock.tsx` (J'identifie · 2) affiche correctement ces observations. On n'y touche pas.

### Changement
Dans `src/components/propriete/analyze/blocks/SamplesMapBlock.tsx` :
1. Supprimer l'import et l'appel de `usePropertySpeciesPool`.
2. Supprimer l'état `showWaypoints`, le filtre `KingdomFilter`, les constantes `KINGDOM_COLORS`, `kingdomFrom`, `norm`, `wpIcon`, `filteredWaypoints`, `stats`.
3. Retirer la barre d'en-tête « Vivant observé · Tous/Plantae/Animalia/Fungi » — ne garder que les micro-hints « Glissez les pastilles / Cliquez la carte pour ajouter » et le compteur `n / 5`.
4. Retirer les `<Marker>` waypoints du `<RichMap>` (garder uniquement les pastilles A/B/C… des prélèvements).
5. Retirer la légende « ○ Prélèvement · ● Observation marcheur » sous la carte (ou la réduire à « Prélèvement »).
6. Conserver le contrôle `cadastre: true` et le reste du comportement (drag, clic-pour-ajouter, sync avec la liste des emplacements).

Aucun autre fichier n'est modifié. `RevealMapBlock` reste inchangé.
